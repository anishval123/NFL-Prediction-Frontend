import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';

const WEEK_COUNT = 18;

const NAV_LINKS = [
  { to: '/teams', label: 'Teams' },
  { to: '/standings', label: 'Standings' },
  { to: '/ai-insight', label: 'AI Insight' },
  { to: '/about', label: 'About' },
];

function WeekDropdown({ open, onNavigate }) {
  return (
    <div
      className={`absolute left-0 top-full z-50 mt-2 w-[340px] origin-top-left rounded-2xl border border-white/10 bg-navy-800 p-4 shadow-2xl transition-all duration-200 ${
        open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Your Predictions
        </span>
        <Link
          to="/week/1"
          onClick={onNavigate}
          className="text-xs font-semibold text-brand-light transition hover:text-white"
        >
          Start Week 1 →
        </Link>
      </div>
      <div className="grid max-h-[300px] grid-cols-3 gap-1.5 overflow-y-auto pr-1">
        {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((wk) => (
          <Link
            key={wk}
            to={`/week/${wk}`}
            onClick={onNavigate}
            className="flex items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-2 text-sm font-semibold text-slate-200 transition hover:bg-brand hover:text-white"
          >
            Wk {wk}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Weeks 1–18 · 272 games · one pick per game
      </p>
    </div>
  );
}

export default function Navbar() {
  const { totalPicked, decidedCount, dark, toggleTheme, liveLoaded, liveUpdatedAt } = usePicks();
  const location = useLocation();
  const [weekOpen, setWeekOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onWeekPath = /^\/week\//.test(location.pathname);
  const closeAll = () => {
    setWeekOpen(false);
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `relative rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-white/10 text-white after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-900/95 backdrop-blur-lg">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* brand */}
          <Link to="/" onClick={closeAll} className="group flex shrink-0 items-center gap-2.5">
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-lg font-bold uppercase tracking-[0.14em] text-white">
                2026 NFL <span className="text-brand-light">Pick 'Em</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Predict every game
              </span>
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <div className="relative" onMouseLeave={() => setWeekOpen(false)}>
              <button
                type="button"
                onClick={() => setWeekOpen((v) => !v)}
                onMouseEnter={() => setWeekOpen(true)}
                aria-expanded={weekOpen}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                  onWeekPath
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                  Your Predictions
                <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${weekOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {onWeekPath && <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
              <WeekDropdown open={weekOpen} onNavigate={closeAll} />
            </div>
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* right: live indicator + theme toggle + progress pill */}
          <div className="hidden items-center gap-3 md:flex">
            {liveLoaded && (
              <span
                title={liveUpdatedAt ? `Live results · updated ${liveUpdatedAt}` : 'Live results connected'}
                className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                live
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-gold hover:bg-white/10 hover:text-gold"
            >
              {dark ? (
                // light bulb when currently dark (button switches to light)
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2a7 7 0 00-4 12v3h8v-3a7 7 0 00-4-12z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                // crescent moon when currently light (button switches to dark)
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <Link to="/week/1" className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-brand/60 hover:bg-white/10">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold tabular-nums text-white">
                  {decidedCount}<span className="text-slate-400">/272</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400">decided</span>
              </div>
              <span className="h-6 w-20 overflow-hidden rounded-full bg-navy-950">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-brand-light to-brand transition-all duration-500"
                  style={{ width: `${Math.min(100, (decidedCount / 272) * 100)}%` }}
                />
              </span>
            </Link>
          </div>

          {/* mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-200 transition hover:bg-white/10"
            >
              {dark ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2a7 7 0 00-4 12v3h8v-3a7 7 0 00-4-12z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* mobile panel */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-navy-900 transition-all duration-200 md:hidden ${
          mobileOpen ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container-page max-h-[540px] space-y-1 overflow-y-auto py-4">
          <Link to="/" onClick={closeAll} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
            Home
          </Link>
          <span className="block px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Your Predictions
          </span>
          {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((wk) => (
            <Link
              key={wk}
              to={`/week/${wk}`}
              onClick={closeAll}
              className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                onWeekPath && location.pathname === `/week/${wk}`
                  ? 'bg-brand text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Week {wk}
            </Link>
          ))}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeAll}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
