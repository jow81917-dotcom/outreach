import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Send, MessageSquare, Sparkles, Trophy,
  Bell, AlertCircle, Plus, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboardStats, getActivities, getFollowUps, createProspect } from '../lib/db';
import { LoadingState, ErrorState } from '../components/States';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import ProspectModal from '../components/ProspectModal';
import { StatusBadge } from '../components/StatusBadge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTIVITY_ICONS = {
  message_sent: Send,
  reply_received: MessageSquare,
  call: Bell,
  meeting: Users,
  note: AlertCircle,
};

const ACTIVITY_COLORS = {
  message_sent: '#60a5fa',
  reply_received: '#a78bfa',
  call: '#34d399',
  meeting: '#f97316',
  note: '#9ca3af',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, a, f] = await Promise.all([
        getDashboardStats(),
        getActivities(null, 5),
        getFollowUps(),
      ]);
      setStats(s);
      setActivities(a);
      setFollowUps(f);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toDateString();
  const todayFollowUps = followUps.filter(
    (f) => !f.completed && new Date(f.due_at).toDateString() === today
  );
  const overdueFollowUps = followUps.filter(
    (f) => !f.completed && new Date(f.due_at) < new Date() && new Date(f.due_at).toDateString() !== today
  );

  // Build 7-day chart from chartData + fill missing days
  function buildChartData(raw = []) {
    const map = {};
    raw.forEach((r) => { map[r.day?.slice(0, 10)] = r.count; });
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: map[key] || 0,
      });
    }
    return days;
  }

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>;

  const chartData = buildChartData(stats?.chartData);

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        action={
          <button
            id="add-prospect-btn"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Plus size={15} />
            Add Prospect
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Prospects" value={stats?.total_prospects} icon={Users} />
        <StatCard label="Contacted"        value={stats?.contacted}       icon={Send} />
        <StatCard label="Replies"          value={stats?.replies}         icon={MessageSquare} />
        <StatCard label="Interested"       value={stats?.interested}      icon={Sparkles} />
        <StatCard label="Clients Won"      value={stats?.clients_won}     icon={Trophy} accent />
        <StatCard
          label="Follow-ups Due"
          value={(stats?.due_today || 0) + (stats?.overdue || 0)}
          icon={Bell}
          accent={stats?.overdue > 0}
          sub={stats?.overdue > 0 ? `${stats.overdue} overdue` : undefined}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* 7-day Chart */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              7-Day Outreach Activity
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={20}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#2a2a2a',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 12,
                }}
                cursor={false}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 6 ? 'var(--accent)' : '#3a3a3a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Follow-ups */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Today's Follow-ups
              </span>
            </div>
            {overdueFollowUps.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#ef444420', color: '#ef4444' }}>
                {overdueFollowUps.length} overdue
              </span>
            )}
          </div>

          {todayFollowUps.length === 0 && overdueFollowUps.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No follow-ups for today 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
              {[...overdueFollowUps.slice(0, 2), ...todayFollowUps].map((f) => {
                const isOverdue = new Date(f.due_at) < new Date() && new Date(f.due_at).toDateString() !== today;
                return (
                  <button
                    key={f.id}
                    onClick={() => navigate(`/prospects/${f.prospect_id}`)}
                    className="flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors hover:opacity-80"
                    style={{ background: '#1e1e1e' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: isOverdue ? '#ef4444' : 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {f.prospect_name}
                      </p>
                      {f.note && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{f.note}</p>
                      )}
                    </div>
                    <span className="text-xs shrink-0" style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                      {fmtDate(f.due_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Activity
          </span>
          <button
            onClick={() => navigate('/activity')}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            View all →
          </button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {activities.map((a) => {
              const Icon = ACTIVITY_ICONS[a.activity_type] || Send;
              const color = ACTIVITY_COLORS[a.activity_type] || '#9ca3af';
              return (
                <div key={a.id} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + '20' }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {a.prospect_name}
                      {a.business_name && <span style={{ color: 'var(--text-muted)' }}> · {a.business_name}</span>}
                    </p>
                    {a.content && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{a.content}</p>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{fmtTime(a.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProspectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          await createProspect(data);
          await load();
        }}
      />
    </div>
  );
}
