import React, { useState, useEffect } from 'react';
import { appointmentApi } from './services/api';
import AppointmentList from './AppointmentList';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

/**
 * AppointmentsPage Component
 * Manages appointment registry, status transitions, and doctor clinical consultation notes.
 */
export const AppointmentsPage = ({ currentUser, isDoctor, initialFilter = 'ALL', onOpenAuth, notify }) => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'ALL');

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Modal state for recording doctor consultation notes
  const [activeModalAppt, setActiveModalAppt] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);

  const fetchAppointments = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await appointmentApi.getAll({
        status: statusFilter
      });
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments.');
      if (notify) notify(err.message || 'Error loading appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentUser, isDoctor, statusFilter]);

  // Doctor Action: Confirm appointment
  const handleConfirm = async (id) => {
    setProcessingId(id);
    try {
      await appointmentApi.updateStatus(id, 'CONFIRMED');
      if (notify) notify('Appointment confirmed successfully!', 'success');
      await fetchAppointments();
    } catch (err) {
      if (notify) notify(err.message || 'Could not confirm appointment', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel Action
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setProcessingId(id);
    try {
      await appointmentApi.updateStatus(id, 'CANCELLED');
      if (notify) notify('Appointment has been cancelled.', 'info');
      await fetchAppointments();
    } catch (err) {
      if (notify) notify(err.message || 'Could not cancel appointment', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Complete Modal
  const handleOpenCompleteModal = (appointment) => {
    setActiveModalAppt(appointment);
    setClinicalNotes(appointment.consultationNotes || '');
  };

  // Submit Doctor Notes & Complete Consultation
  const handleSaveNotesAndComplete = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      if (notify) notify('Please enter consultation notes before completing.', 'error');
      return;
    }

    setSubmittingNotes(true);
    try {
      await appointmentApi.updateStatus(activeModalAppt.id, 'COMPLETED', clinicalNotes.trim());
      if (notify) notify('Consultation completed and clinical notes recorded!', 'success');
      setActiveModalAppt(null);
      await fetchAppointments();
    } catch (err) {
      if (notify) notify(err.message || 'Failed to complete consultation', 'error');
    } finally {
      setSubmittingNotes(false);
    }
  };

  // Unauthenticated Guard
  if (!currentUser) {
    return (
      <section className="container">
        <div className="state-container" style={{ margin: '48px auto', maxWidth: '540px' }}>
          <div className="state-icon">🔒</div>
          <h2 className="state-title">Sign In Required</h2>
          <p className="state-desc">
            Please sign in as a Patient or Doctor to inspect scheduled appointments and medical records.
          </p>
          <button className="btn btn-primary" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container appointments-page">
      <header className="page-hero">
        <h2 className="page-title">
          {isDoctor ? 'Doctor Schedule & Clinical Desk' : 'My Health Appointments'}
        </h2>
        <p className="page-subtitle">
          {isDoctor
            ? 'Review your patient schedule, confirm pending appointments, and record clinical consultation notes upon completion.'
            : 'Track upcoming doctor consultations, review status confirmations, and read doctor treatment notes.'}
        </p>

        {/* Status Filter Bar */}
        <nav className="filter-bar" aria-label="Filter appointments by status">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="state-container" role="status">
          <div className="spinner"></div>
          <h3 className="state-title">Loading Appointments</h3>
          <p className="state-desc">Synchronizing appointment schedule from backend...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <div>
            <strong>Error loading schedule:</strong> {error}
            <div style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={fetchAppointments}>
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment List State */}
      {!loading && !error && (
        <AppointmentList
          appointments={appointments}
          isDoctor={isDoctor}
          onConfirm={handleConfirm}
          onOpenCompleteModal={handleOpenCompleteModal}
          onCancel={handleCancel}
          processingId={processingId}
        />
      )}

      {/* Doctor Consultation Notes Modal */}
      {activeModalAppt && (
        <div className="modal-overlay" onClick={() => setActiveModalAppt(null)} role="dialog">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h3 className="modal-title">Complete TeleConsultation</h3>
                <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>
                  Patient: <strong>{activeModalAppt.patientName}</strong> • Reason: {activeModalAppt.reason}
                </p>
              </div>
              <button
                className="btn-close"
                onClick={() => setActiveModalAppt(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSaveNotesAndComplete}>
              <div className="form-group">
                <label className="form-label" htmlFor="clinicalNotes">
                  Doctor Clinical Impressions & Consultation Notes *
                </label>
                <textarea
                  id="clinicalNotes"
                  className="form-control"
                  rows={5}
                  required
                  placeholder="Record patient vital checks, diagnosis, clinical advice, medication guidance, or lifestyle modifications..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
                <small className="form-hint">
                  Notes are permanently saved in the patient's record upon completing this appointment.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModalAppt(null)}
                  disabled={submittingNotes}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submittingNotes}
                >
                  {submittingNotes ? 'Recording Notes...' : '✓ Complete & Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AppointmentsPage;

