/** The single place that decides which backend this frontend talks to.
 *
 * Priority:
 *   1. VITE_API_URL      — set it in Vercel (or frontend/.env.production) to pin a URL
 *   2. local development — localhost/127.0.0.1 pages use the local backend
 *   3. production        — the deployed backend, so a missing env var can never
 *                          silently send requests to "localhost" or to the
 *                          Vercel domain itself (which was the production bug)
 *
 * This lives on its own so it can be unit tested without a browser.
 */
export const PRODUCTION_API_URL = 'https://nfl-prediction-backend.onrender.com';
export const LOCAL_API_URL = 'http://localhost:8000';

function isLocalHost(host) {
  if (!host) return true; // Node/tests: behave like development
  return host === 'localhost'
    || host === '127.0.0.1'
    || host === '[::1]'
    || host.endsWith('.localhost')
    || /^192\.168\.\d+\.\d+$/.test(host)
    || /^10\.\d+\.\d+\.\d+$/.test(host);
}

export function resolveApiBase({ envUrl, hostname, mode } = {}) {
  const fromEnv = typeof envUrl === 'string' ? envUrl.trim() : '';
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const runtimeMode = typeof mode === 'string' ? mode : (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE)
      ? import.meta.env.MODE
      : ''
  );

  // Production builds must never silently fall back to localhost or a local IP.
  // The public Vercel site should always target the deployed Render backend.
  const isProductionMode = runtimeMode === 'production'
    || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD);

  if (isProductionMode) return PRODUCTION_API_URL;
  return isLocalHost(hostname) ? LOCAL_API_URL : PRODUCTION_API_URL;
}

export const API_URL = resolveApiBase({
  envUrl: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_API_URL
    : '',
  hostname: (typeof window !== 'undefined' && window.location)
    ? window.location.hostname
    : '',
  mode: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.MODE
    : '',
});

export default API_URL;