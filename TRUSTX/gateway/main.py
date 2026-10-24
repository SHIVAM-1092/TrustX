"""TrustX Policy Gateway - Main Entry Point

Central authority for:
- Mutual TLS domain identity validation
- Default-deny policy enforcement
- Tamper-evident hash-chained audit logging
- Cross-domain request routing
"""

import os
import sys
import yaml
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .internal.config import load_config
from .internal.identity import verify_client_identity, DomainIdentity, Domain
from .internal.policy import PolicyEngine
from .internal.audit import AuditLogger, AuditEvent

# Load configuration
cfg = load_config(os.getenv("GATEWAY_CONFIG", "/config/gateway.yaml"))

# Build upstream URL mapping from config
UPSTREAM_URLS = {}
for key, upstream in cfg.upstreams.items():
    UPSTREAM_URLS[key] = upstream.url

# Initialize components
policy_engine = PolicyEngine(cfg.policy.path)
audit_logger = AuditLogger(cfg.audit.log_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: reload policy, verify audit chain
    policy_engine.load_policy()
    audit_logger.verify_chain_integrity()
    yield
    # Shutdown: flush audit logs
    audit_logger.flush()

app = FastAPI(
    title="TrustX Policy Gateway",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health & Status
# ---------------------------------------------------------------------------
@app.get("/health")
@app.head("/health")
async def health_check():
    return {
        "status": "healthy",
        "gateway": "running",
        "audit_chain_valid": audit_logger.verify_chain_integrity(),
        "policy_loaded": policy_engine.is_loaded()
    }

# ---------------------------------------------------------------------------
# Token Issuance (Gateway holds signing secret; domains request tokens)
# ---------------------------------------------------------------------------
@app.post("/auth/token")
async def issue_domain_token(request: Request):
    """Issue a signed domain token. Caller must present valid mTLS cert or existing token."""
    identity: DomainIdentity = await verify_client_identity(request)

    # Caller can only request token for their own domain
    body = await request.json()
    requested_domain = body.get("domain", "").lower()
    subject = body.get("subject", identity.subject)

    if requested_domain != identity.domain.value:
        audit_logger.log_denied_access(
            source=identity.domain,
            destination=Domain.GATEWAY,
            path="/auth/token",
            reason=f"Cross-domain token request denied: {identity.domain.value} cannot request {requested_domain}"
        )
        raise HTTPException(status_code=403, detail="Cannot request token for different domain")

    from trustx.identity import create_domain_token, Domain
    token = create_domain_token(Domain(requested_domain), subject)
    return {"token": token, "domain": requested_domain, "subject": subject}

# ---------------------------------------------------------------------------
# Audit API (read-only, for Blue Team and UI)
# ---------------------------------------------------------------------------
@app.get("/audit/events")
async def get_audit_events(
    identity: DomainIdentity = Depends(verify_client_identity),
    limit: int = 100,
    offset: int = 0
):
    # Enforce policy: only blue team and UI can read audit events
    allowed = policy_engine.evaluate(
        source=identity.domain,
        destination=Domain.GATEWAY,
        path="/audit/events",
        method="GET"
    )
    if not allowed:
        audit_logger.log_denied_access(
            source=identity.domain,
            destination=Domain.GATEWAY,
            path="/audit/events",
            reason="Policy violation"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    events = audit_logger.read_events(limit=limit, offset=offset)
    return {"events": events, "total": len(events)}

@app.get("/audit/verify")
async def verify_audit_chain(
    identity: DomainIdentity = Depends(verify_client_identity)
):
    allowed = policy_engine.evaluate(
        source=identity.domain,
        destination=Domain.GATEWAY,
        path="/audit/verify",
        method="GET"
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Forbidden")

    valid, errors = audit_logger.verify_chain_detailed()
    return {"valid": valid, "errors": errors}

# ---------------------------------------------------------------------------
# Dynamic Cross-Domain Proxy (Default-Deny)
# ---------------------------------------------------------------------------
@app.api_route("/{destination}/{rest_of_path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_request(
    destination: str,
    rest_of_path: str,
    request: Request,
    identity: DomainIdentity = Depends(verify_client_identity)
):
    """
    Route requests from source domain to destination domain.
    Enforces default-deny policy and logs tamper-evident audit trail.
    """
    dest_domain = Domain(destination) if destination in Domain.all() else None
    if not dest_domain:
        audit_logger.log_denied_access(
            source=identity.domain,
            destination=destination,
            path=f"/{rest_of_path}",
            reason=f"Unknown destination domain: {destination}"
        )
        raise HTTPException(status_code=404, detail="Unknown domain")

    # Evaluate policy (fail-closed: default to DENY)
    # The path used for policy evaluation should be path-relative to the destination domain,
    # not including the destination prefix used in the routing path.
    # UI requests go to /api/<destination>/<path>, which proxies to <destination>/<path>.
    path = f"/{rest_of_path}"
    allowed = policy_engine.evaluate(
        source=identity.domain,
        destination=dest_domain,
        path=path,
        method=request.method
    )

    if not allowed:
        # Audit log the denial
        audit_logger.log_event(AuditEvent(
            event_type="ACCESS_DENIED",
            source_domain=identity.domain.value,
            destination_domain=dest_domain.value,
            path=path,
            method=request.method,
            allowed=False,
            client_subject=identity.subject,
            details={"reason": "Policy Access Denied", "rule": "default-deny"}
        ))
        raise HTTPException(
            status_code=403,
            detail=f"Policy Access Denied: from {identity.domain.value} to {dest_domain.value}:{path}"
        )

    # Get upstream URL for destination domain
    upstream_url = UPSTREAM_URLS.get(dest_domain.value)
    if not upstream_url:
        raise HTTPException(status_code=502, detail=f"No upstream configured for {dest_domain.value}")

    # Read body for forwarding
    body = await request.body()

    # Construct target URL: upstream + path (path is already absolute)
    target_url = f"{upstream_url}{path}"

    # Forward request with mTLS client certificate to upstreams that require it
    # The gateway presents its designated client certificate to services that require mTLS
    # (red-team, target). Certificate paths are loaded from the gateway config/volume mount.
    client_cert = None
    client_verify = cfg.tls.ca_cert

    # Configure mTLS client cert for upstreams that require it
    # Use gateway client cert if upstream domain requires mTLS (red-team, target)
    # Per design: red-team and target services require mTLS from gateway initiator
    upstream_domain = dest_domain.value  # e.g. "red", "target", "blue"
    if upstream_domain in ("red", "target"):
        # Present gateway client certificate for mTLS-required upstreams
        # Certs are mounted via Docker Compose: ./gateway/certs:/certs:ro
        cert_path = os.getenv("GATEWAY_CLIENT_CERT", "/certs/gateway.crt")
        key_path = os.getenv("GATEWAY_CLIENT_KEY", "/certs/gateway.key")
        if os.path.exists(cert_path) and os.path.exists(key_path):
            client_cert = (cert_path, key_path)
            # Only skip server-side TLS verification for local testing, never skip client cert
            if os.getenv("SKIP_TLS_VERIFY") == "true":
                client_verify = False
        else:
            # Fall back: skip upstream TLS verification only (not client cert requirement)
            # This is a temporary local-dev fallback, not for production
            client_verify = False if os.getenv("SKIP_TLS_VERIFY") == "true" else cfg.tls.ca_cert
    else:
        # For blue-upstreams, use existing verification logic
        client_verify = client_verify

    try:
        async with httpx.AsyncClient(
            # TLS verification: use CA cert for server cert verification
            verify=client_verify,
            timeout=30.0,
            # Present client certificate for mTLS-required upstreams
            cert=client_cert,
        ) as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers={k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]},
                content=body
            )

        # Audit log the allowed request
        audit_logger.log_event(AuditEvent(
            event_type="ACCESS_ALLOWED",
            source_domain=identity.domain.value,
            destination_domain=dest_domain.value,
            path=path,
            method=request.method,
            allowed=True,
            client_subject=identity.subject,
            status_code=resp.status_code
        ))

        return JSONResponse(content=resp.json(), status_code=resp.status_code)

    except httpx.RequestError as exc:
        audit_logger.log_event(AuditEvent(
            event_type="UPSTREAM_ERROR",
            source_domain=identity.domain.value,
            destination_domain=dest_domain.value,
            path=path,
            method=request.method,
            allowed=True,
            client_subject=identity.subject,
            details={"error": str(exc)}
        ))
        raise HTTPException(status_code=502, detail=f"Upstream communication error: {exc}")
