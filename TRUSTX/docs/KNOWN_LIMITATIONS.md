# Known Limitations and Honest Demo Claims

This document is intentionally conservative. Update it only after reproducing a fix and adding a regression test.

- **Audit-chain concurrency:** previous project diagnostics identified chain breaks associated with concurrent writes. Do not claim reliable tamper-evident logging under concurrent load until writes are serialized or otherwise made atomic and a concurrent regression test passes.
- **End-to-end enforcement:** configuration and service presence do not prove all inter-domain requests traverse the gateway. Test direct service access, invalid credentials, and unauthorized domain-to-domain requests in the running Compose environment.
- **mTLS:** certificate files and environment variables are configured, but verify both sides actually validate peer identity and reject invalid/untrusted certificates before claiming mTLS is enforced.
- **Execution isolation:** Docker networks, resource limits, `no-new-privileges`, and capability restrictions are defense-in-depth settings, not a substitute for a dedicated sandbox or proof against container escape.
- **UI integration:** some demo/simulation UI flows may not be wired to the real gateway. Clearly label simulated responses and demonstrate enforcement through backend responses/logs/tests.
- **Test status:** historic reports may contain different test totals from different revisions. The authoritative result is a fresh test run against the exact commit being submitted.
- **Prototype scope:** do not use production credentials, sensitive data, or publicly exposed services. Review the Compose configuration and `.env.example` before starting.

## Before a judging/demo session

1. Run `docker compose config` and `docker compose ps`.
2. Run the complete test suite and save the actual output.
3. Demonstrate one allowed request and one denied request.
4. Demonstrate a negative authentication or boundary test.
5. Verify the resulting audit event and chain verification output; disclose any limitation.
6. Confirm the UI is showing real backend results rather than simulated data.
