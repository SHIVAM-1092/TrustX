"""TrustX Blue Team Domain Service

Monitors Target LLM integrity and state, performs automated security scanning, and triggers corrective actions.
"""

from fastapi import FastAPI, HTTPException
import httpx
import os

app = FastAPI(title="TrustX Blue Team Service", version="2.0.0")

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8443")

def get_gateway_headers():
    from trustx.identity import create_domain_token, Domain
    token = create_domain_token(Domain.BLUE, "blue-monitor")
    return {"Authorization": f"Bearer {token}"}

@app.get("/health")
async def health():
    return {"status": "healthy", "domain": "blue"}

@app.get("/v1/scan")
async def scan_target():
    """Scans Target LLM status via Gateway"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{GATEWAY_URL}/target/v1/state", headers=get_gateway_headers())
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/v1/defend/reset")
async def trigger_reset():
    """Commands Target reset via Gateway"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{GATEWAY_URL}/target/v1/reset", headers=get_gateway_headers())
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.get("/v1/audit/integrity")
async def check_audit_integrity():
    """Checks Audit log hash chain integrity via Gateway"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{GATEWAY_URL}/audit/verify", headers=get_gateway_headers())
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))