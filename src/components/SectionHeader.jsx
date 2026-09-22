/**
 * Framed section header. Used to keep the two prediction systems on the week
 * pages visually and semantically apart:
 *
 *   tone="brand"   -> the human pick 'em engine in front of you
 *   tone="machine" -> the ML model's matchup projections
 *
 * `right` renders a slot on the right of the title row (chips, counts, links).
 */
const TONES = {
  brand: {
    eyebrow: 'text-brand',
    bar: 'from-brand-light to-brand',
  },
  machine: {
    eyebrow: 'text-violet-600 dark:text-violet-400',
    bar: 'from-violet-400 to-indigo-500',
  },
};

export default function SectionHeader({ eyebrow, title, description, tone = 'brand', right = null }) {
  const t = TONES[tone] || TONES.brand;

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-slate-200 pb-3 dark:border-navy-700">
      <div className="min-w-0">
        {eyebrow && (
          <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${t.eyebrow}`}>{eyebrow}</p>
        )}
        <h2 className="mt-1 flex items-center gap-2.5 text-2xl font-black uppercase tracking-tight text-navy-900 sm:text-3xl dark:text-white">
          <span
            aria-hidden="true"
            className={`h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${t.bar}`}
          />
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}