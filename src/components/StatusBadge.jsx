const STATUS_CONFIG = {
  not_contacted: { label: 'Not Contacted', color: '#6b7280', bg: '#6b728020' },
  contacted:     { label: 'Contacted',     color: '#60a5fa', bg: '#60a5fa20' },
  replied:       { label: 'Replied',       color: '#a78bfa', bg: '#a78bfa20' },
  interested:    { label: 'Interested',    color: '#34d399', bg: '#34d39920' },
  not_interested:{ label: 'Not Interested',color: '#ef4444', bg: '#ef444420' },
  client:        { label: 'Client ✓',      color: '#f97316', bg: '#f9731620' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_contacted;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
