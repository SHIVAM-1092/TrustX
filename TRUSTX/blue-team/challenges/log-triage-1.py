"""TrustX Blue Team Challenge: Security Log Triage Lab

An easy-level lab where learners analyze real seeded authentication and system
log files to identify a clearly defined suspicious event. They use terminal
commands and submit evidence to complete the objective.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/log-triage-1")

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
    """Initialize the lab workspace with seeded authentication and system logs."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create auth.log with a clear brute force pattern
    auth_log = LAB_ROOT / "auth.log"
    if not auth_log.exists():
        auth_log.write_text(
            "Jan 15 08:23:45 trustx-server sshd[1234]: Failed password for root from 192.168.1.45 port 54322 ssh2\n"
            "Jan 15 08:23:47 trustx-server sshd[1235]: Failed password for root from 192.168.1.45 port 54323 ssh2\n"
            "Jan 15 08:23:49 trustx-server sshd[1236]: Failed password for root from 192.168.1.45 port 54324 ssh2\n"
            "Jan 15 08:23:51 trustx-server sshd[1237]: Failed password for root from 192.168.1.45 port 54325 ssh2\n"
            "Jan 15 08:23:53 trustx-server sshd[1238]: Failed password for root from 192.168.1.45 port 54326 ssh2\n"
            "Jan 15 08:23:55 trustx-server sshd[1239]: Failed password for root from 192.168.1.45 port 54327 ssh2\n"
            "Jan 15 08:23:57 trustx-server sshd[1240]: Failed password for root from 192.168.1.45 port 54328 ssh2\n"
            "Jan 15 08:23:59 trustx-server sshd[1241]: Failed password for root from 192.168.1.45 port 54329 ssh2\n"
            "Jan 15 08:24:01 trustx-server sshd[1242]: Failed password for root from 192.168.1.45 port 54330 ssh2\n"
            "Jan 15 08:24:03 trustx-server sshd[1243]: Failed password for root from 192.168.1.45 port 54331 ssh2\n"
            "Jan 15 08:24:05 trustx-server sshd[1244]: Failed password for admin from 10.0.0.23 port 49152 ssh2\n"
            "Jan 15 08:25:10 trustx-server sshd[5678]: Failed password for admin from 10.0.0.23 port 49153 ssh2\n"
            "Jan 15 08:27:22 trustx-server sshd[9012]: Accepted password for admin from 10.0.0.10 port 45678 ssh2\n"
            "Jan 15 08:30:45 trustx-server sshd[3456]: Failed password for testuser from 172.16.0.99 port 32111 ssh2\n"
            "Jan 15 08:33:11 trustx-server sshd[7890]: Accepted password for devops from 192.168.1.100 port 22222\n"
            "Jan 15 08:35:22 trustx-server sudo[1234]: pam_unix(sudo:auth): authentication failure for root; logname=admin uid=1000 euid=0 tty=pts0 ruser=admin rhost=10.0.0.23 user=root\n"
            "Jan 15 08:40:10 trustx-server kernel: imklog: lost 5 messages due to ratelimit\n"
            "Jan 15 08:42:33 trustx-server sshd[1111]: Accepted password for analyst from 10.0.0.50 port 51322 ssh2\n"
            "Jan 15 08:45:00 trustx-server sudo[2222]: pam_unix(sudo:account): account locked for user root\n"
            "Jan 15 08:47:55 trustx-server sshd[3333]: Failed password for postgres from 192.168.1.105 port 43210 ssh2\n"
            "Jan 15 08:50:22 trustx-server sudo[4444]: COMMAND=sudo: /usr/bin/find / -name \"*.conf\" 2>/dev/null\n"
            "Jan 15 08:52:10 trustx-server sshd[5555]: Failed password for admin from 192.168.1.200 port 12345 ssh2\n"
            "Jan 15 08:55:33 trustx-server sudo[6666]: pam_unix(sudo:auth): authentication failure; user=admin !root service=sudo cmd=/bin/ls\n"
            "Jan 15 08:58:00 trustx-server systemd[1]: Starting TrustX Audit Service...\n"
            "Jan 15 08:59:00 trustx-server systemd[1]: Started TrustX Audit Service.\n"
            "Jan 15 09:01:22 trustx-server sshd[7777]: Accepted password for user1 from 10.0.0.15 port 34567 ssh2\n"
            "Jan 15 09:03:44 trustx-server sudo[8888]: COMMAND=sudo: /bin/cat /etc/passwd\n"
        )

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Security Log Triage Lab\n\n"
            "## Objective\n"
            "Analyze the provided authentication and system log files to identify a "
            "clearly defined suspicious event. Use terminal commands to investigate "
            "and submit evidence to complete the objective.\n\n"
            "## Provided Files\n"
            "- `auth.log` — Authentication and sudo logs from trustx-server\n\n"
            "## Investigation Tasks\n"
            "1. Examine the auth.log file for suspicious patterns\n"
            "2. Identify the source IP responsible for the brute force attack\n"
            "3. Identify the timeframe of the attack\n"
            "4. Identify the targeted account\n"
            "5. Submit your findings through the challenge validation\n\n"
            "## Commands to Try\n"
            "- `cat /workspace/sessions/<session>/auth.log` — View the log\n"
            "- `grep 'Failed password' auth.log | head -20` — See failed logins\n"
            "- `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` — Count IPs\n"
            "- `grep '192.168.1.45' auth.log` — Filter by suspicious IP\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Log Triage - Hints\n\n"
            "## Hint 1: Look for repeated failed login attempts\n"
            "Use `grep 'Failed password' auth.log` to see all failed logins.\n\n"
            "## Hint 2: Count occurrences by IP address\n"
            "One IP will stand out with many failed attempts in a short timeframe.\n\n"
            "## Hint 3: The suspicious IP\n"
            "The IP `192.168.1.45` has 10 failed login attempts for `root` in 20 seconds.\n\n"
            "## Hint 4: Validate your findings\n"
            "Submit the IP, timeframe (08:23:45-08:24:05), and account (root) as evidence.\n\n"
            "## Remediation\n"
            "- Implement rate limiting / fail2ban for SSH\n"
            "- Disable root login via SSH (PermitRootLogin no)\n"
            "- Use key-based authentication instead of passwords\n"
            "- Monitor and alert on repeated authentication failures\n"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "log-triage-1",
        "name": "Security Log Triage",
        "category": "Log Analysis / Incident Response",
        "objective": "Analyze seeded authentication logs to identify a brute force attack: determine the source IP, timeframe, targeted account, and submit evidence.",
        "description": (
            "You are given an auth.log file from a Linux server. Your task is to:\n"
            "1. Use terminal commands to explore the log file\n"
            "2. Identify the clearly defined suspicious event (a brute force attack)\n"
            "3. Determine:\n"
            "   - Source IP address\n"
            "   - Timeframe of the attack\n"
            "   - Targeted account\n"
            "   - Number of failed attempts\n"
            "4. Submit your findings through the challenge validation\n\n"
            "The attack pattern is obvious: one IP making rapid repeated failed "
            "login attempts against the root account."
        ),
        "difficulty": "Easy",
        "hints": [
            "Use `grep 'Failed password' auth.log` to see all failed logins.",
            "Count occurrences by IP address to find the attacker.",
            "The suspicious IP is 192.168.1.45 targeting the root account.",
            "The attack occurred between 08:23:45 and 08:24:05 on Jan 15.",
            "Submit: IP=192.168.1.45, Account=root, Timeframe=08:23:45-08:24:05, Count=10"
        ],
        "flag_format": "KALI{log-triage-1-<hash>}",
        "target_endpoint": "Execution Environment (Terminal)",
        "learning_objectives": [
            "Parse and analyze authentication log files",
            "Identify brute force attack patterns in logs",
            "Extract key indicators: source IP, timeframe, targeted account",
            "Use grep, awk, sort, uniq for log analysis",
            "Document findings for incident reporting"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Log Triage lab.

    The payload contains the learner's submitted evidence (JSON or text).
    We check if they correctly identified the attack details.
    """
    if challenge_id != "log-triage-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    payload_lower = payload.lower()

    # Check for required evidence elements
    has_ip = "192.168.1.45" in payload_lower
    has_account = "root" in payload_lower
    has_timeframe = ("08:23" in payload_lower or "08:24" in payload_lower) or ("8:23" in payload_lower or "8:24" in payload_lower)
    has_count = "10" in payload or "ten" in payload_lower

    if has_ip and has_account and has_timeframe and has_count:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Log Triage Complete! You correctly identified: Source IP 192.168.1.45, Target Account root, Timeframe 08:23:45-08:24:05, 10 failed attempts.",
            "flag": flag
        }

    # Partial credit hints
    feedback_parts = []
    if not has_ip:
        feedback_parts.append("Missing: Source IP (check for IP with most failed attempts)")
    if not has_account:
        feedback_parts.append("Missing: Targeted account")
    if not has_timeframe:
        feedback_parts.append("Missing: Timeframe of attack")
    if not has_count:
        feedback_parts.append("Missing: Number of failed attempts")

    if feedback_parts:
        return {
            "success": False,
            "feedback": "Incomplete evidence. " + "; ".join(feedback_parts) + ". Hint: Use grep and awk to extract details.",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Evidence not recognized. Hint: Use `grep 'Failed password' auth.log` and look for the IP with 10 rapid attempts.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()