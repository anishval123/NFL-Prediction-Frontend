import schedule from '../data/schedule2026.json';
import teamsData from '../data/teams.json';
import results2026 from '../data/results2026.json';

export const allGames = schedule.flatMap((week) => week.games);
export const weekCount = schedule.length;

// team metadata lookup map keyed by abbreviation
export const teams = teamsData;
export const teamByAbbr = teamsData.reduce((map, team) => {
  map[team.abbr] = team;
  return map;
}, {});

/* ─────────────────────────────────────────────────────────────────────
 * Live results
 * games that have already been played are locked: their winner is in
 * results2026.json (baseline) and/or the live feed served by the backend
 * poller. The live feed overrides the baseline, and any game whose kickoff
 * time has passed is auto-locked too, so the site stays correct as the
 * season rolls on (result may be pending).
 * ───────────────────────────────────────────────────────────────────── */

export const baseResults = results2026;
const EMPTY_LIVE = {};
let liveResults = EMPTY_LIVE;

/** Merge the backend live feed (gameId -> result) into module state. */
export function applyLiveResults(live) {
  if (live && typeof live === 'object') {
    // Merge incoming live results into existing liveResults so we don't
    // accidentally wipe previously-applied final or live statuses when the
    // backend returns only deltas or the currently active games.
    liveResults = { ...liveResults, ...live };
  }
}

export function getResult(gameId) {
  return liveResults[gameId] || baseResults[gameId];
}

/** A stored row is final when the provider said so or a winner is recorded.
 *  `status === 'live'` rows are deliberately NOT final: only the data source
 *  can end a game, a clock never can. */
export function isFinalResult(result) {
  if (!result) return false;
  return result.status === 'final' || Boolean(result.winner);
}

/** The final result for a game, or null while it is scheduled/in progress. */
export function getFinal(gameId) {
  const result = getResult(gameId);
  return isFinalResult(result) ? result : null;
}

export function isFinalized(gameId) {
  return Boolean(getFinal(gameId));
}

/** The in-progress row for a game, or null. Never counted as a result. */
export function getLiveResult(gameId) {
  const result = getResult(gameId);
  return result && result.status === 'live' ? result : null;
}

/** True when a finished game ended level (NFL ties have no winner). */
export function isTie(result) {
  if (!result) return false;
  if (result.tie) return true;
  const h = result.home_score;
  const a = result.away_score;
  return !result.winner && h != null && a != null && h === a;
}

/** Number of unique finalized games (baseline seed ∪ live feed). */
export function countFinalized(live = liveResults) {
  const merged = { ...baseResults, ...live };
  return Object.keys(merged).filter((id) => isFinalResult(merged[id])).length;
}

export function gamesForWeek(week) {
  const found = schedule.find((w) => w.week === week);
  return found ? found.games : [];
}

export function weekRange(week) {
  const games = gamesForWeek(week);
  if (!games.length) return null;
  const dates = games.map((g) => g.date);
  return { start: dates[0], end: dates[dates.length - 1] };
}

/** Parse a game's kickoff time ("8:20 PM ET", "TBD", …) into a Date. */
export function kickoffMoment(game) {
  const base = game && game.date ? new Date(game.date + 'T00:00:00') : null;
  if (!base) return null;
  if (!game.time_et || game.time_et === 'TBD') {
    // without a kickoff time, treat the whole day as the window
    base.setHours(23, 59, 59, 0);
    return base;
  }
  const m = game.time_et.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return base;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (m[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (m[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
  base.setHours(hour, minute, 0, 0);
  return base;
}

/** Final state of a game regardless of user picks:
 *  'result'  → the data source reports FINAL and a score is stored
 *  'live'    → in progress right now (locked, no picking, not a result yet)
 *  'pending' → kickoff has passed but the source has not called it final
 *  'open'    → still pickable
 *
 *  Kickoff time is only ever used to lock a game for picking; it never makes a
 *  game final, because only the data source can declare a final score.        */
export function gameState(game) {
  if (!game) return 'open';
  const result = getResult(game.id);
  if (isFinalResult(result)) return 'result';
  if (result && result.status === 'live') return 'live';
  const kick = kickoffMoment(game);
  if (kick && kick.getTime() < Date.now()) return 'pending';
  return 'open';
}

export function isLocked(game) {
  return gameState(game) !== 'open';
}

function emptyRecords() {
  const rec = {};
  teamsData.forEach((t) => {
    rec[t.abbr] = { w: 0, l: 0, t: 0, pct: 0, str: '0-0' };
  });
  return rec;
}

/** Win % (team pages, standings) and the "W-L" / "W-L-T" display string. */
function withPercentages(rec) {
  teamsData.forEach((t) => {
    const { w, l, t: ties } = rec[t.abbr];
    const played = w + l + ties;
    rec[t.abbr].pct = played > 0 ? w / played : 0;
    rec[t.abbr].str = ties > 0 ? `${w}-${l}-${ties}` : `${w}-${l}`;
  });
  return rec;
}

/**
 * Fold the season into W-L-T, visiting each game exactly once.
 *
 * A finalized game always wins over a user prediction, and a tie credits
 * neither side with a win. Because games are keyed by their own id and each is
 * added at most once, replaying the same results can never double-count a
 * game: the table is a pure function of (final results, picks).
 */
function foldDecisions(rec, picks, includePicks) {
  allGames.forEach((game) => {
    const result = getFinal(game.id);
    if (isTie(result)) {
      rec[game.home_abbr].t += 1;
      rec[game.away_abbr].t += 1;
      return; // a tie never makes a pick correct
    }
    const winner = result ? result.winner : (includePicks ? picks[game.id] : null);
    if (winner === game.home_abbr || winner === game.away_abbr) {
      rec[winner].w += 1;
      const loser = winner === game.home_abbr ? game.away_abbr : game.home_abbr;
      rec[loser].l += 1;
    }
  });
  return rec;
}

/**
 * Records as the site presents them: finalized results, plus the user's picks
 * for games that are not settled yet ("if my picks hold").
 * picks: { [gameId]: winnerAbbr }
 * Returns { [abbr]: { w, l, t, pct, str } }
 */
export function computeRecords(picks = {}) {
  return withPercentages(foldDecisions(emptyRecords(), picks, true));
}

/**
 * Official records from FINAL games only: nothing scheduled, nothing still in
 * progress, and no user picks. This is what the "Actual results" view shows,
 * and it is the table the NFL's own W-L would match.
 */
export function computeActualRecords() {
  return withPercentages(foldDecisions(emptyRecords(), {}, false));
}

/**
 * How one prediction fared: 'correct' | 'incorrect' | 'tie', or null while the
 * game has no final result yet.
 */
export function predictionOutcome(gameId, pick) {
  const result = getFinal(gameId);
  if (!result || !pick) return null;
  if (isTie(result)) return 'tie';
  if (!result.winner) return null;
  return result.winner === pick ? 'correct' : 'incorrect';
}

/**
 * The user's prediction record, counted over finalized games only — upcoming
 * and in-progress games never move it. Ties are tracked but not graded.
 */
export function computePredictionRecord(picks = {}) {
  let correct = 0;
  let incorrect = 0;
  let tied = 0;
  let pending = 0;
  allGames.forEach((game) => {
    const pick = picks[game.id];
    if (!pick) return;
    const outcome = predictionOutcome(game.id, pick);
    if (outcome === 'correct') correct += 1;
    else if (outcome === 'incorrect') incorrect += 1;
    else if (outcome === 'tie') tied += 1;
    else pending += 1;
  });
  const graded = correct + incorrect;
  return {
    correct,
    incorrect,
    tied,
    pending,
    graded,
    pct: graded > 0 ? correct / graded : 0,
    str: tied > 0 ? `${correct}-${incorrect}-${tied}` : `${correct}-${incorrect}`,
  };
}

export function pickSummary(records) {
  const sorted = Object.entries(records)
    .map(([abbr, r]) => ({ abbr, ...r }))
    .sort((a, b) => b.w - a.w || b.pct - a.pct);
  return {
    leaders: sorted.slice(0, 5),
    laggards: sorted.slice(-3).reverse(),
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}