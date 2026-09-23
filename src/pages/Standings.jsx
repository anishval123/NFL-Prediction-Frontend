import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import TeamRecord from '../components/TeamRecord.jsx';
import FeedStatus from '../components/FeedStatus.jsx';
import teamsData from '../data/teams.json';

const TEAM_BY_ABBR = Object.fromEntries((teamsData || []).map((team) => [team.abbr, team]));

const MODES = [
  { key: 'division', label: 'Division' },
  { key: 'conference', label: 'Conference' },
  { key: 'wins', label: 'Wins' },
  { key: 'pct', label: 'Win %' },
  { key: 'az', label: 'A–Z' },
];

const DIVISION_ORDER = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
];

/** Where the table's numbers come from: real results, or your picks as well. */
const SOURCES = [
  { key: 'official', label: 'Official NFL standings' },
  { key: 'projected', label: 'Projected Record' },
];

function StandingRow({ row, rank, showDivision = false }) {
  const { team, rec } = row;
  return (
    <Link
      to={`/team/${team.abbr}`}
      className="group flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-0 hover:bg-slate-50 sm:px-4 dark:border-navy-800 dark:hover:bg-navy-800/60"
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 text-center font-display text-base font-bold text-slate-300 dark:text-slate-500">
          {rank}
        </span>
      )}
      <TeamLogo team={team} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand-dark dark:text-slate-100 dark:group-hover:text-white">
          {team.name}
        </span>
        {showDivision ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {team.division}
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {team.conference} · {team.division}
          </span>
        )}
      </span>
      <span className="hidden w-32 sm:block">
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${rec.pct * 100}%`, backgroundColor: team.colors.primary }}
          />
        </span>
      </span>
      <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
        {(rec.pct * 100).toFixed(0)}%
      </span>
      <TeamRecord record={rec} className="w-16 justify-center" />
    </Link>
  );
}

function StandingCard({ title, subtitle, rows, showDivision = false, tintClass = '' }) {
  return (
    <div className="card overflow-hidden">
      <header
        className={`flex items-center justify-between px-4 py-3 sm:px-5 ${tintClass}`}
      >
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-navy-900 dark:text-white">
          {title}
        </h3>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{subtitle}</span>
      </header>
      <div className="divide-y divide-slate-100 dark:divide-navy-800">{rows}</div>
    </div>
  );
}

export default function Standings() {
  const {
    actualRecords,
    projectedRecords,
    predictionRecord,
    aiRecord,
    finalizedCount,
    projectedAdjustments,
  } = usePicks();
  const [mode, setMode] = useState('division');
  // "Official NFL standings" counts finished games only and is identical for
  // everyone. "Projected Record" is this user's own view: those same official
  // results plus their predictions for games that have not been decided yet.
  const [source, setSource] = useState('official');

  const table = source === 'projected' ? projectedRecords : actualRecords;

  const rows = useMemo(
    () =>
      (teamsData || []).map((team) => ({
        team,
        rec: table[team.abbr] || { w: 0, l: 0, t: 0, pct: 0, str: '0-0' },
      })),
    [table]
  );

  const byWins = [...rows].sort((a, b) => b.rec.w - a.rec.w || b.rec.pct - a.rec.pct);
  const byPct = [...rows].sort((a, b) => b.rec.pct - a.rec.pct || b.rec.w - a.rec.w);
  const byAz = [...rows].sort((a, b) => a.team.name.localeCompare(b.team.name));

  return (
    <div className="animate-fadeUp">
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
        <div className="container-page py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">The table</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
            Standings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Built entirely from the live NFL results feed: {finalizedCount} games are final. Your
            predictions are{' '}
            <strong className="text-navy-800 dark:text-white">{predictionRecord.str}</strong>
            {predictionRecord.pending > 0 && ` with ${predictionRecord.pending} still to play`}
            {aiRecord ? ` · AI Insight is ${aiRecord.str}` : ''}.
          </p>

          <div className="mt-3">
            <FeedStatus />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {SOURCES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSource(s.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  source === s.key
                    ? 'bg-brand text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand-dark dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400 dark:hover:border-brand/50 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
            <span className="ml-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {source === 'projected'
                ? 'official results + your unresolved predictions'
                : 'final NFL games only · identical for every visitor'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === m.key
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand-dark dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400 dark:hover:border-brand/50 dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        {source === 'projected' ? (
          <div className="card mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 border-l-brand p-4">
            <span className="chip bg-brand/10 text-brand-dark dark:text-brand-light">
              Projected Record
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {projectedAdjustments.length > 0
                ? `Official results plus ${projectedAdjustments.length} unresolved prediction${
                  projectedAdjustments.length === 1 ? '' : 's'
                } of yours. Each one adds a temporary win and loss.`
                : 'Official results plus your predictions for games that have not been decided yet.'}
              {' '}When a game becomes final the real result replaces the projection, so this table
              can never change the official record.
            </p>
          </div>
        ) : (
          <div className="card mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 border-l-emerald-500 p-4">
            <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              Official
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The real NFL table: finished games only, one win and one loss per final, with scheduled
              and in-progress games counting for nothing. Your picks are never included, so every
              visitor sees the same standings.
            </p>
          </div>
        )}

        {mode === 'division' && (
          <div className="grid gap-5 xl:grid-cols-2">
            {DIVISION_ORDER.map((div) => {
              const list = rows
                .filter((r) => r.team.division === div)
                .sort((a, b) => b.rec.w - a.rec.w || b.rec.pct - a.rec.pct);
              const best = list[0];
              const conf = div.startsWith('AFC') ? 'AFC' : 'NFC';
              return (
                <div key={div} className="card overflow-hidden">
                  <header className="flex items-center justify-between bg-navy-800 px-4 py-2.5 sm:px-5">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
                      {div}
                    </h3>
                    {best && (
                      <span className="text-[11px] font-semibold text-slate-300">
                        Leader: {best.team.name}
                      </span>
                    )}
                  </header>
                  <div>
                    {list.map((row, i) => (
                      <StandingRow key={row.team.abbr} row={row} rank={i + 1} />
                    ))}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 text-center">
                    <Link to={`/teams?conf=${conf}`} className="text-xs font-semibold text-slate-500 hover:text-brand-dark">
                      View all {conf} teams →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'conference' && (
          <div className="grid gap-5 xl:grid-cols-2">
            {['AFC', 'NFC'].map((conf) => {
              const list = byWins.filter((r) => r.team.conference === conf);
              const tintClass = conf === 'AFC'
                ? 'bg-[#EAF0FA] dark:bg-navy-800'
                : 'bg-[#F6ECEC] dark:bg-navy-800';
              return (
                <StandingCard
                  key={conf}
                  title={conf}
                  subtitle="sorted by wins"
                  tintClass={tintClass}
                  rows={list.map((row, i) => <StandingRow key={row.team.abbr} row={row} rank={i + 1} />)}
                />
              );
            })}
          </div>
        )}

        {mode === 'wins' && (
          <div className="mx-auto max-w-3xl">
            <StandingCard
              title="All teams · by wins"
              subtitle={source === 'projected' ? 'includes your unresolved picks' : 'final games only'}
              rows={byWins.map((row, i) => <StandingRow key={row.team.abbr} row={row} rank={i + 1} />)}
            />
          </div>
        )}

        {mode === 'pct' && (
          <div className="mx-auto max-w-3xl">
            <StandingCard
              title="All teams · by win %"
              subtitle={source === 'projected' ? 'includes your unresolved picks' : 'final games only'}
              rows={byPct.map((row, i) => <StandingRow key={row.team.abbr} row={row} rank={i + 1} />)}
            />
          </div>
        )}

        {mode === 'az' && (
          <div className="mx-auto max-w-3xl">
            <StandingCard
              title="All teams · A–Z"
              subtitle="alphabetical"
              rows={byAz.map((row) => <StandingRow key={row.team.abbr} row={row} />)}
            />
          </div>
        )}
      </section>
    </div>
  );
}