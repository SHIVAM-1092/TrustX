import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHmac } from 'node:crypto';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/red-exec': {
        target: 'http://red-team-exec:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/red-exec/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('Red Exec Proxy error:', err.message));
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.removeHeader('host');
          });
        },
      },
      '/api/blue-exec': {
        target: 'http://blue-team-exec:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blue-exec/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('Blue Exec Proxy error:', err.message));
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.removeHeader('host');
          });
        },
      },
      '/api': {
        target: 'https://gateway:8443',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        // Required for self-signed certificates in development
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Inject authentication token for local development
            // This runs on the Vite dev server (Node.js), not in the browser
            try {
              const testSecret = process.env.TRUSTX_SECRET_KEY;
              if (!testSecret) {
                console.error('TRUSTX_SECRET_KEY not set – skipping JWT generation; gateway will reject unauthenticated request');
                // Do not set auth header – fail closed
                return;
              }
              // Generate JWT for UI domain (dev only)
              const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
              const payload = Buffer.from(JSON.stringify({
                sub: 'ui-agent',
                domain: 'ui',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                iss: 'trustx-gateway'
              })).toString('base64url');
              const signature = createHmac('sha256', testSecret)
                .update(`${header}.${payload}`)
                .digest('base64url');
              const token = `${header}.${payload}.${signature}`;

              // Remove any existing auth headers and set ours
              proxyReq.removeHeader('authorization');
              proxyReq.removeHeader('x-trustx-token');
              proxyReq.removeHeader('x-trustx-domain');
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            } catch (err) {
              console.error('Failed to generate auth token for UI proxy:', err);
            }
          });

          // Prevent Vite dev server from crashing on proxy connection errors
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err.message);
          });
        },
      },
    },
  },
});