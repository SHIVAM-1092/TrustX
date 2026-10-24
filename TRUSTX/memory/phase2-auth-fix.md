---
name: phase2-auth-fix
description: Phase 2 fix for TrustX UI authentication - Vite proxy JWT injection and api.ts changes
---
## Phase 2: Secure Local UI Authentication Fix

### Changes Made

1. **`ui/src/services/api.ts`**:
   - Changed `GATEWAY_URL` from `'https://localhost:8443'` to `'/api'` — routes through Vite proxy instead of direct HTTPS
   - Removed `X-TrustX-Domain: ui` header from all API calls — this was a spoofable identity header, not a valid auth method
   - All endpoint paths now resolve through Vite proxy (`${GATEWAY_URL}/...`)

2. **`ui/vite.config.ts`**:
   - Added proxy `configure` handler that injects JWT Bearer token into every proxied gateway request
   - Reads `TRUSTX_SECRET_KEY` from Node.js environment (`process.env.TRUSTX_SECRET_KEY`)
   - Generates HS256 JWT: `{sub: 'ui-agent', domain: 'ui', iat, exp, iss: 'trustx-gateway'}`
   - Injects `Authorization: Bearer <token>` via `proxyReq.setHeader('Authorization', ...)`
   - Removes any existing `authorization`, `x-trustx-token`, `x-trustx-domain` headers to prevent conflicts
   - Signing secret never exposed to browser — runs on Node.js dev server only

### Authentication Flow (After Fix)

1. UI starts on `http://localhost:5173`
2. API calls use `fetch('/api/red/v1/challenges', {headers})` — routes through Vite proxy
3. Vite dev server's `proxyReq` event fires
4. JWT injected: `proxyReq.setHeader('Authorization', 'Bearer <token>')`
5. Request forwarded to gateway at `https://localhost:8443/red/v1/challenges`
6. Gateway validates JWT signature via `verify_identity()`
7. Response returns challenge data or 401

### Security Properties
- ✅ Signing secret never leaves Node.js process (Vite dev server)
- ✅ Browser never sees JWT or signing secret
- ✅ JWT short-lived (1 hour expiresIn)
- ✅ All existing endpoint paths preserved
- ✅ `X-TrustX-Domain` header no longer sent by UI
- ✅ mTLS enforcement on gateway unchanged

### How to Run
```bash
cd ui && npm install
npm run dev          # starts Vite on http://localhost:5173
# Then open http://localhost:5173 and test challenge flow
```

### What Was NOT Changed (Preserved)
- Gateway mTLS configuration (`--ssl-cert-reqs 1`)
- Gateway policy rules in `gateway/config/policy.yaml`
- Gateway identity verification logic
- Audit log (`audit/audit.log` — preserved, `audit_chain_valid: false`)
- Red Team challenge logic, Target simulation, Blue Team services
- No secrets exposed to frontend or `VITE_*` env vars
- No disabled authentication or verification