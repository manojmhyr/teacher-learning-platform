import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL as NodeURL } from 'node:url';

/**
 * Content-Security-Policy for the built app.
 *
 * Kept in one place so the same policy is applied by the dev server, the static
 * host (via the generated `staticwebapp.config.json` / `_headers`) and the
 * Capacitor webview. `connect-src` is widened at build time from the configured
 * API + Azure Blob origins so the app can talk to them and nothing else.
 */
export function buildCsp(env: Record<string, string | undefined>, target: 'meta' | 'header' = 'header'): string {
  const extra = [env.VITE_API_BASE_URL, env.VITE_AZURE_BLOB_BASE_URL]
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u as string).origin;
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  return [
    "default-src 'self'",
    // Capacitor serves the app from capacitor://localhost (iOS) / https://localhost (Android).
    `connect-src 'self' https://localhost capacitor://localhost ${extra.join(' ')}`.trim(),
    "img-src 'self' data: blob:",
    "media-src 'self' blob: " + extra.join(' '),
    // MUI/emotion inject styles at runtime, so inline styles must be allowed.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "script-src 'self'",
    "object-src 'none'",
    // frame-ancestors is ignored in a <meta> tag — it is only honoured as a
    // real response header, so it goes in the host config files only.
    ...(target === 'header' ? ["frame-ancestors 'none'"] : []),
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** Injects the CSP meta tag into index.html and emits host header config files. */
function securityHeaders(env: Record<string, string | undefined>): Plugin {
  const csp = buildCsp(env, 'header');
  const metaCsp = buildCsp(env, 'meta');
  return {
    name: 'security-headers',
    transformIndexHtml(html) {
      return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${metaCsp}" />`);
    },
    generateBundle() {
      // Azure Static Web Apps
      this.emitFile({
        type: 'asset',
        fileName: 'staticwebapp.config.json',
        source: JSON.stringify(
          {
            navigationFallback: { rewrite: '/index.html' },
            globalHeaders: {
              'Content-Security-Policy': csp,
              'X-Frame-Options': 'DENY',
              'X-Content-Type-Options': 'nosniff',
              'Referrer-Policy': 'no-referrer',
              'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
              'Cache-Control': 'no-store',
            },
          },
          null,
          2,
        ),
      });
      // Netlify / Cloudflare Pages
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: `/*\n  Content-Security-Policy: ${csp}\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Cache-Control: no-store\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = process.env as Record<string, string | undefined>;
  return {
    plugins: [react(), securityHeaders(env)],
    resolve: { alias: { '@': fileURLToPath(new NodeURL('./src', import.meta.url)) } },
    build: {
      target: 'es2017',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
          },
        },
      },
    },
    server: {
      port: 5173,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  };
});
