/** Renders a team logo from /public/logos with a graceful fallback badge. */
export default function TeamLogo({ team, size = 40, className = '' }) {
  if (!team) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200"
        style={{ width: size, height: size }}
      />
    );
  }
  const style = { width: size, height: size };
  return (
    <img
      src={team.logo}
      alt={`${team.name} logo`}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`shrink-0 object-contain drop-shadow-sm ${className}`}
      style={style}
      onError={(e) => {
        // Fallback: colored monogram badge if the sprite is unavailable
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}