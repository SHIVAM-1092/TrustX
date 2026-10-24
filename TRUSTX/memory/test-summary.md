---
name: test-summary
description: Summary of TrustX test results after fixes
metadata:
  type: reference
---
# TrustX Test Results Summary - October 22, 2026

## All Tests Passing: 12/12

### Security Boundary Tests (`tests/security/test_negative_auth.py`)
| Test | Status | Details |
|------|--------|---------|
| `test_red_to_blue_denied` | ✅ PASS | Red → Blue direct access returns 403 Policy Access Denied |
| `test_target_to_red_denied` | ✅ PASS | Target → Red direct access returns 403 Policy Access Denied |
| `test_missing_identity_fail_closed` | ✅ PASS | Unauthenticated requests return 401 |

### Gateway Integration Tests (`tests/integration/test_gateway_challenges.py`)
| Test | Status | Details |
|------|--------|---------|
| `test_gateway_ui_challenge_list_allowed` | ✅ PASS | UI can list challenges via gateway |
| `test_gateway_ui_challenge_attack_allowed` | ✅ PASS | UI can submit challenge attack via gateway |
| `test_gateway_ui_challenge_reset_allowed` | ✅ PASS | UI can reset challenge via gateway |
| `test_gateway_red_challenge_attack_denied` | ✅ PASS | Red team cannot directly submit challenge attacks |
| `test_gateway_unauthorized_challenge_path_denied` | ✅ PASS | Unrelated red team paths remain denied for UI |
| `test_gateway_ui_to_target_via_challenge_denied` | ✅ PASS | UI cannot directly access target via gateway |

### Gateway Unit Tests (`tests/integration/test_gateway_unit.py`)
| Test | Status | Details |
|------|--------|---------|
| `test_gateway_proxy_allowed` | ✅ PASS | Authorized Red-to-Target request allowed |
| `test_gateway_proxy_denied` | ✅ PASS | Unauthorized Red-to-Blue request denied (403) |
| `test_missing_identity_fail_closed` | ✅ PASS | Requests without token rejected (401) |

## Test Fix Detail

The only code change made was in `tests/security/test_negative_auth.py`:
- **Line 17**: Changed `os.environ["TRUSTX_SECRET_KEY"] = "test-secret-key-for-unit-tests"` 
- **To**: `os.environ["TRUSTX_SECRET_KEY"] = "trustx-shared-secret-change-for-production"`

This aligned the test environment with the `.env` configuration, fixing JWT signature verification so that:
- Tokens are properly validated by the gateway
- Cross-domain access control decisions (ALLOW vs DENY) are reached instead of early authentication rejection
- Policy evaluation occurs at the correct layer

## No Functional Changes Required

All 9 previously-passing integration tests continue to pass. The 2 failing security tests were failing due to incorrect test configuration (wrong JWT secret), not gateway bugs. The gateway policy engine was always correct — the tests were misconfigured.

## Audit Chain Note

The audit log at `audit/audit.log` has 19 prev_hash mismatches from concurrent multi-service writes. This is a documented design limitation (see `audit_chain_diagnostic_report.md`), not a security vulnerability. The chain detects changes relative to a trusted state but does not independently prevent full-log rewriting under concurrent writes.