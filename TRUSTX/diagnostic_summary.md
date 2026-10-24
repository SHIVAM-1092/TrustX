# TrustX Gateway Minimal Recovery - Diagnostic Summary

## Confirmed Findings

1. **Gateway starts successfully** with current Dockerfile config
   - `uvicorn gateway.main:app --ssl-certfile gateway/certs/gateway.crt --ssl-keyfile gateway/certs/gateway.key --ssl-ca-certs gateway/certs/ca.crt --ssl-cert-reqs 1`
   - Uvicorn 0.54.0 supports all these options

2. **`--ssl-cert-reqs 1` = CERT_OPTIONAL** (client cert optional, validated if provided)
   - Per Python stdlib: 0=CERT_NONE, 1=CERT_OPTIONAL, 2=CERT_REQUIRED
   - Requests without client cert succeed TLS handshake

3. **Authentication flow has 3 paths** (priority order varies by module):
   
   **`gateway/internal/identity.py::verify_client_identity()`**:
   1. Bearer JWT token from `Authorization: Bearer <header>`
   2. `X-TrustX-Token` legacy header
   3. mTLS client cert from ASGI scope (only works with `--ssl-cert-reqs 2`)
   4. **Fail closed** → 401 if none work
   
   **`trustx/identity/verifier.py::verify_identity()`**:
   1. Bearer JWT token (primary)
   2. mTLS client cert from ASGI scope
   3. `X-Client-Cert-Domain` header (proxy fallback)
   4. **Fail closed** → 401

4. **Policy engine is the real domain isolation enforcer**
   - `gateway/internal/policy.py::PolicyEngine.evaluate()` reads `policy.yaml` rules
   - Default-deny: any unmatched request is DENIED
   - Explicit rules allow/deny specific source→destination/path/method combos

5. **JWT signing key is shared** across all domains (`test-secret-key-for-unit-tests`)
   - Any domain can forge tokens for any other domain
   - Token domain claim is validated but not cryptographically bound to certificate

6. **TestClient cannot test mTLS** (no TLS termination in tests)
   - `TestClient` makes plain HTTP connections
   - mTLS cert path through `extract_client_cert_info()` is untestable without Docker/HTTPS

## Root Cause

The gateway runs with `--ssl-cert-reqs 1`, making client certificates **optional** at the TLS layer. Identity then relies primarily on JWT tokens, which means:
- An attacker with the shared `TRUSTX_SECRET_KEY` can authenticate as any domain
- Cross-domain isolation depends entirely on the policy engine, not TLS
- mTLS is a fallback path that never activates in current configuration

## Minimal Safe Fix

**Change one flag in `gateway/Dockerfile`:**
```
--ssl-cert-reqs 1    →    --ssl-cert-reqs 2
```

This makes client certificates **required** at the TLS termination layer. The mTLS path in `verify_client_identity()` will then successfully extract client cert information from the ASGI scope, and requests without valid client certs will fail at the TLS level (before even reaching the identity verification code).

**Additional recommendations (beyond smallest fix):**
- Document that mTLS + policy together provide domain isolation
- JWT tokens are still accepted for backward compatibility but do NOT provide TLS-level identity
- Ensure domain services (red-team, target, blue-team) present valid client certs signed by the CA
- Keep `SKIP_TLS_VERIFY` as explicit override, not default

## Tests to Run (after fix)

```bash
# 1. Gateway startup (verify it still starts with --ssl-cert-reqs 2)
# 2. Missing identity → 401 (should still work)
# 3. Valid JWT to target → 200 (policy allows red→target)
# 4. Valid JWT to blue → 403 (policy denies red→blue)  
# 5. Request without client cert → 401 (new behavior with --ssl-cert-reqs 2)
# 6. Audit chain integrity test
```

## Files Changed

Only `gateway/Dockerfile` needs modification: change `--ssl-cert-reqs 1` to `--ssl-cert-reqs 2`.

No source code changes required if the goal is simply to enforce mTLS at the TLS layer. The existing identity verification code will then work correctly when clients present certificates.