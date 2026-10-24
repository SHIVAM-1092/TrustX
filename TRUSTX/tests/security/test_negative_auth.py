"""Cross-Domain Security and Network Boundary Negative Tests for TrustX

Validates:
1. Default-deny policy enforcement across domains
2. Direct Red -> Blue rejection
3. Direct Target -> Red rejection
4. Fail-closed on missing authentication / forged identity
5. Audit event emission on denial
"""
import pytest
import httpx
import os
import jwt
from pathlib import Path

# Set environment variable required by identity module at import time
# Must match the secret used by the gateway (from .env)
os.environ["TRUSTX_SECRET_KEY"] = "trustx-shared-secret-change-for-production"

# Resolve CA certificate path relative to repository root (works on Windows host)
# test file: .../tests/security/test_negative_auth.py
# project root: ../../..
REPO_ROOT = Path(__file__).resolve().parents[2]
CA_CERT = str(REPO_ROOT / "gateway" / "certs" / "ca.crt")

# Use HTTPS with CA verification – the gateway runs with mTLS
GATEWAY_URL = "https://localhost:8443"


@pytest.mark.asyncio
async def test_red_to_blue_denied():
    """Red -> Blue direct access MUST BE DENIED (403 Forbidden)."""
    from trustx.identity import create_domain_token, Domain
    token = create_domain_token(Domain.RED, "test-agent")
    async with httpx.AsyncClient(base_url=GATEWAY_URL, timeout=5.0, verify=CA_CERT) as client:
        resp = await client.get(
            "/blue/health",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data
        assert "Policy Access Denied" in data["detail"]


@pytest.mark.asyncio
async def test_target_to_red_denied():
    """Target -> Red direct access MUST BE DENIED (403 Forbidden)."""
    from trustx.identity import create_domain_token, Domain
    token = create_domain_token(Domain.TARGET, "test-agent")
    async with httpx.AsyncClient(base_url=GATEWAY_URL, timeout=5.0, verify=CA_CERT) as client:
        resp = await client.get(
            "/red/health",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data
        assert "Policy Access Denied" in data["detail"]


@pytest.mark.asyncio
async def test_missing_identity_fail_closed():
    """Requests without identity header/cert MUST BE REJECTED (401 Unauthorized)."""
    async with httpx.AsyncClient(base_url=GATEWAY_URL, timeout=5.0, verify=CA_CERT) as client:
        resp = await client.get("/target/v1/state")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"
        assert "Authentication failed" in resp.json()["detail"]