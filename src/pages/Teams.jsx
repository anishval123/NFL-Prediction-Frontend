import { Link } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import { teams } from '../utils/records.js';

export default function Teams() {
  const { records } = usePicks();
  const sorted = [...teams].sort((a, b) =>
    a.division.localeCompare(b.division) || a.name.localeCompare(b.name)
  );

  return (
    <div className="animate-fadeUp">
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
        <div className="container-page py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Roster</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
            All 32 Teams
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Full 2026 schedules and live records. Tap any team to make picks
            from their perspective.
          </p>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((team, idx) => {
            const rec = records[team.abbr] || { w: 0, l: 0, str: '0-0' };
            return (
              <Link
                key={team.abbr}
                to={`/team/${team.abbr}`}
                className="card group animate-pop p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105"
                    style={{
                      backgroundColor: `${team.colors.primary}18`,
                      boxShadow: `inset 0 0 0 2px ${team.colors.primary}30`,
                    }}
                  >
                    <TeamLogo team={team} size={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-navy-900 group-hover:text-brand-dark dark:text-slate-100 dark:group-hover:text-white">
                      {team.name}
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {team.conference} · {team.division}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-display text-2xl font-bold tabular-nums text-navy-800 dark:text-slate-100">{rec.str}</span>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {(rec.pct * 100).toFixed(0)}% win
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}