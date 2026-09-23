import { useEffect, useMemo, useState } from 'react';
import teamsData from '../data/teams.json';
import snapshot from '../data/projections2026.json';

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

/** ML service base URLs (the FastAPI service in ml-backend/, run on :8001). */
const ML_ENDPOINTS = ['http://localhost:8001', 'http://127.0.0.1:8001'];

/** Explanation fields shown when a row is expanded, with display labels. */
const FACETS = [
  ['off_epa_per_play', 'Off EPA/play'],
  ['def_epa_per_play', 'Def EPA/play'],
  ['points_for', 'Points scored'],
  ['points_against', 'Points allowed'],
  ['turnover_plus', 'Turnover margin'],
  ['sack_rate', 'Sack rate'],
  ['third_down_pct', 'Third down'],
  ['redzone_pct', 'Red zone'],
];

function fmt(value, key) {
  if (value === null || value === undefined) return 'n/a';
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

function ProjectionRow({ pred, grade, expanded, onToggle }) {
  const t1 = TEAM_BY_ABBR[pred.team_1];
  const t2 = TEAM_BY_ABBR[pred.team_2];
  const p1 = Math.round(pred.team_1_win_probability * 100);
  const p2 = 100 - p1;
  const favoursOne = pred.team_1_win_probability >= 0.5;
  const e1 = pred.explanation ? pred.explanation.team_1 : {};
  const e2 = pred.explanation ? pred.explanation.team_2 : {};

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand/40 dark:border-navy-800 dark:bg-navy-900">
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
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t2 ? t2.name : pred.team_2}
          </span>
          <span className="font-display text-base font-black tabular-nums text-navy-900 dark:text-white">
            {p2}%
          </span>
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
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {grade.outcome === 'correct' ? '✓ Correct' : '✗ Incorrect'}
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
  const [liveTried, setLiveTried] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const gameKey = games.map((g) => g.id).join(',');

  // Bundled snapshot for this week, returned in schedule order.
  const snapshotRows = useMemo(() => {
    const rows = (snapshot.weeks && snapshot.weeks[String(n)]) || [];
    const byId = new Map(rows.map((r) => [r.game_id, r]));
    const ordered = games.map((g) => byId.get(g.id)).filter((r) => r && !r.error);
    return ordered.length ? ordered : rows.filter((r) => r && !r.error);
  }, [n, gameKey]);

  useEffect(() => {
    let cancelled = false;
    setLive(null);
    setLiveInfo(null);
    setLiveTried(false);
    setOpenIndex(null);
    if (!games.length) {
      setLiveTried(true);
      return;
    }

    const body = {
      matchups: games.map((g) => ({
        team_1: g.home_abbr,
        team_2: g.away_abbr,
        season: 2026,
        week: Number(week),
        home_team: g.home_abbr,
        date: g.date,
      })),
    };

    (async () => {
      for (const base of ML_ENDPOINTS) {
        try {
          const res = await fetch(`${base}/predict/matchup/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) return;
          const rows = (data.matchups || []).filter((m) => m && !m.error);
          if (rows.length) setLive(rows);
          fetch(`${base}/model/info`)
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => {
              if (!cancelled && j) setLiveInfo(j);
            })
            .catch(() => {});
          setLiveTried(true);
          return;
        } catch {
          /* service not up: the bundled snapshot stays on screen */
        }
      }
      if (!cancelled) setLiveTried(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [week, gameKey]);

  const rows = live && live.length ? live : snapshotRows;
  const isLive = Boolean(live && live.length);
  const info = liveInfo || snapshot.model || null;
  const test = info && info.metrics ? info.metrics.test : null;

  // Grade the model's own pick against the stored final, without ever altering
  // the prediction itself: the AI's call and the actual result stay separate.
  const grades = useMemo(() => {
    const map = {};
    rows.forEach((pred) => {
      const gameId = pred.game_id || AI_BY_PAIR[`${pred.team_1}-${pred.team_2}`];
      if (!gameId) return;
      const finalGame = games.find((game) => game.id === gameId || game.game_id === gameId);
      if (!finalGame) return;
      const hs = finalGame.home_score ?? finalGame.homeScore;
      const aws = finalGame.away_score ?? finalGame.awayScore;
      let score = null;
      if (hs != null && aws != null) {
        const winner = hs === aws ? 'tie' : hs > aws ? finalGame.home_abbr : finalGame.away_abbr;
        score = hs >= aws
          ? `${finalGame.home_abbr} ${hs} - ${finalGame.away_abbr} ${aws}`
          : `${finalGame.away_abbr} ${aws} - ${finalGame.home_abbr} ${hs}`;
        map[`${pred.team_1}-${pred.team_2}`] = {
          outcome: pred.predicted_winner === winner || (winner === 'tie' ? pred.predicted_winner === null : false) ? 'correct' : 'incorrect',
          score,
          winner: winner === 'tie' ? null : winner,
        };
      }
    });
    return map;
  }, [rows, games]);

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
            model live
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

      <ul className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <span>
          {isLive ? 'Live from the model service.' : 'From the bundled model snapshot.'} Informational
          only, not betting advice.
        </span>
      </div>
    </section>
  );
}