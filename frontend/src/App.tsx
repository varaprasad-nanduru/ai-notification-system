import { useCallback, useState } from 'react';
import NotificationCard from './components/NotificationCard';
import SendNotificationForm from './components/SendNotificationForm';
import { useWebSocket } from './hooks/useWebSocket';
import { FilterOption } from './types';

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all',    label: 'All'    },
  { value: 'unread', label: 'Unread' },
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
];

export default function App() {
  const { notifications, isConnected, markRead, markUnread } = useWebSocket();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState<FilterOption>('all');
  const [hideSpam, setHideSpam] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`http://localhost:8000/api/notifications/${id}`, { method: 'DELETE' });
  }, []);

  const filtered = notifications.filter(n => {
    if (hideSpam && n.is_spam) return false;
    switch (filter) {
      case 'unread': return !n.is_read;
      case 'high':   return n.priority === 'high';
      case 'medium': return n.priority === 'medium';
      case 'low':    return n.priority === 'low';
      default:       return true;
    }
  });

  const stats = {
    total:  notifications.length,
    high:   notifications.filter(n => n.priority === 'high').length,
    unread: notifications.filter(n => !n.is_read).length,
    spam:   notifications.filter(n => n.is_spam).length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/70 bg-zinc-950/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-[52px] flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect x="1"    y="9" width="3"   height="8"  rx="1" fill="#38bdf8" opacity="0.4"/>
              <rect x="5.5"  y="5" width="3"   height="12" rx="1" fill="#38bdf8" opacity="0.65"/>
              <rect x="10"   y="1" width="3"   height="16" rx="1" fill="#38bdf8"/>
              <rect x="14.5" y="4" width="2.5" height="10" rx="1" fill="#38bdf8" opacity="0.3"/>
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              NotifyAI
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded leading-none select-none">
              STREAM
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 dot-live block shrink-0" />
                  <span className="text-[12px] text-zinc-500 hidden sm:block">live</span>
                </>
              ) : (
                <>
                  <span className="w-[7px] h-[7px] rounded-full bg-red-400 animate-pulse block shrink-0" />
                  <span className="text-[12px] text-red-400 hidden sm:block">reconnecting</span>
                </>
              )}
            </div>

            {stats.unread > 0 && (
              <span className="text-[11px] font-mono bg-sky-400/10 text-sky-400 border border-sky-400/20 px-2 py-0.5 rounded-full tabular-nums leading-5">
                {stats.unread} new
              </span>
            )}

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-[13px] font-medium bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black px-3 py-1.5 rounded-md transition-colors"
            >
              <span className="text-base font-light leading-none">+</span>
              <span>New</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-3xl mx-auto px-5 py-2.5 flex items-center gap-6">
          {([
            { label: 'total',  value: stats.total,  color: 'text-zinc-300'  },
            { label: 'high',   value: stats.high,   color: 'text-rose-400'  },
            { label: 'unread', value: stats.unread, color: 'text-sky-400'   },
            { label: 'spam',   value: stats.spam,   color: 'text-amber-400' },
          ] as const).map(s => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className={`font-mono text-[17px] font-semibold tabular-nums leading-none ${s.color}`}>
                {s.value}
              </span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-5 py-5">

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-0.5">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`text-[13px] px-3 py-1.5 rounded-md transition-all font-medium ${
                  filter === value
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/70'
                }`}
              >
                {label}
                {value === 'unread' && stats.unread > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] text-zinc-500">{stats.unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Spam toggle */}
          <button
            onClick={() => setHideSpam(v => !v)}
            className="flex items-center gap-2 group"
            aria-pressed={hideSpam}
          >
            <div
              className={`relative w-8 h-[18px] rounded-full transition-colors ${
                hideSpam ? 'bg-sky-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-[3px] w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                  hideSpam ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </div>
            <span className="text-[12px] text-zinc-600 group-hover:text-zinc-400 transition-colors select-none">
              Hide spam
            </span>
          </button>
        </div>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 2.5A4.5 4.5 0 0 0 3.5 7v.75L2.9 9.13a.625.625 0 0 0 .55.995h9.1a.625.625 0 0 0 .55-.995L12.5 7.75V7A4.5 4.5 0 0 0 8 2.5Z" fill="#3f3f46"/>
                <path d="M6.5 11.25a1.5 1.5 0 0 0 3 0" fill="#3f3f46"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">
                {notifications.length === 0 ? 'No notifications' : 'Nothing matches'}
              </p>
              <p className="text-xs text-zinc-700 mt-0.5">
                {notifications.length === 0
                  ? 'Press "+ New" to fire one and watch AI classify it in real time.'
                  : 'Try a different filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={markRead}
                onMarkUnread={markUnread}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && <SendNotificationForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
