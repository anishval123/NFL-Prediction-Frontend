import { Link, Navigate, useParams } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';
import GameCard from '../components/GameCard.jsx';
import { gamesForWeek, weekCount, formatDate, isLocked } from '../utils/records.js';
import ModelProjection from '../components/ModelProjection.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import FeedStatus from '../components/FeedStatus.jsx';

export default function Week() {
  const { week } = useParams();
  const n = Number(week);
  const { picks, records, setPick, clearPick } = usePicks();
  const valid = Number.isInteger(n) && n >= 1 && n <= weekCount;
  const games = valid ? gamesForWeek(n) : [];
  const finalized = games.filter((g) => isLocked(g)).length;
  const decided = games.filter((g) => isLocked(g) || picks[g.id]).length;
  const picked = games.filter((g) => picks[g.id]).length;
  const range = valid && games.length ? [games[0].date, games[games.length - 1].date] : null;

  if (!valid) return <Navigate to="/week/1" replace />;

  return (
    <div className="animate-fadeUp">
      {/* header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
        <div className="container-page py-8 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand">2026 NFL Season</p>
              <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
                Week {n}
                {n === 13 && <span className="ml-3 align-middle text-base font-bold not-italic text-slate-400 dark:text-slate-500">· Thanksgiving</span>}
                {n === 18 && <span className="ml-3 align-middle text-base font-bold not-italic text-slate-400 dark:text-slate-500">· Season Finale</span>}
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

          {/* progress */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand transition-all duration-500"
                style={{ width: `${games.length ? (decided / games.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums text-navy-800 dark:text-slate-100">
              {decided}<span className="text-slate-400 dark:text-slate-400"> / {games.length} decided</span>
            </span>
            {finalized > 0 && (
              <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                {finalized} final
              </span>
            )}
          </div>

          <div className="mt-3">
            <FeedStatus />
          </div>
        </div>
      </section>

      {/* week pills */}
      <div className="container-page pt-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: weekCount }, (_, i) => i + 1).map((wk) => (
            <Link
              key={wk}
              to={`/week/${wk}`}
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

      {/* Section A: user predictions */}
      <section id="user-predictions" className="container-page scroll-mt-24 pb-12 pt-8">
        <SectionHeader
          eyebrow="Pick 'em · your system"
          title="User Predictions"
          tone="brand"
          description="Tap a team on any unlocked card to lock your winner."
          right={
            <span className="chip bg-brand/10 text-brand-dark dark:text-brand-light">
              {picked}<span className="text-slate-400 dark:text-slate-500"> / {games.length} picked</span>
            </span>
          }
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game, idx) => (
            <GameCard
              key={game.id}
              game={game}
              pick={picks[game.id]}
              records={records}

              // ⭐ THIS LINE CALLS YOUR BACKEND
              onPick={(gameId, abbr) => setPick(gameId, abbr)}

              onClear={() => clearPick(game.id)}
              index={idx}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function WeekPrevNext({ n }) {
  return (
    <>
      <Link
        to={`/week/${n - 1}`}
        className={`btn-outline px-3.5 ${n <= 1 ? 'pointer-events-none opacity-40' : ''}`}
        aria-disabled={n <= 1}
      >
        ← Prev
      </Link>
      <Link
        to={`/week/${n + 1}`}
        className={`btn-primary px-3.5 ${n >= weekCount ? 'pointer-events-none opacity-40' : ''}`}
        aria-disabled={n >= weekCount}
      >
        Next →
      </Link>
    </>
  );
}
