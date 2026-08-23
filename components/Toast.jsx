'use client';
import { useState } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  const colors = {
    info:    { bg: 'rgba(108,99,255,0.15)', border: 'rgba(108,99,255,0.3)', icon: 'ℹ️' },
    success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  icon: '✅' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '❌' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      padding: '14px 20px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-md)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeInUp 0.3s ease',
      maxWidth: 360,
    }}>
      <span style={{ fontSize: 18 }}>{c.icon}</span>
      <p style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{message}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}
