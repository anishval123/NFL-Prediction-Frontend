import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePicks } from '../context/PicksContext.jsx';

const FAQ = [
  {
    q: 'Where does the 2026 schedule come from?',
    a: "The official NFL 2026 regular-season schedule, released by the league on May 14, 2026. Each week shows the real matchups, home/away designations, kickoff times (converted to ET), venues and networks as announced. Week 18 times start as TBD, exactly as the NFL released them.",
  },
  {
    q: 'Why are some games locked?',
    a: "Games that have already been played are final. Their winner and score come from the live NFL results feed, and the game is greyed out so it can't be predicted. A game is also locked the moment it kicks off and shows 'Awaiting result' until the feed confirms the final score, so records always reflect reality rather than a clock.",
  },
  {
    q: 'Do my predictions save, and are they private to me?',
    a: "Yes. Each browser gets its own id and the server stores that user's predictions separately, so your picks never mix with anybody else's and they survive refreshes, server restarts and redeploys. Your browser keeps a local copy as an offline mirror, but the server copy is the one that counts.",
  },
  {
    q: 'What is the difference between the standings and my Projected Record?',
    a: 'The Official NFL standings count finished games only: one win and one loss per final result, nothing at all for scheduled or in-progress games, and never a prediction — so that table is identical for every visitor. The Projected Record is yours alone: it shows those same official results plus your predictions for games that have not been decided yet, clearly labelled as temporary. A game drops out of the projection the moment it becomes final, and the real result takes over.',
  },
  {
    q: 'How do final results update my picks and the standings?',
    a: 'A background poller reads the NFL scoreboard and stores each finished game once, keyed by its game id. Your pick is never overwritten: the card keeps the team you chose and adds the actual final score with a Correct or Incorrect verdict. The same stored result updates the standings, so a finalized game always credits one win and one loss exactly once, no matter how many times you refresh.',
  },
  {
    q: 'Do my picks save?',
    a: 'Yes. Every pick is saved in your browser and survives refreshes and browser restarts. When the API server is running, picks are also synced to it automatically via a save endpoint.',
  },
  {
    q: 'Do the AI Insight projections change my picks or my standings?',
    a: 'No. Each week page shows two completely separate prediction systems. "User Predictions" is the one you play: tapping a team locks your winner and rebuilds your records, team pages and standings. "AI Insight" is the trained model\'s own second opinion, shown under its own heading and its own rules: the model only reads stats through the week before, never sees your picks, and its winners are never counted in your record or the standings.',
  },
  {
    q: 'Is this for gambling?',
    a: 'No. It is a fan tool for friendly season-long contests. It carries no odds, spreads, or real-money implications. It just knows the real schedule.',
  },
];

export default function About() {
  const { totalPicked, resetAll } = usePicks();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="animate-fadeUp">
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-navy-700 dark:from-navy-900 dark:to-navy-950">
        <div className="container-page py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">About</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-navy-900 sm:text-5xl dark:text-white">
            Methodology
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            The official 2026 schedule, how final results auto-lock, how the pick
            engine works, and the stack that powers it.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-6 py-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">The real 2026 schedule</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              This site loads the <strong>official NFL 2026 regular-season
              schedule</strong>, released May 14, 2026: real matchups, real
              home/away games, real kickoff times (normalized to ET), venues and
              networks, including the Week 1 Kickoff Game (New England at
              Seattle, Sep 9) and the season's nine international games.
            </p>
            <p>The schedule follows the league's 2026 division pairings:</p>
            <ul className="grid gap-1.5 rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-700 dark:bg-navy-800 dark:text-slate-200">
              <li>Intra: AFC East↔AFC West · AFC North↔AFC South</li>
              <li>Intra: NFC East↔NFC West · NFC North↔NFC South</li>
              <li>Inter: AFC East↔NFC North · AFC North↔NFC South</li>
              <li>Inter: AFC South↔NFC East · AFC West↔NFC West</li>
              <li>17th game: AFC East @ NFC West · AFC North @ NFC East</li>
              <li>17th game: AFC South @ NFC North · AFC West @ NFC South</li>
            </ul>
            <p>
              Each team plays 17 games with one bye, and the final week is all
              intra-division. Week 18 kickoff times show as &ldquo;TBD&rdquo;,
              exactly how the NFL releases them.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Your picks · the engine</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <ul className="list-inside list-disc space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Game cards highlight the picked team and lock the winner.</li>
              <li>When a game is final, your pick is kept and the real score plus a Correct / Incorrect verdict appear on the same card.</li>
              <li>Final results override any old picks and rebuild records live.</li>
              <li>Records surface on weekly pages, team pages, and standings views.</li>
              <li>Picks persist via localStorage and sync to the API when running.</li>
            </ul>
            <div>
              <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {['React 18', 'Tailwind CSS 3', 'React Router 6', 'Vite 5', 'FastAPI', 'Uvicorn', 'localStorage', 'JSON files', 'light/dark theme'].map((t) => (
                  <span key={t} className="chip bg-navy-800 text-white">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">AI Insight · a second system</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Every week page carries a second, deliberately independent prediction
              system under its own heading. It is the trained model&apos;s view of the
              same matchups, and it is scored under entirely different rules from
              your predictions. Its probabilities are always shown: they are
              precomputed for every game in the season and ship with the site, so
              the panel never has to fall back to an empty state.
            </p>
            <ul className="list-inside list-disc space-y-1.5">
              <li>A calibrated gradient-boosted classifier trained on trailing-only team stats.</li>
              <li>Served by a FastAPI service on port 8001 from a saved model artifact.</li>
              <li>Only ever sees stats through the week before, so nothing from the current week can leak in.</li>
              <li>Never reads your picks, and its winners are never added to your record or the standings.</li>
              <li>Once a game is final the model&apos;s own pick is graded against the real result (✓ / ✗) and is never replaced by it.</li>
              <li>If a live service is unreachable the bundled snapshot still shows, so the section is never blank.</li>
            </ul>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['scikit-learn', 'Platt calibration', 'FastAPI :8001', 'joblib artifacts'].map((t) => (
                <span key={t} className="chip bg-violet-500/10 text-violet-700 dark:text-violet-300">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy-900 dark:text-white">Data privacy & reset</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              All picks stay in your browser. When you run the API server, picks
              are synced to it for safekeeping automatically. You have
              <strong className="text-navy-800 dark:text-white">{totalPicked}</strong> picks stored right now.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm) {
                  resetAll();
                  setConfirm(false);
                } else {
                  setConfirm(true);
                  setTimeout(() => setConfirm(false), 4000);
                }
              }}
              className={confirm ? 'btn-primary' : 'btn-outline'}
            >
              {confirm ? 'Click again to confirm. Wipe all picks' : 'Reset all my picks'}
            </button>
          </div>
        </div>
      </section>

      <section className="container-page pb-12">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy-900">FAQ</h2>
        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-navy-800 dark:border-navy-700 dark:bg-navy-900">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy-900 group-open:text-brand-dark dark:text-slate-100 dark:group-open:text-brand-light">
                {f.q}
                <span className="text-slate-400 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/week/1" className="btn-primary">Start picking</Link>
          <Link to="/standings" className="btn-outline">Watch it move</Link>
        </div>
      </section>
    </div>
  );
}