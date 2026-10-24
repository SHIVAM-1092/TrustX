"""TrustX Red Team Web Authentication Bypass Challenge

Registered challenge instance.
"""

from .web_auth_bypass_1 import get_challenge_info, validate_attempt, compute_flag, init_lab_workspace

# Initialize lab workspace on import
init_lab_workspace()

challenge_id = "web-auth-bypass-1"

def web_auth_bypass_1_challenge():
    """Get the web-auth-bypass-1 challenge configuration."""
    info = get_challenge_info()
    return {
        "id": info["id"],
        "name": info["name"],
        "category": info["category"],
        "difficulty": info["difficulty"],
        "team": "red",
        "objective": info["objective"],
        "description": info["description"],
        "hints": info["hints"],
        "flag_format": info["flag_format"],
        "target_endpoint": info["target_endpoint"],
        "learning_objectives": info["learning_objectives"]
    }

def web_auth_bypass_1_validate(challenge_id, payload, target_response, subject):
    """Validate a web-auth-bypass-1 challenge attempt."""
    return validate_attempt(challenge_id, payload, target_response, subject)