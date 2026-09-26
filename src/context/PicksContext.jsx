import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadLive, getResults, getEvaluation, getMe, savePredictions, setUserId, getLastRequestError } from '../utils/api.js';
import {
  applyLiveResults,
  countFinalized,
  computeRecords,
  computeActualRecords,
  computePredictionRecord,
} from '../utils/records.js';

const STORAGE_KEY = 'nfl2026-picks';   // offline mirror of this user's picks
const USER_KEY = 'nfl2026-uid';        // this browser's stable user id
const THEME_KEY = 'nfl2026-theme';
const LIVE_POLL_MS = 30000; // refresh live status + finals every 30s
const FEED_RETRY_MS = 10000; // retry this fast while the backend is unreachable
const EVAL_POLL_MS = 30000; // refresh verdicts/standings at most every 30s
const RESULTS_PULL_MS = 5 * 60 * 1000; // belt-and-braces re-check of /results
const PicksContext = createContext(null);

/** A stable id for this browser, so predictions are stored per user server-side. */
function loadUserId() {
  try {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const fresh = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(USER_KEY, fresh);
    return fresh;
  } catch {
    return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function PicksProvider({ children }) {
  const [userId] = useState(loadUserId);
  // Predictions are the server's; localStorage is only an offline mirror, so the
  // same user gets their picks back on refresh and on another device.
  const [picks, setPicks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  // Verdicts + standings computed by the backend from the finalized ESPN games.
  const [evaluation, setEvaluation] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [serverPicks, setServerPicks] = useState(null);

  // Live game status from the backend poller. Re-applied on every successful
  // fetch (records memo depends on this state); a failed fetch (API down)
  // simply keeps the static baseline.
  const [live, setLive] = useState({ loaded: false, updatedAt: null, provider: null });
  // Whether the results feed is actually reachable right now. Surfaced in the UI
  // so a stopped backend is obvious instead of looking like "no games played".
  const [feed, setFeed] = useState({
    connected: false,
    updatedAt: null,
    provider: null,
    finals: null,
    live: null,
    attempts: 0,
    // Why the last attempt failed (url + status or "no response"). Shown in the
    // UI so a blocked or offline feed is not mistaken for "no games played".
    lastError: null,
  });

  const picksRef = useRef(picks);
  useEffect(() => {
    picksRef.current = picks;
  }, [picks]);

  // Ask the server who we are and what we already predicted. The server's copy
  // wins (it is the durable one); a browser holding local picks but nothing
  // stored yet uploads them once, so upgrading never loses a prediction.
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    setUserId(userId);
    (async () => {
      const me = await getMe();
      const stored = (me && me.picks) || null;
      if (stored && Object.keys(stored).length) {
        setServerPicks(stored);
        setPicks(stored);
      } else {
        const local = picksRef.current;
        if (local && Object.keys(local).length) {
          const res = await savePredictions(local);
          if (res) setServerPicks(local);
        }
      }
      setServerReady(true);
    })();
  }, [userId]);

  useEffect(() => {
    let stopped = false;
    let timer = null;
    let resultsPulledAt = 0;
    let evalPulledAt = 0;
    const reachable = { current: false };

    const tick = async () => {
      const data = await loadLive();
      if (stopped) return;

      // /games/live already carries the final results — the backend serves
      // /results from that same poller state — so applying this one feed keeps
      // the User Predictions view, the schedule locks and the standings in step
      // with each other and with the NFL data source.
      if (data && data.games) {
        reachable.current = true;
        // Feed the one records engine the whole site reads from. Without this
        // the cards/standings only ever saw the bundled seed file.
        applyLiveResults(data.games);
        const view = {
          updatedAt: data.updated_at || null,
          provider: data.provider || null,
          finals: typeof data.finals === 'number' ? data.finals : null,
          live: typeof data.live === 'number' ? data.live : null,
        };
        setLive({ loaded: true, ...view });
        setFeed({ connected: true, attempts: 0, lastError: null, ...view });
      } else {
        reachable.current = false;
        setFeed((f) => ({
          ...f,
          connected: false,
          attempts: (f.attempts || 0) + 1,
          lastError: getLastRequestError(),
        }));
      }

      const now = Date.now();

      // Belt-and-braces: re-pull /results occasionally, and immediately when the
      // live feed is unreachable (it is the same backend state, so if this
      // answers we are not offline at all).
      if (!reachable.current || now - resultsPulledAt > RESULTS_PULL_MS) {
        let res = null;
        try {
          res = await getResults();
        } catch (e) {
          console.log('[live] getResults error', e && (e.message || e));
        }
        if (stopped) return;
        // /results may return either { games: {...} } or a flat map
        const games = res && (res.games || res);
        if (games && Object.keys(games).length) {
          applyLiveResults(games);
          resultsPulledAt = now;
          reachable.current = true;
          setLive((s) => ({ ...s, loaded: true }));
          setFeed((f) => ({ ...f, connected: true, attempts: 0, lastError: null }));
        }
      }

      // Verdicts, prediction records and both standings tables for this user.
      // These are derived from the same stored finals, so they can never
      // disagree with the scores above.
      if (now - evalPulledAt > EVAL_POLL_MS) {
        const ev = await getEvaluation();
        if (stopped) return;
        if (ev) {
          setEvaluation(ev);
          evalPulledAt = Date.now();
        }
      }
    };

    // Self-scheduling so the retry rate can follow the connection state: quick
    // while the backend is down, relaxed once it answers.
    const run = async () => {
      if (stopped) return;
      await tick();
      if (stopped) return;
      timer = setTimeout(run, reachable.current ? LIVE_POLL_MS : FEED_RETRY_MS);
    };
    const refresh = () => {
      if (stopped) return;
      if (timer) clearTimeout(timer);
      run();
    };

    run();
    // Refresh immediately when the tab regains focus so statuses never lag
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Global theme (dark class on <html>, persisted). Lives here so every
  // component can read/toggle it via usePicks().
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ||
        (!localStorage.getItem(THEME_KEY) && document.documentElement.classList.contains('dark'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.toggle('dark', dark);
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((v) => !v), []);

  // Persist on every change: localStorage is the offline mirror, the backend is
  // the durable per-user record. Re-reading the evaluation straight afterwards
  // makes the Projected Record react to a pick change immediately.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch {
      /* storage unavailable */
    }
    if (!serverReady) return; // never race the initial server load
    savePredictions(picks).then(async (res) => {
      if (!res) return;
      setServerPicks(picks);
      const ev = await getEvaluation();
      if (ev) setEvaluation(ev);
    });
  }, [picks, serverReady]);

  const setPick = useCallback((gameId, winnerAbbr) => {
    setPicks((prev) => {
      // Toggle: clicking the already-selected team removes the pick
      if (prev[gameId] === winnerAbbr) {
        const next = { ...prev };
        delete next[gameId];
        return next;
      }
      return { ...prev, [gameId]: winnerAbbr };
    });
  }, []);

  const clearPick = useCallback((gameId) => {
    setPicks((prev) => {
      if (!(gameId in prev)) return prev;
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setPicks({}), []);

  // Per-game verdicts keyed by game id, straight from the backend evaluation.
  const evaluated = useMemo(() => {
    const map = {};
    ((evaluation && evaluation.games) || []).forEach((row) => {
      map[row.game_id] = row;
    });
    return map;
  }, [evaluation]);

  const finalGameIds = useMemo(() => {
    const ids = new Set();
    ((evaluation && evaluation.games) || []).forEach((row) => {
      if (row && row.status === 'final') ids.add(row.game_id);
    });
    return ids;
  }, [evaluation]);

  // Server-first, local-fallback: the backend's tables when reachable, otherwise
  // the same numbers computed from the stored finals + this user's picks, so a
  // hiccup in the API never blanks the site.
  const records = useMemo(
    () => (evaluation && evaluation.projected) || computeRecords(picks),
    [evaluation, picks, live]
  );
  const projectedRecords = records;
  const actualRecords = useMemo(
    () => (evaluation && evaluation.official) || computeActualRecords(),
    [evaluation, picks, live]
  );
  const predictionRecord = useMemo(
    () => (evaluation && evaluation.record) || computePredictionRecord(picks),
    [evaluation, picks, live]
  );
  const aiRecord = useMemo(() => (evaluation && evaluation.aiRecord) || null, [evaluation]);

  const value = useMemo(
    () => {
      const totalPicked = Object.keys(picks).length;
      const pickedNotFinal = Object.keys(picks).filter((id) => !finalGameIds.has(id)).length;
      const finalCount = finalGameIds.size || Number(live.finals || 0) || countFinalized();
      return {
        picks,
        records,
        actualRecords,
        projectedRecords,
        predictionRecord,
        aiRecord,
        evaluated,
        evaluation,
        userId,
        savedToServer: Boolean(serverPicks),
        projectedAdjustments: (evaluation && evaluation.adjustments) || [],
        setPick,
        clearPick,
        resetAll,
        totalPicked,
        finalizedCount: finalCount,
        decidedCount: pickedNotFinal + finalCount,
        liveLoaded: live.loaded,
        liveUpdatedAt: live.updatedAt,
        liveProvider: live.provider,
        liveFinals: live.finals,
        // Results-feed connection state, so the UI can say when it is offline.
        feedConnected: feed.connected,
        feedUpdatedAt: feed.updatedAt,
        feedProvider: feed.provider,
        feedFinals: feed.finals,
        feedLive: feed.live,
        feedAttempts: feed.attempts,
        feedError: feed.lastError,
        dark,
        toggleTheme,
      };
    },
    [picks, records, actualRecords, projectedRecords, predictionRecord, aiRecord, evaluated,
     evaluation, userId, serverPicks, setPick, clearPick, resetAll, live, feed, dark, toggleTheme]
  );

  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

export function usePicks() {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error('usePicks must be used inside <PicksProvider>');
  return ctx;
}