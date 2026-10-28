import { useState, useEffect, useCallback } from 'react';
import {
  Send, MessageSquare, Bell, Users, FileText, Activity as ActivityIcon,
} from 'lucide-react';
import { getActivities } from '../lib/db';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_CONFIG = {
  message_sent:   { label: 'Message Sent',   icon: Send,          color: '#60a5fa' },
  reply_received: { label: 'Reply Received',  icon: MessageSquare, color: '#a78bfa' },
  call:           { label: 'Call',             icon: Bell,          color: '#34d399' },
  meeting:        { label: 'Meeting',          icon: Users,         color: '#f97316' },
  note:           { label: 'Note',             icon: FileText,      color: '#9ca3af' },
};

function fmtDT(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();

  if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (isYesterday) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function groupByDate(activities) {
  const groups = {};
  activities.forEach((a) => {
    const key = new Date(a.created_at).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return groups;
}

function fmtGroupHeader(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === new Date(now - 86400000).toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getActivities(null, 100);
      setActivities(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = groupByDate(activities);
  const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Activity"
        subtitle="Your full outreach timeline"
      />

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : activities.length === 0 ? (
        <EmptyState
          message="No activity logged yet. Start by adding a prospect and logging activities."
          icon={ActivityIcon}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {sortedKeys.map((dateKey) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {fmtGroupHeader(dateKey)}
                </p>
                <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
              </div>

              <div className="relative ml-3">
                {/* Timeline line */}
                <div
                  className="absolute left-3 top-0 bottom-0 w-px"
                  style={{ background: 'var(--border)' }}
                />

                <div className="flex flex-col gap-1">
                  {groups[dateKey].map((a) => {
                    const cfg = ACTIVITY_CONFIG[a.activity_type] || ACTIVITY_CONFIG.note;
                    const Icon = cfg.icon;
                    return (
                      <div key={a.id} className="flex items-start gap-4 pl-4 relative pb-4">
                        {/* Dot */}
                        <div
                          className="absolute left-0 w-7 h-7 rounded-full flex items-center justify-center shrink-0 -translate-x-1/2 border-2"
                          style={{
                            background: 'var(--bg-card)',
                            borderColor: cfg.color,
                          }}
                        >
                          <Icon size={12} style={{ color: cfg.color }} />
                        </div>

                        <div
                          className="flex-1 ml-4 rounded-xl border p-3"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <button
                                onClick={() => navigate(`/prospects/${a.prospect_id}`)}
                                className="ml-2 text-xs hover:underline"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {a.prospect_name}
                                {a.business_name ? ` · ${a.business_name}` : ''}
                              </button>
                            </div>
                            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {a.content && (
                            <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
