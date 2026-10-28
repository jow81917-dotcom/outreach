import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
        {message || 'Something went wrong.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {Icon && <Icon size={32} style={{ color: 'var(--text-muted)' }} />}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {action}
    </div>
  );
}
