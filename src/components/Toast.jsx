import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} style={{ color: 'var(--status-offer)' }} />,
    error: <AlertCircle size={18} style={{ color: 'var(--status-rejected)' }} />,
    info: <Info size={18} style={{ color: 'var(--accent-primary)' }} />
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        borderColor: toast.type === 'error' ? 'var(--status-rejected)' : 'var(--accent-primary)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {icons[toast.type] || icons.info}
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '8px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
