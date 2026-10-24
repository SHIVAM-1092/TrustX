"""TrustX Blue Team Challenge: Incident Timeline Reconstruction Lab

An advanced-level lab where learners correlate multiple seeded log sources to
reconstruct a multi-stage incident timeline. They identify the initial event and
subsequent activity, and validate the result against expected evidence.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/incident-timeline-1")

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
    """Initialize the lab workspace with multiple seeded log sources."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Source 1: auth.log with SSH brute force + suspicious sudo
    auth_log = LAB_ROOT / "auth.log"
    if not auth_log.exists():
        auth_log.write_text(
            "# Auth log for trustx-server - Jan 15, 2026\n"
            "# Format: Jan DD HH:MM:SS trustx-server sshd[PID]: Status for USER from IP port PORT ssh2\n\n"
            "# Initial intrusion attempt - brute force SSH from external IP\n"
            "Jan 15 08:23:45 trustx-server sshd[1234]: Failed password for root from 203.0.113.45 port 54322 ssh2\n"
            "Jan 15 08:23:47 trustx-server sshd[1235]: Failed password for admin from 203.0.113.45 port 54323 ssh2\n"
            "Jan 15 08:23:49 trustx-server sshd[1236]: Failed password for testuser from 203.0.113.45 port 54324 ssh2\n"
            "Jan 15 08:23:51 trustx-server sshd[1237]: Failed password for root from 203.0.113.45 port 54325 ssh2\n"
            "Jan 15 08:23:53 trustx-server sshd[1238]: Failed password for admin from 203.0.113.45 port 54326 ssh2\n\n"
            "# Successful login from internal IP after attack\n"
            "Jan 15 08:25:10 trustx-server sshd[2222]: Successful authentication for admin from 10.0.0.10 port 45678 ssh2\n\n"
            "# Privilege escalation attempt via sudo\n"
            "Jan 15 08:35:22 trustx-server sudo[4444]: pam_unix(sudo:auth): authentication failure for root; logname=admin uid=1000 euid=0 tty=pts0 ruser=admin rhost=203.0.113.45 user=root\n"
            "Jan 15 08:35:33 trustx-server sudo[5555]: COMMAND=/usr/bin/find / -name \".*\" 2>/dev/null\n\n"
            "# Data exfiltration indicator\n"
            "Jan 15 08:40:10 trustx-server kernel: imklog: lost 10 messages due to ratelimit\n"
            "Jan 15 08:42:33 trustx-server sshd[7777]: Accepted password for analyst from 10.0.0.50 port 51322 ssh2\n\n"
            "# Outbound connection to suspicious external IP\n"
            "Jan 15 08:45:00 trustx-server firewall[8888]: OUTBOUND TCP from 10.0.0.10:54321 to 203.0.113.45:443 packets=500 bytes=25000\n"
            "Jan 15 08:45:05 trustx-server firewall[8888]: OUTBOUND TCP from 10.0.0.10:54322 to 203.0.113.45:443 packets=300 bytes=15000\n\n"
            "# System service restart (cover track)\n"
            "Jan 15 08:50:00 trustx-server systemd[1]: Starting TrustX Audit Service...\n"
            "Jan 15 08:50:05 trustx-server systemd[1]: Started TrustX Audit Service.\n"
        )

    # Source 2: access.log with web request anomalies
    access_log = LAB_ROOT / "access.log"
    if not access_log.exists():
        access_log.write_text(
            "# Web access log for trustx-server.example.com - Jan 15, 2026\n"
            "# Format: IP - - [DD/Mon/YYYY:HH:MM:SS +0000] \"METHOD /path HTTP/1.1\" STATUS SIZE \"REFERER\" \"USER-AGENT\"\n\n"
            "# Legitimate admin API calls\n"
            "10.0.0.10 - - [15/Jan/2026:08:20:00 +0000] \"GET /api/admin/status HTTP/1.1\" 200 512 \"-\" \"Mozilla/5.0\"\n"
            "10.0.0.10 - - [15/Jan/2026:08:22:00 +0000] \"GET /api/admin/users HTTP/1.1\" 200 1024 \"-\" \"Mozilla/5.0\"\n\n"
            "# Suspicious admin API calls during attack\n"
            "203.0.113.45 - - [15/Jan/2026:08:23:46 +0000] \"GET /api/admin/config HTTP/1.1\" 200 8192 \"-\" \"curl/7.88.1\"\n"
            "203.0.113.45 - - [15/Jan/2026:08:23:47 +0000] \"GET /api/admin/secrets HTTP/1.1\" 200 16384 \"-\" \"curl/7.88.1\"\n\n"
            "# Data staging from compromised account\n"
            "10.0.0.10 - - [15/Jan/2026:08:40:00 +0000] \"POST /api/export HTTP/1.1\" 200 4096 \"-\" \"curl/7.88.1\"\n\n"
            "# Unknown external IP accessing admin endpoints\n"
            "203.0.113.45 - - [15/Jan/2026:08:45:01 +0000] \"GET /api/admin/users HTTP/1.1\" 403 64 \"-\" \"curl/7.88.1\"\n\n"
        )

    # Source 3: system.log with system events
    system_log = LAB_ROOT / "system.log"
    if not system_log.exists():
        system_log.write_text(
            "# System log for trustx-server - Jan 15, 2026\n\n"
            "# Service start events\n"
            "Jan 15 06:00:00 trustx-server systemd[1]: Starting TrustX Application Service...\n"
            "Jan 15 06:00:05 trustx-server systemd[1]: Started TrustX Application Service.\n\n"
            "# SSH service restarts (potential cover track)\n"
            "Jan 15 08:50:00 trustx-server systemd[1]: Starting TrustX Audit Service...\n"
            "Jan 15 08:50:05 trustx-server systemd[1]: Started TrustX Audit Service.\n\n"
            "# Kernel warnings (data exfiltration)\n"
            "Jan 15 08:40:10 trustx-server kernel: imklog: lost 10 messages due to ratelimit\n\n"
            "# Suspicious cron job detection\n"
            "Jan 15 08:35:00 trustx-server CRON[3333]: (admin) CMD (/usr/bin/find / -name \".*\" 2>/dev/null) >> /var/log/cron_output.log\n\n"
            "# Service stop events (cover tracks)\n"
            "Jan 15 08:55:00 trustx-server systemd[1]: Stopping TrustX Application Service...\n"
            "Jan 15 08:55:05 trustx-server systemd[1]: Stopped TrustX Application Service.\n\n"
            "# Network interface reset (potential track cover)\n"
            "Jan 15 08:56:00 trustx-server kernel: IP route delete 203.0.113.45\n"
        )

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Incident Timeline Reconstruction Lab\n\n"
            "## Objective\n"
            "Correlate multiple seeded log sources to reconstruct a multi-stage incident "
            "timeline. Identify the initial event and subsequent activity. Validate the "
            "result against expected evidence.\n\n"
            "## Provided Log Sources\n"
            "- `auth.log` — Authentication and sudo logs from trustx-server\n"
            "- `access.log` — Web access logs from trustx-server.example.com\n"
            "- `system.log` — System events from trustx-server\n\n"
            "## Your Investigation Tasks\n"
            "1. Examine all three log sources to identify the attack chain\n"
            "2. Correlate events across log files by timestamp and system\n"
            "3. Reconstruct the incident timeline:\n"
            "   - Initial event (first indicator of compromise)\n"
            "   - Subsequent activity (lateral movement, data access, exfiltration)\n"
            "   - Cover track attempts\n"
            "4. Identify the affected systems and data\n"
            "5. Submit your reconstructed timeline and findings through the challenge validation\n\n"
            "## Commands to Correlate Logs\n"
            "Use these terminal commands:\n"
            "- `grep '08:23' auth.log access.log system.log` — Find initial attack events\n"
            "- `grep '203.0.113' auth.log access.log` — Filter by attacker IP\n"
            "- `grep 'sudo\\|find' auth.log` — Find privilege escalation\n"
            "- `grep 'firewall\\|outbound' system.log` — Find exfiltration events\n"
            "- `awk '{print $1, $2}' auth.log access.log system.log | sort -u` — Get all unique timestamps\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Incident Timeline - Hints\n\n"
            "## Hint 1: Start with the earliest event\n"
            "The brute force SSH attacks at 08:23:45 are the initial intrusion indicator.\n\n"
            "## Hint 2: Follow the attack chain\n"
            "08:23:45 → SSH brute force → 08:25:10 → Successful login → 08:35:22 → sudo escalation → 08:40:10 → Kernel warnings → 08:45:00 → Outbound exfiltration\n\n"
            "## Hint 3: Correlate across log sources\n"
            "The attacker IP 203.0.113.45 appears in auth.log, access.log, and system.log firewall entries.\n"
            "The internal IP 10.0.0.10 appears in access.log making legitimate and suspicious API calls.\n\n"
            "## Hint 4: Timeline structure\n"
            "Stage 1: Initial brute force (08:23:45-08:23:53, auth.log)\n"
            "Stage 2: Privilege escalation via sudo (08:35:22, auth.log)\n"
            "Stage 3: Data access and staging (08:40:00-08:45:00, access.log + system.log)\n"
            "Stage 4: Data exfiltration (08:45:00-08:45:05, system.log)\n"
            "Stage 5: Track covering (08:50:00-08:56:00, system.log)\n\n"
            "## Remediation\n"
            "- Correlate logs across all system components for full incident visibility\n"
            "- Implement centralized log collection (SIEM)\n"
            "- Set up alerts on repeated auth failures and sudo escalations\n"
            "- Monitor outbound traffic to suspicious external IPs\n"
            "- Preserve logs with proper retention and integrity controls"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "incident-timeline-1",
        "name": "Incident Timeline Reconstruction",
        "category": "Incident Response / Log Analysis",
        "objective": "Correlate multiple seeded log sources to reconstruct a multi-stage incident timeline. Identify the initial event and subsequent activity, and validate the result against expected evidence.",
        "description": (
            "You are given three log sources from a Linux server that together form "
            "a complete incident narrative. Your task is to:\n\n"
            "1. Examine all three log files (auth.log, access.log, system.log)\n"
            "2. Correlate events across log files by timestamp and system\n"
            "3. Reconstruct the complete incident timeline with these stages:\n"
            "   - **Stage 1 — Initial Compromise**: SSH brute force from 203.0.113.45 "
            "(08:23:45-08:23:53), auth.log\n"
            "   - **Stage 2 — Privilege Escalation**: Sudo misconfiguration allowing "
            "root access without password (08:35:22), auth.log\n"
            "   - **Stage 3 — Data Staging**: Admin API access and export staging "
            "(08:40:00-08:45:00), access.log + auth.log\n"
            "   - **Stage 4 — Data Exfiltration**: Outbound connections to attacker IP "
            "(08:45:00-08:45:05), system.log\n"
            "   - **Stage 5 — Track Covering**: Service restarts and log manipulation "
            "(08:50:00-08:56:00), system.log\n"
            "4. Identify:\n"
            "   - The initial event that started the incident\n"
            "   - All subsequent activity in chronological order\n"
            "   - The affected systems and data\n"
            "   - The attacker's IP and methods\n"
            "5. Submit your reconstructed timeline and evidence\n\n"
            "### Expected Evidence\n"
            "- Initial event: SSH brute force from 203.0.113.45 at 08:23:45 (auth.log)\n"
            "- Privilege escalation: sudo find / at 08:35:22 (auth.log)\n"
            "- Data export staging: POST /api/export at 08:40:00 (access.log)\n"
            "- Exfiltration: Outbound to 203.0.113.45 at 08:45:00-08:45:05 (system.log)\n"
            "- Track covering: systemd service restart at 08:50:00 (system.log)\n\n"
            "### Commands to Get Started\n"
            "- `grep '08:23' auth.log` — Initial attack events\n"
            "- `grep '203.0.113' auth.log access.log` — Attacker IP correlation\n"
            "- `grep 'sudo\\|find' auth.log` — Privilege escalation events\n"
            "- `grep 'firewall\\|outbound\\|exfil' system.log` — Exfiltration events\n"
            "- `awk '{print $1, $2}' auth.log access.log system.log | sort -u` — All timestamps\n"
            "- `grep '203.0.113.45' auth.log access.log` — Full attacker footprint\n"
        ),
        "difficulty": "Advanced",
        "hints": [
            "Start with the earliest event — the SSH brute force at 08:23:45 in auth.log is the initial compromise indicator.",
            "The attacker IP 203.0.113.45 appears across all three log sources — follow its trail.",
            "The timeline flows: 08:23:45 SSH brute force → 08:35:22 sudo escalation → 08:40:10 kernel warnings → 08:45:00 outbound exfil → 08:50:00 track covering.",
            "Correlate by timestamp — events at 08:23, 08:35, 08:40, 08:45, 08:50 map to the five stages.",
            "The internal IP 10.0.0.10 is also involved — note the legitimate and suspicious API calls.",
            "Submit: Full chronological timeline with all five stages, attacker IP, and key evidence from each log source."
        ],
        "flag_format": "KALI{incident-timeline-1-<hash>}",
        "target_endpoint": "Execution Environment (Terminal)",
        "learning_objectives": [
            "Correlate events across multiple log sources in incident response",
            "Identify the initial compromise indicator and attack chain stages",
            "Extract key indicators: timestamps, source IPs, affected systems, methods",
            "Use grep, awk, sort for log analysis and timeline reconstruction",
            "Distinguish between attack events and track-covering events",
            "Document a complete incident timeline with evidence from each source"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Incident Timeline lab.

    The payload contains the learner's submitted timeline/evidence.
    We check if they correctly identified all five stages and the initial event.
    """
    if challenge_id != "incident-timeline-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    payload_lower = payload.lower()

    # Check for evidence of all five stages
    stage1 = "08:23:45" in payload_lower and "brute force" in payload_lower and "203.0.113" in payload_lower
    stage2 = "08:35:22" in payload_lower and "sudo" in payload_lower and "root" in payload_lower
    stage3 = "08:40:00" in payload_lower and "export" in payload_lower
    stage4 = "08:45:00" in payload_lower and "exfil" in payload_lower and "203.0.113" in payload_lower
    stage5 = "08:50:00" in payload_lower and "restart" in payload_lower

    if stage1 and stage2 and stage3 and stage4 and stage5:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Incident Timeline Reconstruction Complete! You correctly identified all five stages: (1) Initial SSH brute force from 203.0.113.45 at 08:23:45, (2) Privilege escalation via sudo at 08:35:22, (3) Data export staging at 08:40:00, (4) Data exfiltration to 203.0.113.45 at 08:45:00, (5) Track covering via service restart at 08:50:00.",
            "flag": flag
        }

    # Partial feedback
    missing = []
    if not stage1:
        missing.append("Stage 1: Initial SSH brute force at 08:23:45")
    if not stage2:
        missing.append("Stage 2: Privilege escalation via sudo at 08:35:22")
    if not stage3:
        missing.append("Stage 3: Data export staging at 08:40:00")
    if not stage4:
        missing.append("Stage 4: Data exfiltration at 08:45:00")
    if not stage5:
        missing.append("Stage 5: Track covering at 08:50:00")

    if missing:
        return {
            "success": False,
            "feedback": "Partial evidence. " + "; ".join(missing) + " not yet identified. Hint: Correlate events across auth.log, access.log, and system.log by timestamp.",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Evidence not fully recognized. Hint: Examine all three log sources and identify the five-stage incident timeline.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()