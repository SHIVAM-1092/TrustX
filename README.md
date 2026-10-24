# TrustX — AI Security Testing Prototype

TrustX is a prototype for controlled AI-security testing across Red Team, Target, and Blue Team domains. Its intended workflow combines a policy gateway, identity/access checks, challenge services, and audit evidence.

## Repository layout

- `TRUSTX/` — backend/services, Docker Compose lab, original UI, policy/identity/audit code, and tests.
- `trustx-ai-studio-ui/` — separate newer UI/demo app. Its local simulation API is **not automatically wired** to the TrustX gateway; simulated UI output must not be presented as proof of backend enforcement.
- `Start-TrustX-Demo.ps1` — convenience launcher (inspect before running).
- `SETUP_README.md` — Windows setup notes.

## Quick start (Windows)

1. Install Docker Desktop and Node.js LTS if needed.
2. Extract this archive to a short local path, such as `C:\TrustX`.
3. Start the backend lab in one PowerShell window:

```powershell
cd C:\TrustX\TRUSTX
Copy-Item .env.example .env
notepad .env
# Set TRUSTX_SECRET_KEY to a long, random, local-only value.
docker compose config
docker compose up --build -d
docker compose ps
```

4. To run the separate UI demo, open another PowerShell window:

```powershell
cd C:\TrustX\trustx-ai-studio-ui
npm install
npm run dev
```

Use the local URL printed by the UI command. Consult `SETUP_README.md` for ports and troubleshooting. Stop backend containers with `docker compose down` from `TRUSTX/`.

## Engineering notes

- Start with `TRUSTX/README.md` and `TRUSTX/docs/ARCHITECTURE.md`.
- Known caveats and claims that still require proof are documented in `TRUSTX/docs/KNOWN_LIMITATIONS.md`.
- Test commands and an evidence-record template are in `TRUSTX/docs/TESTING.md`.
- Do not commit `.env`, tokens, private keys, runtime logs, or real user data.
- This is a local prototype, not production-ready software. Do not expose it to the public internet.

## Important

The files in this archive were packaged and ZIP integrity was checked. That does not mean every service was launched or every test passed in this packaging step. Run the tests and record their actual results on the final commit before making performance or security claims.
