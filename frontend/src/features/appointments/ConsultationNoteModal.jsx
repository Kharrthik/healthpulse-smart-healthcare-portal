import React, { useState } from 'react';

export const ConsultationNoteModal = ({ appointment, onClose, onSave, notify }) => {
  const [notes, setNotes] = useState(appointment?.consultationNotes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      notify('Please enter consultation notes before completing.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(appointment.id, 'COMPLETED', notes.trim());
      notify('Consultation completed and notes recorded successfully!', 'success');
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to complete consultation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Consultation</h2>
            <p className="modal-subtitle">
              Patient: <strong>{appointment.patientName}</strong> ({appointment.patientEmail})
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Chief Complaint / Reason for Visit</label>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', color: '#475569' }}>
              {appointment.reason}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="consultationNotes">
              Doctor Consultation Notes & Clinical Impressions *
            </label>
            <textarea
              id="consultationNotes"
              className="form-textarea"
              rows={5}
              placeholder="Record clinical observations, vital sign findings, diagnosis, lifestyle recommendations, or follow-up plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Notes...' : '✓ Complete Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

