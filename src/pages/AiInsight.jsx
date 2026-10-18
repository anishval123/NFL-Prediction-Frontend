import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader.jsx';
import ModelProjection from '../components/ModelProjection.jsx';
import FeedStatus from '../components/FeedStatus.jsx';
import { gamesForWeek } from '../utils/records.js';

const WEEK_COUNT = 18;

function formatRangeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Plain-language explainer for the Elo rating the projections are built on.
 * Sits at the top of the AI Insight tab, where a reader meets the term for the
 * first time ("Elo rating (pregame)" in the breakdown table).
 */
function EloNote() {
  return (
    <aside className="mt-5 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 text-sm leading-relaxed text-slate-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-slate-300">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
        What is an Elo rating?
      </p>
      <p>
        Every team has a rating (starting at{' '}
        <b className="font-semibold text-navy-800 dark:text-slate-100">1500</b>) that
        summarizes its strength based on completed games. After each game, ratings
        adjust based on how the result compares to expectations, with bigger changes
        for unexpected outcomes. To predict a matchup, the model compares team
        ratings, adds{' '}
        <b className="font-semibold text-navy-800 dark:text-slate-100">
          55 points to the home team
        </b>
        , and converts the adjusted rating difference into a win probability. Only
        games completed before the selected week are used. Elo summarizes past
        results rather than explaining what causes a team to win.
      </p>
    </aside>
  );
}

export default function AiInsight() {
  const { week } = useParams();

  // The hero's "AI Predictions" button links straight to this section header
  // (/ai-insight/1#ai-insight). React Router navigation does not trigger the
  // browser's native fragment scroll, so honour the hash here.
  useEffect(() => {
    const id = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [week]);

  // If a week param is provided, render only that week. Games come from the
  // bundled schedule so the page renders even if the API is unreachable.
  if (week) {
    const n = Number(week);
    const valid = Number.isInteger(n) && n >= 1 && n <= WEEK_COUNT;
    const games = valid ? gamesForWeek(n) : [];

    if (!valid) return <Navigate to="/ai-insight/1" replace />;

    const finalized = games.filter((g) => g.status === 'final').length;
    const decided = games.filter((g) => g.status === 'final').length;
    const range = games.length ? [games[0].date, games[games.length - 1].date] : null;

    function WeekPrevNext({ n }) {
      return (
        <>
          <Link
            to={`/ai-insight/${n - 1}`}
            className={`btn-outline px-3.5 ${n <= 1 ? 'pointer-events-none opacity-40' : ''}`}
            aria-disabled={n <= 1}
          >
            ← Prev
          </Link>
          <Link
            to={`/ai-insight/${n + 1}`}
            className={`btn-primary px-3.5 ${n >= WEEK_COUNT ? 'pointer-events-none opacity-40' : ''}`}
            aria-disabled={n >= WEEK_COUNT}
          >
            Next →
          </Link>
        </>
      );
    }

    return (
      <div className="animate-fadeUp">
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
          <div className="container-page py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">2026 NFL Season</p>
                <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
                  AI Insight — Week {n}
                </h1>
                {range && (
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {formatRangeDate(range[0])} – {formatRangeDate(range[1])}, 2027
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <WeekPrevNext n={n} />
              </div>
            </div>
          </div>
        </section>

        <div className="container-page pt-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((wk) => (
              <Link
                key={wk}
                to={`/ai-insight/${wk}`}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  wk === n
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand-dark dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400 dark:hover:border-brand/50 dark:hover:text-white'
                }`}
              >
                {wk}
              </Link>
            ))}
          </div>
        </div>

        <section id="ai-insight" className="container-page scroll-mt-24 pb-12 pt-8" aria-label={`AI Insight Week ${n}`}>
          <SectionHeader
            eyebrow="AI generated · separate system"
            title={`AI Insight — Week ${n}`}
            tone="machine"
            description={`An independent second opinion: win probabilities from the trained matchup model, built only from stats through week ${Math.max(0, n - 1)}. It never sees your picks, and its winners never count toward your record or the standings.`}
            right={
              <span className="chip bg-violet-500/10 text-violet-700 dark:text-violet-300">
                Informational only
              </span>
            }
          />

          <EloNote />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-1 md:col-span-2 xl:col-span-3">
              <ModelProjection week={n} games={games} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Ties do not impact the overall AI record.
          </p>
        </section>
      </div>
    );
  }

  // No week param: show a grid of links (like the Schedule dropdown) so users navigate to each week's AI Insight page.
  return (
    <div className="container-page scroll-mt-24 py-8" aria-label="AI Insight Index">
      <SectionHeader
        eyebrow="AI generated · aggregated"
        title="AI Insight"
        tone="machine"
        description="Select a week to view the model's projections for that week's matchups."
        right={
          <span className="chip bg-violet-500/10 text-violet-700 dark:text-violet-300">
            Informational only
          </span>
        }
      />

      <EloNote />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((wk) => (
          <Link
            key={wk}
            to={`/ai-insight/${wk}`}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-brand hover:text-white dark:border-navy-800 dark:bg-navy-900/30"
          >
            Wk {wk}
          </Link>
        ))}
      </div>
    </div>
  );
}
