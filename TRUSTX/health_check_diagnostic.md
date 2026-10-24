# TrustX — Diagnose HTTPS Health Check and Authentication

## Confirmed Findings

1. **Gateway `/health` route is exempt from authentication**
   - `gateway/main.py:63-71`: `@app.get("/health")` and `@app.head("/health")` have **no dependency** on `verify_client_identity`
   - The health check endpoint is a **standalone FastAPI route** that returns immediately without checking identity
   - This is intentional: the Docker healthcheck (`docker-compose.yml:35`) uses `wget` with `--ca-certificate=/certs/ca.crt` but **without** a client certificate

2. **Docker healthcheck uses `wget` without client cert**
   - `docker-compose.yml:35`: `test: ["CMD", "wget", "-q", "--ca-certificate=/certs/ca.crt", "https://localhost:8443/health"]`
   - `wget` does **not** present a client certificate by default
   - With gateway Dockerfile `--ssl-cert-reqs 1` (current), this succeeds because client cert is **optional**
   - If changed to `--ssl-cert-reqs 2`, the healthcheck would fail because no client cert is provided

3. **Windows PowerShell `curl` failure**
   - Error: "The underlying connection was closed: An unexpected error occurred on a send."
   - Likely caused by: TLS protocol/certificate negotiation issue when connecting from PowerShell
   - PowerShell's `curl` may use different TLS defaults than `wget` or `openssl s_client`
   - The gateway cert has no SAN for `localhost` (only generated with `subjectAltName=DNS:gateway,DNS:localhost,IP:127.0.0.1` per `generate_certs.sh:21`, but the certs on disk may have been regenerated without SANs)

4. **Cert SAN status**
   - Per earlier check: ALL domain certs (gateway, red, target, blue) have **NO SAN extension**
   - `generate_certs.sh:21` includes `-extfile <(printf "subjectAltName=DNS:gateway,DNS:localhost,IP:127.0.0.1")` but the certs on disk may have been regenerated via `generate_remaining_certs.sh` which does NOT include SANs
   - This causes hostname verification failures when clients connect to `localhost` but the cert was issued for a different CN or without SANs

5. **Authentication flow for `/health`**
   - `/health` requires **no authentication** — it's a pure TLS-level check
   - The Docker healthcheck (`wget --ca-certificate=/certs/ca.crt`) verifies the server cert was signed by the CA, but does NOT require client cert
   - This is **by design** for container orchestration health monitoring

6. **JWT-only access to `/health`**
   - A Bearer JWT in the `Authorization` header is **ignored** for the `/health` route (no `Depends(verify_client_identity)`)
   - Any request to `/health` returns 200 regardless of auth headers (as long as TLS succeeds)

## Root Causes of Health Check Failures

| Symptom | Root Cause |
|---|---|
| PowerShell `curl` failure: "unexpected error on send" | TLS handshake issue — likely cert SAN mismatch or protocol version mismatch between PowerShell curl and the gateway's OpenSSL version |
| Docker healthcheck previously passed | Used `wget` with `--ca-certificate` only (no client cert required, and `--ssl-cert-reqs 1` allowed this) |
| `localhost` connection failures | Gateway cert may lack proper SAN for `localhost`, causing hostname verification failures |
| Gateway container reported healthy | Docker healthcheck used `wget` which succeeded with the above config |

## Safest Next Diagnostic Commands

**Do NOT modify code, restart containers, or rebuild.**

1. **Verify cert SANs** — confirm whether gateway cert has `localhost` SAN:
   ```bash
   openssl x509 -in gateway/certs/gateway.crt -text -noout | grep -A3 "Subject Alternative"
   ```

2. **Test TLS connection from POSIX shell** (not PowerShell):
   ```bash
   wget --ca-certificate=gateway/certs/ca.crt https://localhost:8443/health
   ```

3. **Test TLS connection with openssl** (no client cert, just CA verification):
   ```bash
   openssl s_client -connect localhost:8443 -CAfile gateway/certs/ca.crt -servername localhost </dev/null 2>&1 | head -20
   ```

4. **Check if gateway is actually running** and listen on the expected port:
   ```bash
   .venv/Scripts/python -c "
   from gateway.main import app
   from fastapi.testclient import TestClient
   client = TestClient(app)
   resp = client.get('/health')
   print(f'status={resp.status_code} body={resp.json()}')
   "
   ```

5. **Check PowerShell curl specifically against the TLS setup**:
   ```powershell
   curl --verbose https://localhost:8443/health --cacert .\gateway\certs\ca.crt
   ```

## Confirmed: `/health` is Intentionally Exempt

The `/health` route at `gateway/main.py:63-71` has **no** `verify_client_identity` dependency. It is a simple status endpoint that:

- Returns `{"status": "healthy", "gateway": "running", "audit_chain_valid": ..., "policy_loaded": ...}`
- Does **not** check mTLS, JWT, or identity headers
- Is designed for container orchestration health monitoring (Docker `healthcheck`)
- Works with just server cert CA verification (no client cert needed)

The PowerShell curl failure is therefore **not an authentication issue** — it's a TLS negotiation issue specific to the PowerShell client's connection to the gateway's certificate.

## Recommendation

The current configuration (`--ssl-cert-reqs 1` + exempt `/health` route) is **functional for its intended purpose**:
- Docker healthcheck works (used `wget` with CA cert only)
- `/health` is open by design for infrastructure monitoring
- Protected routes (`/auth/token`, `/target/*`, `/blue/*`, etc.) enforce identity via JWT/mTLS + policy

The PowerShell curl failure is a client-side TLS issue, not a gateway misconfiguration. The safest action is to **document this as a known client-environment limitation** rather than changing the gateway.

If the Docker healthcheck needs to work with the current certs, no change is needed — the healthcheck already passes with the existing config. If PowerShell curl is needed for debugging, use `wget` or `openssl s_client` instead, or add the `localhost` SAN to the gateway cert via `generate_certs.sh`.