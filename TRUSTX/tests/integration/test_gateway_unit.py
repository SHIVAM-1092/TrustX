import pytest
import httpx
from fastapi.testclient import TestClient
from gateway.main import app
from trustx.identity import create_domain_token, Domain

client = TestClient(app)

def test_gateway_proxy_allowed():
    """Verify authorized Red-to-Target request is ALLOWED."""
    token = create_domain_token(Domain.RED, "test-agent")
    response = client.post(
        "/target/v1/chat/completions",
        headers={"Authorization": f"Bearer {token}"},
        json={"messages": [{"role": "user", "content": "Hello target"}]}
    )
    # Since target is mocked or proxying upstream, check status code or mock response
    assert response.status_code in [200, 502]

def test_gateway_proxy_denied():
    """Verify unauthorized Red-to-Blue request is DENIED."""
    token = create_domain_token(Domain.RED, "test-agent")
    response = client.get(
        "/blue/health",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "Policy Access Denied" in response.json()["detail"]

def test_missing_identity_fail_closed():
    """Verify requests without token are rejected (HTTP 401)."""
    response = client.get("/target/v1/state")
    assert response.status_code == 401
    assert "Authentication failed" in response.json()["detail"]
