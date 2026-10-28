import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Calendar, AlarmClock, Clock3, Bell } from 'lucide-react';
import {
  getFollowUps, completeFollowUp, rescheduleFollowUp, deleteFollowUp,
  getProspects, createFollowUp,
} from '../lib/db';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import PageHeader from '../components/PageHeader';
import FollowUpModal from '../components/FollowUpModal';

function fmtDT(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function FollowUpCard({ f, onComplete, onDelete, onReschedule }) {
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const navigate = useNavigate();

  const isOverdue = !f.completed && new Date(f.due_at) < new Date();

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', borderColor: isOverdue ? '#ef444440' : 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/prospects/${f.prospect_id}`)}
            className="text-sm font-semibold text-left hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {f.prospect_name}
          </button>
          {f.business_name && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.business_name}</p>
          )}
          {f.note && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{f.note}</p>
          )}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: isOverdue ? '#ef444420' : '#f9731620',
            color: isOverdue ? '#ef4444' : 'var(--accent)',
          }}
        >
          {fmtDT(f.due_at)}
        </span>
      </div>

      {/* Reschedule inline */}
      {rescheduling && (
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1 text-xs outline-none border"
            style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={async () => {
              if (!newDate) return;
              await onReschedule(f.id, newDate);
              setRescheduling(false);
            }}
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Set
          </button>
          <button
            onClick={() => setRescheduling(false)}
            className="px-2 py-1 rounded text-xs border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {!f.completed && (
          <button
            id={`complete-fu-${f.id}`}
            onClick={() => onComplete(f.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: '#22c55e20', color: '#22c55e' }}
          >
            <Check size={11} /> Mark Done
          </button>
        )}
        {!f.completed && (
          <button
            id={`reschedule-fu-${f.id}`}
            onClick={() => setRescheduling(!rescheduling)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: '#60a5fa20', color: '#60a5fa' }}
          >
            <Calendar size={11} /> Reschedule
          </button>
        )}
        <button
          id={`delete-fu-${f.id}`}
          onClick={() => onDelete(f.id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80 ml-auto"
          style={{ color: '#ef4444' }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, color, items, onComplete, onDelete, onReschedule, emptyMsg }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: color + '20', color }}
        >
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>{emptyMsg}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((f) => (
            <FollowUpCard
              key={f.id}
              f={f}
              onComplete={onComplete}
              onDelete={onDelete}
              onReschedule={onReschedule}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fus, ps] = await Promise.all([getFollowUps(), getProspects()]);
      setFollowUps(fus);
      setProspects(ps);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id) => {
    await completeFollowUp(id);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this follow-up?')) return;
    await deleteFollowUp(id);
    await load();
  };

  const handleReschedule = async (id, newDueAt) => {
    await rescheduleFollowUp(id, newDueAt);
    await load();
  };

  const today = new Date().toDateString();
  const now = new Date();

  const overdue = followUps.filter((f) => !f.completed && new Date(f.due_at) < now && new Date(f.due_at).toDateString() !== today);
  const todayItems = followUps.filter((f) => !f.completed && new Date(f.due_at).toDateString() === today);
  const upcoming = followUps.filter((f) => !f.completed && new Date(f.due_at) > now && new Date(f.due_at).toDateString() !== today);

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Follow-ups"
        subtitle="Stay on top of your outreach"
        action={
          <button
            id="add-followup-page-btn"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Plus size={15} /> Add Follow-up
          </button>
        }
      />

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          {overdue.length === 0 && todayItems.length === 0 && upcoming.length === 0 ? (
            <EmptyState
              message="No pending follow-ups. You're all caught up!"
              icon={Bell}
              action={
                <button onClick={() => setModalOpen(true)} className="text-sm px-4 py-2 rounded-xl font-medium" style={{ background: 'var(--accent)', color: 'white' }}>
                  Add First Follow-up
                </button>
              }
            />
          ) : (
            <>
              <Section
                title="Overdue"
                icon={AlarmClock}
                color="#ef4444"
                items={overdue}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onReschedule={handleReschedule}
                emptyMsg="No overdue follow-ups 🎉"
              />
              <Section
                title="Today"
                icon={Clock3}
                color="var(--accent)"
                items={todayItems}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onReschedule={handleReschedule}
                emptyMsg="Nothing due today"
              />
              <Section
                title="Upcoming"
                icon={Calendar}
                color="#60a5fa"
                items={upcoming}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onReschedule={handleReschedule}
                emptyMsg="No upcoming follow-ups"
              />
            </>
          )}
        </>
      )}

      <FollowUpModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prospects={prospects}
        onSave={async (data) => { await createFollowUp(data); await load(); }}
      />
    </div>
  );
}
