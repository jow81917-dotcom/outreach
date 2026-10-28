export default function StatCard({ label, value, icon: Icon, accent = false, sub }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 border"
      style={{
        background: 'var(--bg-card)',
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: accent ? 'var(--accent)' : '#2e2e2e' }}
          >
            <Icon size={13} color={accent ? 'white' : 'var(--text-secondary)'} />
          </div>
        )}
      </div>
      <div>
        <span
          className="text-2xl font-bold"
          style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {value ?? '—'}
        </span>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
