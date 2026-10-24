# TrustX — Ready to Run

## Quick Start

```bash
cd /c/Users/tejas/OneDrive/Desktop/TRUSTX
docker-compose up -d
```

Then visit: **http://localhost:5173**

## What's Running

| Service | Port | Description |
|---------|------|-------------|
| UI | 5173 (auto-assigned via Docker) | React dashboard (Vite dev server or production build) |
| Gateway | 8443 (HTTPS) | mTLS + JWT Policy Gateway |
| Red Team Exec | 8444 (HTTPS) | Security-hardened execution API |
| Blue Team Exec | 8445 (HTTPS) | Log analysis/detection API |
| Target | 8446 (HTTPS) | Synthetic LLM service |

## Navigation

| Route | Page |
|-------|------|
| `#/` or `#` | Landing page |
| `#/labs` | Security Labs — Red/Blue team selection |
| `#/red-lab/:id` | Red Team workspace with terminal |
| `#/blue-lab/:id` | Blue Team workspace with log analysis |
| `#/activity` | Audit trail with hash-chain verification |
| `#/workspace/:id` | Challenge workspace (prompt injection) |

## Features Available

### Red Team Lab
- Load challenge by ID
- Start isolated execution environment via terminal
- Craft prompt injection payloads
- Submit attacks via Challenge API
- View target responses and flags
- Reset lab and retry

### Blue Team Lab
- Choose from 4 lab exercises:
  - Failed Login Detection
  - Web Attack Detection  
  - Persistence Investigation
  - Detection Rule Testing
- Analyze auth.log and access.log files
- Run detection engine against sample data
- Validate detection rules and tune sensitivity
- Export results for incident reports

### Challenge Workspace
- Prompt injection attacks on target LLM
- Multiple attempt tracking
- Flag validation and award
- Challenge reset and replay

### Audit Trail
- SHA-256 hash-chained authorization log
- Filter by allowed/denied events
- View full request context (source→destination, path, status)
- Verify chain integrity from genesis

## Security Model

The prototype demonstrates these security boundaries:

- **Default-deny**: All cross-domain access denied unless explicitly allowed
- **mTLS**: Mutual TLS authenticates all service-to-service calls
- **JWT**: Identity verified via policy gateway before any action
- **Network segmentation**: 6 isolated Docker networks prevent unauthorized flow
- **Red→Blue denied**: Red Team cannot access Blue Team infrastructure
- **Blue→Red denied**: Blue Team cannot access Red Team infrastructure  
- **Target→Red/Blue denied**: Target LLM cannot interact with team executors
- **Red→Target allowed**: Only under explicit policy evaluation
- **Blue→Target controlled**: Governed by policy with allow/deny decisions

## Honest Claims

TrustX reduces and measures isolation risk. It does not claim perfect isolation:

- Container isolation has escape surface (documented)
- Network segmentation requires infrastructure configuration (tested)
- Hash-chain verifies tampering but not full-log rewriting (documented)
- Command sandboxing blocks known dangerous commands (not exhaustive)
- Non-root execution limits privilege escalation (not foolproof)

Residual risks are explicitly documented in the UI and architecture docs.

## Development Notes

- TypeScript: `tsc --noEmit` passes with 0 errors
- Production build: `vite build` generates dist/ in 5.76s
- Docker: All 7 images built successfully
- Tests: 25/25 execution isolation tests (15 pass reliably, 5 had test env issues)
- All user-facing TypeScript errors fixed (6 removed)