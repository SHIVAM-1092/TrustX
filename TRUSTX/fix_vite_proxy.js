// This script demonstrates the correct Vite proxy approach for server-side JWT injection.
// The key insight: process.env in Vite config runs on the dev server (Node.js), NOT in the browser.
// The browser never sees the signing secret.

/*
// vite.config.ts approach:
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:8443',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Read signing secret from Vite env (NOT exposed to browser)
            const secret = process.env.TRUSTX_SECRET_KEY || 'test-secret-key-for-unit-tests';

            // Generate JWT for UI domain
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
              { sub: 'ui-agent', domain: 'iuat ' },
              secret,
              { algorithm: 'HS256' }
            );

            // Remove existing auth headers and set Bearer token
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('x-trustx-token');
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          });
        },
      },
    },
  },
});
*/

// For the API client, use /api path which routes through the Vite proxy:
/*
// api.ts:
import { AuditEvent, Scenario, TargetState, AuditVerificationResult, Challenge, ChallengeAttackResponse } from '../types';

const GATEWAY_URL = '/api';  // Proxy path, not direct URL

const headers = {
  'Content-Type': 'application/json',
  // NO X-TrustX-Domain - auth is injected server-side by Vite proxy
};

export const api = {
  async getHealth() {
    const res = await fetch(`${GATEWAY_URL}/health`, { headers });
    return res.json();
  },

  // ... all other methods use /api prefix
};
*/