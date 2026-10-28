import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight, Trash2, Users } from 'lucide-react';
import { getProspects, createProspect, deleteProspect } from '../lib/db';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import ProspectModal from '../components/ProspectModal';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'client', label: 'Client' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProspects({ search, status: statusFilter });
      setProspects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this prospect? This will also delete their activities and follow-ups.')) return;
    setDeleting(id);
    try {
      await deleteProspect(id);
      setProspects((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Prospects"
        subtitle={`${prospects.length} total`}
        action={
          <button
            id="add-prospect-list-btn"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Plus size={15} />
            Add Prospect
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            id="prospect-search"
            type="text"
            placeholder="Search name, business, niche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`filter-${opt.value}`}
              onClick={() => setStatusFilter(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === opt.value ? 'var(--accent)' : 'var(--bg-card)',
                color: statusFilter === opt.value ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === opt.value ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : prospects.length === 0 ? (
        <EmptyState
          message={search || statusFilter !== 'all' ? 'No prospects match your filters.' : 'No prospects yet. Add your first one!'}
          icon={Users}
          action={
            statusFilter === 'all' && !search ? (
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm px-4 py-2 rounded-xl font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Add First Prospect
              </button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  {['Name / Business', 'Niche', 'Contact', 'Status', 'Next Follow-up', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/prospects/${p.id}`)}
                    className="cursor-pointer border-b last:border-0 transition-colors hover:opacity-80"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      {p.business_name && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.business_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {p.niche || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.contact_method || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.pending_followups > 0 ? (
                        <span style={{ color: 'var(--accent)' }}>{p.pending_followups} pending</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          id={`delete-prospect-${p.id}`}
                          onClick={(e) => handleDelete(e, p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-30"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {prospects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/prospects/${p.id}`)}
                className="w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-opacity hover:opacity-80"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.business_name && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{p.business_name}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.niche && <span>{p.niche}</span>}
                    {p.contact_method && <span>· {p.contact_method}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    disabled={deleting === p.id}
                    className="p-1 disabled:opacity-30"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

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
