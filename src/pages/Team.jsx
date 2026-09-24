import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePicks } from '../context/PicksContext.jsx';
import GameCard from '../components/GameCard.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import teamsData from '../data/teams.json';
import { API_URL } from '../utils/apiBase.js';

const API_BASE = API_URL;
const TEAM_BY_ABBR = Object.fromEntries((teamsData || []).map((team) => [team.abbr, team]));

export default function Team() {
  const { abbr } = useParams();
  const code = abbr ? abbr.toUpperCase() : '';
  const team = TEAM_BY_ABBR[code];
  const { picks, records, setPick, clearPick } = usePicks();
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await fetch(`${API_BASE}/schedule`);
        if (!res.ok) return;
        const data = await res.json();
        setSchedule(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[team] schedule load error', err);
      }
    }
    loadSchedule();
  }, []);

  if (!team) return <Navigate to="/teams" replace />;

  const games = schedule
    .filter((g) => g.home_abbr === code || g.away_abbr === code)
    .sort((a, b) => Number(a.week) - Number(b.week));
  const rec = records[code] || { w: 0, l: 0, str: '0-0', pct: 0 };
  const pickedGames = games.filter((g) => picks[g.id]).length;
  const { primary, secondary } = team.colors;

  return (
    <div className="animate-fadeUp">
      {/* header band */}
      <section
        className="relative overflow-hidden py-10 text-white sm:py-14"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary} 45%, ${secondary} 130%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff, transparent 55%)' }}
        />
        <div className="container-page relative flex flex-wrap items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/95 p-2 shadow-2xl sm:h-28 sm:w-28">
            <TeamLogo team={team} size={88} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-black/20 text-white">{team.conference}</span>
              <span className="chip bg-black/20 text-white">{team.division}</span>
              <span className="chip bg-black/20 text-white">📍 {team.stadium}</span>
            </div>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">{team.name}</h1>
            <p className="mt-1 text-sm font-medium text-white/70">{team.city} · {team.mascot}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="font-display text-5xl font-black tabular-nums sm:text-6xl">{rec.str}</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Your record</p>
            </div>
            <div className="text-center">
              <span className="font-display text-5xl font-black tabular-nums sm:text-6xl">{pickedGames}/17</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Games picked</p>
            </div>
          </div>
        </div>
      </section>
      {/* body */}
      <section className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">
                {team.name} 2026 schedule
              </h2>
              <Link to="/standings" className="text-sm font-semibold text-brand-dark hover:underline dark:text-brand-light">
                View standings →
              </Link>
            </div>

            {pickedGames === 0 && (
              <p className="card mb-5 border-l-4 border-l-brand p-4 text-sm text-slate-600 dark:text-slate-300">
                No games picked yet. Set {team.name}'s win-loss line by choosing winners below. Played games are already locked.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {games.map((game, idx) => (
                <GameCard
                  key={game.id}
                  game={game}
                  pick={picks[game.id]}
                  records={records}
                  onPick={(gameId, winner) => setPick(gameId, winner)}
                  onClear={() => clearPick(game.id)}
                  index={idx}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Team colors</h3>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl border border-slate-200" style={{ backgroundColor: primary }} />
                <span className="h-10 w-10 rounded-xl border border-slate-200" style={{ backgroundColor: secondary }} />
                <div className="text-xs">
                  <p className="font-semibold text-slate-700">{primary}</p>
                  <p className="text-slate-400">{secondary}</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">2026 slate</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Home games</dt>
                  <dd className="font-bold tabular-nums text-navy-800 dark:text-slate-100">
                    {games.filter((g) => g.home_abbr === code).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Away games</dt>
                  <dd className="font-bold tabular-nums text-navy-800 dark:text-slate-100">
                    {games.filter((g) => g.away_abbr === code).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Division games</dt>
                  <dd className="font-bold tabular-nums text-navy-800 dark:text-slate-100">6</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Weeks</dt>
                  <dd className="font-bold tabular-nums text-navy-800 dark:text-slate-100">
                    {Math.min(...games.map((g) => g.week))}–{Math.max(...games.map((g) => g.week))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Win rate</h3>
              <div className="mt-3">
                <div className="flex items-end gap-2">
                  <span className="font-display text-5xl font-black text-navy-900 dark:text-white">
                    {rec.pct > 0 ? (rec.pct * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${rec.pct * 100}%`, backgroundColor: primary }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}