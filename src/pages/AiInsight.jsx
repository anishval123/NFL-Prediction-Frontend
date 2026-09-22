import { useParams, Navigate, Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader.jsx';
import ModelProjection from '../components/ModelProjection.jsx';
import { gamesForWeek, weekCount, formatDate, isLocked } from '../utils/records.js';

export default function AiInsight() {
  const { week } = useParams();

  // If a week param is provided, render only that week. If not provided, render all weeks.
  if (week) {
    const n = Number(week);
    const valid = Number.isInteger(n) && n >= 1 && n <= weekCount;
    const games = valid ? gamesForWeek(n) : [];

    if (!valid) return <Navigate to="/ai-insight/1" replace />;

    const finalized = games.filter((g) => isLocked(g)).length;
    const decided = games.filter((g) => isLocked(g)).length;
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
            className={`btn-primary px-3.5 ${n >= weekCount ? 'pointer-events-none opacity-40' : ''}`}
            aria-disabled={n >= weekCount}
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
                    {formatDate(range[0])} – {formatDate(range[1])}, 2027
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
            {Array.from({ length: weekCount }, (_, i) => i + 1).map((wk) => (
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

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-1 md:col-span-2 xl:col-span-3">
              <ModelProjection week={n} games={games} />
            </div>
          </div>
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

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: weekCount }, (_, i) => i + 1).map((wk) => (
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
