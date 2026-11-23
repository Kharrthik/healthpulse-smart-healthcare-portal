import React from 'react';

/**
 * Helper to format ISO datetime to clean readable string
 */
function formatDateTime(isoString) {
  if (!isoString) return 'Date TBD';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Returns badge CSS class based on status
 */
function getBadgeClass(status) {
  switch (status) {
    case 'CONFIRMED': return 'badge-confirmed';
    case 'COMPLETED': return 'badge-completed';
    case 'CANCELLED': return 'badge-cancelled';
    case 'PENDING':
    default:
      return 'badge-pending';
  }
}

/**
 * AppointmentList Component
 * Displays appointment cards with status indicators, patient details,
 * and authorized doctor/patient action controls.
 */
export const AppointmentList = ({
  appointments = [],
  isDoctor = false,
  onConfirm,
  onOpenCompleteModal,
  onCancel,
  processingId
}) => {
  const list = Array.isArray(appointments) ? appointments : [];

  if (list.length === 0) {
    return (
      <div className="state-container">
        <div className="state-icon">📋</div>
        <h3 className="state-title">No Appointments Found</h3>
        <p className="state-desc">
          There are currently no scheduled appointments matching the selected filter.
        </p>
      </div>
    );
  }

  return (
    <div className="appointments-grid">
      {list.map((appt) => {
        if (!appt) return null;
        const isPending = appt.status === 'PENDING';
        const isConfirmed = appt.status === 'CONFIRMED';
        const isCompleted = appt.status === 'COMPLETED';
        const isCancelled = appt.status === 'CANCELLED';
        const isProcessing = processingId === appt.id;

        return (
          <article
            key={appt.id}
            className="card appointment-card"
            style={{
              borderLeft: isCompleted
                ? '4px solid var(--success)'
                : isConfirmed
                ? '4px solid var(--primary)'
                : isPending
                ? '4px solid var(--warning)'
                : '4px solid var(--danger)'
            }}
          >
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title-group" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="detail-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {isDoctor ? 'Patient Record' : 'Assigned Specialist'}
                  </span>
                  <span className={`badge ${getBadgeClass(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>

                <h3 style={{ marginTop: '4px' }}>
                  {isDoctor ? appt.patientName : appt.doctorName}
                </h3>

                <p className="card-meta">
                  {isDoctor
                    ? `📧 ${appt.patientEmail || 'N/A'} • 📞 ${appt.patientPhone || 'N/A'}`
                    : `${appt.doctorSpecialization || 'Specialist'} (${appt.doctorQualification || 'MBBS'})`}
                </p>
              </div>
            </div>

            <div className="card-body">
              <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                <span className="detail-label">Scheduled Date & Time:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  📅 {formatDateTime(appt.appointmentDateTime)}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Reason / Chief Complaint:</strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {appt.reason}
                </p>
              </div>

              {/* Consultation Notes Section */}
              {appt.consultationNotes && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: 'var(--success-light)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  <strong style={{ color: '#065f46', fontSize: '0.85rem', display: 'block' }}>
                    👨‍⚕️ Clinical Consultation Notes:
                  </strong>
                  <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                    {appt.consultationNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="card-footer" style={{ gap: '8px', flexWrap: 'wrap' }}>
              {/* Doctor Action: Confirm PENDING booking */}
              {isDoctor && isPending && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onConfirm(appt.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Confirming...' : '✓ Confirm Booking'}
                </button>
              )}

              {/* Doctor Action: Add Notes & Complete CONFIRMED appointment */}
              {isDoctor && isConfirmed && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => onOpenCompleteModal(appt)}
                  disabled={isProcessing}
                >
                  ✍️ Add Notes & Complete
                </button>
              )}

              {/* Both Patient and Doctor can cancel active appointments */}
              {(isPending || isConfirmed) && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => onCancel(appt.id)}
                  disabled={isProcessing}
                >
                  ✕ Cancel Appointment
                </button>
              )}

              {isCompleted && (
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Consultation Complete
                </span>
              )}

              {isCancelled && (
                <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
                  ✕ Booking Cancelled
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default AppointmentList;
