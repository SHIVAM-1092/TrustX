# TrustX — AI Security Gateway & Isolated Testing Prototype

TrustX is a prototype for safer AI-security testing across separate Red Team, Target, and Blue Team domains. Requests are intended to pass through a policy gateway that authenticates callers, applies access rules, and records security-relevant events.

> **Prototype status:** This repository is an evolving demonstration, not a production-ready security boundary. Review `docs/KNOWN_LIMITATIONS.md` before relying on any security claim. The included AI Studio/demo UI may simulate some interactions and is not proof that the gateway enforced a policy.

## What is in this repository

- **Policy gateway:** FastAPI-based gateway service and policy/configuration files.
- **Security domains:** Red Team, synthetic Target, and Blue Team services.
- **Execution services:** Separate Red Team and Blue Team execution containers with configured resource/security restrictions.
- **Identity and policy code:** JWT-oriented identity and access-control components; mTLS-related configuration and certificates are included for local demonstration.
- **Audit code:** Audit logging and hash-chain verification utilities. See the known limitations before treating the chain as tamper-evident.
- **UI:** Browser interface in `ui/`.
- **Tests:** Unit/integration/security-boundary test suites under `tests/` and service-specific test files.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the Mermaid diagram and trust-boundary notes.

## Requirements

- Docker Desktop with Docker Compose (recommended for the full multi-service demo)
- Windows 10/11 PowerShell, macOS, or Linux shell
- A local-only secret value for `TRUSTX_SECRET_KEY`

For individual Python tests, use a Python environment compatible with the service dependencies. The exact dependencies are listed in the relevant service `requirements.txt` files and project configuration files.

## Run locally with Docker Compose

From this directory (`TRUSTX/`):

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `TRUSTX_SECRET_KEY` in `.env` to a long random local-only value. Do not commit `.env`.

Then run:

```powershell
docker compose config
docker compose up --build -d
docker compose ps
```

The Compose file publishes several local ports, including the gateway on `8443`, the original UI on `5173`, and lab services on `8001`–`8003`. Use the health/status output and the actual endpoints in the current configuration to confirm which services started successfully. Local TLS certificates may cause browser warnings.

Stop the demo:

```powershell
docker compose down
```

Do not expose these prototype services to the public internet. Keep them on a local, isolated machine or network.

## Run tests

From `TRUSTX/`, activate the project's Python environment and run:

```powershell
python -m pytest -q
```

For focused security-boundary coverage:

```powershell
python -m pytest tests/integration/test_security_boundary.py -q
python -m pytest tests/security/test_negative_auth.py -q
```

These commands describe how to run the tests; they are **not** a statement that every test currently passes. Record the actual output, date, and environment in [`docs/TESTING.md`](docs/TESTING.md) after running them on the final commit.

## Security and responsible use

TrustX is intended for local, authorized security testing with synthetic targets. Read [`SECURITY.md`](SECURITY.md) and [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md). Never use the lab against systems you do not own or have explicit permission to test.

## Current status

The repository contains working components and test suites, but implementation completeness varies by component. The gateway, UI, isolation, and audit chain must be tested together in the exact environment used for a demonstration. Do not describe planned or configured controls as proven until a test demonstrates their enforcement.
