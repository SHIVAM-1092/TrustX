# Requirements-to-Implementation Traceability Matrix

| Req # | Requirement Description | Source | Implementing Component / File | Verification Test | Current Status |
|---|---|---|---|---|---|
| **REQ-01** | Separate Red, Target, and Blue domains into isolated services | CLAUDE.md §3, Prompt req 7 | `red-team/main.py`, `target/main.py`, `blue-team/main.py`, `docker-compose.yml` | `tests/integration/test_network_boundaries.py` | **Implemented** (Files created, isolated docker subnets defined) |
| **REQ-02** | Central Policy Gateway with default-deny enforcement | CLAUDE.md §4, Prompt req 5 | `gateway/main.py`, `gateway/internal/policy.py`, `gateway/config/policy.yaml` | `gateway/tests/test_gateway.py::test_policy_default_deny` | **Implemented** (Code written; pending execution) |
| **REQ-03** | Fail-closed error handling and identity rejection | CLAUDE.md §4, Prompt req 5, 6 | `gateway/internal/identity.py`, `gateway/main.py` | `tests/security/test_negative_auth.py::test_missing_identity_fail_closed` | **Implemented** (Code written; pending execution) |
| **REQ-04** | Explicit domain identity validation (mTLS certs + tokens) | CLAUDE.md §4, Prompt req 6 | `gateway/internal/identity.py`, `generate_certs.sh` | `tests/security/test_negative_auth.py` | **Implemented** (Code written; cert script ready) |
| **REQ-05** | Deny cross-domain access (Red $\leftrightarrow$ Blue, Target $\to$ Red/Blue) | CLAUDE.md §4, Prompt req 7 | `gateway/config/policy.yaml`, `gateway/internal/policy.py` | `tests/security/test_negative_auth.py::test_red_to_blue_denied` | **Implemented** (Policy rules written; pending test run) |
| **REQ-06** | Allow controlled Red $\to$ Target and Blue $\to$ Target operations | CLAUDE.md §4, Prompt req 1 | `gateway/config/policy.yaml`, `red-team/main.py`, `target/main.py` | `tests/security/test_negative_auth.py::test_red_to_target_allowed` | **Implemented** (Endpoints written) |
| **REQ-07** | Resettable synthetic Target LLM with configurable vulnerabilities | CLAUDE.md §3, §4, Prompt req 1, 11 | `target/main.py` (Prompt Injection, DAN Jailbreak, Synthetic PII) | `target/tests/test_target.py` | **Implemented** (Synthetic state and reset endpoint written) |
| **REQ-08** | Tamper-evident SHA-256 hash-chained audit logging | CLAUDE.md §4, Prompt req 8 | `gateway/internal/audit.py` | `gateway/tests/test_gateway.py::test_audit_hash_chain_tampering_detection` | **Implemented** (Chain & verification written; pending test run) |
| **REQ-09** | Document limitations of local hash chain (not immutable ledger) | CLAUDE.md §4, §9, Prompt req 8 | `gateway/internal/audit.py`, `README.md`, `ARCHITECTURE.md` | Code docstrings & doc inspection | **Documented in code** (Docs to be completed) |
| **REQ-10** | Usable browser-based demo interface | CLAUDE.md §6, Prompt req 4 | `ui/src/App.tsx`, `ui/src/services/api.ts` | Manual / UI smoke test | **Implemented** (UI code written; pending build) |
| **REQ-11** | Automated unit, integration, and negative security tests | CLAUDE.md §5, Prompt req 9 | `gateway/tests/test_gateway.py`, `tests/security/test_negative_auth.py` | `pytest` test suite | **Partially Implemented** (Tests written; test runner execution pending) |
| **REQ-12** | Docker Compose orchestration with network segmentation | CLAUDE.md §7, Prompt req 10 | `docker-compose.yml`, `gateway/Dockerfile`, `red-team/Dockerfile`, `target/Dockerfile`, `blue-team/Dockerfile` | `docker compose config` & `docker compose up` | **Implemented** (Dockerfiles written; image build pending) |
| **REQ-13** | Honest security claims and no fabricated test results | CLAUDE.md §2, §9, Prompt req 12 | `README.md`, `ARCHITECTURE.md` | Verification of executed tests only | **In Progress** |

---

## 🎯 Smallest Credible End-to-End Prototype

To deliver a working system that can be demonstrated live before the deadline:

1. **Gateway with In-Memory / File-based Default-Deny Policy Engine**:
   - Explicitly rejects requests without domain identification (`HTTP 401`).
   - Rejects unauthorized Red $\to$ Blue or Target $\to$ Red requests (`HTTP 403`).
   - Emits structured SHA-256 hash-chained audit log events for every decision.
2. **Synthetic Target LLM**:
   - Exposes `/v1/chat/completions` and `/v1/state`.
   - Simulates Prompt Injection and Synthetic PII leak; tracks `compromised` boolean flag.
   - Resets state cleanly on authorized `/v1/reset` call from Blue Team.
3. **Synthetic Red Team Workload**:
   - Triggers pre-canned adversarial prompts against Target exclusively through the Gateway.
4. **Synthetic Blue Team Workload**:
   - Monitors Target compromise status, requests Target reset via Gateway, and triggers audit integrity checks.
5. **Interactive UI Dashboard**:
   - 3-column layout: Red Team trigger $\rightarrow$ Target status monitor $\rightarrow$ Blue Team countermeasures.
   - Live audit log viewer with real-time hash chain integrity verification status badge.
   - Interactive "Test Illegal Cross-Domain Call" button proving policy denial.

---

## 🛠️ Proposed Build Order & Next Steps

1. **Execute Unit Tests**:
   - Run `pytest gateway/tests/test_gateway.py` locally to verify the policy engine and SHA-256 hash-chain tampering detection algorithms without needing Docker first.
2. **Verify Docker & Container Builds**:
   - Run `docker compose build` to ensure all 5 container images build without errors.
3. **Launch Stack & Execute Integration / Security Negative Tests**:
   - Run `docker compose up -d`.
   - Run `pytest tests/security/test_negative_auth.py` against the running stack to empirically verify default-deny, cross-domain blocking, and fail-closed behavior.
4. **Complete Documentation**:
   - Create `README.md` with demo walkthrough procedure and `ARCHITECTURE.md` with threat model and isolation limitations.