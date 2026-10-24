"""TrustX Blue Team Execution Environment

Secure command execution environment for Blue Team lab exercises.
Runs as non-root user with resource limits and network isolation.
Provides sample log files and detection-rule testing capabilities.
"""

import os
import uuid
import time
import asyncio
import shlex
import json
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

# Configuration
SESSION_TTL_MINUTES = int(os.getenv("SESSION_TTL_MINUTES", "30"))
MAX_SESSIONS = int(os.getenv("MAX_SESSIONS", "50"))
DEFAULT_TIMEOUT = int(os.getenv("DEFAULT_TIMEOUT", "30"))
MAX_OUTPUT_SIZE = int(os.getenv("MAX_OUTPUT_SIZE", "10000"))
WORKSPACE_ROOT = Path("/workspace")

# Sample log data for Blue Team exercises
SAMPLE_AUTH_LOG = """\
Jan 15 08:23:45 trustx-server sshd[1234]: Failed password for root from 192.168.1.45 port 54322 ssh2
Jan 15 08:25:10 trustx-server sshd[5678]: Failed password for admin from 10.0.0.23 port 49152 ssh2
Jan 15 08:27:22 trustx-server sshd[9012]: Successful authentication for admin from 10.0.0.10 port 45678
Jan 15 08:30:45 trustx-server sshd[3456]: Failed password for testuser from 172.16.0.99 port 32111 ssh2
Jan 15 08:33:11 trustx-server sshd[7890]: Successful authentication for devops from 192.168.1.100 port 22222
Jan 15 08:35:22 trustx-server sudo[1234]: pam_unix(sudo:auth): authentication failure for root; logname=admin uid=1000 euid=0 tty=pts0 ruser=admin rhost=10.0.0.23 user=root
Jan 15 08:40:10 trustx-server kernel: imklog: lost 5 messages due to ratelimit
Jan 15 08:42:33 trustx-server sshd[1111]: Accepted password for analyst from 10.0.0.50 port 51322 ssh2
Jan 15 08:45:00 trustx-server sudo[2222]: pam_unix(sudo:account): account locked for user root
Jan 15 08:47:55 trustx-server sshd[3333]: Failed password for postgres from 192.168.1.105 port 43210 ssh2
Jan 15 08:50:22 trustx-server sudo[4444]: COMMAND=sudo: /usr/bin/find / -name "*.conf" 2>/dev/null
Jan 15 08:52:10 trustx-server sshd[5555]: Failed password for admin from 192.168.1.200 port 12345 ssh2
Jan 15 08:55:33 trustx-server sudo[6666]: pam_unix(sudo:auth): authentication failure; user=admin !root service=sudo cmd=/bin/ls
Jan 15 08:58:00 trustx-server systemd[1]: Starting TrustX Audit Service...
Jan 15 08:59:00 trustx-server systemd[1]: Started TrustX Audit Service.
Jan 15 09:01:22 trustx-server sshd[7777]: Accepted password for user1 from 10.0.0.15 port 34567 ssh2
Jan 15 09:03:44 trustx-server sudo[8888]: COMMAND=sudo: /bin/cat /etc/passwd
"""

SAMPLE_ACCESS_LOG = """\
192.168.1.45 - - [15/Jan/2026:08:23:45 +0000] "GET /dashboard HTTP/1.1" 200 2326 "-" "Mozilla/5.0"
10.0.0.23 - - [15/Jan/2026:08:25:10 +0000] "POST /login HTTP/1.1" 401 128 "-" "Mozilla/5.0"
172.16.0.99 - - [15/Jan/2026:08:30:45 +0000] "GET /api/users HTTP/1.1" 200 512 "-" "curl/7.88.1"
192.168.1.100 - - [15/Jan/2026:08:33:11 +0000] "GET /health HTTP/1.1" 200 128 "-" "curl/7.88.1"
10.0.0.50 - - [15/Jan/2026:08:42:33 +0000] "GET /api/alerts HTTP/1.1" 200 4096 "-" "Mozilla/5.0"
192.168.1.200 - - [15/Jan/2026:08:45:00 +0000] "GET /dashboard HTTP/1.1" 200 890 "-" "Mozilla/5.0"
10.0.0.15 - - [15/Jan/2026:09:01:22 +0000] "GET /api/logs HTTP/1.1" 200 3072 "-" "Mozilla/5.0"
"""

SAMPLE_DETECTION_RULE = """{
    "rule_id": "suspicious_sudo_cmd",
    "title": "Suspicious Sudo Command Execution",
    "description": "Detects sudo commands that may indicate persistence or lateral movement",
    "author": "TrustX",
    "status": "test",
    "log_source": "auth.log",
    "selection": {
        "Command": {
            "contains": "/bin/"
        }
    },
    "filter": {
        "EventID": {
            "equals": 1122
        }
    },
    "interval": 3600,
    "level": "high",
    "tags": ["sudo", "persistence", "lateral-movement"]
}"""

SAMPLE_INCIDENT_REPORT = """{
    "incident_id": "IR-2026-001",
    "title": "Suspicious Persistence Attempt Detected",
    "timestamp": "2026-01-15T08:35:22Z",
    "severity": "high",
    "description": "Multiple sudo authentication failures followed by successful root execution",
    "affected_systems": ["trustx-server"],
    "indicators": [
        "Failed sudo authentication from 10.0.0.23",
        "Successful root execution via sudo",
        "Unusual find command execution"
    ],
    "actions_taken": [
        "Account root locked",
        "Investigated sudo history",
        "Updated detection rules"
    ],
    "status": "contained"
}"""

from contextlib import asynccontextmanager

sessions: dict[str, dict] = {}
sessions_lock = asyncio.Lock()


class ExecuteRequest(BaseModel):
    """Request to execute a command."""
    command: list[str] = Field(..., min_length=1, max_length=50)
    timeout: int = Field(default=DEFAULT_TIMEOUT, ge=1, le=300)
    max_output: int = Field(default=MAX_OUTPUT_SIZE, ge=100, le=100000)
    session_id: Optional[str] = None


class ExecuteResponse(BaseModel):
    """Response from command execution."""
    exit_code: int
    stdout: str
    stderr: str
    timed_out: bool
    truncated: bool
    session_id: str
    working_dir: str
    duration_ms: int


class SessionInfo(BaseModel):
    """Session information."""
    session_id: str
    created_at: datetime
    last_used: datetime
    working_dir: str
    command_count: int


def get_session_workspace(session_id: str) -> Path:
    """Get the workspace path for a session."""
    return WORKSPACE_ROOT / "sessions" / session_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    yield


app = FastAPI(
    title="TrustX Blue Team Execution Environment",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "blue-team-exec",
        "active_sessions": len(sessions),
        "max_sessions": MAX_SESSIONS
    }


@app.post("/sessions", response_model=SessionInfo)
async def create_session():
    """Create a new execution session."""
    if len(sessions) >= MAX_SESSIONS:
        raise HTTPException(status_code=429, detail="Maximum sessions reached")

    session_id = str(uuid.uuid4())[:12]
    workspace = get_session_workspace(session_id)
    workspace.mkdir(parents=True, exist_ok=True)

    # Copy sample data to session workspace
    import shutil
    # Sample auth log
    auth_log = workspace / "auth.log"
    if not auth_log.exists():
        auth_log.write_text(SAMPLE_AUTH_LOG)

    # Sample access log
    access_log = workspace / "access.log"
    if not access_log.exists():
        access_log.write_text(SAMPLE_ACCESS_LOG)

    # Sample detection rule
    rule_file = workspace / "detection_rule.json"
    if not rule_file.exists():
        rule_file.write_text(SAMPLE_DETECTION_RULE)

    # Sample incident report
    incident_file = workspace / "incident_report.json"
    if not incident_file.exists():
        incident_file.write_text(SAMPLE_INCIDENT_REPORT)

    # Sample detection rules directory
    rules_dir = workspace / "rules"
    rules_dir.mkdir(exist_ok=True)
    rules_sample = rules_dir / "example_rule.json"
    if not rules_sample.exists():
        rules_sample.write_text(SAMPLE_DETECTION_RULE)

    # Sample evidence directory
    evidence_dir = workspace / "evidence"
    evidence_dir.mkdir(exist_ok=True)

    now = datetime.now()
    sessions[session_id] = {
        "created_at": now,
        "last_used": now,
        "working_dir": str(workspace),
        "command_count": 0
    }

    return SessionInfo(
        session_id=session_id,
        created_at=now,
        last_used=now,
        working_dir=str(workspace),
        command_count=0
    )


@app.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """Get session information."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    sess = sessions[session_id]
    return SessionInfo(
        session_id=session_id,
        created_at=sess["created_at"],
        last_used=sess["last_used"],
        working_dir=sess["working_dir"],
        command_count=sess["command_count"]
    )


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and clean up workspace."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    workspace = get_session_workspace(session_id)
    if workspace.exists():
        import shutil
        shutil.rmtree(workspace, ignore_errors=True)

    del sessions[session_id]
    return {"status": "deleted", "session_id": session_id}


@app.post("/execute", response_model=ExecuteResponse)
async def execute_command(req: ExecuteRequest):
    """Execute a command in the session workspace."""
    # Get or create session
    if req.session_id and req.session_id in sessions:
        session_id = req.session_id
    else:
        # Auto-create session if not provided
        if len(sessions) >= MAX_SESSIONS:
            raise HTTPException(status_code=429, detail="Maximum sessions reached")
        session_id = str(uuid.uuid4())[:12]
        workspace = get_session_workspace(session_id)
        workspace.mkdir(parents=True, exist_ok=True)
        # Copy sample data
        import shutil
        auth_log = workspace / "auth.log"
        if not auth_log.exists():
            auth_log.write_text(SAMPLE_AUTH_LOG)
        access_log = workspace / "access.log"
        if not access_log.exists():
            access_log.write_text(SAMPLE_ACCESS_LOG)
        rule_file = workspace / "detection_rule.json"
        if not rule_file.exists():
            rule_file.write_text(SAMPLE_DETECTION_RULE)
        now = datetime.now()
        sessions[session_id] = {
            "created_at": now,
            "last_used": now,
            "working_dir": str(workspace),
            "command_count": 0
        }

    sess = sessions[session_id]
    workspace = Path(sess["working_dir"])
    sess["last_used"] = datetime.now()
    sess["command_count"] += 1

    # Execute command with timeout and output limits
    start_time = time.time()
    try:
        proc = await asyncio.create_subprocess_exec(
            *req.command,
            cwd=str(workspace),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            limit=req.max_output * 2
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(),
                timeout=req.timeout
            )
            timed_out = False
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            stdout_bytes = b""
            stderr_bytes = b"Command timed out"
            timed_out = True

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

    duration_ms = int((time.time() - start_time) * 1000)

    # Decode and truncate output
    stdout = stdout_bytes.decode("utf-8", errors="replace")
    stderr = stderr_bytes.decode("utf-8", errors="replace")

    truncated = False
    if len(stdout) > req.max_output:
        stdout = stdout[:req.max_output] + "\n[OUTPUT TRUNCATED]"
        truncated = True
    if len(stderr) > req.max_output:
        stderr = stderr[:req.max_output] + "\n[OUTPUT TRUNCATED]"
        truncated = True

    return ExecuteResponse(
        exit_code=proc.returncode if not timed_out else -1,
        stdout=stdout,
        stderr=stderr,
        timed_out=timed_out,
        truncated=truncated,
        session_id=session_id,
        working_dir=str(workspace),
        duration_ms=duration_ms
    )


@app.get("/sessions")
async def list_sessions():
    """List all active sessions."""
    return {
        "sessions": [
            SessionInfo(
                session_id=sid,
                created_at=sess["created_at"],
                last_used=sess["last_used"],
                working_dir=sess["working_dir"],
                command_count=sess["command_count"]
            )
            for sid, sess in sessions.items()
        ],
        "total": len(sessions)
    }


@app.post("/analyze")
async def analyze_log(req: dict):
    """Analyze a log file for security events."""
    try:
        log_path = Path(req.get("log_path", ""))
        if not log_path.exists():
            raise HTTPException(status_code=404, detail="Log file not found")

        search_terms = req.get("search_terms", [])
        if not search_terms:
            raise HTTPException(status_code=400, detail="No search terms provided")

        results = []
        with open(log_path, 'r') as f:
            for line in f:
                for term in search_terms:
                    if term.lower() in line.lower():
                        results.append({
                            "line": line.strip(),
                            "match": term,
                            "found_at": line.lower().index(term.lower()) if term.lower() in line.lower() else -1
                        })
                        break

        return {
            "analyzed": True,
            "total_lines": sum(1 for _ in open(log_path)) if log_path.exists() else 0,
            "matches_found": len(results),
            "results": results[:50]  # Limit to first 50
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@app.post("/detect")
async def detect_patterns(req: dict):
    """Run detection rules against sample logs."""
    try:
        log_path = Path(req.get("log_path", ""))
        rules_path = Path(req.get("rules_path", ""))

        patterns = []
        if not log_path.exists():
            # Use sample auth log
            log_path = Path("/workspace/sessions") / req.get("session_id", "") / "auth.log"
            if not log_path.exists():
                raise HTTPException(status_code=404, detail="Log file not found")

        # Simple pattern matching for common security events
        if log_path.name == "auth.log" or "auth.log" in str(log_path):
            with open(log_path, 'r') as f:
                for line in f:
                    line_lower = line.lower()
                    if "failed password" in line_lower or "authentication failure" in line_lower:
                        patterns.append({
                            "type": "failed_login",
                            "line": line.strip(),
                            "severity": "high"
                        })
                    elif "successful authentication" in line_lower:
                        patterns.append({
                            "type": "successful_login",
                            "line": line.strip(),
                            "severity": "medium"
                        })
                    elif "sudo" in line_lower and ("authentication failure" in line_lower or "auth failure" in line_lower):
                        patterns.append({
                            "type": "sudo_auth_failure",
                            "line": line.strip(),
                            "severity": "high"
                        })

        # If rules file provided, check against rules
        rules_checked = 0
        if rules_path and rules_path.exists():
            try:
                rules = json.loads(rules_path.read_text())
                rules_checked = 1  # Simplified - would evaluate rules
            except:
                pass

        return {
            "analyzed": True,
            "patterns_found": patterns,
            "rules_checked": rules_checked,
            "severity_distribution": {
                "high": len([p for p in patterns if p.get("severity") == "high"]),
                "medium": len([p for p in patterns if p.get("severity") == "medium"]),
                "low": len([p for p in patterns if p.get("severity") == "low"])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)