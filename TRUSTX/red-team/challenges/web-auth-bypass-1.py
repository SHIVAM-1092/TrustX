"""TrustX Red Team Challenge: Web Authentication Weakness Lab

An intermediate-level lab where learners identify and exploit a specific
authentication/authorization weakness in a local-only intentionally vulnerable
training application. They verify access to a protected training resource before
flag release. Includes a remediation explanation.
"""

import hashlib
import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"


# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/web-auth-bypass-1")

# Flag secret from environment - unique per deployment
LAB_SECRET = os.getenv("LAB_SECRET", "trustx-lab-secret-dev-only")


class AuthAttempt(BaseModel):
    """Record an authentication attempt."""
    timestamp: float
    username: str
    password: str
    source_ip: str
    success: bool
    session_granted: bool = False


class ChallengeState(BaseModel):
    """Track learner progress for this challenge."""
    challenge_id: str
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    attempts: List[Dict[str, Any]] = []
    flag: Optional[str] = None
    auth_attempts: List[AuthAttempt] = []


class ChallengeAttempt(BaseModel):
    """Record of a single challenge attempt."""
    timestamp: float
    payload: str
    target_response: str
    success: bool
    flag_awarded: bool = False


def compute_flag(challenge_id: str, secret: str, subject: str) -> str:
    """Compute a unique flag for a learner completing this challenge."""
    hash_input = f"{challenge_id}:{secret}:{subject}".encode()
    digest = hashlib.sha256(hash_input).hexdigest()[:12]
    return f"{FLAG_PREFIX}{challenge_id}-{digest}}"


# In-memory challenge state store
_challenge_states: Dict[str, ChallengeState] = {}


def init_lab_workspace():
    """Initialize the lab workspace with vulnerable auth app and data."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create the vulnerable auth application
    app_py = LAB_ROOT / "app.py"
    if not app_py.exists():
        app_py.write_text('''\"\"\"TrustX Vulnerable Auth Application - Web Authentication Weakness Lab\"\"\"

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import json
import hashlib

app = FastAPI(title="Vulnerable Auth App", version="1.0.0")

# Hardcoded credentials (VULNERABILITY: should use password hashing)
VALID_USERS = {
    "admin": "password123",        # Default password - VULNERABLE to brute force
    "user": "userpass",            # Weak password
    "test": "testpass"             # Test account
}

# Session tracking (in prototype - would use Redis/DB in production)
sessions = {}

# Vulnerability: No rate limiting on login attempts
# Vulnerability: Session fixation possible
# Vulnerability: Password displayed in error messages


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    username: Optional[str] = None
    role: Optional[str] = None
    token: Optional[str] = None
    message: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "Welcome to the Vulnerable Auth Application", "status": "vulnerable"}


@app.get("/health")
async def health():
    return {"status": "healthy", "app": "vulnerable-auth", "vulnerabilities": ["hardcoded-creds", "no-rate-limit"]}


@app.post("/login")
async def login(request: LoginRequest):
    """Login endpoint with authentication weakness."""
    username = request.username
    password = request.password

    # VULNERABILITY: Simple password check, no hashing, no rate limiting
    if username in VALID_USERS and VALID_USERS[username] == password:
        # VULNERABILITY: Session fixation - accept any session ID
        token = hashlib.sha256(f"{username}:{password}:{time.time()}".encode()).hexdigest()[:16]
        sessions[token] = {
            "username": username,
            "role": "user",  # Default role - VULNERABLE: privilege escalation possible
            "created_at": time.time()
        }
        return LoginResponse(
            success=True,
            username=username,
            role="user",
            token=token,
            message="Login successful"
        )
    else:
        # VULNERABILITY: Error message reveals if username exists
        if username in VALID_USERS:
            message = "Invalid password for user: " + username
        else:
            message = "Invalid credentials"

        return LoginResponse(
            success=False,
            username=username,
            role=None,
            token=None,
            message=message
        )


@app.get("/protected-data")
async def protected_data(request):
    """Protected endpoint - accessible only with valid session."""
    # VULNERABILITY: No session validation - anyone can access
    # The session token is checked but the check is flawed
    token = request.query_params.get("token")

    if token and token in sessions:
        user = sessions[token]
        # VULNERABILITY: Any authenticated user can access admin data
        # Should check user.role == "admin" but role is "user" by default
        return JSONResponse(content={
            "data": "Sensitive customer records: ACCT-99238, SSN: 123-45-6789",
            "user": user["username"],
            "role": user["role"]
        })

    # VULNERABILITY: Fall through - no auth check, data exposed
    return JSONResponse(
        content={"data": "Sensitive customer records: ACCT-99238, SSN: 123-45-6789"},
        status_code=200
    )


@app.get("/admin-panel")
async def admin_panel(request):
    """Admin-only panel - should require admin role."""
    # VULNERABILITY: No role check - any user can access
    token = request.query_params.get("token")

    if token and token in sessions:
        # VULNERABILITY: No role/permission check at all
        user = sessions[token]
        return JSONResponse(content={
            "admin_data": "System configuration, user accounts, security settings",
            "user": user["username"]
        })

    # VULNERABILITY: No auth check
    return JSONResponse(
        content={"admin_data": "System configuration, user accounts, security settings"},
        status_code=200
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
''')

    # Create the target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Web Authentication Weakness Lab\n\n"
            "## Objective\n"
            "Identify and exploit an authentication/authorization weakness in the "
            "local training web application. Gain access to protected training "
            "resources and discover the flag.\n\n"
            "## Lab Setup\n"
            "The vulnerable auth application runs on port 8080 within the execution "
            "environment. You can interact with it via HTTP requests.\n\n"
            "## Known Vulnerabilities\n"
            "1. **Hardcoded Credentials**: Usernames/passwords are stored in plaintext\n"
            "2. **No Rate Limiting**: No restriction on login attempt frequency\n"
            "3. **Session Fixification**: No session regeneration after login\n"
            "4. **Privilege Escalation**: All users granted same access level\n"
            "5. **Information Disclosure**: Error messages reveal user existence\n\n"
            "## Your Goal\n"
            "1. Exploit the authentication weakness to gain access\n"
            "2. Access the /protected-data endpoint\n"
            "3. Access the /admin-panel endpoint (privilege escalation)\n"
            "4. Discover the flag hidden in the application\n\n"
            "## Flag Format: KALI{web-auth-bypass-1-<hash>}\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Web Auth Weakness - Hints\n\n"
            "## Hint 1: Start by exploring the application structure\n"
            "Try accessing the root endpoint and the health check.\n\n"
            "## Hint 2: Test the login endpoint\n"
            "Try different username/password combinations. Notice that the error "
            "messages differ depending on whether the username exists.\n\n"
            "## Hint 3: Exploit the information disclosure\n"
            "Use the username existence revelation to enumerate valid users, then "
            "try common passwords against each.\n\n"
            "## Hint 4: Access protected resources\n"
            "Once logged in, try accessing /protected-data and /admin-panel. "
            "Notice the lack of proper authorization checks.\n\n"
            "## Hint 5: Privilege escalation\n"
            "After logging in as a regular user, try accessing admin endpoints. "
            "The session doesn't check roles - any valid session gains access.\n\n"
            "## Remediation\n"
            "1. Use password hashing (bcrypt/argon2) instead of plaintext\n"
            "2. Implement rate limiting on login attempts\n"
            "3. Regenerate session IDs after login (session fixation fix)\n"
            "4. Add role-based access control (RBAC)\n"
            "5. Generic error messages - 'Invalid credentials' regardless of username\n"
        )


def get_lab_files() -> List[str]:
    """Get list of files available in the lab workspace."""
    if not LAB_ROOT.exists():
        return []
    return sorted([f.name for f in LAB_ROOT.iterdir() if f.is_file()])


def validate_auth_success(target_response: str, payload: str) -> bool:
    """
    Validate that authentication succeeded by checking the target response.

    The payload contains the login request, and the target_response contains
    the application's response. Check for success indicators.
    """
    try:
        # Look for success indicators in the response
        response_lower = target_response.lower()
        success_indicators = [
            '"success": true' in response_lower,
            '"login successful"' in response_lower,
            'username' in response_lower and '"user"' in response_lower,
        ]
        return any(success_indicators)
    except Exception:
        return False


def validate_admin_access(target_response: str) -> bool:
    """
    Validate that admin panel access succeeded.
    """
    try:
        response_lower = target_response.lower()
        return (
            '"admin_data"' in response_lower
            or '"system configuration"' in response_lower
            or '"user accounts"' in response_lower
        )
    except Exception:
        return False


def validate_flag_discovery(command_output: str, subject: str) -> Dict[str, Any]:
    """
    Validate that the learner has discovered the flag through intended investigation.
    """
    if "KALI{" in command_output and "web-auth-bypass-1-" in command_output:
        import re
        matches = re.findall(r'KALI\{web-auth-bypass-1-[a-f0-9]{12}\}', command_output)
        if matches:
            return {
                "success": True,
                "feedback": "Congratulations! You successfully exploited the authentication weakness and discovered the flag.",
                "flag": matches[0]
            }
    return {"success": False, "feedback": "Flag not discovered yet. Continue investigating the authentication weaknesses.", "flag": None}


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "web-auth-bypass-1",
        "name": "Web Authentication Weakness",
        "category": "Authentication / Authorization",
        "objective": "Identify and exploit an authentication weakness in the local training web application. Gain access to protected resources through the vulnerability, then escalate privileges to admin-level access.",
        "description": (
            "A local training web application has intentional authentication and "
            "authorization weaknesses. Your goal is to:\n"
            "1. Exploit the weak authentication (hardcoded credentials, no rate limiting)\n"
            "2. Access protected data endpoints\n"
            "3. Escalate privileges to access admin-level panels\n"
            "4. Discover the flag hidden within the application\n\n"
            "The application has the following known vulnerabilities:\n"
            "- Hardcoded credentials in plaintext\n"
            "- No rate limiting on login attempts\n"
            "- Session fixation possible\n"
            "- No role-based access control\n"
            "- Information disclosure via error messages\n\n"
            "After exploiting the authentication weakness, you can escalate privileges "
            "because the application does not check user roles - any valid session gains "
            "access to all endpoints."
        ),
        "difficulty": "Intermediate",
        "hints": [
            "The application has hardcoded credentials in plaintext.",
            "Try common usernames like 'admin' with common passwords.",
            "Notice that error messages reveal whether a username exists.",
            "After logging in, try accessing /protected-data without a token.",
            "The session doesn't check roles - any valid session gains full access.",
            "The flag is awarded after accessing the admin panel and discovering it."
        ],
        "flag_format": "KALI{web-auth-bypass-1-<hash>}",
        "target_endpoint": "http://localhost:8080",
        "learning_objectives": [
            "Identify authentication weaknesses in web applications",
            "Exploit hardcoded credentials and lack of rate limiting",
            "Exploit information disclosure in error messages",
            "Execute privilege escalation through missing authorization checks",
            "Understand the importance of role-based access control",
            "Learn remediation techniques for common auth vulnerabilities"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Web Authentication Weakness lab.

    The payload contains the HTTP request sent, and the target_response contains
    the application's HTTP response.
    """
    if challenge_id != "web-auth-bypass-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    # Check if authentication succeeded
    auth_success = validate_auth_success(target_response, payload)

    # Check if admin panel access succeeded
    admin_success = validate_admin_access(target_response)

    if auth_success and admin_success:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Success! You exploited the authentication weakness, accessed protected data, and escalated privileges to the admin panel.",
            "flag": flag
        }

    if auth_success and not admin_success:
        hint = "Hint: You're authenticated - try accessing the admin panel endpoint directly."
        return {
            "success": False,
            "feedback": "Authentication succeeded but admin access not detected." + (f" {hint}" if hint else ""),
            "flag": None
        }

    if not auth_success:
        # Provide progressive hints based on attempt
        payload_lower = payload.lower()
        if "admin" not in payload_lower and "password" not in payload_lower:
            hint = "Hint: Try logging in with username 'admin' and password 'password123'."
        elif "login" not in payload_lower:
            hint = "Hint: Use the /login endpoint with POST method."
        else:
            hint = "Hint: Check the error messages - they reveal if the username exists."

        return {
            "success": False,
            "feedback": "Authentication did not succeed." + (f" {hint}" if hint else ""),
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Challenge not yet completed.",
        "flag": None
    }


# Pre-initialized lab workspace (called on import)
_lab_initialized = False


def ensure_lab_initialized():
    """Ensure lab workspace is initialized on first access."""
    global _lab_initialized
    if not _lab_initialized:
        init_lab_workspace()
        _lab_initialized = True


# Initialize on import
ensure_lab_initialized()