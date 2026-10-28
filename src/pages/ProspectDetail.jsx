import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Save, X, Plus, Trash2,
  Calendar, Link, Mail, User, Building2, Tag,
  Send, MessageSquare, Bell, Users, FileText,
} from 'lucide-react';
import {
  getProspectById, updateProspect, deleteProspect,
  getActivities, createActivity, deleteActivity,
  getFollowUps, createFollowUp, completeFollowUp, deleteFollowUp,
} from '../lib/db';
import { LoadingState, ErrorState } from '../components/States';
import { StatusBadge, STATUS_CONFIG } from '../components/StatusBadge';
import FollowUpModal from '../components/FollowUpModal';

const STATUSES = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

const ACTIVITY_TYPES = [
  { value: 'message_sent',    label: 'Message Sent',    icon: Send },
  { value: 'reply_received',  label: 'Reply Received',  icon: MessageSquare },
  { value: 'call',            label: 'Call',             icon: Bell },
  { value: 'meeting',         label: 'Meeting',          icon: Users },
  { value: 'note',            label: 'Note',             icon: FileText },
];

const ACTIVITY_COLORS = {
  message_sent:   '#60a5fa',
  reply_received: '#a78bfa',
  call:           '#34d399',
  meeting:        '#f97316',
  note:           '#9ca3af',
};

const CONTACT_METHODS = ['Instagram DM', 'Email', 'LinkedIn', 'Twitter/X DM', 'YouTube Comment', 'Other'];

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDT(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProspectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prospect, setProspect] = useState(null);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [addActivityType, setAddActivityType] = useState('message_sent');
  const [addActivityContent, setAddActivityContent] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);
  const [fuModalOpen, setFuModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, a, f] = await Promise.all([
        getProspectById(id),
        getActivities(id),
        getFollowUps(id),
      ]);
      if (!p) { setError('Prospect not found.'); return; }
      setProspect(p);
      setActivities(a);
      setFollowUps(f);
      setForm({
        name: p.name || '',
        business_name: p.business_name || '',
        niche: p.niche || '',
        contact_method: p.contact_method || '',
        contact_handle: p.contact_handle || '',
        profile_url: p.profile_url || '',
        status: p.status || 'not_contacted',
        notes: p.notes || '',
        first_contacted_at: p.first_contacted_at ? p.first_contacted_at.slice(0, 10) : '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError('Name is required.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateProspect(id, { ...form, first_contacted_at: form.first_contacted_at || null });
      setProspect(updated);
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this prospect and all their data?')) return;
    try {
      await deleteProspect(id);
      navigate('/prospects');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setAddingActivity(true);
    try {
      await createActivity({ prospect_id: Number(id), activity_type: addActivityType, content: addActivityContent });
      setAddActivityContent('');
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingActivity(false);
    }
  };

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} /></div>;
  if (!prospect) return null;

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const inp = (field, placeholder, type = 'text') => editing ? (
    <input
      type={type}
      value={form[field]}
      onChange={set(field)}
      placeholder={placeholder}
      className="rounded-lg px-2 py-1 text-sm outline-none border w-full"
      style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    />
  ) : (
    <span style={{ color: 'var(--text-primary)' }}>{prospect[field] || '—'}</span>
  );

  const today = new Date().toDateString();
  const overdueFollowUps = followUps.filter((f) => !f.completed && new Date(f.due_at) < new Date());
  const upcomingFollowUps = followUps.filter((f) => !f.completed && new Date(f.due_at) >= new Date());
  const completedFollowUps = followUps.filter((f) => f.completed);

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate('/prospects')}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
          id="back-to-prospects"
        >
          <ArrowLeft size={15} />
          Prospects
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                id="cancel-edit-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                id="save-edit-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                <Save size={13} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                id="edit-prospect-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={handleDelete}
                id="delete-prospect-detail-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
                style={{ borderColor: '#ef444440', color: '#ef4444' }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <p className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>{saveError}</p>
      )}

      {/* Main Info Card */}
      <div className="rounded-xl border p-5 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {editing ? (
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Prospect name"
                className="text-xl font-bold rounded-lg px-2 py-1 outline-none border w-full"
                style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{prospect.name}</h1>
            )}
          </div>
          {editing ? (
            <select
              value={form.status}
              onChange={set('status')}
              className="rounded-lg px-2 py-1 text-sm outline-none border"
              style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          ) : (
            <StatusBadge status={prospect.status} />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={Building2} label="Business">
            {inp('business_name', 'Business name')}
          </InfoRow>
          <InfoRow icon={Tag} label="Niche">
            {inp('niche', 'Niche')}
          </InfoRow>
          <InfoRow icon={Send} label="Contact Method">
            {editing ? (
              <select
                value={form.contact_method}
                onChange={set('contact_method')}
                className="rounded-lg px-2 py-1 text-sm outline-none border w-full"
                style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">— None —</option>
                {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <span style={{ color: 'var(--text-primary)' }}>{prospect.contact_method || '—'}</span>
            )}
          </InfoRow>
          <InfoRow icon={Mail} label="Handle / Email">
            {inp('contact_handle', '@username or email')}
          </InfoRow>
          <InfoRow icon={Link} label="Profile URL" className="sm:col-span-2">
            {editing ? (
              <input
                type="url"
                value={form.profile_url}
                onChange={set('profile_url')}
                placeholder="https://…"
                className="rounded-lg px-2 py-1 text-sm outline-none border w-full"
                style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            ) : prospect.profile_url ? (
              <a
                href={prospect.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline truncate"
                style={{ color: 'var(--accent)' }}
              >
                {prospect.profile_url}
              </a>
            ) : <span style={{ color: 'var(--text-primary)' }}>—</span>}
          </InfoRow>
          <InfoRow icon={Calendar} label="First Contacted">
            {editing ? (
              <input
                type="date"
                value={form.first_contacted_at}
                onChange={set('first_contacted_at')}
                className="rounded-lg px-2 py-1 text-sm outline-none border"
                style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            ) : (
              <span style={{ color: 'var(--text-primary)' }}>{fmt(prospect.first_contacted_at)}</span>
            )}
          </InfoRow>
          <InfoRow icon={Calendar} label="Date Added">
            <span style={{ color: 'var(--text-primary)' }}>{fmt(prospect.date_added)}</span>
          </InfoRow>
        </div>

        {/* Notes */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>NOTES</p>
          {editing ? (
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Notes about this prospect…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
              style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: prospect.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {prospect.notes || 'No notes yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="rounded-xl border p-5 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Follow-ups</h2>
          <button
            onClick={() => setFuModalOpen(true)}
            id="add-followup-detail-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#f9731620', color: 'var(--accent)' }}
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {followUps.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No follow-ups yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...overdueFollowUps, ...upcomingFollowUps, ...completedFollowUps].map((f) => {
              const isOverdue = !f.completed && new Date(f.due_at) < new Date();
              return (
                <div
                  key={f.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: '#1e1e1e', opacity: f.completed ? 0.5 : 1 }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{
                      background: f.completed ? '#22c55e'
                        : isOverdue ? '#ef4444'
                        : 'var(--accent)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: isOverdue ? '#ef4444' : f.completed ? '#22c55e' : 'var(--accent)' }}>
                      {f.completed ? `Completed ${fmtDT(f.completed_at)}` : fmtDT(f.due_at)}
                    </p>
                    {f.note && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{f.note}</p>}
                  </div>
                  {!f.completed && (
                    <button
                      id={`complete-followup-${f.id}`}
                      onClick={async () => { await completeFollowUp(f.id); load(); }}
                      className="text-xs px-2 py-1 rounded font-medium transition-opacity hover:opacity-70"
                      style={{ background: '#22c55e20', color: '#22c55e' }}
                    >
                      Done
                    </button>
                  )}
                  <button
                    id={`delete-followup-${f.id}`}
                    onClick={async () => { await deleteFollowUp(f.id); load(); }}
                    className="p-1 transition-opacity hover:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Activity History</h2>

        {/* Add Activity */}
        <form onSubmit={handleAddActivity} className="flex gap-2 mb-4">
          <select
            id="activity-type-select"
            value={addActivityType}
            onChange={(e) => setAddActivityType(e.target.value)}
            className="rounded-lg px-2 py-1.5 text-xs outline-none border"
            style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            id="activity-content-input"
            type="text"
            value={addActivityContent}
            onChange={(e) => setAddActivityContent(e.target.value)}
            placeholder="Optional note…"
            className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none border"
            style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            id="add-activity-btn"
            disabled={addingActivity}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Plus size={12} />
          </button>
        </form>

        {activities.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No activities logged yet.</p>
        ) : (
          <div className="flex flex-col">
            {activities.map((a) => {
              const t = ACTIVITY_TYPES.find((x) => x.value === a.activity_type);
              const Icon = t?.icon || Send;
              const color = ACTIVITY_COLORS[a.activity_type] || '#9ca3af';
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 py-2.5 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: color + '20' }}
                  >
                    <Icon size={12} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t?.label || a.activity_type}
                    </p>
                    {a.content && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDT(a.created_at)}</span>
                    <button
                      id={`delete-activity-${a.id}`}
                      onClick={async () => { await deleteActivity(a.id); load(); }}
                      className="p-1 transition-opacity hover:opacity-70"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FollowUpModal
        open={fuModalOpen}
        onClose={() => setFuModalOpen(false)}
        prospectId={Number(id)}
        onSave={async (data) => { await createFollowUp(data); await load(); }}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  );
}
