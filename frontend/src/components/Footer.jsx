import React from 'react';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid var(--border-subtle)',
      padding: '32px 0 24px',
      marginTop: '60px'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
          HealthPulse Smart Healthcare Portal • Powered by Java 21 Spring Boot & Groq AI
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto 12px' }}>
          <strong>Telemedicine Disclaimer:</strong> This portal facilitates appointment scheduling, clinical note organization, and preliminary AI triage support. It does not replace emergency medical response. If you are experiencing acute chest pain, severe breathlessness, or trauma, please dial your local emergency services (112 / 911) immediately.
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
          Strict Regex Validation Active • Encrypted Authentication • © 2026 HealthPulse Systems
        </p>
      </div>
    </footer>
  );
};

