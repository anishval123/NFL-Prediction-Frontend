import { usePicks } from '../context/PicksContext.jsx';
import { API_URL } from '../utils/apiBase.js';

/**
 * Where the results are coming from, in one line.
 *
 * The feed going quiet used to look identical to "no games have been played",
 * so this says plainly whether the backend is reachable, how many finals it has
 * given us, and what to do when it is not answering.
 */
export default function FeedStatus({ className = '' }) {
  const { feedConnected, feedFinals, liveUpdatedAt, liveProvider, finalizedCount } = usePicks();
  // How many finals this page can actually show: the count the API reported when
  // it was reachable, otherwise what the local feed already has.
  const finals = typeof feedFinals === 'number' && feedFinals > 0
    ? feedFinals
    : (finalizedCount || 0);
  const backendLabel = API_URL.replace(/\/$/, '');
  const isLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(API_URL);

  if (feedConnected) {
    return (
      <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ${className}`}>
        <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          results feed connected
        </span>
        <span>
          {finals} final{finals === 1 ? '' : 's'}
          {liveProvider ? ` · source ${liveProvider}` : ''}
          {liveUpdatedAt ? ` · updated ${new Date(liveUpdatedAt).toLocaleTimeString()}` : ''}
        </span>
      </span>
    );
  }

  return (
    <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ${className}`}>
      <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-400">
        results feed offline
      </span>
      <span>
        {backendLabel} is not responding, so this page is showing the {finals} final
        {finals === 1 ? '' : 's'} it already has. Retrying automatically.
        {isLocalBackend ? ' Start the local backend (start.bat) to load live scores.' : ''}
      </span>
    </span>
  );
}