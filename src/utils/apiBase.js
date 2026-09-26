/** The single place that decides which backend this frontend talks to.
 *
 * Priority:
 *   1. production builds   -> PROXY_PATH, a same-origin path that vercel.json
 *                             forwards to the deployed backend
 *   2. VITE_API_DIRECT_URL -> opt-in escape hatch: an absolute backend URL for a
 *                             production build that must bypass the proxy
 *   3. VITE_API_URL        -> development override (point `npm run dev` at
 *                             another machine)
 *   4. localhost / LAN     -> the local backend on port 8000
 *   5. anything else       -> the deployed backend, called directly
 *
 * Why the proxy exists: the backend's CORS allowlist names exact origins, and no
 * allowlist can name Vercel's per-deployment preview hostnames (for example
 * nfl-prediction-frontend-git-main-<team>.vercel.app). A direct cross-origin
 * call therefore fails on every preview URL, on any alias the allowlist does not
 * list, and after a domain change. The browser hides that from JavaScript, so
 * the site looked like "the backend is not responding" while the backend was
 * healthy. Fetching the same origin (/api/...) takes CORS out of the path
 * entirely, on every Vercel URL and every device.
 *
 * This lives on its own so it can be unit tested without a browser.
 */
export const PROXY_PATH = '/api';
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

export function resolveApiBase({ envUrl, directUrl, hostname, mode, prod } = {}) {
  const fromDirect = typeof directUrl === 'string' ? directUrl.trim().replace(/\/+$/, '') : '';
  const fromEnv = typeof envUrl === 'string' ? envUrl.trim() : '';

  const runtimeProd = prod === true || mode === 'production'
    || (typeof import.meta !== 'undefined' && import.meta.env && Boolean(import.meta.env.PROD));

  // A deployed build always calls its own origin, so no CORS rule can block it.
  if (runtimeProd) return fromDirect || PROXY_PATH;

  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return isLocalHost(hostname) ? LOCAL_API_URL : PRODUCTION_API_URL;
}

export const API_URL = resolveApiBase({
  envUrl: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_API_URL
    : '',
  directUrl: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_API_DIRECT_URL
    : '',
  hostname: (typeof window !== 'undefined' && window.location)
    ? window.location.hostname
    : '',
  mode: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.MODE
    : '',
  prod: (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.PROD
    : undefined,
});

/** True when this build reaches the backend through the same-origin proxy. */
export const USING_PROXY = API_URL === PROXY_PATH;

export default API_URL;
