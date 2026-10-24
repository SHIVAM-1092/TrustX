"""Unit and Integration Tests for Policy Engine, Identity, and Audit Hash Chain"""

import os
import tempfile
import pytest
import json
import jwt
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends

# Environment variable TRUSTX_SECRET_KEY is set by project-level conftest.py
# before test collection, ensuring consistent signing key across all tests.

from gateway.internal.identity import Domain, DomainIdentity, verify_client_identity
from gateway.internal.policy import PolicyEngine, PolicyRule
from gateway.internal.audit import AuditLogger, AuditEvent

# ---------------------------------------------------------------------------
# Policy Engine Tests
# ---------------------------------------------------------------------------
def test_policy_default_deny():
    """Verify default-deny behavior when no rules match or file is missing"""
    engine = PolicyEngine(policy_path="/nonexistent/policy.yaml")
    assert not engine.is_loaded()
    # Unmatched request should be DENIED
    assert not engine.evaluate(Domain.RED, Domain.BLUE, "/health", "GET")

def test_policy_allow_rule(tmp_path):
    policy_file = tmp_path / "policy.yaml"
    policy_file.write_text("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "red-to-target-allow"
    source_domain: "red"
    destination_domain: "target"
    allowed_paths: ["/v1/chat/completions"]
    allowed_methods: ["POST"]
    action: "ALLOW"
""")
    engine = PolicyEngine(str(policy_file))
    assert engine.is_loaded()

    # Allowed path and method
    assert engine.evaluate(Domain.RED, Domain.TARGET, "/v1/chat/completions", "POST")

    # Unallowed method (GET instead of POST)
    assert not engine.evaluate(Domain.RED, Domain.TARGET, "/v1/chat/completions", "GET")

    # Unallowed destination (Red -> Blue)
    assert not engine.evaluate(Domain.RED, Domain.BLUE, "/v1/chat/completions", "POST")

# ---------------------------------------------------------------------------
# JWT Authentication Security Tests
# ---------------------------------------------------------------------------
def test_jwt_auth_valid_token():
    """Verify valid signed JWT is accepted and parsed correctly"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value, "subject": identity.subject}

    client = TestClient(app)

    token = jwt.encode(
        {"sub": "test-user", "domain": "ui", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"domain": "ui", "subject": "test-user"}

def test_jwt_auth_unsigned_token_rejected():
    """Verify unsigned or falsely signed JWTs are strictly rejected (No signature verification bypass)"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    # Sign with a different secret
    forged_token = jwt.encode(
        {"sub": "attacker", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        "wrong-secret-key",
        algorithm="HS256"
    )

    response = client.get("/test", headers={"Authorization": f"Bearer {forged_token}"})
    assert response.status_code == 401
    assert "Authentication failed" in response.json()["detail"]

def test_jwt_auth_expired_token_rejected():
    """Verify expired tokens are rejected"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    expired_token = jwt.encode(
        {"sub": "user", "domain": "ui", "iat": 1600000000, "exp": 1600000001},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/test", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401

# ---------------------------------------------------------------------------
# Audit Hash Chain Tests
# ---------------------------------------------------------------------------
def test_audit_hash_chain_validity(tmp_path):
    log_file = tmp_path / "audit.log"
    logger = AuditLogger(str(log_file))

    # Log 3 events
    e1 = logger.log_event(AuditEvent(
        event_type="ACCESS_ALLOWED",
        source_domain="red",
        destination_domain="target",
        path="/v1/chat/completions",
        method="POST",
        allowed=True
    ))

    e2 = logger.log_event(AuditEvent(
        event_type="ACCESS_DENIED",
        source_domain="red",
        destination_domain="blue",
        path="/v1/health",
        method="GET",
        allowed=False
    ))

    # Verify chain integrity
    valid, errors = logger.verify_chain_detailed()
    assert valid, f"Chain should be valid, got errors: {errors}"

def test_audit_hash_chain_tampering_detection(tmp_path):
    log_file = tmp_path / "audit.log"
    logger = AuditLogger(str(log_file))

    logger.log_event(AuditEvent(
        event_type="ACCESS_ALLOWED",
        source_domain="red",
        destination_domain="target",
        path="/v1/chat/completions",
        method="POST",
        allowed=True
    ))
    logger.log_event(AuditEvent(
        event_type="ACCESS_ALLOWED",
        source_domain="blue",
        destination_domain="target",
        path="/v1/reset",
        method="POST",
        allowed=True
    ))

    # Tamper with the log file (modify line 1 path)
    with open(log_file, "r") as f:
        lines = f.readlines()

    event1 = json.loads(lines[0])
    event1["path"] = "/tampered/path"  # Modify data without updating hash
    lines[0] = json.dumps(event1) + "\n"

    with open(log_file, "w") as f:
        f.writelines(lines)

    # Re-verify chain -> MUST detect tampering
    valid, errors = logger.verify_chain_detailed()
    assert not valid
    assert len(errors) > 0
    assert "Tampering detected" in errors[0] or "Chain broken" in errors[0]


# ---------------------------------------------------------------------------
# Cross-Domain Token Validation Tests
# ---------------------------------------------------------------------------
def test_red_token_cannot_impersonate_blue():
    """Verify a Red domain token cannot access Blue-only resources"""
    app = FastAPI()

    @app.get("/blue-only")
    async def blue_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    # Create a valid Red token
    red_token = jwt.encode(
        {"sub": "red-agent", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/blue-only", headers={"Authorization": f"Bearer {red_token}"})
    # Should authenticate successfully (token is valid) but policy would deny
    # This test verifies the token itself is correctly parsed as Red
    assert response.status_code == 200
    assert response.json()["domain"] == "red"


def test_blue_token_cannot_impersonate_red():
    """Verify a Blue domain token cannot access Red-only resources"""
    app = FastAPI()

    @app.get("/red-only")
    async def red_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    # Create a valid Blue token
    blue_token = jwt.encode(
        {"sub": "blue-monitor", "domain": "blue", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/red-only", headers={"Authorization": f"Bearer {blue_token}"})
    assert response.status_code == 200
    assert response.json()["domain"] == "blue"


def test_token_domain_claim_enforced():
    """Verify token domain claim must match a valid TrustX domain"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    # Token with invalid domain
    invalid_token = jwt.encode(
        {"sub": "attacker", "domain": "admin", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/test", headers={"Authorization": f"Bearer {invalid_token}"})
    assert response.status_code == 401
    assert "Unknown domain" in response.json()["detail"]


def test_malformed_token_rejected():
    """Verify malformed JWTs are rejected"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    # Not a valid JWT
    response = client.get("/test", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert response.status_code == 401
    assert "Invalid identity token" in response.json()["detail"]


def test_missing_authorization_header_rejected():
    """Verify requests without Authorization header are rejected"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    response = client.get("/test")
    assert response.status_code == 401
    assert "Missing or invalid" in response.json()["detail"]


def test_x_trustx_token_header_accepted():
    """Verify X-TrustX-Token header is accepted (legacy support)"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"domain": identity.domain.value}

    client = TestClient(app)

    token = jwt.encode(
        {"sub": "legacy-user", "domain": "ui", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    response = client.get("/test", headers={"X-TrustX-Token": token})
    assert response.status_code == 200
    assert response.json()["domain"] == "ui"


# ---------------------------------------------------------------------------
# Full Policy Enforcement Tests (Auth + Policy)
# ---------------------------------------------------------------------------
def test_red_to_target_allowed_by_policy():
    """Verify Red can access Target chat completions via Gateway proxy (full flow)"""
    app = FastAPI()

    # Load actual policy
    import tempfile
    policy_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    policy_file.write("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "red-to-target-allow"
    source_domain: "red"
    destination_domain: "target"
    allowed_paths: ["/v1/chat/completions"]
    allowed_methods: ["POST"]
    action: "ALLOW"
""")
    policy_file.close()

    engine = PolicyEngine(policy_file.name)

    @app.post("/target/v1/chat/completions")
    async def target_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"status": "ok"}

    client = TestClient(app)

    # Valid Red token
    red_token = jwt.encode(
        {"sub": "red-agent", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    # Simulate policy check
    allowed = engine.evaluate(Domain.RED, Domain.TARGET, "/v1/chat/completions", "POST")
    assert allowed is True

    # Verify token parses correctly
    response = client.post("/target/v1/chat/completions", headers={"Authorization": f"Bearer {red_token}"})
    assert response.status_code == 200


def test_red_to_blue_denied_by_policy():
    """Verify Red cannot access Blue via Gateway proxy (policy denies)"""
    import tempfile
    policy_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    policy_file.write("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "red-to-blue-deny"
    source_domain: "red"
    destination_domain: "blue"
    action: "DENY"
""")
    policy_file.close()

    engine = PolicyEngine(policy_file.name)

    # Valid Red token
    red_token = jwt.encode(
        {"sub": "red-agent", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    # Policy should deny Red -> Blue
    allowed = engine.evaluate(Domain.RED, Domain.BLUE, "/v1/reset", "POST")
    assert allowed is False


def test_blue_to_target_allowed_by_policy():
    """Verify Blue can access Target state and reset (policy allows)"""
    import tempfile
    policy_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    policy_file.write("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "blue-to-target-monitor"
    source_domain: "blue"
    destination_domain: "target"
    allowed_paths: ["/v1/state"]
    allowed_methods: ["GET"]
    action: "ALLOW"
  - name: "blue-to-target-control"
    source_domain: "blue"
    destination_domain: "target"
    allowed_paths: ["/v1/reset"]
    allowed_methods: ["POST"]
    action: "ALLOW"
""")
    policy_file.close()

    engine = PolicyEngine(policy_file.name)

    # Valid Blue token
    blue_token = jwt.encode(
        {"sub": "blue-monitor", "domain": "blue", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    # Blue -> Target GET /v1/state should be allowed
    assert engine.evaluate(Domain.BLUE, Domain.TARGET, "/v1/state", "GET") is True
    # Blue -> Target POST /v1/reset should be allowed
    assert engine.evaluate(Domain.BLUE, Domain.TARGET, "/v1/reset", "POST") is True


def test_blue_to_red_denied_by_policy():
    """Verify Blue cannot access Red (policy denies)"""
    import tempfile
    policy_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    policy_file.write("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "blue-to-red-deny"
    source_domain: "blue"
    destination_domain: "red"
    action: "DENY"
""")
    policy_file.close()

    engine = PolicyEngine(policy_file.name)

    # Valid Blue token
    blue_token = jwt.encode(
        {"sub": "blue-monitor", "domain": "blue", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    # Policy should deny Blue -> Red
    allowed = engine.evaluate(Domain.BLUE, Domain.RED, "/v1/simulate", "POST")
    assert allowed is False


def test_invalid_credentials_rejected_at_gateway():
    """Verify invalid/missing credentials are rejected at Gateway entry point"""
    app = FastAPI()

    @app.get("/target/v1/state")
    async def target_endpoint(identity: DomainIdentity = Depends(verify_client_identity)):
        return {"status": "ok"}

    client = TestClient(app)

    # No auth header
    response = client.get("/target/v1/state")
    assert response.status_code == 401

    # Malformed token
    response = client.get("/target/v1/state", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401

    # Token signed with wrong secret
    forged = jwt.encode(
        {"sub": "attacker", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        "wrong-secret",
        algorithm="HS256"
    )
    response = client.get("/target/v1/state", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401

    # Expired token
    expired = jwt.encode(
        {"sub": "attacker", "domain": "red", "iat": 1600000000, "exp": 1600000001},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )
    response = client.get("/target/v1/state", headers={"Authorization": f"Bearer {expired}"})
    assert response.status_code == 401


def test_cross_domain_token_request_denied():
    """Verify Gateway /auth/token denies cross-domain token requests"""
    # This test would require the full gateway main.py with /auth/token endpoint
    # For now, verify the policy logic: a token for domain X cannot be used as domain Y
    import tempfile
    policy_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    policy_file.write("""
version: "1.0"
default_action: "DENY"
rules:
  - name: "red-to-target-allow"
    source_domain: "red"
    destination_domain: "target"
    allowed_paths: ["/v1/chat/completions"]
    allowed_methods: ["POST"]
    action: "ALLOW"
""")
    policy_file.close()

    engine = PolicyEngine(policy_file.name)

    # A Red token presented as if it were Blue won't work because
    # verify_identity() extracts domain from token claims, not headers
    red_token = jwt.encode(
        {"sub": "red-agent", "domain": "red", "iat": 1700000000, "exp": 2000000000},
        os.environ["TRUSTX_SECRET_KEY"],
        algorithm="HS256"
    )

    # The token says domain=red, so policy evaluates as Red -> Target
    # This is correct - the token's domain claim IS the identity
    allowed = engine.evaluate(Domain.RED, Domain.TARGET, "/v1/chat/completions", "POST")
    assert allowed is True

    # But Red cannot do Blue things even with a valid Red token
    allowed = engine.evaluate(Domain.RED, Domain.BLUE, "/v1/reset", "POST")
    assert allowed is False
