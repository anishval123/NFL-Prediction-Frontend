import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-navy-950 text-slate-300">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏈</span>
              <span className="font-display text-xl font-bold uppercase tracking-wider text-white">
                2026 NFL Pick 'Em
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              Predict all 272 games of the real, released 2026 NFL season. Picks are
              stored locally in your browser and synced to the API when it is
              running.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Navigate
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="transition hover:text-white">Home</Link></li>
              <li><Link to="/week/1" className="transition hover:text-white">Weekly Schedule</Link></li>
              <li><Link to="/teams" className="transition hover:text-white">All 32 Teams</Link></li>
              <li><Link to="/standings" className="transition hover:text-white">Standings</Link></li>
              <li><Link to="/about" className="transition hover:text-white">About / Methodology</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Disclaimer
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              This site uses the official NFL 2026 schedule, released by the
              league in May 2026. Times, venues and networks are as announced
              (Week 18 times start as TBD by league design). NFL and team
              names/logos are trademarks of their owners.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>© 2026 NFL Pick 'Em · For fun, not betting</span>
          <span>React · Tailwind CSS · FastAPI</span>
        </div>
      </div>
    </footer>
  );
}