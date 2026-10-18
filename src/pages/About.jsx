import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';
import snapshot from '../data/projections2026.json';

/**
 * Methodology numbers derived from the same published snapshot the AI Insight
 * tab renders, so this section cannot drift from the shipped model output.
 */
const METH = (() => {
  const test = snapshot?.model?.metrics?.test || {};
  const rows = Object.values(snapshot?.weeks || {}).flat().filter(Boolean);
  const contribution = (row, feature) =>
    (row?.feature_contributions || []).find((c) => c.feature === feature) || null;
  const gaps = rows
    .map((r) => contribution(r, 'elo_rating_gap')?.log_odds_contribution)
    .filter((v) => typeof v === 'number');
  const homeLarger = rows.filter((r) => {
    const g = contribution(r, 'elo_rating_gap')?.log_odds_contribution;
    const h = contribution(r, 'home_field')?.log_odds_contribution;
    return typeof g === 'number' && typeof h === 'number' && Math.abs(g) < Math.abs(h);
  }).length;
  const gapMin = gaps.length ? Math.min(...gaps) : 0;
  const gapMax = gaps.length ? Math.max(...gaps) : 0;
  const gapMeanAbs = gaps.length ? gaps.reduce((a, b) => a + Math.abs(b), 0) / gaps.length : 0;
  // log-odds -> Elo rating points: points = log-odds * 400 / ln(10)
  const toPts = (logOdds) => Math.round(Math.abs(logOdds) * (400 / Math.LN10));
  const w1 = rows.find((r) => r.game_id === 'W1-SEA-NE') || {};
  return {
    version: snapshot?.model?.version || 'unversioned',
    games: rows.length,
    accuracy: ((test.accuracy ?? 0) * 100).toFixed(1),
    nRows: test.n ?? 0,
    nGames: Math.round((test.n ?? 0) / 2),
    brier: (test.brier ?? 0).toFixed(3),
    auc: (test.roc_auc ?? 0).toFixed(3),
    gapMin: gapMin.toFixed(2),
    gapMax: gapMax.toFixed(2),
    gapMeanAbs: gapMeanAbs.toFixed(2),
    gapPts: toPts(gapMin),
    gapMeanPts: toPts(gapMeanAbs),
    home: (contribution(w1, 'home_field')?.log_odds_contribution ?? 0).toFixed(3),
    homeLarger,
    w1: {
      t1: w1.team_1, t2: w1.team_2, week: w1.week,
      gap: (contribution(w1, 'elo_rating_gap')?.log_odds_contribution ?? 0).toFixed(2),
      home: (contribution(w1, 'home_field')?.log_odds_contribution ?? 0).toFixed(2),
      p: ((w1.team_1_win_probability ?? 0) * 100).toFixed(1),
      winner: w1.predicted_winner,
    },
  };
})();

const FAQ = [
  {
    q: 'Where does the 2026 schedule come from?',
    a: "The official NFL 2026 regular-season schedule, released by the league on May 14, 2026. Each week shows the real matchups, home/away designations, kickoff times (converted to ET), venues and networks as announced. Week 18 times start as TBD, exactly as the NFL released them.",
  },
  {
    q: 'Why are some games locked?',
    a: "Games that have already been played are final. Their winner and score come from the live NFL results feed, and the game is greyed out so it can't be predicted. A game is also locked the moment it kicks off and shows 'Awaiting result' until the feed confirms the final score, so records always reflect reality rather than a clock.",
  },
  {
    q: 'Do my predictions save, and are they private to me?',
    a: "Yes. Each browser gets its own id and the server stores that user's predictions separately, so your picks never mix with anybody else's and they survive refreshes, server restarts and redeploys. Your browser keeps a local copy as an offline mirror, but the server copy is the one that counts.",
  },
  {
    q: 'What is the difference between the standings and my Projected Record?',
    a: 'The Official NFL standings count finished games only: one win and one loss per final result, nothing at all for scheduled or in-progress games, and never a prediction — so that table is identical for every visitor. The Projected Record is yours alone: it shows those same official results plus your predictions for games that have not been decided yet, clearly labelled as temporary. A game drops out of the projection the moment it becomes final, and the real result takes over.',
  },
  {
    q: 'How do final results update my picks and the standings?',
    a: 'A background poller reads the NFL scoreboard and stores each finished game once, keyed by its game id. Your pick is never overwritten: the card keeps the team you chose and adds the actual final score with a Correct or Incorrect verdict. The same stored result updates the standings, so a finalized game always credits one win and one loss exactly once, no matter how many times you refresh.',
  },
  {
    q: 'Do my picks save?',
    a: 'Yes. Every pick is saved in your browser and survives refreshes and browser restarts. When the API server is running, picks are also synced to it automatically via a save endpoint.',
  },
  {
    q: 'Do the AI Insight projections change my picks or my standings?',
    a: 'No. Each week page shows two completely separate prediction systems. "User Predictions" is the one you play: tapping a team locks your winner and rebuilds your records, team pages and standings. "AI Insight" is the trained model\'s own second opinion, shown under its own heading and its own rules: the model only reads stats through the week before, never sees your picks, and its winners are never counted in your record or the standings.',
  },
  {
    q: 'Is this for gambling?',
    a: 'No. It is a fan tool for friendly season-long contests. It carries no odds, spreads, or real-money implications. It just knows the real schedule.',
  },
];

export default function About() {
  const { totalPicked, resetAll } = usePicks();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="animate-fadeUp">
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
        <div className="container-page py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">About</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
            Methodology
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            How the prediction model works, how final results auto-lock, how the pick
            engine works, and the stack that powers it.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-6 py-8 lg:grid-cols-2">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Prediction Methodology</h2>
            <span className="chip bg-violet-500/10 text-violet-700 dark:text-violet-300">model {METH.version}</span>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Every win probability in <strong className="text-navy-800 dark:text-white">AI Insight</strong> comes from a walk-forward <strong className="text-navy-800 dark:text-white">Elo rating model</strong>. It uses only games completed before the week being predicted. It ignores injuries, betting odds, and your picks.
            </p>

            <div>
              <p className="mb-1 font-semibold text-slate-800 dark:text-slate-200">How a prediction is made</p>
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-slate-400 dark:marker:text-slate-500">
                <li>Replay every completed NFL game from 2018 onward in order. Each team starts at 1500 and its rating moves after every result.</li>
                <li>Update each rating with <code className="font-mono text-xs text-navy-800 dark:text-slate-100">R&rsquo; = R + 20 &times; (result &minus; expected)</code>, where <em>expected</em> is the win probability the model gave that team before the game.</li>
                <li>To pick a winner, compute <code className="font-mono text-xs text-navy-800 dark:text-slate-100">d = R_team &minus; R_opponent &plusmn; 55</code> (+55 for the home team) and convert the gap with <code className="font-mono text-xs text-navy-800 dark:text-slate-100">p = 1 / (1 + 10^(&minus;d/400))</code>. The higher probability is the pick.</li>
              </ol>
            </div>

            <div>
              <p className="mb-1 font-semibold text-slate-800 dark:text-slate-200">What the probability means</p>
              <p>
                A win probability is an <strong className="text-navy-800 dark:text-white">estimate</strong> from
                past results, not a guarantee. If a matchup were played many times under the same pregame
                conditions, a 64% forecast would mean about 64 wins per 100 on average, and even a 90% favorite
                would lose about one game in ten. In walk-forward validation the model won{' '}
                <strong className="text-navy-800 dark:text-white">{METH.accuracy}%</strong> of{' '}
                <strong className="text-navy-800 dark:text-white">{METH.nGames} held-out games</strong> ({METH.nRows}{' '}
                team-game rows counted once per team) across 24 weekly folds (Brier {METH.brier}, where a constant
                coin-flip forecaster scores 0.25; AUC {METH.auc}).
              </p>
            </div>

            <details className="group rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-navy-700 dark:bg-navy-800/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-navy-800 dark:text-slate-100">
                Technical details: the model&apos;s two inputs
                <span className="text-slate-400 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Influence is shown in <em>log-odds</em>, the additive scale the formula uses: a positive value
                pushes the probability toward that team. These are not percentages and do not sum to 100%.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left align-top text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-navy-700 dark:text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Factor</th>
                      <th className="py-2 pr-3 font-semibold">What it measures</th>
                      <th className="py-2 font-semibold">Influence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    <tr>
                      <td className="py-2 pr-3 font-semibold text-navy-800 dark:text-slate-100">Pregame rating gap<br /><span className="font-normal text-slate-400 dark:text-slate-500">(team strength)</span></td>
                      <td className="py-2 pr-3">Results-based form since 2018: who a team beat and how surprising each result was to the ratings.</td>
                      <td className="py-2">Multiplies the odds by 10<sup>&Delta;R/400</sup>: every 100 rating points is about &times;1.8 the odds. Varies by game: across the {METH.games} published 2026 picks it ranges from {METH.gapMin} to +{METH.gapMax} log-odds (&plusmn;{METH.gapPts} rating points), averaging {METH.gapMeanAbs} (about {METH.gapMeanPts} points).</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-semibold text-navy-800 dark:text-slate-100">Home field</td>
                      <td className="py-2 pr-3">Fixed venue edge: crowd, travel, routine.</td>
                      <td className="py-2">+55 rating points, a constant +{METH.home} log-odds (&times;1.37 the odds) toward the home team in every game. In {METH.homeLarger} of {METH.games} published games it was the larger of the two factors.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The table is the model&apos;s fixed structure: only these two inputs exist and their per-point
                influence never changes. One game&apos;s own contribution, shown in its &ldquo;Why this pick&rdquo;
                panel, is that matchup&apos;s rating gap plus the constant home edge, and the two add up in
                log-odds to exactly the probability displayed. Example: {METH.w1.t1} vs {METH.w1.t2}, week{' '}
                {METH.w1.week}, +{METH.w1.gap} strength and +{METH.w1.home} home field gives{' '}
                {METH.w1.p}% for {METH.w1.winner}.
              </p>
            </details>

          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Your picks · the engine</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <ul className="list-inside list-disc space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Game cards highlight the picked team and lock the winner.</li>
              <li>When a game is final, your pick is kept and the real score plus a Correct / Incorrect verdict appear on the same card.</li>
              <li>Final results override any old picks and rebuild records live.</li>
              <li>Records surface on weekly pages, team pages, and standings views.</li>
              <li>Picks persist via localStorage and sync to the API when running.</li>
            </ul>
            <div>
              <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {['React 18', 'Tailwind CSS 3', 'React Router 6', 'Vite 5', 'FastAPI', 'Uvicorn', 'localStorage', 'JSON files', 'light/dark theme'].map((t) => (
                  <span key={t} className="chip bg-navy-800 text-white">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">AI Insight · a second system</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Every week page carries a second, deliberately independent prediction
              system under its own heading. It is the trained model&apos;s view of the
              same matchups, and it is scored under entirely different rules from
              your predictions. Its probabilities are always shown: they are
              precomputed for every game in the season and ship with the site, so
              the panel never has to fall back to an empty state.
            </p>
            <ul className="list-inside list-disc space-y-1.5">
              <li>A walk-forward Elo rating model (version elo-walkforward-2026), selected by chronological comparison as the most accurate on held-out weeks.</li>
              <li>Served by a FastAPI service on port 8001; the same numbers ship bundled with the site as a fallback.</li>
              <li>Only ever sees games completed before the week being predicted, so nothing from the current week can leak in.</li>
              <li>Never reads your picks, and its winners are never added to your record or the standings.</li>
              <li>Once a game is final the model&apos;s own pick is graded against the real result (✓ / ✗) and is never replaced by it.</li>
              <li>Ties do not impact the overall AI record.</li>
              <li>If a live service is unreachable the bundled snapshot still shows, so the section is never blank.</li>
            </ul>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Elo ratings', 'walk-forward validation', 'FastAPI :8001', 'pregame inputs only'].map((t) => (
                <span key={t} className="chip bg-violet-500/10 text-violet-700 dark:text-violet-300">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Data privacy & reset</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              All picks stay in your browser. When you run the API server, picks
              are synced to it for safekeeping automatically. You have
              <strong className="text-navy-800 dark:text-white">{totalPicked}</strong> picks stored right now.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm) {
                  resetAll();
                  setConfirm(false);
                } else {
                  setConfirm(true);
                  setTimeout(() => setConfirm(false), 4000);
                }
              }}
              className={confirm ? 'btn-primary' : 'btn-outline'}
            >
              {confirm ? 'Click again to confirm. Wipe all picks' : 'Reset all my picks'}
            </button>
          </div>
        </div>
      </section>

      <section className="container-page pb-12">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy-900">FAQ</h2>
        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-navy-800 dark:border-navy-700 dark:bg-navy-900">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy-900 group-open:text-brand-dark dark:text-slate-100 dark:group-open:text-brand-light">
                {f.q}
                <span className="text-slate-400 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/week/1" className="btn-primary">Start picking</Link>
        </div>
      </section>
    </div>
  );
}