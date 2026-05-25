import { FormEvent, useState } from 'react';

interface Props { onClose: () => void; }

const PRESETS = [
  { title: 'Security Alert',      message: 'Unauthorized login attempt detected from IP 192.168.1.45. Please verify your account immediately.', source: 'security'   },
  { title: 'Server CPU Critical', message: 'Production server CPU usage has exceeded 95% for the last 10 minutes. Auto-scaling triggered.',      source: 'monitoring' },
  { title: 'Payment Received',    message: 'You received a payment of $250.00 from John Doe. Transaction ID: TXN-8823.',                         source: 'payments'   },
  { title: 'Weekly Newsletter',   message: 'Check out our latest deals this week! Up to 50% off on selected items. Click here to browse.',       source: 'marketing'  },
  { title: 'Team Mention',        message: '@varaprasad mentioned you in #engineering: "Can you review the PR when you get a chance?"',          source: 'slack'      },
  { title: 'Deploy Success',      message: 'Release v2.4.1 successfully deployed to production. All health checks passing.',                     source: 'ci-cd'      },
];

export default function SendNotificationForm({ onClose }: Props) {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [source,  setSource]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setMessage(p.message);
    setSource(p.source);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), source: source.trim() || 'user' }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-enter w-full max-w-[440px] bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-[14px] font-semibold text-white tracking-tight">New notification</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">AI classifies on send</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Presets */}
        <div className="px-5 py-3 border-b border-zinc-800/60">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.title}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                  title === p.title
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
              Title <span className="text-zinc-700 normal-case not-italic">required</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Server CPU at 95%"
              maxLength={120}
              autoFocus
              className="w-full text-sm bg-zinc-800/40 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
              Message <span className="text-zinc-700 normal-case not-italic">required</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What happened?"
              rows={3}
              maxLength={500}
              className="w-full text-sm bg-zinc-800/40 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/15 transition-all resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="system, slack, ci-cd…"
              maxLength={50}
              className="w-full text-sm bg-zinc-800/40 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/15 transition-all"
            />
          </div>

          {error && (
            <div className="text-[12px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Classifying…
                </>
              ) : (
                'Send & Classify'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
