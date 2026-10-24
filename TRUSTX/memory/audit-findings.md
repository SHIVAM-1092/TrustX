---
name: audit-findings
description: Summary of TrustX audit findings and fixes applied
metadata:
  type: reference
---

## Audit Findings - October 2026

### Fixes Applied

1. **JWT Secret Mismatch in Security Tests** (`tests/security/test_negative_auth.py`)
   - **Problem**: Tests used `test-secret-key-for-unit-tests` but the gateway/verifier expected `trustx-shared-secret-change-for-production` from `.env`
   - **Fix**: Updated test environment variable to match production secret
   - **Result**: All 3 security boundary tests now pass (red→blue denied, target→red denied, missing identity fail-closed)

2. **Gateway Policy Verification**
   - All cross-domain policy rules verified working:
     - red→target via `/v1/challenges/*` allowed
     - red→blue denied (403)
     - target→red denied (403)
     - ui→red challenges allowed
     - ui→target POST completions denied (403)
   - All 6 integration gateway challenge tests pass
   - All 3 gateway unit tests pass

### Known Limitations

1. **Audit Hash Chain Concurrent Write Issue**
   - 19 prev_hash mismatches across 212 events in `audit/audit.log`
   - Root cause: Multiple services (gateway, red-team, target, blue-team) independently append to same log file without coordination
   - Each AuditLogger reads `last_hash` from file state at initialization; concurrent writes cause chain breaks
   - **Documented design choice**: The hash chain is "best-effort tamper detection," not a guarantee under concurrent writes (see `audit_chain_diagnostic_report.md`)
   - **Remediation accepted**: Document limitation; reset audit log before demo runs

2. **Certificate SAN Issues**
   - Gateway cert lacks `localhost` SAN in some configurations
   - PowerShell curl fails; `wget` or `openssl s_client` recommended
   - Workaround: Use `wget --ca-certificate=gateway/certs/ca.crt https://localhost:8443/health`

### Test Results Summary

| Test Suite | Tests | Passed | Failed |
|------------|-------|--------|--------|
| Security boundary negative tests | 3 | 3 | 0 |
| Gateway integration challenges | 6 | 6 | 0 |
| Gateway unit tests | 3 | 3 | 0 |
| **Total** | **12** | **12** | **0** |

### Architecture Status

- **Gateway**: ✅ Functional with default-deny policy enforcement
- **Identity/mTLS**: ✅ Working with valid client certificates
- **Challenge system**: ✅ Prompt injection, jailbreak, PII leakage scenarios
- **Audit logging**: ⚠️ Operational with documented concurrent-write limitation
- **Frontend/UI**: ❌ Needs lab catalog, workspace, and terminal implementation
- **Container isolation**: ❌ Not yet implemented (separate containers, networks)