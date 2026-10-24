"""TrustX Blue Team Challenge: Brute-Force Detection Lab

An intermediate-level lab where learners inspect seeded authentication logs with
multiple source addresses and timestamps. They identify the source, timeframe,
affected account and relevant evidence using real analysis logic, not hard-coded success text.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/bruteforce-detection-1")

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
    """Initialize the lab workspace with seeded authentication logs."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create auth.log with brute-force patterns from multiple sources
    auth_log = LAB_ROOT / "auth.log"
    if not auth_log.exists():
        auth_log.write_text(
            "# Auth log for trustx-server - Jan 15, 2026\n"
            "# Format: Jan DD HH:MM:SS trustx-server sshd[PID]: Status for USER from IP port PORT ssh2\n\n"
            "# Normal successful logins (benign)\n"
            "Jan 15 08:20:01 trustx-server sshd[1111]: Successful authentication for admin from 10.0.0.10 port 45678 ssh2\n"
            "Jan 15 08:25:10 trustx-server sshd[2222]: Successful authentication for devops from 192.168.1.100 port 22222 ssh2\n"
            "Jan 15 09:01:22 trustx-server sshd[3333]: Successful authentication for user1 from 10.0.0.15 port 34567 ssh2\n\n"
            "# Brute force attempts from attacker IP\n"
            "Jan 15 08:23:45 trustx-server sshd[1234]: Failed password for root from 203.0.113.45 port 54322 ssh2\n"
            "Jan 15 08:23:47 trustx-server sshd[1235]: Failed password for admin from 203.0.113.45 port 54323 ssh2\n"
            "Jan 15 08:23:49 trustx-server sshd[1236]: Failed password for testuser from 203.0.113.45 port 54324 ssh2\n"
            "Jan 15 08:23:51 trustx-server sshd[1237]: Failed password for postgres from 203.0.113.45 port 54325 ssh2\n"
            "Jan 15 08:23:53 trustx-server sshd[1238]: Failed password for redis from 203.0.113.45 port 54326 ssh2\n"
            "Jan 15 08:23:55 trustx-server sshd[1239]: Failed password for mongodb from 203.0.113.45 port 54327 ssh2\n"
            "Jan 15 08:23:57 trustx-server sshd[1240]: Failed password for root from 203.0.113.45 port 54328 ssh2\n"
            "Jan 15 08:23:59 trustx-server sshd[1241]: Failed password for admin from 203.0.113.45 port 54329 ssh2\n"
            "Jan 15 08:24:01 trustx-server sshd[1242]: Failed password for testuser from 203.0.113.45 port 54330 ssh2\n"
            "Jan 15 08:24:03 trustx-server sshd[1243]: Failed password for root from 203.0.113.45 port 54331 ssh2\n\n"
            "# Additional suspicious attempts from another IP\n"
            "Jan 15 08:35:22 trustx-server sudo[4444]: pam_unix(sudo:auth): authentication failure for root; logname=admin uid=1000 euid=0 tty=pts0 ruser=admin rhost=198.51.100.50 user=root\n"
            "Jan 15 08:47:55 trustx-server sshd[5555]: Failed password for admin from 198.51.100.50 port 43210 ssh2\n"
            "Jan 15 08:47:57 trustx-server sshd[5556]: Failed password for postgres from 198.51.100.50 port 43211 ssh2\n"
            "Jan 15 08:47:59 trustx-server sshd[5557]: Failed password for oracle from 198.51.100.50 port 43212 ssh2\n\n"
            "# Legitimate failures from edge cases\n"
            "Jan 15 08:55:33 trustx-server sudo[6666]: pam_unix(sudo:auth): authentication failure; user=admin !root service=sudo cmd=/bin/ls\n"
            "Jan 15 09:03:44 trustx-server sudo[7777]: pam_unix(sudo:auth): authentication failure; user=root service=sudo cmd=/bin/find\n"
        )

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Brute-Force Detection Lab\n\n"
            "## Objective\n"
            "Inspect seeded authentication logs with multiple source addresses and "
            "timestamps. Identify the source, timeframe, affected account and relevant "
            "evidence using real analysis logic, not hard-coded success text.\n\n"
            "## Provided Files\n"
            "- `auth.log` — Authentication and sudo logs from trustx-server\n\n"
            "## Your Analysis Tasks\n"
            "1. Examine the auth.log file to identify all suspicious patterns\n"
            "2. Identify brute-force attacks from multiple source IPs\n"
            "3. For each brute force attack, determine:\n"
            "   - Source IP address\n"
            "   - Timeframe (first and last attempt)\n"
            "   - Targeted accounts\n"
            "   - Number of failed attempts\n"
            "   - Affected system\n"
            "4. Distinguish between attacker IPs and legitimate failures\n"
            "5. Submit your findings through the challenge validation\n\n"
            "## Your Analysis Toolkit\n"
            "Use these terminal commands:\n"
            "- `grep 'Failed password' auth.log` — List all failed logins\n"
            "- `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` — Count failures by IP\n"
            "- `awk '/{print $1, $2}' auth.log | sort -u` — Get unique timestamps\n"
            "- `grep '192.168' auth.log` — Filter by IP range\n"
            "- `grep '203.0.113' auth.log` — Filter attacker IP\n"
            "- `grep '198.51' auth.log` — Filter another suspicious IP\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Brute Force Detection - Hints\n\n"
            "## Hint 1: Count failures by source IP\n"
            "Use `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` to find IPs "
            "with the most failed attempts.\n\n"
            "## Hint 2: The two attacker IPs\n"
            "IP `203.0.113.45` has 10 attempts targeting root/admin. IP `198.51.100.50` has 3 attempts.\n\n"
            "## Hint 3: Timeframe for each IP\n"
            "203.0.113.45: 08:23:45 to 08:24:03 (19 minutes). 198.51.100.50: 08:35:22 to 08:47:59 (13 minutes).\n\n"
            "## Hint 4: Targeted accounts per IP\n"
            "203.0.113.45 targets: root, admin, testuser, postgres, redis, mongodb. 198.51.100.50 targets: root, admin, postgres.\n\n"
            "## Hint 5: Distinguish attacker from legitimate\n"
            "Legitimate failures have different patterns (wrong user, edge cases). The "
            "IPs above with many rapid attempts in short timeframes are the attacks.\n\n"
            "## Remediation\n"
            "- Implement fail2ban or rate limiting\n"
            "- Configure SSH to allow key-only authentication\n"
            "- Block known attacker IPs at the firewall\n"
            "- Monitor for repeated failed authentications and alert"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "bruteforce-detection-1",
        "name": "Brute-Force Detection",
        "category": "Log Analysis / Incident Response",
        "objective": "Inspect seeded authentication logs with multiple source addresses and timestamps. Identify the source, timeframe, affected account and relevant evidence using real analysis logic.",
        "description": (
            "You are given an auth.log file from a Linux server with authentication "
            "logs from multiple sources. Your task is to:\n\n"
            "1. Use terminal commands to parse and analyze the log file\n"
            "2. Identify all brute-force attacks from multiple source IPs\n"
            "3. For each brute force attack, determine:\n"
            "   - Source IP address\n"
            "   - Timeframe (first and last failed attempt timestamp)\n"
            "   - Targeted accounts\n"
            "   - Number of failed attempts per account\n"
            "4. Distinguish attacker activity from legitimate failures\n\n"
            "### Log Contents Overview\n"
            "The auth.log contains:\n"
            "- 3 successful authentications (benign)\n"
            "- 13 failed attempts from IP `203.0.113.45` targeting root/admin (brute force)\n"
            "- 6 failed attempts from IP `198.51.100.50` targeting root/admin/postgres (brute force)\n"
            "- Several legitimate edge-case failures\n\n"
            "### Expected Findings\n"
            "Attacker 1: IP=203.0.113.45, Timeframe=08:23:45-08:24:03, Accounts targeted=root,admin,testuser,postgres,redis,mongodb, Count=13\n"
            "Attacker 2: IP=198.51.100.50, Timeframe=08:35:22-08:47:59, Accounts targeted=root,admin,postgres, Count=6\n\n"
            "### Commands to Get Started\n"
            "- `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` — Count failures by IP\n"
            "- `grep '203.0.113' auth.log` — Show all attempts from attacker 1\n"
            "- `grep '198.51' auth.log` — Show all attempts from attacker 2\n"
            "- `awk '{print $1, $2}' auth.log | sort -u` — Get all timestamps\n"
        ),
        "difficulty": "Intermediate",
        "hints": [
            "Use `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` to count failures by source IP. The IP with the most attempts is likely an attacker.",
            "IP `203.0.113.45` has 13 failed attempts in about 19 minutes. IP `198.51.100.50` has 6 attempts in about 13 minutes.",
            "After identifying IPs, use `grep '203.0.113' auth.log` and `grep '198.51' auth.log` to see the full attack patterns.",
            "Distinguish attacker IPs from legitimate failures — legitimate failures have different patterns and are less frequent.",
            "Submit: Source IPs, timeframes, affected accounts, and attempt counts for both attacks."
        ],
        "flag_format": "KALI{bruteforce-detection-1-<hash>}",
        "target_endpoint": "Execution Environment (Terminal)",
        "learning_objectives": [
            "Parse and analyze authentication log files with multiple sources",
            "Identify brute-force attacks from multiple source IPs",
            "Extract key indicators: source IP, timeframe, targeted accounts",
            "Use awk, sort, uniq for log analysis and aggregation",
            "Distinguish between attacker activity and legitimate failures",
            "Document findings with precise evidence for incident reporting"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Brute-Force Detection lab.

    The payload contains the learner's submitted evidence (analysis text/JSON).
    We check if they correctly identified both attacker IPs and their details.
    """
    if challenge_id != "bruteforce-detection-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    payload_lower = payload.lower()

    # Check for evidence of both attacker IPs
    ip_203 = "203.0.113.45" in payload_lower
    ip_198 = "198.51.100.50" in payload_lower

    # Check for timeframes
    time_203 = "08:23:45" in payload_lower and "08:24:03" in payload_lower
    time_198 = "08:35:22" in payload_lower and "08:47:59" in payload_lower

    # Check for affected accounts
    accounts_203 = any(acc in payload_lower for acc in ["root", "admin", "testuser", "postgres", "redis", "mongodb"])
    accounts_198 = any(acc in payload_lower for acc in ["root", "admin", "postgres"])

    if ip_203 and ip_198 and time_203 and time_198 and accounts_203 and accounts_198:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Brute-Force Detection Complete! You correctly identified both attacker IPs: 203.0.113.45 (08:23:45-08:24:03, targeting root/admin/testuser/postgres/redis/mongodb) and 198.51.100.50 (08:35:22-08:47:59, targeting root/admin/postgres), with their respective attempt counts and timeframes.",
            "flag": flag
        }

    # Partial feedback - missing elements
    missing = []
    if not ip_203:
        missing.append("Source IP 203.0.113.45")
    if not ip_198:
        missing.append("Source IP 198.51.100.50")
    if not time_203:
        missing.append("Timeframe 08:23:45-08:24:03 for IP 203.0.113.45")
    if not time_198:
        missing.append("Timeframe 08:35:22-08:47:59 for IP 198.51.100.50")
    if not accounts_203:
        missing.append("Accounts targeted by IP 203.0.113.45")
    if not accounts_198:
        missing.append("Accounts targeted by IP 198.51.100.50")

    if missing:
        return {
            "success": False,
            "feedback": "Partial evidence. " + "; ".join(missing) + " not yet identified. Hint: Use `awk '{print $11}' auth.log | sort | uniq -c | sort -nr` to count failures by IP.",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Evidence not fully recognized. Hint: Parse the auth.log to identify all IPs, their timeframes, and targeted accounts.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()