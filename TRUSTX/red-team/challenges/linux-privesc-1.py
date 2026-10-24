"""TrustX Red Team Challenge: Linux Privilege Escalation Investigation Lab

An advanced-level lab where learners are provided with a deliberately vulnerable,
unprivileged lab environment. They must identify a specific misconfiguration
(sudo NOPASSWD on dangerous command) and demonstrate its impact. Keeps
privileges, capabilities, filesystem mounts and network boundaries restricted
to the lab. Never grants the container privileged mode or host access.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/linux-privesc-1")

# Flag secret from environment - unique per deployment
LAB_SECRET = os.getenv("LAB_SECRET", "trustx-lab-secret-dev-only")


class ChallengeState(BaseModel):
    """Track learner progress for this challenge."""
    challenge_id: str
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
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
    """Initialize the lab workspace with seeded files for privilege escalation investigation."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create sudoers configuration (simulated - the real one is in /etc/sudoers)
    sudoers_file = LAB_ROOT / "sudoers_dump.txt"
    if not sudoers_file.exists():
        sudoers_file.write_text(
            "# TrustX Lab Sudoers Configuration (simulated for investigation)\n"
            "# This is a copy of the relevant /etc/sudoers entries for this lab\n\n"
            "# User privilege specification\n"
            "root    ALL=(ALL:ALL) ALL\n"
            "\n"
            "# Members of the admin group may gain root privileges\n"
            "%admin  ALL=(ALL) ALL\n"
            "\n"
            "# VULNERABILITY: labuser can run find as root without password\n"
            "labuser ALL=(root) NOPASSWD: /usr/bin/find\n"
            "\n"
            "# Other safe entries\n"
            "labuser ALL=(ALL) NOPASSWD: /bin/ls, /bin/cat, /bin/grep\n"
        )

    # Create the flag file that requires root to read
    flag_file = LAB_ROOT / "FLAG"
    if not flag_file.exists():
        flag_content = compute_flag("linux-privesc-1", LAB_SECRET, "learner")
        flag_file.write_text(flag_content)
        os.chmod(flag_file, 0o600)
        # In a real scenario, this would be owned by root and only readable via sudo
        # For this lab, we simulate by checking if the learner uses sudo correctly

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Linux Privilege Escalation Investigation Lab\n\n"
            "## Objective\n"
            "Investigate a deliberately vulnerable, unprivileged lab environment. "
            "Identify a specific misconfiguration in sudo rules and demonstrate its "
            "impact by reading the flag file as root.\n\n"
            "## Lab Environment\n"
            "- You are logged in as `labuser` (UID 1000)\n"
            "- The environment has restricted capabilities (no NEWPRIVS, limited caps)\n"
            "- Your goal: Find the sudo misconfiguration and exploit it\n"
            "- The flag is in a file only readable by root\n\n"
            "## Allowed Commands for Investigation\n"
            "- `sudo -l` — List your sudo permissions\n"
            "- `cat /etc/sudoers` — View sudo configuration (requires sudo)\n"
            "- `find / -name FLAG 2>/dev/null` — Search for the flag file\n"
            "- `sudo find / -exec cat /workspace/challenges/linux-privesc-1/FLAG \\; 2>/dev/null` — Exploit path\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Privilege Escalation - Hints\n\n"
            "## Hint 1: Check your sudo permissions\n"
            "Run `sudo -l` to see what commands you can execute as root without a password.\n\n"
            "## Hint 2: Look for dangerous commands\n"
            "The `find` command with `-exec` can be used to execute arbitrary commands as root. "
            "If sudo allows running `find` as root without a password, you have a privilege escalation path.\n\n"
            "## Hint 3: The flag is in the challenge workspace\n"
            "Search for the FLAG file: `find / -name FLAG 2>/dev/null`\n\n"
            "## Hint 4: The exploit\n"
            "Use: `sudo find / -exec cat /workspace/challenges/linux-privesc-1/FLAG \\; 2>/dev/null`\n"
            "This runs `cat` on the flag file as root, bypassing the file permissions.\n\n"
            "## Remediation\n"
            "- Never grant NOPASSWD on commands that can spawn shells or execute arbitrary code (find, vim, less, more, awk, sed, etc.)\n"
            "- Use specific command arguments in sudoers (e.g., `/usr/bin/find /var/log -name '*.log'`) instead of full command\n"
            "- Regularly audit sudoers configuration with `sudo -l` for all users\n"
            "- Implement the principle of least privilege"
        )

    # Create a log file showing the sudo configuration
    log_file = LAB_ROOT / "system.log"
    if not log_file.exists():
        log_file.write_text(
            "2026-01-15 10:00:00 INFO Lab environment initialized\n"
            "2026-01-15 10:00:01 INFO User labuser created with UID 1000\n"
            "2026-01-15 10:00:02 INFO Sudo misconfiguration applied: labuser ALL=(root) NOPASSWD: /usr/bin/find\n"
            "2026-01-15 10:00:03 INFO Flag file created at /workspace/challenges/linux-privesc-1/FLAG\n"
            "2026-01-15 10:00:04 INFO Lab ready for investigation\n"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "linux-privesc-1",
        "name": "Linux Privilege Escalation Investigation",
        "category": "Privilege Escalation / Linux Security",
        "objective": "Identify a specific sudo misconfiguration (NOPASSWD on /usr/bin/find) and demonstrate its impact by reading a root-only flag file.",
        "description": (
            "You are in a deliberately vulnerable but UNPRIVILEGED lab environment as `labuser`.\n\n"
            "Your task:\n"
            "1. Enumerate your sudo permissions using `sudo -l`\n"
            "2. Identify the dangerous misconfiguration (NOPASSWD on `/usr/bin/find`)\n"
            "3. Find the flag file location using `find`\n"
            "4. Exploit the find command's `-exec` flag to read the flag as root\n\n"
            "## Critical Constraints (Safety)\n"
            "- The container runs WITHOUT privileged mode\n"
            "- Capabilities are DROPPED (cap_drop: ALL, cap_add: CAP_DAC_OVERRIDE only for file access)\n"
            "- No Docker socket mounted, no host filesystem access\n"
            "- Network is isolated to the lab's Docker network\n"
            "- The sudoers configuration is pre-configured in the container image\n\n"
            "## Safe by Design\n"
            "The only 'privilege escalation' possible is within the container's own "
            "sudo configuration — you cannot escape to the host, access Docker, "
            "or affect other containers. This demonstrates the concept safely."
        ),
        "difficulty": "Advanced",
        "hints": [
            "Run `sudo -l` to list your sudo permissions.",
            "Look for NOPASSWD entries that allow running commands as root.",
            "The `find` command with `-exec` can execute arbitrary commands.",
            "The flag file is in the challenge workspace directory.",
            "Use `sudo find / -exec cat <flag_path> \\; 2>/dev/null` to read it."
        ],
        "flag_format": "KALI{linux-privesc-1-<hash>}",
        "target_endpoint": "Execution Environment (Terminal)",
        "learning_objectives": [
            "Understand sudo misconfigurations that lead to privilege escalation",
            "Safely demonstrate NOPASSWD on dangerous binaries (find, vim, less, awk, etc.)",
            "Practice Linux privilege enumeration techniques",
            "Learn to audit sudoers configurations for security",
            "Understand container isolation limits vs. host escape risks"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Linux Privilege Escalation lab.

    The payload is the command executed, and target_response is the output.
    We check if the learner successfully used sudo find -exec to read the flag.
    """
    if challenge_id != "linux-privesc-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    payload_lower = payload.lower()
    response_lower = target_response.lower()

    # Check if they successfully used sudo find with -exec to cat the flag
    used_sudo_find = "sudo find" in payload_lower and "-exec" in payload_lower
    flag_in_output = "kali{linux-privesc-1-" in response_lower

    if used_sudo_find and flag_in_output:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Privilege Escalation Successful! You identified the sudo NOPASSWD misconfiguration on /usr/bin/find and exploited it to read the root-only flag.",
            "flag": flag
        }

    # Checkpoint: discovered sudo permissions
    if "sudo -l" in payload_lower or "nopasswd" in response_lower or "/usr/bin/find" in response_lower:
        return {
            "success": False,
            "feedback": "Checkpoint Passed! You discovered the sudo NOPASSWD misconfiguration on /usr/bin/find. Now find the FLAG file and use find -exec to read it as root.",
            "flag": None
        }

    # Checkpoint: found the flag file location
    if "flag" in payload_lower and "find" in payload_lower:
        return {
            "success": False,
            "feedback": "Checkpoint Passed! You found the flag file location. Now exploit the sudo find misconfiguration: `sudo find / -exec cat /workspace/challenges/linux-privesc-1/FLAG \\; 2>/dev/null`",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Continue investigating. Hint: Start with `sudo -l` to check your sudo permissions.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()