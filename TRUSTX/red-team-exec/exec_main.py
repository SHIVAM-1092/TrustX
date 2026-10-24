"""TrustX Red Team Execution Environment

Secure command execution environment for Red Team lab exercises.
Runs as non-root user with resource limits and network isolation.
"""

import os
import uuid
import time
import asyncio
import shlex
import signal
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

# In-memory session store (prototype - would use Redis in production)
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


async def cleanup_expired_sessions():
    """Remove expired sessions."""
    now = datetime.now()
    expired = []
    for sid, sess in sessions.items():
        if now - sess["last_used"] > timedelta(minutes=SESSION_TTL_MINUTES):
            expired.append(sid)
    for sid in expired:
        # Clean up workspace
        workspace = get_session_workspace(sid)
        if workspace.exists():
            import shutil
            shutil.rmtree(workspace, ignore_errors=True)
        del sessions[sid]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    yield
    # Shutdown - cleanup all sessions
    for sid in list(sessions.keys()):
        workspace = get_session_workspace(sid)
        if workspace.exists():
            import shutil
            shutil.rmtree(workspace, ignore_errors=True)
    sessions.clear()


app = FastAPI(
    title="TrustX Red Team Execution Environment",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "red-team-exec",
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

    # Copy lab files to session workspace
    import shutil
    for src_dir in ["tools", "wordlists", "scripts"]:
        src = WORKSPACE_ROOT / src_dir
        if src.exists():
            shutil.copytree(src, workspace / src_dir, dirs_exist_ok=True)

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
        # Copy lab files
        import shutil
        for src_dir in ["tools", "wordlists", "scripts"]:
            src = WORKSPACE_ROOT / src_dir
            if src.exists():
                shutil.copytree(src, workspace / src_dir, dirs_exist_ok=True)
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

    # Validate command - no shell metacharacters, no dangerous commands
    dangerous_commands = {"rm", "rmdir", "dd", "mkfs", "fdisk", "mount", "umount",
                          "iptables", "nc", "ncat", "socat", "ssh", "scp", "rsync",
                          "curl", "wget", "docker", "kubectl", "systemctl", "service"}
    cmd_name = req.command[0].lower()
    if cmd_name in dangerous_commands:
        raise HTTPException(
            status_code=400,
            detail=f"Command '{cmd_name}' is not allowed in this environment"
        )

    # Execute command with timeout and output limits
    start_time = time.time()
    try:
        proc = await asyncio.create_subprocess_exec(
            *req.command,
            cwd=str(workspace),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            limit=req.max_output * 2  # Buffer limit
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
    await cleanup_expired_sessions()
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)