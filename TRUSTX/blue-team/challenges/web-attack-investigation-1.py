"""TrustX Blue Team Challenge: Web Attack Investigation Lab

An intermediate-level lab where learners inspect seeded web access/error logs.
They correlate suspicious requests, status codes and timestamps to determine the
likely attack pattern and affected endpoint.
"""

import hashlib
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"

# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/web-attack-investigation-1")

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
    """Initialize the lab workspace with seeded web access/error logs."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create access.log with attack patterns
    access_log = LAB_ROOT / "access.log"
    if not access_log.exists():
        access_log.write_text(
            "# Web access log for trustx-server.example.com - Jan 15, 2026\n"
            "# Format: IP - - [DD/Mon/YYYY:HH:MM:SS +0000] \"METHOD /path HTTP/1.1\" STATUS SIZE \"REFERER\" \"USER-AGENT\"\n\n"
            "# Legitimate traffic\n"
            "192.168.1.45 - - [15/Jan/2026:08:23:45 +0000] \"GET /dashboard HTTP/1.1\" 200 2326 \"-\" \"Mozilla/5.0\"\n"
            "10.0.0.23 - - [15/Jan/2026:08:25:10 +0000] \"POST /login HTTP/1.1\" 401 128 \"-\" \"Mozilla/5.0\"\n"
            "172.16.0.99 - - [15/Jan/2026:08:30:45 +0000] \"GET /api/users HTTP/1.1\" 200 512 \"-\" \"curl/7.88.1\"\n"
            "192.168.1.100 - - [15/Jan/2026:08:33:11 +0000] \"GET /health HTTP/1.1\" 200 128 \"-\" \"curl/7.88.1\"\n\n"
            "# SQL Injection attempts\n"
            "198.51.100.25 - - [15/Jan/2026:08:35:00 +0000] \"GET /api/users?id=' OR 1=1-- HTTP/1.1\" 500 128 \"-\" \"curl/7.88.1\"\n"
            "198.51.100.25 - - [15/Jan/2026:08:35:01 +0000] \"POST /login HTTP/1.1\" 401 64 \"-\" \"curl/7.88.1\"\n"
            "198.51.100.25 - - [15/Jan/2026:08:35:02 +0000] \"GET /api/products?category=' UNION SELECT password FROM users-- HTTP/1.1\" 500 128 \"-\" \"curl/7.88.1\"\n\n"
            "# XSS attempts\n"
            "203.0.113.50 - - [15/Jan/2026:08:37:10 +0000] \"GET /search?q=<script>alert('xss')</script> HTTP/1.1\" 403 64 \"-\" \"curl/7.88.1\"\n"
            "203.0.113.50 - - [15/Jan/2026:08:37:11 +0000] \"POST /comment HTTP/1.1\" 500 64 \"-\" \"curl/7.88.1\"\n\n"
            "# Path traversal attempts\n"
            "192.168.1.200 - - [15/Jan/2026:08:40:00 +0000] \"GET /../../../etc/passwd HTTP/1.1\" 404 32 \"-\" \"curl/7.88.1\"\n"
            "192.168.1.200 - - [15/Jan/2026:08:40:01 +0000] \"GET /../../var/log/auth.log HTTP/1.1\" 403 32 \"-\" \"curl/7.88.1\"\n\n"
            "# Successful requests\n"
            "10.0.0.15 - - [15/Jan/2026:09:01:22 +0000] \"GET /api/logs HTTP/1.1\" 200 3072 \"-\" \"Mozilla/5.0\"\n"
        )

    # Create target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Web Attack Investigation Lab\n\n"
            "## Objective\n"
            "Inspect seeded web access/error logs. Correlate suspicious requests, status "
            "codes and timestamps. Determine the likely attack pattern and affected endpoint.\n\n"
            "## Provided Files\n"
            "- `access.log` — Web access logs from trustx-server.example.com\n\n"
            "## Your Investigation Tasks\n"
            "1. Examine the access.log file to identify all suspicious patterns\n"
            "2. Correlate requests by IP address, status codes, and timestamps\n"
            "3. Identify the attack patterns present:\n"
            "   - SQL injection attempts\n"
            "   - XSS injection attempts\n"
            "   - Path traversal attempts\n"
            "4. Determine the affected endpoint(s)\n"
            "5. Submit your findings through the challenge validation\n\n"
            "## Log Format\n"
            "IP - - [DD/Mon/YYYY:HH:MM:SS +0000] \"METHOD /path HTTP/1.1\" STATUS SIZE \"REFERER\" \"USER-AGENT\"\n\n"
            "## Your Analysis Toolkit\n"
            "Use these terminal commands:\n"
            "- `grep '500' access.log` — Find server error responses\n"
            "- `grep '500\\|403\\|401' access.log` — Find error status codes\n"
            "- `awk '{print $1}' access.log | sort | uniq -c | sort -nr` — Count requests by IP\n"
            "- `grep 'OR 1=1' access.log` — Find SQL injection attempts\n"
            "- `grep '<script>' access.log` — Find XSS attempts\n"
            "- `grep '\\.\\./' access.log` — Find path traversal attempts\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Web Attack Investigation - Hints\n\n"
            "## Hint 1: Count requests by status code\n"
            "Use `awk '{print $9}' access.log | sort | uniq -c | sort -nr` to see the distribution of status codes.\n\n"
            "## Hint 2: The three attack patterns\n"
            "Status 500 + 'OR 1=1' = SQL injection. Status 403 + '<script>' = XSS. Status 404 + '../' = path traversal.\n\n"
            "## Hint 3: The attacker IPs\n"
            "IP `198.51.100.25` performs SQL injection. IP `203.0.113.50` performs XSS. IP `192.168.1.200` performs path traversal.\n\n"
            "## Hint 4: Affected endpoints\n"
            "SQL injection targets `/api/users` and `/api/products`. XSS targets `/search` and `/comment`. Path traversal targets root filesystem access.\n\n"
            "## Hint 4: Correlate timestamps\n"
            "Note the time window of each attack to understand the scope.\n\n"
            "## Remediation\n"
            "- Parameterize all SQL queries, never interpolate user input\n"
            "- Escape all output before rendering in HTML\n"
            "- Implement input validation and sanitization\n"
            "- Use Web Application Firewall (WAF) rules for common attacks\n"
            "- Return generic error messages that don't leak stack traces"
        )


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "web-attack-investigation-1",
        "name": "Web Attack Investigation",
        "category": "Web Security / Log Analysis",
        "objective": "Inspect seeded web access/error logs. Correlate suspicious requests, status codes and timestamps to determine the likely attack pattern and affected endpoint.",
        "description": (
            "You are given an access.log file from a web server. Your task is to:\n\n"
            "1. Use terminal commands to parse and analyze the log file\n"
            "2. Identify all attack patterns present:\n"
            "   - SQL injection (error 500 + 'OR 1=1' in query)\n"
            "   - XSS (403 + script tags in payload)\n"
            "   - Path traversal (404 + '../' in path)\n"
            "3. For each attack, determine:\n"
            "   - Attacker IP address\n"
            "   - Targeted endpoint\n"
            "   - Status code and timestamp\n"
            "   - Payload used\n"
            "4. Correlate all findings to determine the full attack scope\n\n"
            "### Log Contents Overview\n"
            "The access.log contains:\n"
            "- 5 legitimate requests (200 status)\n"
            "- 3 SQL injection attempts from IP 198.51.100.25 (500 status)\n"
            "- 2 XSS attempts from IP 203.0.113.50 (403 status)\n"
            "- 2 path traversal attempts from IP 192.168.1.200 (404 status)\n"
            "- 1 successful request (200 status)\n\n"
            "### Expected Findings\n"
            "SQL Injection: IP=198.51.100.25, Endpoint=/api/users?id=' OR 1=1-- (08:35:00), /api/products?category=' UNION SELECT... (08:35:02)\n"
            "XSS: IP=203.0.113.50, Endpoint=/search?q=<script>alert('xss')</script> (08:37:10)\n"
            "Path Traversal: IP=192.168.1.200, Endpoint=/../../../etc/passwd (08:40:00)\n\n"
            "### Commands to Get Started\n"
            "- `awk '{print $9}' access.log | sort | uniq -c | sort -nr` — Status code distribution\n"
            "- `grep 'OR 1=1' access.log` — SQL injection payloads\n"
            "- `grep '<script>' access.log` — XSS payloads\n"
            "- `grep '\\.\\./' access.log` — Path traversal payloads\n"
            "- `awk '{print $1}' access.log | sort | uniq -c | sort -nr` — Request count per IP\n"
        ),
        "difficulty": "Intermediate",
        "hints": [
            "Use `awk '{print $9}' access.log | sort | uniq -c | sort -nr` to see the status code distribution. Three error codes stand out: 500 (SQL injection), 403 (XSS), 404 (path traversal).",
            "SQL injection comes from IP 198.51.100.25 targeting /api/users and /api/products. Look for 'OR 1=1' in the requests.",
            "XSS comes from IP 203.0.113.50 targeting /search and /comment with script tags.",
            "Path traversal comes from IP 192.168.1.200 trying '../../' paths to access /etc/passwd and /var/log/auth.log.",
            "Each attacker IP has a distinct pattern and time window.",
            "Submit: Attacker IPs, their payloads, targeted endpoints, and timestamps."
        ],
        "flag_format": "KALI{web-attack-investigation-1-<hash>}",
        "target_endpoint": "Execution Environment (Terminal)",
        "learning_objectives": [
            "Parse and analyze web access log files",
            "Identify SQL injection, XSS, and path traversal patterns",
            "Extract key indicators: attacker IP, targeted endpoint, status codes, timestamps",
            "Use awk, grep, sort, uniq for log analysis and correlation",
            "Distinguish between different attack types based on status codes and payloads",
            "Document findings with precise evidence for incident reporting"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Web Attack Investigation lab.

    The payload contains the learner's submitted evidence (analysis text).
    We check if they correctly identified all three attack patterns.
    """
    if challenge_id != "web-attack-investigation-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    payload_lower = payload.lower()

    # Check for evidence of all three attack types
    sql_injection = "198.51.100.25" in payload_lower and ("or 1=1" in payload_lower or "union select" in payload_lower)
    xss_attack = "203.0.113.50" in payload_lower and "<script>" in payload_lower
    path_traversal = "192.168.1.200" in payload_lower and ("../../" in payload_lower or "../" in payload_lower)

    if sql_injection and xss_attack and path_traversal:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Web Attack Investigation Complete! You correctly identified all three attack patterns: SQL injection from IP 198.51.100.25, XSS from IP 203.0.113.50, and path traversal from IP 192.168.1.200.",
            "flag": flag
        }

    # Partial feedback - which elements are missing
    missing = []
    if not sql_injection:
        missing.append("SQL injection from IP 198.51.100.25")
    if not xss_attack:
        missing.append("XSS from IP 203.0.113.50")
    if not path_traversal:
        missing.append("Path traversal from IP 192.168.1.200")

    if missing:
        return {
            "success": False,
            "feedback": "Partial evidence. " + "; ".join(missing) + " not yet identified. Hint: Use `grep 'OR 1=1' access.log` for SQL injection, `grep '<script>' access.log` for XSS, and `grep '\\.\\./' access.log` for path traversal.",
            "flag": None
        }

    return {
        "success": False,
        "feedback": "Evidence not fully recognized. Hint: Parse the access.log to identify all three attack types.",
        "flag": None
    }


# Pre-initialize
init_lab_workspace()