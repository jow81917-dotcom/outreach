import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function FollowUpModal({ open, onClose, onSave, prospectId, prospects = [] }) {
  const [form, setForm] = useState({ prospect_id: prospectId || '', due_at: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setForm({
        prospect_id: prospectId || '',
        due_at: tomorrow.toISOString().slice(0, 16),
        note: '',
      });
      setError('');
    }
  }, [open, prospectId]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prospect_id) { setError('Select a prospect.'); return; }
    if (!form.due_at) { setError('Pick a due date.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, prospect_id: Number(form.prospect_id) });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Add Follow-up</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" id="close-followup-modal">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>{error}</p>
          )}

          {!prospectId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Prospect</label>
              <select
                id="followup-prospect"
                value={form.prospect_id}
                onChange={(e) => setForm((f) => ({ ...f, prospect_id: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">— Select prospect —</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.business_name ? `(${p.business_name})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" htmlFor="followup-due" style={{ color: 'var(--text-secondary)' }}>Due At</label>
            <input
              id="followup-due"
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" htmlFor="followup-note" style={{ color: 'var(--text-secondary)' }}>Note</label>
            <textarea
              id="followup-note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="What to follow up about…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
              style={{ background: '#1a1a1a', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} id="cancel-followup-btn"
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" id="save-followup-btn" disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {saving ? 'Saving…' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
