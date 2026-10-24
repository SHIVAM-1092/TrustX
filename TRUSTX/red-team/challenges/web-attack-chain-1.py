"""TrustX Red Team Challenge: Multi-Stage Web Attack Chain Lab

An advanced-level lab where learners combine at least two meaningful, related
weaknesses in a controlled local target (information disclosure + authentication
bypass/privilege escalation). Requires evidence from earlier stages to complete the
final objective. Includes checkpoints and a clear explanation of the attack chain.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/web-attack-chain-1")

# Flag secret from environment - unique per deployment
LAB_SECRET = os.getenv("LAB_SECRET", "trustx-lab-secret-dev-only")


class ChallengeState(BaseModel):
    """Track learner progress for this challenge."""
    challenge_id: str
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    stage1_completed: bool = False
    stage2_completed: bool = False
    stage1_evidence: Optional[str] = None
    stage2_evidence: Optional[str] = None
    attempts: List[Dict[str, Any]] = []
    flag: Optional[str] = None


def compute_flag(challenge_id: str, secret: str, subject: str) -> str:
    """Compute a unique flag for a learner completing this challenge."""
    hash_input = f"{challenge_id}:{secret}:{subject}".encode()
    digest = hashlib.sha256(hash_input).hexdigest()[:12]
    return f"{FLAG_PREFIX}{challenge_id}-{digest}}"


# In-memory challenge state store
_challenge_states: Dict[str, ChallengeState] = {}


def get_challenge_state(challenge_id: str, subject: str) -> ChallengeState:
    """Get or create challenge state for a learner."""
    key = f"{challenge_id}:{subject}"
    if key not in _challenge_states:
        _challenge_states[key] = ChallengeState(challenge_id=challenge_id)
    return _challenge_states[key]


def init_lab_workspace():
    """Initialize the lab workspace with multi-stage attack target."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Multi-Stage Web Attack Chain Lab\n\n"
            "## Objective\n"
            "Execute a multi-stage attack chain against a local web application:\n"
            "1. **Stage 1**: Exploit information disclosure to obtain API keys / tokens\n"
            "2. **Stage 2**: Use the leaked API key to bypass authentication and gain admin access\n"
            "3. **Stage 3**: Access secret administration endpoint to extract the flag\n\n"
            "## Attack Chain Topology\n"
            "```\n"
            "Stage 1: GET /api/v1/debug/config → Leaks internal API key\n"
            "Stage 2: POST /api/v1/auth/token-login with leaked key → Returns Admin JWT\n"
            "Stage 3: GET /api/v1/admin/secrets with Admin JWT → Exposes Flag\n"
            "```\n\n"
            "## Checkpoints\n"
            "- **Checkpoint 1**: Discover the debug endpoint and extract the internal API key (`API_KEY_SECRET_992`)\n"
            "- **Checkpoint 2**: Use the key to log in and receive an admin token\n"
            "- **Checkpoint 3**: Access admin secrets with the token to retrieve the flag\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Attack Chain - Hints\n\n"
            "## Hint 1 (Stage 1)\n"
            "Check for common debug or configuration endpoints like `/api/v1/debug/config` "
            "or `/env`. Look for leaked credentials in JSON responses.\n\n"
            "## Hint 2 (Stage 2)\n"
            "Use the discovered API key (`API_KEY_SECRET_992`) to call `/api/v1/auth/token-login` "
            "with payload `{\"api_key\": \"API_KEY_SECRET_992\"}` to receive an admin token.\n\n"
            "## Hint 3 (Stage 3)\n"
            "Use the admin token in the `Authorization: Bearer <token>` header to access "
            "`/api/v1/admin/secrets`.\n\n"
            "## Remediation\n"
            "- Disable debug endpoints in production environments\n"
            "- Store API keys in environment variables, never hardcode in responses\n"
            "- Implement strict RBAC and validate JWT signatures on every sensitive route\n"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "web-attack-chain-1",
        "name": "Multi-Stage Web Attack Chain",
        "category": "Complex Attack Chain / API Security",
        "objective": "Combine an information disclosure weakness with an authentication bypass to reach an administrative secrets endpoint in a 3-stage attack chain.",
        "description": (
            "This advanced lab requires chaining multiple weaknesses together:\n\n"
            "1. **Stage 1 — Information Disclosure**: Discover an unauthenticated debug endpoint "
            "that exposes internal configuration and a hardcoded API key.\n"
            "2. **Stage 2 — Auth Bypass**: Use the discovered API key to authenticate via a token-login "
            "endpoint and obtain an elevated admin token.\n"
            "3. **Stage 3 — Admin Access**: Use the admin token to access the restricted secrets "
            "endpoint and retrieve the flag.\n\n"
            "Each stage requires evidence from the previous stage to proceed."
        ),
        "difficulty": "Advanced",
        "hints": [
            "Start by looking for debug endpoints such as /api/v1/debug/config.",
            "Look for a key named 'api_key' in the debug configuration response.",
            "Send that key to /api/v1/auth/token-login to generate an admin token.",
            "Pass the admin token to /api/v1/admin/secrets to retrieve the flag."
        ],
        "flag_format": "KALI{web-attack-chain-1-<hash>}",
        "target_endpoint": "http://localhost:8083",
        "learning_objectives": [
            "Understand how minor information disclosures lead to full system compromise",
            "Execute multi-stage attack chains requiring sequential evidence",
            "Practice API security auditing and JWT token analysis",
            "Implement proper remediation for debug exposure and key management"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Multi-Stage Web Attack Chain lab.
    """
    if challenge_id != "web-attack-chain-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    response_lower = target_response.lower()
    payload_lower = payload.lower()

    # Stage 3 check - flag retrieval
    if "admin secrets" in response_lower or "flag" in response_lower or "kali{" in response_lower:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Attack Chain Completed! You successfully chained information disclosure → auth bypass → admin access.",
            "flag": flag
        }

    # Stage 2 check - token login
    if "token_login" in payload_lower or "api_key_secret_992" in payload_lower:
        return {
            "success": False,
            "feedback": "Stage 2 Checkpoint Passed! API key accepted, admin token generated. Now use this token to access /api/v1/admin/secrets.",
            "flag": None
        }

    # Stage 1 check - debug discovery
    if "debug/config" in payload_lower or "api_key_secret_992" in response_lower:
        return {
            "success": False,
            "feedback": "Stage 1 Checkpoint Passed! Discovered API key 'API_KEY_SECRET_992'. Next, submit it to /api/v1/auth/token-login.",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Attack chain not complete. Hint: Start by querying /api/v1/debug/config to find the leaked API key.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()