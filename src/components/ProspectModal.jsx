import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted',     label: 'Contacted' },
  { value: 'replied',       label: 'Replied' },
  { value: 'interested',    label: 'Interested' },
  { value: 'not_interested',label: 'Not Interested' },
  { value: 'client',        label: 'Client' },
];

const CONTACT_METHODS = [
  'Instagram DM', 'Email', 'LinkedIn', 'Twitter/X DM', 'YouTube Comment', 'Other',
];

const INITIAL = {
  name: '',
  business_name: '',
  niche: '',
  contact_method: '',
  contact_handle: '',
  profile_url: '',
  status: 'not_contacted',
  notes: '',
  first_contacted_at: '',
};

export default function ProspectModal({ open, onClose, onSave, prospect = null }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prospect) {
      setForm({
        name: prospect.name || '',
        business_name: prospect.business_name || '',
        niche: prospect.niche || '',
        contact_method: prospect.contact_method || '',
        contact_handle: prospect.contact_handle || '',
        profile_url: prospect.profile_url || '',
        status: prospect.status || 'not_contacted',
        notes: prospect.notes || '',
        first_contacted_at: prospect.first_contacted_at
          ? prospect.first_contacted_at.slice(0, 10)
          : '',
      });
    } else {
      setForm(INITIAL);
    }
    setError('');
  }, [prospect, open]);

  if (!open) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        first_contacted_at: form.first_contacted_at || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {prospect ? 'Edit Prospect' : 'Add Prospect'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:opacity-70" id="close-modal-btn">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 flex flex-col gap-4">
            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Name *" id="prospect-name">
                <input id="prospect-name" value={form.name} onChange={set('name')} placeholder="John Doe" {...inputProps} />
              </Field>
              <Field label="Business" id="prospect-business">
                <input id="prospect-business" value={form.business_name} onChange={set('business_name')} placeholder="Acme Media" {...inputProps} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Niche" id="prospect-niche">
                <input id="prospect-niche" value={form.niche} onChange={set('niche')} placeholder="Fitness, Real Estate…" {...inputProps} />
              </Field>
              <Field label="Status" id="prospect-status">
                <select id="prospect-status" value={form.status} onChange={set('status')} {...selectProps}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Method" id="prospect-method">
                <select id="prospect-method" value={form.contact_method} onChange={set('contact_method')} {...selectProps}>
                  <option value="">— Select —</option>
                  {CONTACT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Handle / Email" id="prospect-handle">
                <input id="prospect-handle" value={form.contact_handle} onChange={set('contact_handle')} placeholder="@username or email" {...inputProps} />
              </Field>
            </div>

            <Field label="Profile URL" id="prospect-url">
              <input id="prospect-url" value={form.profile_url} onChange={set('profile_url')} placeholder="https://…" {...inputProps} />
            </Field>

            <Field label="First Contacted" id="prospect-contacted">
              <input id="prospect-contacted" type="date" value={form.first_contacted_at} onChange={set('first_contacted_at')} {...inputProps} />
            </Field>

            <Field label="Notes" id="prospect-notes">
              <textarea
                id="prospect-notes"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="Any notes about this prospect…"
                className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none border"
                style={{
                  background: '#1a1a1a',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t flex gap-3 justify-end shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              id="cancel-prospect-btn"
              className="px-4 py-2 rounded-lg text-sm border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-prospect-btn"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {saving ? 'Saving…' : prospect ? 'Update' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputProps = {
  className: 'w-full rounded-lg px-3 py-2 text-sm outline-none border',
  style: {
    background: '#1a1a1a',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  },
};

const selectProps = {
  className: 'w-full rounded-lg px-3 py-2 text-sm outline-none border',
  style: {
    background: '#1a1a1a',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  },
};
