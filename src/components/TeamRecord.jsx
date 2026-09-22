/** Compact W-L(-T) record chip used in game cards, team pages and standings. */
export default function TeamRecord({ record, className = '', showPct = false }) {
  if (!record) {
    return <span className={`text-xs font-medium text-slate-400 dark:text-slate-500 ${className}`}>n/a</span>;
  }
  const { w, l, t = 0, pct } = record;
  // Ties are only shown when a team actually has one, so the usual chip stays "W-L".
  const line = t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
  return (
    <span
      title={`${line} · ${(pct * 100).toFixed(1)}%`}
      className={`inline-flex items-baseline gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300 ${className}`}
    >
      <span className="tabular-nums">{line}</span>
      {showPct && (
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
          {(pct * 100).toFixed(1)}%
        </span>
      )}
    </span>
  );
}