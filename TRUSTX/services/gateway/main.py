"""TrustX Unified Policy Gateway

- Central server-side policy enforcement (default-deny)
- Cryptographic identity verification (Bearer token / signed JWT)
- Tamper-evident SHA-256 audit log chaining
- Secure cross-domain proxy routing
"""

import os
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from trustx.identity import verify_identity, Domain, DomainIdentity, create_domain_token
from trustx.policy import PolicyEngine
from trustx.audit import AuditChain

# Load policy and audit chain from environment or defaults
POLICY_PATH = os.getenv("POLICY_PATH", "gateway/config/policy.yaml")
if not os.path.exists(POLICY_PATH):
    POLICY_PATH = "gateway/config/policy.yaml"

AUDIT_LOG_PATH = os.getenv("AUDIT_LOG_PATH", "audit/audit.log")

policy_engine = PolicyEngine(POLICY_PATH)
audit_chain = AuditChain(AUDIT_LOG_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup verification
    audit_chain.verify_integrity()
    yield
    # Shutdown

app = FastAPI(
    title="TrustX Unified Policy Gateway",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upstream service mapping
UPSTREAM_URLS = {
    Domain.RED: os.getenv("RED_TEAM_URL", "http://localhost:8001"),
    Domain.TARGET: os.getenv("TARGET_URL", "http://localhost:8002"),
    Domain.BLUE: os.getenv("BLUE_TEAM_URL", "http://localhost:8003"),
}

@app.get("/health")
async def health_check():
    integrity = audit_chain.verify_integrity()
    return {
        "status": "healthy",
        "gateway": "operational",
        "audit_chain_valid": integrity.valid,
        "total_audit_records": integrity.total_records
    }

@app.post("/auth/token")
async def issue_token(request: Request):
    """Helper endpoint for UI / local demo to obtain a signed domain token."""
    body = await request.json()
    domain_str = body.get("domain", "").lower()
    subject = body.get("subject", "demo-user")

    if not Domain.is_valid(domain_str):
        raise HTTPException(status_code=400, detail=f"Invalid domain: {domain_str}")

    token = create_domain_token(Domain(domain_str), subject)
    return {"token": token, "domain": domain_str}

@app.get("/audit/records")
async def get_audit_records(identity: DomainIdentity = Depends(verify_identity), limit: int = 100):
    # Enforce policy: Only Blue Team or UI can read audit records
    eval_res = policy_engine.evaluate(identity.domain, Domain.GATEWAY, "/audit/records", "GET")
    if not eval_res.allowed:
        audit_chain.append("ACCESS_DENIED", identity.domain.value, "gateway", "/audit/records", "GET", False, identity.subject, 403, eval_res.reason)
        raise HTTPException(status_code=403, detail=eval_res.reason)

    records = audit_chain.read_records(limit=limit)
    return {"records": records, "total": len(records)}

@app.get("/audit/verify")
async def verify_audit_records(identity: DomainIdentity = Depends(verify_identity)):
    eval_res = policy_engine.evaluate(identity.domain, Domain.GATEWAY, "/audit/verify", "GET")
    if not eval_res.allowed:
        raise HTTPException(status_code=403, detail=eval_res.reason)

    result = audit_chain.verify_integrity()
    audit_chain.append("AUDIT_VERIFIED", identity.domain.value, "gateway", "/audit/verify", "GET", True, identity.subject, 200, "Audit chain integrity verified")
    return result

@app.api_route("/{destination}/{rest_of_path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def gateway_proxy(
    destination: str,
    rest_of_path: str,
    request: Request,
    identity: DomainIdentity = Depends(verify_identity)
):
    """
    Unified Gateway Proxy with Default-Deny Policy Enforcement.
    Validates identity, evaluates policy, logs to tamper-evident audit chain, and proxies upstream.
    """
    dest_lower = destination.lower()
    if not Domain.is_valid(dest_lower):
        audit_chain.append("ACCESS_DENIED", identity.domain.value, destination, f"/{rest_of_path}", request.method, False, identity.subject, 404, "Unknown destination domain")
        raise HTTPException(status_code=404, detail=f"Unknown destination domain: {destination}")

    dest_domain = Domain(dest_lower)
    path = f"/{rest_of_path}"

    # Evaluate policy
    eval_res = policy_engine.evaluate(identity.domain, dest_domain, path, request.method)

    if not eval_res.allowed:
        audit_chain.append(
            event_type="ACCESS_DENIED",
            source=identity.domain.value,
            destination=dest_domain.value,
            path=path,
            method=request.method,
            allowed=False,
            subject=identity.subject,
            status_code=403,
            reason=eval_res.reason
        )
        raise HTTPException(status_code=403, detail=f"Policy Access Denied: {eval_res.reason}")

    # Forward request to upstream service
    upstream_base = UPSTREAM_URLS.get(dest_domain)
    if not upstream_base:
        raise HTTPException(status_code=502, detail=f"No upstream configured for domain {dest_domain.value}")

    upstream_url = f"{upstream_base}/{rest_of_path}"
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length", "authorization"]}
    headers["X-TrustX-Forwarded-By"] = "gateway"
    headers["X-TrustX-Source-Domain"] = identity.domain.value

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.request(
                method=request.method,
                url=upstream_url,
                headers=headers,
                content=body,
                params=request.query_params
            )

        # Log allowed success
        audit_chain.append(
            event_type="ACCESS_ALLOWED",
            source=identity.domain.value,
            destination=dest_domain.value,
            path=path,
            method=request.method,
            allowed=True,
            subject=identity.subject,
            status_code=resp.status_code,
            reason=eval_res.reason
        )

        try:
            content = resp.json()
        except Exception:
            content = {"raw": resp.text}

        return JSONResponse(content=content, status_code=resp.status_code)

    except httpx.RequestError as exc:
        audit_chain.append(
            event_type="UPSTREAM_ERROR",
            source=identity.domain.value,
            destination=dest_domain.value,
            path=path,
            method=request.method,
            allowed=True,
            subject=identity.subject,
            status_code=502,
            reason=str(exc)
        )
        raise HTTPException(status_code=502, detail=f"Upstream communication error: {str(exc)}")