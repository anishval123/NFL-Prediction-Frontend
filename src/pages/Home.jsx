import { Link } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import teamsData from '../data/teams.json';

const TEAM_BY_ABBR = Object.fromEntries((teamsData || []).map((team) => [team.abbr, team]));
const WEEK_COUNT = 18;

const STATS = [
  { value: '272', label: 'Games', desc: 'every 2027 matchup' },
  { value: '18', label: 'Weeks', desc: 'full regular season' },
  { value: '32', label: 'Teams', desc: 'AFC + NFC' },
  { value: '1', label: 'Crown', desc: 'supreme picker' },
];

export default function Home() {
  const { totalPicked, records, decidedCount, resetAll, projectedRecords } = usePicks();
  const leaderboard = Object.entries(projectedRecords || records || {})
    .map(([abbr, rec]) => ({
      abbr,
      str: rec?.str || '0-0',
      pct: rec?.pct || 0,
      name: TEAM_BY_ABBR[abbr]?.name || abbr,
      division: TEAM_BY_ABBR[abbr]?.division || 'NFL',
    }))
    .sort((a, b) => (b.pct || 0) - (a.pct || 0) || (b.str || '0-0').localeCompare(a.str || '0-0'))
    .slice(0, 5);
  const pct = Math.round((decidedCount / 272) * 100);

  return (
    <div className="animate-fadeUp">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-navy-500/20 blur-3xl" />

        <div className="container-page relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="chip bg-brand/15 text-brand-light">2026 season · Official NFL schedule</span>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
              Predict every game.
              <br />
              Own the <span className="text-brand-light">season.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Tap a team, lock in your winner, and watch standings rebuild
              instantly. All 18 weeks, all 272 games, all 32 teams.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/week/1" className="btn-primary">
                Make Week 1 picks
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12m0 0-5-5m5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/standings" className="btn-ghost-light">Your standings</Link>
              {totalPicked > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all picks? This will clear your selections and revert team records to current standings.')) {
                      resetAll();
                    }
                  }}
                  className="btn-outline"
                >
                  Reset all picks
                </button>
              )}
              {totalPicked > 0 && (
                <span className="chip border border-white/15 bg-white/5 text-slate-200">
                  {totalPicked} picks · {pct}% decided
                </span>
              )}
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <dd className="font-display text-3xl font-bold text-white">{s.value}</dd>
                <dt className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</dt>
                <p className="text-[11px] text-slate-500">{s.desc}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>
      {/* snapshot cards */}
      <section className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Season snapshot</h2>
              <span className="fire-dot" />
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-5xl font-black text-navy-900 dark:text-white">{decidedCount}</span>
              <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">/ 272 decided</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <Link to="/week/1" className="btn-primary flex-1 justify-center">Continue</Link>
              <Link to="/week/9" className="btn-outline flex-1 justify-center">Mid-season</Link>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Projected leaders</h2>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">from your picks + finals</span>
            </div>
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-navy-800">
              {leaderboard.map((row, i) => (
                <li key={row.abbr}>
                  <Link
                    to={`/team/${row.abbr}`}
                    className="group flex items-center gap-4 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 dark:hover:bg-navy-800/60"
                  >
                    <span className="w-5 text-center font-display text-lg font-bold text-slate-300 dark:text-slate-500">{i + 1}</span>
                    <TeamLogo team={TEAM_BY_ABBR[row.abbr]} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand-dark dark:text-slate-100 dark:group-hover:text-white">
                        {row.name}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {row.division}
                      </span>
                    </span>
                    <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{row.str}</span>
                  </Link>
                </li>
              ))}
              {leaderboard.length === 0 && (
                <li className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                  Pick some games and your projected winners will show up here.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
      {/* week strip */}
      <section className="container-page pb-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Jump to a week</h2>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{WEEK_COUNT} weeks · 272 games</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((wk) => (
            <Link
              key={wk}
              to={`/week/${wk}`}
              className="group rounded-xl border border-slate-200 bg-white p-3 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lift dark:border-navy-700 dark:bg-navy-900"
            >
              <span className="block font-display text-lg font-bold text-navy-800 group-hover:text-brand-dark dark:text-slate-100 dark:group-hover:text-white">
                {wk}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {wk === 1 ? 'Kickoff' : wk === 13 ? 'Thanksgiving' : wk === 18 ? 'Finale' : 'Week'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="container-page py-10">
        <h2 className="text-center text-2xl font-bold uppercase tracking-wide text-navy-900 sm:text-3xl dark:text-white">
          How it works
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-3">
          {[
            { n: '01', title: 'Make your picks', body: 'Every game card lets you tap home or away. Your choice is instantly locked with a team-colored highlight.' },
            { n: '02', title: 'Records rebuild live', body: 'Wins and losses are recomputed from your picks plus real final scores the moment anything changes, and they appear on weekly pages, team pages, and standings.' },
            { n: '03', title: 'Played games lock', body: 'Once a game kicks off it can no longer be predicted. Final winners are loaded in and count toward the standings automatically.' },
          ].map((s) => (
            <div key={s.n} className="card group p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="font-display text-4xl font-black text-slate-200 transition group-hover:text-brand/30 dark:text-slate-500">
                {s.n}
              </span>
              <h3 className="mt-2 text-lg font-bold text-navy-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}