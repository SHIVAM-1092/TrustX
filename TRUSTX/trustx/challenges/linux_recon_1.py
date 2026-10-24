"""TrustX Red Team Linux Reconnaissance Challenge

Registered challenge instance.
"""

from .linux_recon_1 import get_challenge_info, validate_attempt, compute_flag, init_lab_workspace

# Initialize lab workspace on import
init_lab_workspace()

challenge_id = "linux-recon-1"

def linux_recon_1_challenge():
    """Get the linux-recon-1 challenge configuration."""
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

def linux_recon_1_validate(challenge_id, payload, target_response, subject):
    """Validate a linux-recon-1 challenge attempt."""
    return validate_attempt(challenge_id, payload, target_response, subject)