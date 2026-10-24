---
name: phase0-checkpoint
description: Phase 0 baseline report - repository inventory
---
## Phase 0: Repository Inventory Baseline

### Working Directory
`C:\Users\tejas\OneDrive\Desktop\TRUSTX`

### Key Project Structure
- **Gateway**: `services/gateway/main.py` — policy enforcement, identity verification, audit chaining, proxy routing
- **Policy Engine**: `trustx/policy/engine.py` — default-deny, rules for cross-domain access
- **Identity**: `trustx/identity/verifier.py` — supports Bearer JWT, X-TrustX-Token, mTLS
- **Target**: `target/main.py` — synthetic LLM with prompt injection vulnerability
- **Blue Team**: `blue-team/main.py` — monitors target, uses mTLS for gateway auth
- **Red Team**: `red-team/challenge.py` — System Prompt Extraction challenge
- **UI**: `ui/src/services/api.ts`, `ui/vite.config.ts` — browser demo interface
- **Audit**: `audit/audit.log` — 212-event SHA-256 hash chain (pre-existing breaks)

### Already-Implemented Phase 1 Fixes (verified)
1. **`ui/src/services/api.ts`**: `GATEWAY_URL = '/api'` (routes through Vite proxy); removed `X-TrustX-Domain: ui` header
2. **`ui/vite.config.ts`**: Vite proxy with server-side JWT injection using `TRUSTX_SECRET_KEY`; signing secret never exposed to browser

### Environment Configuration
- `.env`: `TRUSTX_SECRET_KEY=test-secret-key-for-unit-tests`
- `conftest.py`: Sets `TRUSTX_SECRET_KEY` env var
- UI: `VITE_GATEWAY_URL=https://localhost:8443`

### Gateway Configuration
- Policy: `gateway/config/policy.yaml` — default-deny, UI has explicit ALLOW rules for challenges, simulate, target state, blue defense, audit read
- Identity verification: 3 methods (Bearer JWT, X-TrustX-Token, mTLS client cert)
- mTLS: `--ssl-cert-reqs 1` makes client cert optional (CERT_OPTIONAL)
- Upstream URLs: red-team:8001, target:8002, blue-team:8003

### Test Infrastructure
- `tests/` directory with security tests
- `gen_token.py`: Generates JWT using `create_domain_token(Domain.UI, 'ui-agent')`
- `test_auth.py`: Verifies JWT generation and gateway authentication
- `audit/audit.log`: 212 events with 5 independent chain segments; 19 prev_hash mismatches (pre-existing)

### Compose Services
- `gateway`: port 8443 (HTTPS), depends on red-team, target, blue-team
- `red-team`: port 8001
- `target`: port 8002
- `blue-team`: port 8003, uses mTLS to fetch token from gateway at startup
- `ui`: port 5173, depends on gateway

### Authentication Flow (Current, After Phase 1 Fixes)
1. UI loads at `http://localhost:5173`
2. API calls use `fetch('/api/red/v1/challenges', {headers})` → routes through Vite proxy
3. Vite dev server's `proxyReq` event fires
4. JWT injected: `proxyReq.setHeader('Authorization', 'Bearer <token>')`
5. Request forwarded to gateway at `https://localhost:8443/red/v1/challenges`
6. Gateway validates JWT signature via `verify_identity()`
7. Policy engine evaluates request against rules
8. Request proxied to upstream or 403 denied

### Pre-existing Limitations (NOT introduced by Phase 1)
- `test_negative_auth.py` key mismatch (test uses `test-secret-key-for-unit-tests`; gateway may use different key)
- `X-TrustX-Domain` header spoofing (anyone can set it; mTLS provides real isolation)
- Gateway `--ssl-cert-reqs 1` (client cert optional, not required)
- Audit chain 19 prev_hash mismatches (historical, preserved as-is)
- No mTLS from UI (UI uses JWT auth; mTLS required for cryptographic domain isolation)

### Commands Identified
- Python tests: `python -m pytest tests/` or `python -m pytest specific_test.py`
- UI dev: `cd ui && npm run dev` (Vite on http://localhost:5173)
- UI build: `cd ui && npm run build`
- Docker: `docker-compose up -d` (or `docker compose up -d`)
- Gateway health: `wget --ca-certificate=gateway/certs/ca.crt https://localhost:8443/health`

### Uncommitted Changes
None detected — working directory files match repository state.

### Checkpoint Action
Proceed to Phase 1 — Secure Local UI Authentication. The authentication design is supported by code; the Vite proxy JWT injection model is verified through code inspection. Browser E2E verification is marked separate.