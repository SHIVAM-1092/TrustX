import os
import hmac
import hashlib
import time
from typing import Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .domain import Domain, DomainIdentity

# Load secret key for JWT verification – must be provided via environment.
def _get_secret() -> str:
    """Retrieve the JWT secret from the environment.
    Raises a RuntimeError if not set, ensuring the caller knows the secret is missing.
    """
    secret = os.getenv("TRUSTX_SECRET_KEY")
    if not secret:
        raise RuntimeError("Missing required environment variable TRUSTX_SECRET_KEY for JWT verification")
    return secret

JWT_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

def create_domain_token(domain: Domain, subject: str, expires_in_sec: int = 3600) -> str:
    """Generates a cryptographically signed domain identity token."""
    payload = {
        "sub": subject,
        "domain": domain.value,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in_sec,
        "iss": "trustx-gateway"
    }
    secret = _get_secret()
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)

def extract_client_cert_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client certificate info from mTLS connection if available.
    Returns (domain, subject) or (None, None) if no valid client cert.
    """
    # Check multiple possible locations for client cert in ASGI scope
    # uvicorn with --ssl-cert-reqs 1 stores cert in scope["client_cert"] or scope["ssl_object"]
    cert = None

    # DEBUG: Log what's in scope for mTLS debugging
    scope_keys = list(request.scope.keys())
    print(f"[DEBUG mTLS] ASGI scope keys: {scope_keys}")
    if "client_cert" in request.scope:
        print(f"[DEBUG mTLS] scope['client_cert'] type: {type(request.scope['client_cert'])}, value: {request.scope['client_cert']}")
    if "ssl_object" in request.scope:
        print(f"[DEBUG mTLS] scope['ssl_object'] type: {type(request.scope['ssl_object'])}")

    # 1. Check scope["client_cert"] (uvicorn with ssl-cert-reqs)
    if "client_cert" in request.scope and request.scope["client_cert"]:
        cert = request.scope["client_cert"]

    # 2. Check scope["ssl_object"]
    elif ssl_object := getattr(request, "ssl_object", None):
        if hasattr(ssl_object, "getpeercert"):
            cert = ssl_object.getpeercert()

    # 3. Check scope["ssl_object"] from scope dict
    elif "ssl_object" in request.scope and hasattr(request.scope["ssl_object"], "getpeercert"):
        cert = request.scope["ssl_object"].getpeercert()

    if cert:
        print(f"[DEBUG mTLS] Found cert: type={type(cert)}")
        try:
            # Extract subject CN and OU from certificate
            subject = ""
            domain = None
            for part in cert.get("subject", []):
                for key, value in part:
                    if key == "commonName":
                        subject = value
                    elif key == "organizationalUnitName":
                        domain = value.lower()
            print(f"[DEBUG mTLS] Extracted subject={subject}, domain={domain}")
            if domain and Domain.is_valid(domain):
                return domain, subject
        except Exception as e:
            print(f"[DEBUG mTLS] Cert extraction error: {e}")
            import traceback
            traceback.print_exc()
            pass

    print("[DEBUG mTLS] No valid client cert found in scope")
    return None, None

async def verify_identity(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> DomainIdentity:
    """Validates domain identity.
    Fails closed: Any missing, expired, or tampered credentials raise HTTP 401.
    Supports:
    1. Bearer JWT token (primary)
    2. X-TrustX-Token header (legacy)
    3. mTLS client certificate (when TLS termination happens at app level)
    """
    token_str: Optional[str] = None

    # 1. Check Bearer Authorization Header
    if credentials and hasattr(credentials, 'credentials') and credentials.credentials:
        token_str = credentials.credentials
    elif auth_header := request.headers.get("Authorization"):
        if auth_header.startswith("Bearer "):
            token_str = auth_header[7:]

    # 2. Check X-TrustX-Token header (legacy support)
    if not token_str:
        token_str = request.headers.get("X-TrustX-Token")

    if token_str:
        # Decode and verify JWT signature, expiry, and required claims
        try:
            payload = jwt.decode(token_str, _get_secret(), algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Authentication failed: Identity token has expired")
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=401, detail=f"Authentication failed: Invalid identity token: {str(exc)}")

        domain_val = payload.get("domain", "").lower()
        if not Domain.is_valid(domain_val):
            raise HTTPException(status_code=401, detail=f"Authentication failed: Unknown domain in token: {domain_val}")

        return DomainIdentity(
            domain=Domain(domain_val),
            subject=payload.get("sub", "unknown"),
            auth_method="token",
            claims=payload
        )

    # 3. Check mutual TLS client cert from actual TLS connection
    cert_domain, cert_subject = extract_client_cert_info(request)
    if cert_domain and Domain.is_valid(cert_domain):
        return DomainIdentity(
            domain=Domain(cert_domain),
            subject=cert_subject or "mtls-client",
            auth_method="mtls"
        )

    # 4. Fallback: Check X-Client-Cert-Domain header (for trusted proxy termination)
    # This is a fallback for when TLS is terminated by a reverse proxy that validates mTLS
    client_cert_domain = request.headers.get("X-Client-Cert-Domain")
    if client_cert_domain and Domain.is_valid(client_cert_domain):
        return DomainIdentity(
            domain=Domain(client_cert_domain.lower()),
            subject=request.headers.get("X-Client-Cert-Subject", "mtls-client"),
            auth_method="mtls-proxy"
        )

    # Fail closed – no valid token or cert
    raise HTTPException(
        status_code=401,
        detail="Authentication failed: Missing or invalid domain identity token. Unauthenticated requests are rejected. Access denied."
    )