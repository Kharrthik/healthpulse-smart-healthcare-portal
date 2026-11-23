import React from 'react';
import { formatDateTime } from '../../utils/formatters';

export const AppointmentCard = ({
  appointment,
  isDoctor,
  onConfirm,
  onOpenCompleteModal,
  onCancel,
  processingId
}) => {
  const isPending = appointment.status === 'PENDING';
  const isConfirmed = appointment.status === 'CONFIRMED';
  const isCompleted = appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'CANCELLED';

  const badgeClass = {
    PENDING: 'badge-warning',
    CONFIRMED: 'badge-success',
    COMPLETED: 'badge-primary',
    CANCELLED: 'badge-danger'
  }[appointment.status] || 'badge-secondary';

  const isProcessing = processingId === appointment.id;

  return (
    <article className="consultation-card" style={{ borderLeft: isCompleted ? '4px solid #10b981' : isConfirmed ? '4px solid #3b82f6' : isPending ? '4px solid #f59e0b' : '4px solid #ef4444' }}>
      <div className="card-top">
        <div className="card-person-info">
          <span className="person-label">{isDoctor ? 'Patient Contact' : 'Assigned Doctor'}</span>
          <h3 className="person-name">
            {isDoctor ? appointment.patientName : appointment.doctorName}
          </h3>
          <span className="person-sub">
            {isDoctor
              ? `📧 ${appointment.patientEmail} | 📞 ${appointment.patientPhone}`
              : `${appointment.doctorSpecialization || 'Specialist'} (${appointment.doctorQualification || 'MBBS'})`}
          </span>
        </div>

        <div className="status-container">
          <span className={`badge ${badgeClass}`} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {appointment.status}
          </span>
          <span className="appointment-time">{formatDateTime(appointment.appointmentDateTime)}</span>
        </div>
      </div>

      <div className="complaint-box" style={{ marginTop: '12px' }}>
        <strong className="complaint-title">Visit Reason:</strong>
        <p className="complaint-text">{appointment.reason}</p>
        
        {appointment.consultationNotes && (
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <strong style={{ color: '#065f46', fontSize: '0.85rem' }}>👨‍⚕️ Doctor Consultation Notes:</strong>
            <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
              {appointment.consultationNotes}
            </p>
          </div>
        )}
      </div>

      <div className="card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
        {/* Doctor Actions */}
        {isDoctor && isPending && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onConfirm(appointment.id)}
            disabled={isProcessing}
          >
            ✓ Confirm Booking
          </button>
        )}

        {isDoctor && isConfirmed && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onOpenCompleteModal(appointment)}
            disabled={isProcessing}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          >
            ✍️ Add Notes & Complete
          </button>
        )}

        {/* Both Doctor and Patient can cancel if active */}
        {(isPending || isConfirmed) && (
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => onCancel(appointment.id)}
            disabled={isProcessing}
            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
          >
            ✕ Cancel Appointment
          </button>
        )}

        {isCompleted && (
          <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ✓ Consultation Completed
          </span>
        )}
      </div>
    </article>
  );
};

