"""Identity verification for TrustX Policy Gateway

Validates mTLS client certificates and extracts security domain identity.
FAILS CLOSED: Requests without a valid, signed client certificate or valid JWT are rejected.
"""

from enum import Enum
from typing import List, Optional
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer
import os

from trustx.identity import Domain, DomainIdentity, verify_identity as trustx_verify_identity

security = HTTPBearer(auto_error=False)

# Compatibility shim: provide .all() method expected by gateway code
def _domain_all() -> List[str]:
    return [d.value for d in Domain]
Domain.all = _domain_all  # type: ignore

# Re-export compatible types for gateway internal usage
Domain = Domain
DomainIdentity = DomainIdentity

async def verify_client_identity(request: Request) -> DomainIdentity:
    """Gateway wrapper that extracts token from request and uses shared trustx verifier.
    Accepts:
    1. Bearer JWT token in Authorization header
    2. X-TrustX-Token header (legacy)
    3. mTLS client certificate (via trustx verifier fallback)
    """
    from trustx.identity.verifier import verify_identity as trustx_verify_identity

    # Manually extract credentials from request — avoids FastAPI Security dependency injection crash
    # when verify_client_identity is called without explicit credentials parameter
    token_str: Optional[str] = None

    # 1. Check Bearer Authorization Header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header[7:]

    # 2. Check X-TrustX-Token header (legacy support)
    if not token_str:
        token_str = request.headers.get("X-TrustX-Token")

    if token_str:
        return await trustx_verify_identity(request, token_str)

    # 3. Check mutual TLS client cert from actual TLS connection (fallback via trustx verifier)
    # trustx_verify_identity handles the mTLS cert fallback internally
    result = await trustx_verify_identity(request, None)
    if result.auth_method in ("mtls", "mtls-proxy"):
        return result

    # Fail closed
    raise HTTPException(
        status_code=401,
        detail="Authentication failed: Missing or invalid domain identity token. Unauthenticated requests are rejected. Access denied."
    )