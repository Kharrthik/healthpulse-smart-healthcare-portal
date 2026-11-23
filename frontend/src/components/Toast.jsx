import React, { useEffect } from 'react';

export const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'var(--status-routine)',
    error: 'var(--status-emergency)',
    warning: 'var(--status-urgent)',
    info: 'var(--primary)'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: bgColors[type] || bgColors.info,
      color: '#ffffff',
      padding: '12px 20px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.9rem',
      fontWeight: '600',
      maxWidth: '420px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '1.1rem',
          lineHeight: '1',
          marginLeft: 'auto'
        }}
      >
        ×
      </button>
    </div>
  );
};

