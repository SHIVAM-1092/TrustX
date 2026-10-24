# TrustX Combined Demo Bundle

This bundle contains:
- `TRUSTX/` — your existing TrustX services, Docker Compose configuration, tests, and original UI.
- `trustx-ai-studio-ui/` — the newer Google AI Studio interface and its included demo server.

## Quick start (Windows 10/11)

### A. Run the new AI Studio demo website
1. Install Node.js LTS (20 or newer) from https://nodejs.org/ and install Docker Desktop if you also plan to run the TrustX services.
2. Extract this ZIP to a simple path, for example `C:\TrustX-Combined`.
3. Open PowerShell and run:

```powershell
cd C:\TrustX-Combined\trustx-ai-studio-ui
npm install
npm run dev
```

4. Open the local URL printed by Vite (the included `server.ts` normally serves on `http://localhost:3000`).

The AI Studio app includes its own demo/simulation API in `server.ts`. It is not automatically wired to the original TrustX gateway. Do not interpret its simulated responses as proof that the gateway enforced a real policy.

### B. Run the existing TrustX services
Open a second PowerShell window:

```powershell
cd C:\TrustX-Combined\TRUSTX
Copy-Item .env.example .env
notepad .env
```

Set `TRUSTX_SECRET_KEY` to a long random local-only value. Then run:

```powershell
docker compose up --build
```

Wait for the containers to build/start. Check status with:

```powershell
docker compose ps
```

The existing TrustX services use the ports configured in `docker-compose.yml` (including gateway `8443`, original UI `5173`, and lab services `8001`–`8003`). Open `https://localhost:8443` for the gateway/API where applicable, or `http://localhost:5173` for the original UI. Browser certificate warnings may appear for the local demo certificates.

To stop the services:

```powershell
docker compose down
```

### If Docker is already running
If the TrustX services are already up, do not start another copy. Check them first:

```powershell
cd C:\TrustX-Combined\TRUSTX
docker compose ps
```

## Important integration note
The two codebases are preserved together without overwriting the existing TrustX backend. The AI Studio interface has its own demo server and API routes; connecting every screen to the TrustX gateway requires endpoint-by-endpoint integration and verification. This bundle intentionally does not silently replace TrustX's policy, identity, or audit services with mock implementations.

## Troubleshooting
- `npm` not recognized: install Node.js LTS, close/reopen PowerShell, then retry.
- Docker daemon error: open Docker Desktop and wait until it says Docker is running.
- Port 3000/5173/8443 already in use: stop the older process/container or use a different port after checking which service owns it.
- For a clean demo, start the AI Studio app first and use its printed local URL.
