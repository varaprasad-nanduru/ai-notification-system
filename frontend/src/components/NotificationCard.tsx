import { formatDistanceToNow } from 'date-fns';
import { Notification, Priority } from '../types';

const PRIORITY: Record<Priority, {
  strip: string; text: string; bg: string; label: string;
}> = {
  high:   { strip: 'bg-rose-500',  text: 'text-rose-400',  bg: 'bg-rose-500/10',  label: 'HIGH' },
  medium: { strip: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', label: 'MED'  },
  low:    { strip: 'bg-teal-400',  text: 'text-teal-400',  bg: 'bg-teal-400/10',  label: 'LOW'  },
};

const CATEGORY_CODE: Record<string, string> = {
  security: 'SEC', system: 'SYS', social: 'SOC',
  commerce: 'PAY', alert:  'ALT', info:   'INF', warning: 'WRN',
};

const urgencyGradient = (score: number) =>
  score >= 70 ? 'from-rose-500 to-orange-400'
  : score >= 35 ? 'from-amber-400 to-yellow-300'
  : 'from-teal-400 to-emerald-300';

interface Props {
  notification:  Notification;
  onMarkRead:    (id: string) => void;
  onMarkUnread:  (id: string) => void;
  onDelete:      (id: string) => void;
}

export default function NotificationCard({ notification: n, onMarkRead, onMarkUnread, onDelete }: Props) {
  const p    = PRIORITY[n.priority];
  const time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });

  return (
    <article
      className={`card-enter group relative flex rounded-lg overflow-hidden border transition-all duration-200 ${
        !n.is_read
          ? 'border-zinc-700/70 bg-zinc-900 hover:border-zinc-600/80'
          : 'border-zinc-800/40 bg-zinc-900/40 opacity-55 hover:opacity-75'
      }`}
    >
      {/* Priority strip */}
      <div className={`w-[3px] shrink-0 ${p.strip}`} />

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 py-3.5">

        {/* Row 1: badges + meta */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-px rounded ${p.text} ${p.bg}`}>
            {p.label}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800/60 px-1.5 py-px rounded">
            {CATEGORY_CODE[n.category] ?? 'INF'}
          </span>
          {n.is_spam && (
            <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-px rounded">
              SPAM
            </span>
          )}
          {!n.is_read && (
            <span className={`w-1.5 h-1.5 rounded-full ${p.strip} shrink-0 ${n.priority === 'high' ? 'animate-pulse' : ''}`} />
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-600 hidden sm:block">{n.source}</span>
            <span className="text-[11px] text-zinc-500 whitespace-nowrap">{time}</span>
          </div>
        </div>

        {/* Row 2: title */}
        <h3 className={`text-[14px] font-medium leading-snug mb-1 ${!n.is_read ? 'text-zinc-100' : 'text-zinc-400'}`}>
          {n.title}
        </h3>

        {/* Row 3: message */}
        <p className="text-[13px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">
          {n.message}
        </p>

        {/* Row 4: urgency + AI reason + actions */}
        <div className="flex items-center gap-3">
          {/* Urgency bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 h-[3px] bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${urgencyGradient(n.urgency_score)} transition-all duration-700`}
                style={{ width: `${n.urgency_score}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{n.urgency_score}</span>
          </div>

          {/* AI reason */}
          {n.ai_reason && (
            <p className="text-[11px] text-zinc-600 italic truncate flex-1 min-w-0 hidden sm:block">
              {n.ai_reason}
            </p>
          )}

          {/* Actions — appear on hover */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => n.is_read ? onMarkUnread(n.id) : onMarkRead(n.id)}
              className="text-[11px] text-zinc-500 hover:text-zinc-200 px-2 py-1 hover:bg-zinc-800 rounded transition-colors"
            >
              {n.is_read ? 'unread' : 'read'}
            </button>
            <button
              onClick={() => onDelete(n.id)}
              className="text-[11px] text-zinc-600 hover:text-rose-400 px-2 py-1 hover:bg-zinc-800 rounded transition-colors"
            >
              del
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
