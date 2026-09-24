import TeamLogo from './TeamLogo.jsx';
import TeamRecord from './TeamRecord.jsx';
import { usePicks } from '../context/PicksContext.jsx';
import {
  teamByAbbr,
  gameState,
  getFinal,
  getLiveResult,
  isTie,
  predictionOutcome,
} from '../utils/records.js';
import snapshot from '../data/projections2026.json';

/**
 * A game card renders from bundled team metadata plus the one results feed that
 * PicksContext polls. Nothing here fetches per card: the previous version issued
 * three API calls per card every 30 seconds, and hid the whole card whenever
 * /teams could not be reached.
 */
const AI_PICKS = (() => {
  const map = {};
  Object.values(snapshot.weeks || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      if (row && row.game_id && row.predicted_winner) map[row.game_id] = row.predicted_winner;
    });
  });
  return map;
})();

function formatDate(date) {
  if (!date) return 'TBD';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
}

/** How a graded prediction reads, in the site's existing chip styling. */
const OUTCOMES = {
  correct: { label: '✓ Correct', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  incorrect: { label: '✗ Incorrect', className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  tie: { label: '= Tie (no pick wins)', className: 'bg-slate-200 text-slate-600 dark:bg-navy-700 dark:text-slate-300' },
};

/** A tick or a cross, and nothing at all when nothing was predicted. */
function VerdictChip({ outcome }) {
  if (outcome !== 'correct' && outcome !== 'incorrect' && outcome !== 'tie') return null;
  const style = OUTCOMES[outcome];
  return <span className={`chip ${style.className}`}>{style.label}</span>;
}

/** #rrggbb -> rgba() at the given alpha */
function withAlpha(hex, alpha) {
  if (!hex || !/^#([0-9a-fA-F]{6})$/.test(hex)) return `rgba(15, 23, 42, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TeamRow({ side, team, record, selected, won, disabled, score, onSelect }) {
  const primary = team.colors.primary;
  const rowClass = disabled
    ? 'opacity-90 cursor-not-allowed'
    : 'cursor-pointer transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 dark:hover:border-navy-600 dark:hover:bg-navy-800 active:scale-[0.995]';
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
        selected ? 'shadow-sm' : 'border-transparent'
      } ${rowClass}`}
      style={{
        borderColor: selected ? primary : undefined,
        backgroundColor: selected ? withAlpha(primary, 0.08) : undefined,
      }}
    >
      <TeamLogo team={team} size={46} />

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {side === 'home' ? 'Home' : 'Away'}
        </span>
        <span
          className="block truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100"
          style={selected ? { color: primary } : undefined}
        >
          {team.name}
          <span className="ml-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">{team.abbr}</span>
          {score != null && <span className="ml-2 font-display text-sm font-black tabular-nums">{score}</span>}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <TeamRecord record={record} />
        {won && (
          <span
            className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            title="This team won the game"
          >
            Won
          </span>
        )}
        {selected && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: primary }}
            title="Your prediction"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M4 10.5 8 14l8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </span>
    </button>
  );
}

export default function GameCard({ game, pick, records, onPick, onClear, index = 0 }) {
  const { evaluated, feedConnected } = usePicks();

  // Bundled team metadata, so a card can always render even if the API is down.
  const homeTeam = teamByAbbr[game.home_abbr];
  const awayTeam = teamByAbbr[game.away_abbr];
  if (!homeTeam || !awayTeam) return null;

  const final = getFinal(game.id);
  const liveRow = getLiveResult(game.id);
  const state = gameState(game);
  const locked = state !== 'open';

  const userPick = pick || null;
  const actualWinner = final && !isTie(final) ? final.winner : null;
  // Verdicts come from the backend evaluation when reachable, and are computed
  // from the same stored finals locally when it is not.
  const grade = evaluated[game.id] || null;
  const userOutcome = grade
    ? grade.predictionResult
    : (userPick ? predictionOutcome(game.id, userPick) : null);
  const aiPick = (grade && grade.aiPrediction) || AI_PICKS[game.id] || null;
  const aiOutcome = (grade && grade.aiResult)
    || (aiPick ? predictionOutcome(game.id, aiPick) : null);
  const scoreRow = final || liveRow;
  const showScores = Boolean(scoreRow && (scoreRow.home_score != null || scoreRow.away_score != null));

  let scoreLine = null;
  if (showScores && scoreRow.home_score != null && scoreRow.away_score != null) {
    const hs = scoreRow.home_score;
    const aws = scoreRow.away_score;
    const homeFirst = hs >= aws;
    scoreLine = [
      homeFirst ? `${game.home_abbr} ${hs}` : `${game.away_abbr} ${aws}`,
      homeFirst ? `${game.away_abbr} ${aws}` : `${game.home_abbr} ${hs}`,
    ].join(' - ');
  }

  return (
    <article
      className="card animate-pop overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      {/* meta bar */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2 dark:border-navy-800 dark:bg-navy-800/60">
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="chip bg-navy-700 text-white">Wk {game.week}</span>
          <span className="truncate">
            {game.day} · {formatDate(game.date)} · {game.time_et}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {game.primetime && state === 'open' && <span className="chip bg-brand/10 text-brand">★ Primetime</span>}
          {state === 'live' && (
            <span className="chip bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                </span>
                LIVE
              </span>
            </span>
          )}
          {state === 'result' && (
            <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" title="Final result is in">
              ✓ FINAL
            </span>
          )}
          {state === 'pending' && (
            <span
              className="chip bg-amber-500/15 text-amber-700 dark:text-amber-400"
              title={feedConnected
                ? 'Kickoff has passed but the NFL result is not in yet'
                : 'The results feed is offline, so this game cannot be resolved yet'}
            >
              {feedConnected ? '● Awaiting result' : '● Awaiting result · feed offline'}
            </span>
          )}
          {!locked && pick && (
            <button
              type="button"
              onClick={onClear}
              title="Clear this pick"
              className="chip cursor-pointer border border-slate-200 bg-white text-slate-500 transition hover:border-brand hover:text-brand dark:border-navy-700 dark:bg-navy-800 dark:text-slate-400"
            >
              Clear ✕
            </button>
          )}
        </div>
      </header>

      {/* teams */}
      <div className="space-y-1.5 p-2.5">
        <TeamRow
          side="away"
          team={awayTeam}
          record={records[game.away_abbr]}
          selected={userPick === game.away_abbr}
          won={actualWinner === game.away_abbr}
          disabled={locked}
          score={showScores ? scoreRow.away_score : null}
          onSelect={() => onPick(game.id, game.away_abbr)}
        />

        <div className="flex items-center gap-2 px-2">
          <span className="h-px flex-1 bg-slate-200 dark:bg-navy-700" />
          {locked ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ended</span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-500">vs</span>
          )}
          <span className="h-px flex-1 bg-slate-200 dark:bg-navy-700" />
        </div>

        <TeamRow
          side="home"
          team={homeTeam}
          record={records[game.home_abbr]}
          selected={userPick === game.home_abbr}
          won={actualWinner === game.home_abbr}
          disabled={locked}
          score={showScores ? scoreRow.home_score : null}
          onSelect={() => onPick(game.id, game.home_abbr)}
        />
      </div>

      {(userPick || scoreLine || state === 'result') && (
        <div className="space-y-0.5 border-t border-slate-100 px-3 py-2 text-[11px] dark:border-navy-800">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-slate-500 dark:text-slate-400">
              Your Prediction:{' '}
              <span className="font-bold text-navy-800 dark:text-slate-100">
                {userPick || 'No prediction'}
              </span>
            </span>
            <VerdictChip outcome={userOutcome} />
            {userPick && !userOutcome && state === 'live' && (
              <span className="chip bg-slate-200 text-slate-600 dark:bg-navy-700 dark:text-slate-300">
                live · not final
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-slate-500 dark:text-slate-400">
              AI Prediction:{' '}
              <span className="font-bold text-navy-800 dark:text-slate-100">
                {aiPick || 'No prediction'}
              </span>
            </span>
            <VerdictChip outcome={aiOutcome} />
          </div>

          {scoreLine && (
            <div className="text-slate-500 dark:text-slate-400">
              {state === 'result' ? 'Final: ' : 'Live: '}
              <span className="font-bold tabular-nums text-navy-800 dark:text-slate-100">{scoreLine}</span>
            </div>
          )}
        </div>
      )}

      <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-1.5 text-[10px] font-medium text-slate-400 dark:border-navy-800 dark:bg-navy-800/40 dark:text-slate-500">
        <span className="truncate">📍 {game.venue}</span>
        {state === 'result' ? (
          <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
            {actualWinner ? `${actualWinner} wins` : 'Tie game'}
          </span>
        ) : state === 'live' ? (
          <span className="shrink-0 font-semibold text-rose-600 dark:text-rose-400">in progress</span>
        ) : state === 'pending' ? (
          <span className="shrink-0">locked after kickoff</span>
        ) : (
          <span className="shrink-0 tabular-nums">{game.id}</span>
        )}
      </footer>
    </article>
  );
}