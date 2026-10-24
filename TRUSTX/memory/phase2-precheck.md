---
name: phase2-precheck
description: Phase 2 baseline - challenge flow inventory
---
## Phase 2: End-to-End Challenge — Pre-Check Inventory

### Intended Workflow (from Phase 2 instructions)
```
Challenge list
→ Select challenge
→ Read objective and hints
→ Submit a real attack payload
→ Red Team routes request through gateway
→ Gateway applies identity and security policy
→ Target processes the request
→ Result returns to challenge handler
→ Server validates success
→ Server reveals challenge flag only after success
→ UI displays result and progress
→ User can reset and retry
```

### Files to Inspect
1. **UI challenge integration**: `ui/src/services/api.ts` — `getChallenges()`, `challengeAttack()`, `challengeReset()`, `getChallengeInfo()` (not yet in api.ts)
2. **Red Team challenge**: `red-team/challenge.py` — `verify_challenge()`, `compute_flag()`, `record_attempt()`, `get_challenge_info()`
3. **Gateway proxy**: `services/gateway/main.py` — `/auth/token` endpoint, `gateway_proxy()` route
4. **Target service**: `target/main.py` — `chat_completions()`, vulnerability evaluation
5. **Policy engine**: `trustx/policy/engine.py` — evaluates cross-domain rules
6. **Audit chain**: `trustx/audit/chain.py` — SHA-256 hash chain verification

### API Endpoints Needed (from gateway routes)
- `GET /red/v1/challenges` — list challenges (policy: ui→red→challenges ALLOW)
- `POST /red/v1/challenges/{challengeId}/attack` — submit attack (policy: ui→red→/v1/challenges/*→POST ALLOW)
- `POST /red/v1/challenges/{challengeId}/reset` — reset challenge (policy: ui→red→/v1/challenges/*→reset ALLOW)
- `GET /red/v1/challenges/{challengeId}` — get challenge info
- `POST /auth/token` — obtain JWT from gateway (helper endpoint)

### UI→Gateway→Red Team→Target Path
```
UI:          fetch('/api/red/v1/challenges')
Vite proxy: → https://localhost:8443/red/v1/challenges
Gateway:    verify JWT → evaluate policy ui→red→/v1/challenges GET → ALLOW → proxy to red-team:8001
Red Team:   challenge.py routes to main.py → /v1/challenges
Gateway:    evaluate policy ui→red→/v1/challenges/* POST → ALLOW → proxy to target:8002
Target:     chat_completions → prompt injection evaluation
Gateway:    log ACCESS_ALLOWED to audit chain
Response:   returns result → UI → flag if success
```

### Policy Rules Required (from gateway/config/policy.yaml)
- `ui-to-red-challenges`: ui→red, `/v1/challenges`, GET/POST → ALLOW
- `ui-to-red-simulate`: ui→red, `/v1/simulate`, POST/GET → ALLOW
- `ui-to-target-query`: ui→target, `/v1/state`, GET → ALLOW
- `ui-to-blue-defense`: ui→blue, `/v1/defend`, POST/GET → ALLOW

### Test Coverage Needed (from Phase 2 instructions)
- Challenge listing from real backend
- Challenge details consistent across UI and backend
- Successful attack and server-validated flag
- Failed attack with no flag revealed
- Gateway-denied attack (policy block)
- Reset and retry from expected state
- Malformed request handling
- Invalid authentication rejection

### Pre-existing Conditions
- Audit chain: 212 events with 19 prev_hash mismatches (preserved, not to be modified)
- Gateway identity: 3 auth methods (Bearer JWT, X-TrustX-Token, mTLS)
- JWT key mismatch between test env and running gateway (pre-existing)
- Target prompt injection: enabled by default (`"prompt_injection": True`)

### Phase 2 Exit Gate Criteria
The challenge flow is complete only to the extent demonstrated by:
- Passing tests and running-service evidence
- Listing challenges from backend
- Executing genuine successful challenge with flag
- Failed attacks do not reveal flag
- Reset/restore works correctly
- Invalid authentication rejected