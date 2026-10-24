# Testing and Evidence Record

Use this page to record results from the exact commit used for submission. Do not fill in a passing count until the command has actually completed.

## Commands

```powershell
python -m pytest -q
python -m pytest tests/integration/test_security_boundary.py -q
python -m pytest tests/security/test_negative_auth.py -q
docker compose config
docker compose ps
```

## Evidence to record

| Check | Result | Evidence / notes |
|---|---|---|
| Full pytest suite | Not re-run in this document | Paste actual summary and date |
| Security-boundary tests | Not re-run in this document | Include allowed and denied cases |
| Negative authentication tests | Not re-run in this document | Include invalid/expired token outcomes |
| Compose configuration validation | Not re-run in this document | Record command exit code |
| Service health | Not re-run in this document | Record `docker compose ps` output |
| Audit-chain verification | Not re-run in this document | Include result and known concurrency caveat |
| UI-to-real-gateway integration | Requires explicit verification | Identify which UI actions call real endpoints |

## Suggested evidence bundle

- Test output from the final commit
- `docker compose ps` output after startup
- One screenshot or sanitized transcript for an allowed request
- One screenshot or sanitized transcript for a denied request
- Audit verification output

Remove tokens, private keys, host-specific paths, and sensitive data before publishing evidence.
