import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultationService } from '../../services/consultationService';
import { appointmentService } from '../../services/appointmentService';
import { ConsultationCard } from './ConsultationCard';
import { AppointmentCard } from '../appointments/AppointmentCard';
import { ConsultationNoteModal } from '../appointments/ConsultationNoteModal';
import './consultations.css';

export const ConsultationList = ({ onViewAiPrep, onOpenPrescription, onIssuePrescription, onOpenAuth, notify }) => {
  const { user, isDoctor } = useAuth();
  
  // Section Mode: 'appointments' (/api/appointments) vs 'consultations' (/api/consultations)
  const [sectionMode, setSectionMode] = useState('appointments');

  // Appointments state (/api/appointments)
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [apptFilter, setApptFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);
  const [activeNoteAppointment, setActiveNoteAppointment] = useState(null);

  // Consultations state (/api/consultations)
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [consultFilterTab, setConsultFilterTab] = useState('ALL');

  const loadAppointments = async () => {
    if (!user) {
      setLoadingAppointments(false);
      return;
    }
    setLoadingAppointments(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data || []);
    } catch (err) {
      notify(err.message || 'Failed to load appointments registry.', 'error');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadConsultations = async () => {
    if (!user) {
      setLoadingConsultations(false);
      return;
    }
    setLoadingConsultations(true);
    try {
      const params = {};
      if (isDoctor) {
        params.doctorId = user?.profileId || 1;
      } else {
        params.patientId = user?.profileId || 1;
      }
      const data = await consultationService.getConsultations(params);
      setConsultations(data || []);
    } catch (err) {
      notify(err.message || 'Failed to load teleconsultations.', 'error');
    } finally {
      setLoadingConsultations(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadConsultations();
  }, [user, isDoctor]);

  // Appointment Status Transitions
  const handleConfirmAppointment = async (id) => {
    setProcessingId(id);
    try {
      await appointmentService.updateStatus(id, 'CONFIRMED');
      notify('Appointment confirmed successfully!', 'success');
      await loadAppointments();
    } catch (err) {
      notify(err.message || 'Failed to confirm appointment', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setProcessingId(id);
    try {
      await appointmentService.updateStatus(id, 'CANCELLED');
      notify('Appointment cancelled.', 'info');
      await loadAppointments();
    } catch (err) {
      notify(err.message || 'Failed to cancel appointment', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteWithNotes = async (id, status, notes) => {
    await appointmentService.updateStatus(id, status, notes);
    await loadAppointments();
  };

  if (!user) {
    return (
      <section className="consultations-section container">
        <div className="section-header">
          <div>
            <h1 className="section-title">My Health Appointments</h1>
            <p className="section-desc">
              Sign in to view your scheduled tele-consultations, AI pre-visit briefings, and digital prescriptions.
            </p>
          </div>
        </div>
        <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ marginBottom: '8px', fontSize: '1.4rem', color: 'var(--text-main)' }}>Sign In Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Please sign in as a Patient or Doctor to access your personal consultation registry and medical records.
          </p>
          <button className="btn btn-primary" onClick={onOpenAuth} style={{ padding: '10px 28px', fontSize: '1rem' }}>
            Sign In / Register
          </button>
        </div>
      </section>
    );
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    if (apptFilter === 'ALL') return true;
    return a.status === apptFilter;
  });

  // Filtered Consultations
  const filteredConsultations = consultations.filter((c) => {
    if (consultFilterTab === 'ALL') return true;
    return c.status === consultFilterTab;
  });

  return (
    <section className="consultations-section container">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="section-title">
            {isDoctor ? 'Doctor Clinical Desk & Schedule' : 'My Health Appointments & Schedule'}
          </h1>
          <p className="section-desc">
            {isDoctor
              ? 'Manage patient appointments, execute status transitions (Confirm / Complete / Cancel), and record clinical consultation notes.'
              : 'Track your scheduled bookings, monitor confirmation status, and review doctor consultation notes.'}
          </p>
        </div>

        {/* Workflow Switcher */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            className={`btn btn-sm ${sectionMode === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 600, padding: '8px 14px' }}
            onClick={() => setSectionMode('appointments')}
          >
            📅 Appointments Registry ({appointments.length})
          </button>
          <button
            className={`btn btn-sm ${sectionMode === 'consultations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 600, padding: '8px 14px' }}
            onClick={() => setSectionMode('consultations')}
          >
            🩺 TeleConsultations & AI ({consultations.length})
          </button>
        </div>
      </div>

      {sectionMode === 'appointments' ? (
        /* APPOINTMENTS REGISTRY WORKFLOW */
        <div>
          <div className="appointment-tabs" style={{ marginTop: '16px' }}>
            <button
              className={`tab-btn ${apptFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setApptFilter('ALL')}
            >
              All ({appointments.length})
            </button>
            <button
              className={`tab-btn ${apptFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setApptFilter('PENDING')}
            >
              Pending ({appointments.filter(a => a.status === 'PENDING').length})
            </button>
            <button
              className={`tab-btn ${apptFilter === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setApptFilter('CONFIRMED')}
            >
              Confirmed ({appointments.filter(a => a.status === 'CONFIRMED').length})
            </button>
            <button
              className={`tab-btn ${apptFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setApptFilter('COMPLETED')}
            >
              Completed ({appointments.filter(a => a.status === 'COMPLETED').length})
            </button>
            <button
              className={`tab-btn ${apptFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setApptFilter('CANCELLED')}
            >
              Cancelled ({appointments.filter(a => a.status === 'CANCELLED').length})
            </button>
          </div>

          {loadingAppointments ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading appointments registry...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No {apptFilter !== 'ALL' ? apptFilter.toLowerCase() : ''} appointments found in registry.</p>
            </div>
          ) : (
            <div className="consultations-grid">
              {filteredAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  isDoctor={isDoctor}
                  onConfirm={handleConfirmAppointment}
                  onOpenCompleteModal={(appointment) => setActiveNoteAppointment(appointment)}
                  onCancel={handleCancelAppointment}
                  processingId={processingId}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TELECONSULTATIONS WORKFLOW (AI Clinical Notes & Prescriptions) */
        <div>
          <div className="appointment-tabs" style={{ marginTop: '16px' }}>
            <button
              className={`tab-btn ${consultFilterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setConsultFilterTab('ALL')}
            >
              All TeleConsults ({consultations.length})
            </button>
            <button
              className={`tab-btn ${consultFilterTab === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setConsultFilterTab('CONFIRMED')}
            >
              Confirmed ({consultations.filter(c => c.status === 'CONFIRMED').length})
            </button>
            <button
              className={`tab-btn ${consultFilterTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setConsultFilterTab('COMPLETED')}
            >
              Completed ({consultations.filter(c => c.status === 'COMPLETED').length})
            </button>
          </div>

          {loadingConsultations ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading teleconsultations...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="empty-state">
              <p>No {consultFilterTab.toLowerCase()} teleconsultations found.</p>
            </div>
          ) : (
            <div className="consultations-grid">
              {filteredConsultations.map((c) => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  isDoctor={isDoctor}
                  onViewAiPrep={onViewAiPrep}
                  onOpenPrescription={onOpenPrescription}
                  onIssuePrescription={onIssuePrescription}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doctor Consultation Note Completion Modal */}
      {activeNoteAppointment && (
        <ConsultationNoteModal
          appointment={activeNoteAppointment}
          onClose={() => setActiveNoteAppointment(null)}
          onSave={handleCompleteWithNotes}
          notify={notify}
        />
      )}
    </section>
  );
};
