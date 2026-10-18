import { useEffect, useMemo, useState } from 'react';
import { usePicks } from '../context/PicksContext.jsx';
import teamsData from '../data/teams.json';
import snapshot from '../data/projections2026.json';
import { getFinal, aiPredictionOutcome } from '../utils/records.js';
import { getAiProjections } from '../utils/api.js';

const TEAM_BY_ABBR = Object.fromEntries((teamsData || []).map((team) => [team.abbr, team]));

/** The AI model's own output, keyed by matchup, so its pick can be graded. */
const AI_BY_PAIR = (() => {
  const map = {};
  Object.values(snapshot.weeks || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      if (row && row.game_id && row.team_1 && row.team_2) {
        map[`${row.team_1}-${row.team_2}`] = row.game_id;
      }
    });
  });
  return map;
})();

/**
 * The AI's originally recorded winner per game id, straight from the same
 * bundled snapshot the backend grades. Grading always reads this map, so a
 * prediction regenerated after kickoff (by the live service or a retrained
 * snapshot) can never rewrite the call that was actually on record.
 */
const AI_WINNER_BY_ID = (() => {
  const map = {};
  Object.values(snapshot.weeks || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      if (row && row.game_id && row.predicted_winner) {
        map[row.game_id] = row.predicted_winner;
      }
    });
  });
  return map;
})();

/** Explanation fields shown when a row is expanded, with display labels. */
const FACETS = [
  ['elo_rating', 'Elo rating (pregame)'],
  ['off_epa_per_play', 'Off EPA/play'],
  ['def_epa_per_play', 'Def EPA/play'],
  ['points_for', 'Points scored'],
  ['points_against', 'Points allowed'],
  ['turnover_plus', 'Turnover margin'],
  ['sack_rate', 'Sack rate'],
  ['third_down_pct', 'Third down'],
  ['redzone_pct', 'Red zone'],
];

const DETAIL_METRICS = [
  ['off_epa_per_play', 'Off EPA/play'], ['def_epa_per_play', 'Def EPA allowed/play'],
  ['off_success_rate', 'Offensive success rate'], ['def_success_rate', 'Defensive success rate allowed'],
  ['pass_epa_per_dropback', 'Pass EPA/dropback'], ['rush_epa_per_attempt', 'Rush EPA/attempt'],
  ['turnover_plus', 'Turnover margin/play'], ['pressure_rate', 'Pressure rate'],
  ['sack_rate', 'Sack rate allowed'], ['third_down_pct', 'Third down'],
  ['redzone_pct', 'Red zone TD rate'], ['points_for', 'Points/game'], ['points_against', 'Points allowed/game'],
];

function unavailable(value) {
  return value === null || value === undefined || Number.isNaN(value);
}

/**
 * Which model produced the contributions on this row, described truthfully
 * from the backend's `contribution_basis` field. Older snapshots without the
 * field fall back to the logistic description only when the row really came
 * from a linear model version; everything else reports contributions as
 * unavailable rather than mislabelling them.
 */
function contributionMethod(pred) {
  const basis = pred.contribution_basis
    || ((pred.model_version || '').startsWith('lr-') ? 'logistic_coefficients' : 'unavailable');
  if (basis === 'elo_log_odds') {
    return 'Values decompose this Elo model\u2019s own log-odds: pregame rating gap and the +55 home edge, each as its actual share of the probability shown.';
  }
  if (basis === 'logistic_coefficients') {
    return 'Values are actual standardized logistic feature \u00d7 coefficient contributions.';
  }
  return 'The selected model exposes no feature-level contributions, so none are shown.';
}

function detailValue(value, label) {
  if (unavailable(value)) return 'Unavailable';
  if (/rate|Third|Red zone|Sack/.test(label)) return `${(value * 100).toFixed(1)}%`;
  return Number(value).toFixed(/Points/.test(label) ? 1 : 3);
}

function FocusDashboard({ pred, game, model, dataQuality }) {
  if (!pred) return null;
  const one = pred.explanation?.team_1 || {};
  const two = pred.explanation?.team_2 || {};
  const first = TEAM_BY_ABBR[pred.team_1];
  const second = TEAM_BY_ABBR[pred.team_2];
  const contributions = pred.feature_contributions || [];
  const p1 = Math.round(pred.team_1_win_probability * 100);
  const p2 = 100 - p1;
  return <div className="space-y-4 border-t border-slate-100 p-4 dark:border-navy-800">
    <section className="rounded-xl border border-slate-200 p-4 dark:border-navy-700">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-2">{first?.logo && <img src={first.logo} alt="" className="h-9 w-9" />}<b>{first?.name || pred.team_1}</b></div>
        <div className="text-center"><p className="text-xs text-slate-500">{game?.date || `Week ${pred.week}`} · {game?.time_et || 'Kickoff unavailable'}</p><p className="font-display text-2xl font-black">{p1}% – {p2}%</p><p className="text-sm font-bold text-brand">Model pick: {pred.predicted_winner}</p></div>
        <div className="flex items-center justify-start gap-2 md:justify-end">{second?.logo && <img src={second.logo} alt="" className="h-9 w-9" />}<b>{second?.name || pred.team_2}</b></div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Prediction timestamp: {snapshotDate(pred.prediction_timestamp)} · {pred.prediction_kind === 'reconstructed' ? 'Historical prediction — not published before kickoff.' : 'Scheduled forecast.'}</p>
    </section>
    <section className="rounded-xl border border-slate-200 dark:border-navy-700">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-navy-800"><b>Team comparison</b><p className="mt-1 text-xs text-slate-500">Trailing pregame values used where available.</p></div>
      <div className="divide-y divide-slate-100 dark:divide-navy-800">{DETAIL_METRICS.map(([key, label]) => <div key={key} className="grid grid-cols-[1fr_10rem_1fr] gap-2 px-4 py-2 text-xs"><span className="text-right font-semibold">{detailValue(one[key], label)}</span><span className="text-center text-slate-500">{label}</span><span className="font-semibold">{detailValue(two[key], label)}</span></div>)}</div>
      <p className="px-4 py-2 text-[11px] text-slate-500">Season trend sample: {pred.team_1} has {one.games_played ?? 'Unavailable'} prior games (current-season weight {unavailable(one.current_season_weight) ? 'Unavailable' : `${Math.round(one.current_season_weight * 100)}%`}); {pred.team_2} has {two.games_played ?? 'Unavailable'} ({unavailable(two.current_season_weight) ? 'Unavailable' : `${Math.round(two.current_season_weight * 100)}%`}). Early-season values are shrunk toward the prior season. Yards per drive and explicit matchup-rate fields are unavailable and are not estimated.</p>
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><b>Why the model picked {pred.predicted_winner}</b>{contributions.length ? <ul className="mt-3 space-y-2 text-sm">{contributions.map((item) => <li key={item.feature} className="flex justify-between gap-3"><span>{item.label} <small className="text-slate-500">{item.group}</small></span><span className="text-right text-xs font-semibold">favours {item.favors} ({item.log_odds_contribution > 0 ? '+' : ''}{item.log_odds_contribution})</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Contribution data is unavailable for this row; no synthetic explanation is shown.</p>}<p className="mt-3 text-[11px] text-slate-500">{contributionMethod(pred)}</p></section>
      <section className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><b>Quarterbacks & injuries</b><p className="mt-2 text-sm text-slate-500">Reliable starter, backup, replacement-quality, and historical injury data is unavailable in this published row.</p><p className="mt-2 text-[11px] text-slate-500">The selected model did not use injury features; current reports are never substituted into predictions.</p></section>
    </div>
    <section className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><b>Model accuracy & data quality</b>{model?.metrics?.test ? <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><span><strong>{Math.round(model.metrics.test.accuracy * 100)}%</strong><small className="block text-slate-500">held-out accuracy</small></span><span><strong>{model.metrics.test.n}</strong><small className="block text-slate-500">team-oriented rows</small></span><span><strong>{model.metrics.test.brier}</strong><small className="block text-slate-500">Brier score</small></span><span><strong>{model.metrics.test.log_loss}</strong><small className="block text-slate-500">log loss</small></span></div> : <p className="mt-2 text-sm text-slate-500">Verified metrics unavailable.</p>}<p className="mt-3 text-[11px] text-slate-500">Held-out season: {model?.test_season ?? 'Unavailable'}. Sportsbook comparison: {dataQuality?.odds || 'Unavailable'}.</p></section>
  </div>;
}

function fmt(value, key) {
  if (value === null || value === undefined) return 'n/a';
  if (key === 'elo_rating') return value.toFixed(1);
  if (key.endsWith('_pct') || key === 'sack_rate') return `${Math.round(value * 100)}%`;
  if (key === 'points_for' || key === 'points_against') return value.toFixed(1);
  if (key === 'turnover_plus') return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  return value.toFixed(3);
}

/** ISO timestamp -> short "Sep 18, 2026" label for the snapshot badge. */
function snapshotDate(iso) {
  if (!iso) return 'bundled';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'bundled'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Schedule game + stored result -> "SEA 24 - NE 17" (winner first), or null. */
function scoreLine(game, result) {
  const hs = result ? result.home_score : null;
  const aws = result ? result.away_score : null;
  if (!game || hs == null || aws == null) return null;
  return hs >= aws
    ? `${game.home_abbr} ${hs} - ${game.away_abbr} ${aws}`
    : `${game.away_abbr} ${aws} - ${game.home_abbr} ${hs}`;
}

function ProjectionRow({ pred, grade, expanded, onToggle }) {
  const t1 = TEAM_BY_ABBR[pred.team_1];
  const t2 = TEAM_BY_ABBR[pred.team_2];
  const p1 = Math.round(pred.team_1_win_probability * 100);
  const p2 = 100 - p1;
  const favoursOne = pred.team_1_win_probability >= 0.5;
  const e1 = pred.explanation ? pred.explanation.team_1 : {};
  const e2 = pred.explanation ? pred.explanation.team_2 : {};

  return (
    <li className={`matchup overflow-hidden${expanded ? ' matchup-picked' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-2 px-3 py-3 text-left"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t1 ? t1.name : pred.team_1}
          </span>
          <span className="font-display text-base font-black tabular-nums text-navy-900 dark:text-white">
            {p1}%
          </span>
        </span>
        <span className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${p1}%`, backgroundColor: t1 ? t1.colors.primary : '#C8102E' }}
          />
        </span>
        {/* Divider between the two sides of the matchup. */}
        <span className="flex items-center gap-2" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-300 dark:bg-navy-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">vs</span>
          <span className="h-px flex-1 bg-slate-300 dark:bg-navy-600" />
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t2 ? t2.name : pred.team_2}
          </span>
          <span className="font-display text-base font-black tabular-nums text-navy-900 dark:text-white">
            {p2}%
          </span>
        </span>
        <span className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${p2}%`, backgroundColor: t2 ? t2.colors.primary : '#C8102E' }}
          />
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
              favoursOne
                ? 'bg-navy-800 text-white dark:bg-white dark:text-navy-900'
                : 'bg-slate-200 text-slate-700 dark:bg-navy-700 dark:text-slate-200'
            }`}
          >
            AI: {pred.predicted_winner} wins
          </span>
          <span className="flex items-center gap-2">
            {grade && grade.outcome && (
              <span
                className={`chip ${
                  grade.outcome === 'correct'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : grade.outcome === 'tie'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {grade.outcome === 'correct'
                  ? '✓ Correct'
                  : grade.outcome === 'tie'
                    ? 'Tie'
                    : '✗ Incorrect'}
              </span>
            )}
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {expanded ? 'hide breakdown' : 'why this pick'}
            </span>
          </span>
        </span>
        {grade && grade.score && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Final:{' '}
            <span className="font-bold tabular-nums text-navy-800 dark:text-slate-100">
              {grade.score}
            </span>
            {grade.winner ? ` · ${grade.winner} won` : ' · tie'}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 dark:border-navy-800 dark:bg-navy-950">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500">
                <th className="py-0.5 text-left font-semibold">{pred.team_1}</th>
                <th className="py-0.5 text-center font-semibold">stat</th>
                <th className="py-0.5 text-right font-semibold">{pred.team_2}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-slate-600 dark:text-slate-300">
              {FACETS.map(([key, label]) => (
                <tr key={key}>
                  <td className="py-0.5 text-left">{fmt(e1 ? e1[key] : null, key)}</td>
                  <td className="py-0.5 text-center text-slate-400 dark:text-slate-500">{label}</td>
                  <td className="py-0.5 text-right">{fmt(e2 ? e2[key] : null, key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}

/**
 * AI matchup projections for a week.
 *
 * These always render: the trained model's numbers are precomputed into
 * `src/data/projections2026.json`, so the panel is populated even when the
 * ml-backend service is not running. When that service on port 8001 does
 * answer, its response replaces the snapshot and the badge flips to "model
 * live". Projections are informational and are never scored against picks.
 */
export default function ModelProjection({ week, games }) {
  const n = Number(week);
  const [live, setLive] = useState(null);
  const [liveInfo, setLiveInfo] = useState(null);
  const [publishedQuality, setPublishedQuality] = useState(null);
  const [liveTried, setLiveTried] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  // Server-side verdicts + the AI's season grade, refreshed by the same poll
  // loop that pulls the results feed, so a finalised game grades itself on
  // every device without this tab being open or manually refreshed.
  const { evaluated, aiRecord, liveUpdatedAt } = usePicks();

  const gameKey = games.map((g) => g.id).join(',');

  // Bundled snapshot for this week, returned in schedule order.
  const snapshotRows = useMemo(() => {
    const rows = (snapshot.weeks && snapshot.weeks[String(n)]) || [];
    const byId = new Map(rows.map((r) => [r.game_id, r]));
    const ordered = games.map((g) => byId.get(g.id)).filter((r) => r && !r.error);
    return ordered.length ? ordered : rows.filter((r) => r && !r.error);
  }, [n, gameKey]);

  // Render API is the production source of truth. The bundled JSON is only a
  // resilient, versioned fallback when a visitor is offline or Render is down.
  useEffect(() => {
    let cancelled = false;
    setLive(null);
    setLiveInfo(null);
    setPublishedQuality(null);
    setLiveTried(false);
    setOpenIndex(null);
    getAiProjections(n).then((data) => {
      const rows = data?.weeks?.[String(n)];
      if (cancelled || !Array.isArray(rows) || !rows.length) return;
      setLive(rows);
      setLiveInfo(data.model || null);
      setPublishedQuality(data.data_quality || null);
      setLiveTried(true);
    }).catch(() => {
      if (!cancelled) setLiveTried(true);
    });
    return () => { cancelled = true; };
  }, [n]);

  const rows = live && live.length ? live : snapshotRows;
  const isLive = Boolean(live && live.length);
  const info = liveInfo || snapshot.model || null;
  const test = info && info.metrics ? info.metrics.test : null;

  // Grade the model's own pick against the stored final, without ever altering
  // the prediction itself: the AI's call and the actual result stay separate.
  //
  // aiPredictionOutcome always compares the AI's originally recorded winner
  // (AI_WINNER_BY_ID) — never the user's pick and never a prediction regenerated
  // after the game — and takes the verdict from the backend evaluation when the
  // API answers, so it is identical on every device and updates whether or not
  // this tab is open. Scheduled and in-progress games return null: no label.
  const grades = useMemo(() => {
    const map = {};
    rows.forEach((pred) => {
      const gameId = pred.game_id || AI_BY_PAIR[`${pred.team_1}-${pred.team_2}`];
      if (!gameId) return;

      const row = evaluated[gameId];
      const result = getFinal(gameId);
      const serverFinal = Boolean(row && row.status === 'final');
      const outcome = aiPredictionOutcome(gameId, AI_WINNER_BY_ID[gameId] || null, row);
      if (!outcome) return; // upcoming or in progress: show neither label

      const game = games.find((g) => g.id === gameId);
      const winner = (serverFinal
        ? (row.winner || row.actualWinner)
        : (result && result.winner)) || null;
      let score = serverFinal ? (row.final_score || row.finalScore) : null;
      if (!score && game && result) score = scoreLine(game, result);

      map[`${pred.team_1}-${pred.team_2}`] = { outcome, score, winner };
    });
    return map;
  }, [rows, games, evaluated, liveUpdatedAt]);

  // Nothing stored for this week and the service has not answered yet.
  if (!rows.length && !liveTried) {
    return (
      <section className="card p-4">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          Loading AI projections for Week {n}...
        </p>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <div className="card p-4">
        <p className="text-sm font-semibold text-navy-900 dark:text-white">
          No AI projections stored for Week {n}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Regenerate the snapshot from the trained model, or start the ML service on port 8001 for
          live responses. Your picks and standings are unaffected.
        </p>
      </div>
    );
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-navy-800">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {rows.length} probabilities for week {n} · click any row for the stat breakdown behind the pick
        </p>
        {isLive ? (
          <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            API snapshot
          </span>
        ) : (
          <span
            className="chip bg-violet-500/15 text-violet-700 dark:text-violet-300"
            title="Precomputed run of the trained model, refreshed whenever the model is retrained."
          >
            model snapshot · {snapshotDate(snapshot.generated_at)}
          </span>
        )}
      </div>

      <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((pred, i) => (
          <ProjectionRow
            key={`${pred.team_1}-${pred.team_2}-${i}`}
            pred={pred}
            grade={grades[`${pred.team_1}-${pred.team_2}`]}
            expanded={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </ul>

      <FocusDashboard
        pred={rows[openIndex >= 0 ? openIndex : 0]}
        game={games.find((game) => game.id === rows[openIndex >= 0 ? openIndex : 0]?.game_id)}
        model={info}
        dataQuality={publishedQuality || snapshot.data_quality}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 dark:border-navy-800 dark:text-slate-400">
        <span>
          Model{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {info ? info.version : 'training'}
          </span>
        </span>
        {test && (
          <span>
            Held out season {info.test_season}: {Math.round(test.accuracy * 100)}% straight up, AUC{' '}
            {test.roc_auc} over {test.n} team games
          </span>
        )}
        {aiRecord && aiRecord.graded > 0 && (
          <span>
            Season grade{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {aiRecord.str} ({Math.round((aiRecord.pct || 0) * 100)}%)
            </span>{' '}
            of decided games
          </span>
        )}
        <span>
          {isLive ? 'Loaded from the prediction API.' : 'From the bundled model snapshot.'} Informational
          only, not betting advice.
        </span>
      </div>
    </section>
  );
}
