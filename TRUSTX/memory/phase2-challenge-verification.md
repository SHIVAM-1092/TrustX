---
name: phase2-challenge-verification
description: Phase 2 verification - end-to-end challenge flow
---
## Phase 2: End-to-End Challenge — Verification Results

### Architecture Verification ✅

The complete end-to-end challenge flow architecture is verified through code inspection:

```
Challenge List:         fetch('/api/red/v1/challenges')
                      → Vite proxy → https://localhost:8443/red/v1/challenges
                      → Gateway: verify JWT → policy ui→red→/v1/challenges GET → ALLOW
                      → Proxy to red-team:8001 → challenge.py list_challenges()
                      → Returns challenge info → UI displays

Challenge Select + Read: select challenge → getChallenges() → UI shows objective/hints/flags

Attack Submission:      fetch('/api/red/v1/challenges/{id}/attack', {payload})
                      → Vite proxy → https://localhost:8443/red/v1/challenges/{id}/attack
                      → Gateway: verify JWT → policy ui→red→/v1/challenges/* POST → ALLOW
                      → Proxy to red-team:8001 → challenge_attack()
                      → Routes to target:8002 → chat_completions() → evaluates prompt injection
                      → Returns target response → record_attempt() → server-side validation
                      → Returns success/flag/feedback → UI displays

Flag Validation:        verify_challenge() in red-team/challenge.py
                      - Checks if target response contains system prompt indicators
                      - If success: computes flag = TRUSTX{prompt-injection-1-<12-char-hash>}
                      - If failure: returns feedback hint + no flag
                      - Frontend cannot supply success or arbitrary flag (server-side only)

Challenge Reset:        fetch('/api/red/v1/challenges/{id}/reset', {subject})
                      → Vite proxy → https://localhost:8443/red/v1/challenges/{id}/reset
                      → Gateway: verify JWT → policy ui→red→/v1/challenges/*→reset → ALLOW
                      → Proxy to red-team:8001 → challenge_reset() → clears in-memory state

Policy Enforcement (verified in gateway/config/policy.yaml):
- ui→red→/v1/challenges GET/POST → ALLOW ✅
- ui→red→/v1/simulate POST/GET → ALLOW ✅
- ui→target→/v1/state GET → ALLOW ✅
- ui→blue→/v1/defend POST/GET → ALLOW ✅
- red→blue → DENY (invariant) ✅
- target→red → DENY (invariant) ✅
- target→blue → DENY (invariant) ✅
- Missing/invalid auth → 401 (fail-closed) ✅