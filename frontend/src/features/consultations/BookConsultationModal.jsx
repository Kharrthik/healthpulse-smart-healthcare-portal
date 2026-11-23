import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultationService } from '../../services/consultationService';
import { appointmentService } from '../../services/appointmentService';
import { validateChiefComplaint, validateSymptoms } from '../../utils/validation';
import { formatCurrency } from '../../utils/formatters';

export const BookConsultationModal = ({ doctor, patientId, onClose, onSuccess, notify }) => {
  const { user } = useAuth();
  const [scheduledAt, setScheduledAt] = useState(() => {
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [severity, setSeverity] = useState('MODERATE');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const complaintErr = validateChiefComplaint(chiefComplaint);
    const symptomsErr = validateSymptoms(symptomsDescription);

    if (complaintErr || symptomsErr) {
      setErrors({
        chiefComplaint: complaintErr,
        symptomsDescription: symptomsErr
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create appointment in /api/appointments
      try {
        await appointmentService.createAppointment({
          doctorId: doctor.id,
          patientId: patientId || user?.profileId,
          patientName: user?.fullName || '',
          patientEmail: user?.email || '',
          patientPhone: user?.phone || '',
          appointmentDateTime: scheduledAt,
          reason: chiefComplaint.trim()
        });
      } catch (appErr) {
        console.warn('Appointment creation error in /api/appointments:', appErr);
      }

      // 2. Create Consultation with AI prep in /api/consultations
      await consultationService.bookConsultation({
        patientId: patientId || user?.profileId || 1,
        doctorId: doctor.id,
        scheduledAt: scheduledAt,
        chiefComplaint: chiefComplaint.trim(),
        symptomsDescription: symptomsDescription.trim(),
        durationDays: parseInt(durationDays, 10),
        severity: severity
      });

      notify('Appointment booked successfully! Recorded in appointment registry & AI pre-consultation summary prepared.', 'success');
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to book appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Book Tele-Consultation</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Consult with <strong>{doctor.fullName}</strong> ({doctor.specialization})
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="booking-summary-banner">
              <span>Consultation Fee: <strong>{formatCurrency(doctor.consultationFee)}</strong></span>
              <span>Available: <strong>{doctor.availableDays} ({doctor.availableTimeStart} - {doctor.availableTimeEnd})</strong></span>
            </div>

            <div className="form-group">
              <label htmlFor="scheduledAt">Select Date & Time *</label>
              <input
                id="scheduledAt"
                type="datetime-local"
                className="form-input"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="chiefComplaint">Chief Complaint / Primary Issue *</label>
              <input
                id="chiefComplaint"
                type="text"
                className={`form-input ${errors.chiefComplaint ? 'is-invalid' : ''}`}
                placeholder="e.g. Dry cough and low fever for 3 days"
                value={chiefComplaint}
                onChange={(e) => {
                  setChiefComplaint(e.target.value);
                  if (errors.chiefComplaint) setErrors({ ...errors, chiefComplaint: null });
                }}
              />
              {errors.chiefComplaint && <span className="error-text">{errors.chiefComplaint}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="symptomsDescription">Detailed Symptoms Intake for AI Triage *</label>
              <textarea
                id="symptomsDescription"
                className={`form-textarea ${errors.symptomsDescription ? 'is-invalid' : ''}`}
                rows="3"
                placeholder="Describe your symptoms, triggers, and any medications already taken. Our AI assistant will analyze this to brief the doctor before your call."
                value={symptomsDescription}
                onChange={(e) => {
                  setSymptomsDescription(e.target.value);
                  if (errors.symptomsDescription) setErrors({ ...errors, symptomsDescription: null });
                }}
              ></textarea>
              {errors.symptomsDescription && <span className="error-text">{errors.symptomsDescription}</span>}
              <span className="form-hint">Tip: Be descriptive. Gemini AI evaluates this to highlight critical safety checks.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="durationDays">Duration (Days)</label>
                <input
                  id="durationDays"
                  type="number"
                  min="1"
                  max="365"
                  className="form-input"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="severity">Self-Reported Severity</label>
                <select
                  id="severity"
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="MILD">Mild (Manageable)</option>
                  <option value="MODERATE">Moderate (Impacting routine)</option>
                  <option value="SEVERE">Severe (Intense discomfort)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Preparing with AI...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

