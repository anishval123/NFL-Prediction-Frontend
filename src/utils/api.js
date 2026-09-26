/** Small API client for the FastAPI backend.
 *  The server stores each user's predictions; localStorage keeps only the
 *  identity token plus an offline mirror. */

import { API_URL, PRODUCTION_API_URL, PROXY_PATH } from './apiBase.js';

// Re-exported so components share one definition of the backend URL.
export { API_URL };

// When a build talks to the same-origin proxy, keep the absolute backend URL as a
// second attempt: if a host ever stops forwarding /api/*, the site can still
// reach the backend directly wherever its CORS allowlist permits.
const DIRECT_FALLBACK = API_URL === PROXY_PATH ? PRODUCTION_API_URL : null;

// The browser hides cross-origin failures from JavaScript (fetch rejects with a
// bare TypeError and no status), so record what is known about the last failed
// call. The UI shows it, which is how "blocked by CORS or offline" is told apart
// from "the backend answered with an error".
let lastError = null;
export function getLastRequestError() {
  return lastError;
}

// The signed-in browser's id. Set once by PicksContext so every call is made on
// behalf of that user (the backend also falls back to the nfl_uid cookie).
let userId = null;
export function setUserId(id) {
  userId = id || null;
}

// Endpoints that need no identity. Calling them as "simple" requests (no custom
// header, no credentials) stops the browser from sending a CORS preflight, which
// halves the request count while polling and removes a whole class of failure:
// a preflight that a proxy or a stale backend rejects would otherwise hide every
// score on the site. Anything else stays credentialed because it is per-user.
const PUBLIC_PATHS = [
  '/schedule', '/teams', '/team/', '/results', '/games/finals',
  '/games/live', '/games/status', '/standings/official',
];
const isPublicPath = (path) => PUBLIC_PATHS.some((p) => path.startsWith(p));

/** One HTTP attempt against one base URL. Throws with url/status filled in. */
async function send(base, path, { anonymous, options }) {
  // A cached response would keep a FINAL score hidden after a game ends, so
  // every call opts out of HTTP caching and carries a cache-busting stamp.
  const url = `${base}${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const headers = {
    // Identifies the visitor to the per-user endpoints; the backend also
    // accepts a cookie or ?user=.
    ...(!anonymous && userId ? { 'X-User-Id': userId } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...(anonymous ? {} : { credentials: 'include' }),
      headers,
      ...options,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.url = url;
      throw err;
    }
    return await res.json();
  } catch (err) {
    err.url = err.url || url;
    throw err;
  }
}

async function request(path, { public: forcePublic = false, ...options } = {}) {
  const anonymous = forcePublic || isPublicPath(path);
  const bases = DIRECT_FALLBACK ? [API_URL, DIRECT_FALLBACK] : [API_URL];

  for (let i = 0; i < bases.length; i += 1) {
    try {
      const data = await send(bases[i], path, { anonymous, options });
      lastError = null;
      return data;
    } catch (err) {
      // never let API failures touch the UI; console.warn/info are not
      // supported everywhere, so use plain console.log
      lastError = {
        url: err.url || `${bases[i]}${path}`,
        status: err.status || null,
        message: (err && (err.message || String(err))) || 'request failed',
        via: bases[i],
        at: new Date().toISOString(),
      };
      console.log('[api]', lastError.via + path, lastError.message);
    }
  }
  return null;
}

export const api = {
  getSchedule: () => request('/schedule'),
  getWeek: (week) => request(`/schedule/week/${week}`),
  getTeams: () => request('/teams'),
  getTeam: (abbr) => request(`/team/${abbr}`),
  /** Finalized games only — the same backend state /games/live serves. */
  getResults: () => request('/results'),
  getFinals: () => request('/games/finals'),
  /** Live game status + final results, refreshed by the backend poller. */
  loadLive: () => request('/games/live'),
  /** This user's identity plus the predictions the server has stored for them. */
  getMe: () => request('/users/me'),
  /** Replace this user's predictions (server-side, per user). */
  savePredictions: (picks) =>
    request('/users/me/predictions', { method: 'POST', body: JSON.stringify({ picks }) }),
  /** Upsert (or clear) one prediction for this user. */
  savePrediction: (gameId, pick) =>
    request(`/users/me/predictions/${encodeURIComponent(gameId)}`, {
      method: 'PUT',
      body: JSON.stringify({ pick: pick || null }),
    }),
  /** Per-game verdicts, prediction records and both standings tables. */
  getEvaluation: () => request('/predictions/evaluation'),
  /** Official NFL standings (final games only, identical for everyone). */
  getOfficialStandings: () => request('/standings/official'),
  /** Official standings plus this user's unresolved predictions. */
  getProjectedStandings: () => request('/standings/projected'),
  savePicks: (picks) =>
    request('/save-picks', { method: 'POST', body: JSON.stringify({ picks }) }),
  loadPicks: () => request('/load-picks'),
};

/** Convenience named exports used by the poller in context. */
export const loadLive = () => api.loadLive();
export const getResults = () => api.getResults();
export const getFinals = () => api.getFinals();
export const getEvaluation = () => api.getEvaluation();
export const getMe = () => api.getMe();
export const savePredictions = (picks) => api.savePredictions(picks);