/** Small API client for the FastAPI backend.
 *  The server stores each user's predictions; localStorage keeps only the
 *  identity token plus an offline mirror. */

// Where the API lives. Set VITE_API_URL at build time when you deploy the
// backend somewhere other than localhost, e.g. VITE_API_URL=https://api.example.com
const ENV_URL = (typeof import.meta !== 'undefined' && import.meta.env
  && import.meta.env.VITE_API_URL) || null;
export const API_URL = ENV_URL || 'http://localhost:8000';

// The signed-in browser's id. Set once by PicksContext so every call is made on
// behalf of that user (the backend also falls back to the nfl_uid cookie).
let userId = null;
export function setUserId(id) {
  userId = id || null;
}

async function request(path, options = {}) {
  try {
    // A cached response would keep a FINAL score hidden after a game ends, so
    // every call opts out of HTTP caching and carries a cache-busting stamp.
    const url = `${API_URL}${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(userId ? { 'X-User-Id': userId } : {}),
      },
      ...options,
    });
    if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
    return await res.json();
  } catch (err) {
    // never let API failures touch the UI; console.warn/info are not
    // supported everywhere, so use plain console.log
    console.log('[api]', err && (err.message || err));
    return null;
  }
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