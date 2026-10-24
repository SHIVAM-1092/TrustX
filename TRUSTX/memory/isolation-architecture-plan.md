---
name: isolation-architecture-plan
description: Architecture plan for Red/Blue Team isolated execution environments
metadata:
  type: reference
---

# TrustX Isolation Architecture Plan - Stage 1

## Objective
Implement isolated Red Team and Blue Team Linux execution environments with network segmentation, resource limits, and security hardening.

## Current Architecture (Preserved)
- Gateway (8443): mTLS policy enforcement, default-deny routing
- Red Team API (8001): Challenge endpoints, simulation routes
- Target LLM (8002): Synthetic LLM with vulnerabilities
- Blue Team API (8003): Analysis, scan, defend endpoints
- UI (5173): React frontend via Vite dev server

## New Architecture (Stage 1)

### Services Added

| Service | Port | Network | Purpose |
|---------|------|---------|---------|
| `red-team-exec` | 8081 | `red-exec-net`, `target-net` | Red Team command execution |
| `blue-team-exec` | 8082 | `blue-exec-net` | Blue Team command execution |

### Network Segmentation

```
┌─────────────────────────────────────────────────────────────┐
│                     GATEWAY NETWORK                          │
│  UI ──→ Gateway ──→ Red Team API, Target, Blue Team API      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │ RED EXEC NET│    │  TARGET NET │    │ BLUE EXEC NET│
    │             │    │             │    │             │
    │red-team-exec│───→│   target    │    │blue-team-exec│
    │  (8081)     │    │   (8002)    │    │  (8082)     │
    └─────────────┘    └─────────────┘    └─────────────┘
          │                                        │
          ▼                                        ▼
    No access to                        No access to
    Blue Exec Net                       Red Exec Net,
    No access to                        Target Net
    Target Net (except                  (Blue only has
    via Gateway)                        its own datasets)
```

### Network Connectivity Rules

| Source | Destination | Allowed | Via |
|--------|-------------|---------|-----|
| red-team-exec | target (8002) | ✅ Yes | target-net (direct) |
| red-team-exec | blue-team-exec | ❌ No | Different networks |
| blue-team-exec | red-team-exec | ❌ No | Different networks |
| blue-team-exec | target (8002) | ❌ No | Not on target-net |
| red-team-exec | gateway (8443) | ❌ No | Not on gateway-net |
| blue-team-exec | gateway (8443) | ❌ No | Not on gateway-net |

### Security Hardening (Per Container)

```dockerfile
# Non-root user
RUN useradd -u 1000 -m -s /bin/bash labuser

# Resource limits via Docker Compose
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
      pids: 100

# Security options
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - CAP_DAC_OVERRIDE  # Only if needed for workspace
read_only: true  # Root filesystem read-only
tmpfs:
  - /tmp:exec,size=100M
  - /var/tmp:exec,size=50M
```

### Command Execution API

Each execution container exposes a simple REST API:

```
POST /execute
{
  "command": ["ls", "-la"],
  "timeout": 30,
  "max_output": 10000
}

Response:
{
  "exit_code": 0,
  "stdout": "...",
  "stderr": "",
  "timed_out": false,
  "truncated": false
}
```

### Session Management

- Sessions tracked in-memory with TTL (default 30 min)
- Per-session working directory under `/workspace/sessions/{session_id}/`
- Commands execute in session working directory
- Cleanup on session expiry or explicit stop

### Data Isolation

- Red Team: Adversarial tools, wordlists, exploit scripts
- Blue Team: Log samples, detection rules, investigation datasets
- Each in their own container filesystem
- No shared volumes between execution containers

## Implementation Steps

1. Create `red-team-exec/` and `blue-team-exec/` directories with:
   - Dockerfile with security hardening
   - requirements.txt (minimal: fastapi, uvicorn, python-multipart)
   - main.py (command execution API)
   - workspace files (adversarial/defensive datasets)

2. Update `docker-compose.yml`:
   - Add `red-team-exec` and `blue-team-exec` services
   - Add `red-exec-net` and `blue-exec-net` networks
   - Configure resource limits and security options
   - Connect red-team-exec to target-net only
   - Connect blue-team-exec to blue-exec-net only

3. Add integration tests:
   - Test Red → Blue connectivity (should fail)
   - Test Blue → Red connectivity (should fail)
   - Test Red → Target connectivity (should work)
   - Test command execution in each container
   - Test file isolation

4. Build and verify

## Gateway Policy Updates (Minimal)

Only add policy rules if execution containers need to communicate with gateway.
For Stage 1, execution containers should NOT need gateway access - they're
isolated lab environments. UI would call them directly or via a separate
control plane in future stages.

## Files to Create

```
red-team-exec/
├── Dockerfile
├── requirements.txt
├── main.py
├── workspace/
│   ├── tools/          # nmap, curl, python, etc.
│   ├── wordlists/      # common wordlists
│   └── scripts/        # helper scripts

blue-team-exec/
├── Dockerfile
├── requirements.txt
├── main.py
├── workspace/
│   ├── logs/           # sample auth.log, access.log
│   ├── rules/          # sample detection rules
│   └── evidence/       # simulated incident data
```

## Tests to Add

```
tests/integration/
├── test_red_exec_isolation.py
├── test_blue_exec_isolation.py
└── test_cross_domain_isolation.py
```

## Rollback Plan

Backup: `TRUSTX_backup_20261022_172947.tar.gz`

To rollback:
```bash
tar -xzf TRUSTX_backup_20261022_172947.tar.gz -C /c/Users/tejas/OneDrive/Desktop/TRUSTX
```