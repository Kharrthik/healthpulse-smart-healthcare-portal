import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toast } from './components/Toast';
import { AuthModal } from './features/auth/AuthModal';

import DoctorsPage from './DoctorsPage';
import AppointmentsPage from './AppointmentsPage';
import SymptomIntakePage from './SymptomIntakePage';
import AppointmentForm from './AppointmentForm';

import './styles.css';

/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree,
 * logs them, and displays a graceful fallback UI instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HealthPulse Client Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '64px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🩺</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Application Encountered an Error
          </h2>
          <p style={{ color: '#64748b', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A client-side initialization issue occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Reload Application
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Stale Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { user, isDoctor, logout } = useAuth();

  // Primary portal mode: 'PATIENT' or 'DOCTOR'
  const [portalMode, setPortalMode] = useState(() => {
    return user?.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
  });

  // Active tab inside Patient Portal ('doctors', 'appointments', 'symptoms')
  const [activeTab, setActiveTab] = useState('doctors');

  // Active tab inside Doctor Portal ('schedule', 'completed')
  const [activeDoctorTab, setActiveDoctorTab] = useState('schedule');

  // Modal states
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('PATIENT');
  const [authModalMode, setAuthModalMode] = useState('login');

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const notify = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast({ message: '', type: 'info' });
  };

  // Keep portal mode aligned with authenticated user role
  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      setPortalMode('DOCTOR');
    }
  }, [user]);

  const handleBookDoctor = (doctor) => {
    if (!user) {
      notify('Please sign in as a Patient to book an appointment.', 'info');
      setAuthModalRole('PATIENT');
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    if (user.role === 'DOCTOR') {
      notify('You are currently authenticated as a Doctor. Please book using a Patient account.', 'warning');
      return;
    }
    setSelectedDoctorForBooking(doctor);
  };

  const handleBookingSuccess = () => {
    setSelectedDoctorForBooking(null);
    setActiveTab('appointments');
  };

  // Role-enforced navigation: Patients only access Patient Portal, Doctors only access Doctor Console
  const handleSwitchToDoctorPortal = () => {
    if (user?.role === 'PATIENT') {
      notify('You are currently signed in as a Patient. Please sign out first to access the Doctor Console.', 'warning');
      return;
    }
    setPortalMode('DOCTOR');
    setActiveDoctorTab('schedule');
    if (user?.role === 'DOCTOR') {
      notify(`Welcome to Doctor Clinical Console, Dr. ${user.fullName || ''}!`, 'info');
    } else {
      notify('Switched to Doctor Clinical Portal view. Please sign in with your Doctor credentials.', 'info');
    }
  };

  const handleSwitchToPatientPortal = () => {
    if (user?.role === 'DOCTOR') {
      notify('You are currently signed in as a Doctor. Please sign out first to access the Patient Portal.', 'warning');
      return;
    }
    setPortalMode('PATIENT');
    setActiveTab('doctors');
    notify('Switched to Patient Healthcare Portal', 'info');
  };

  const handleOpenAuth = (role = 'PATIENT', mode = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (role) => {
    setShowAuthModal(false);
    if (role === 'DOCTOR') {
      setPortalMode('DOCTOR');
      setActiveDoctorTab('schedule');
    } else {
      setPortalMode('PATIENT');
      setActiveTab('appointments');
    }
  };

  const handleSignOut = async () => {
    await logout();
    notify('Signed out successfully.', 'info');
    setPortalMode('PATIENT');
    setActiveTab('doctors');
  };

  // Display user name
  const userName = user?.fullName || user?.data?.fullName || user?.email || 'User';

  return (
    <div className={`site-wrapper ${portalMode === 'DOCTOR' ? 'doctor-mode-active' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ====================================================================
          HEADER: SEPARATED PATIENT VS DOCTOR CLINICAL HEADER
         ==================================================================== */}
      {portalMode === 'PATIENT' ? (
        /* PATIENT PORTAL HEADER */
        <header className="app-header">
          <div className="container nav-wrapper">
            <div className="brand" onClick={() => setActiveTab('doctors')}>
              <div className="brand-icon">✚</div>
              <div className="brand-text">
                <h1>HealthPulse</h1>
                <span>Virtual Patient Healthcare</span>
              </div>
            </div>

            {/* Patient Navigation Tabs */}
            <nav className="nav-tabs" aria-label="Patient Navigation">
              <button
                type="button"
                className={`nav-btn ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                🩺 Find Doctors
              </button>

              <button
                type="button"
                className={`nav-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                📅 My Appointments
              </button>

              <button
                type="button"
                className={`nav-btn ${activeTab === 'symptoms' ? 'active' : ''}`}
                onClick={() => setActiveTab('symptoms')}
              >
                ✨ AI Symptom Intake
              </button>
            </nav>

            <div className="auth-controls">
              {/* Only unauthenticated visitors see the Doctor Portal switch button */}
              {!user && (
                <button
                  type="button"
                  className="portal-switch-btn to-doctor"
                  onClick={handleSwitchToDoctorPortal}
                  title="Switch to Healthcare Provider Console"
                >
                  🩺 Doctor Portal ➔
                </button>
              )}

              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    👤 {userName}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenAuth('PATIENT', 'login')}
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </header>
      ) : (
        /* DOCTOR PORTAL CLINICAL HEADER */
        <header className="app-header doctor-portal-header">
          <div className="container nav-wrapper">
            <div className="brand" onClick={() => setActiveDoctorTab('schedule')}>
              <div className="brand-icon">🩺</div>
              <div className="brand-text">
                <h1>HealthPulse Provider</h1>
                <span>Clinical Consultation Console</span>
              </div>
            </div>

            {/* Doctor Navigation Tabs (NO Find Doctors, NO AI Symptom Intake) */}
            <nav className="nav-tabs" aria-label="Doctor Navigation">
              <button
                type="button"
                className={`nav-btn ${activeDoctorTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveDoctorTab('schedule')}
              >
                📅 Patient Appointments &amp; Schedule
              </button>

              <button
                type="button"
                className={`nav-btn ${activeDoctorTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveDoctorTab('completed')}
              >
                📋 Completed Visits &amp; Clinical Records
              </button>
            </nav>

            <div className="auth-controls">
              {/* Only unauthenticated visitors see the switch back to Patient Portal */}
              {!user && (
                <button
                  type="button"
                  className="portal-switch-btn to-patient"
                  onClick={handleSwitchToPatientPortal}
                  title="Switch back to Patient Healthcare Portal"
                >
                  👤 Switch to Patient Portal ➔
                </button>
              )}

              {user && user.role === 'DOCTOR' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    👨‍⚕️ Dr. {userName}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#0f766e', borderColor: '#14b8a6' }}
                  onClick={() => handleOpenAuth('DOCTOR', 'login')}
                >
                  Doctor Sign In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ====================================================================
          MAIN ROUTED CONTENT
         ==================================================================== */}
      <main style={{ flex: 1, paddingBottom: '48px' }}>
        {portalMode === 'PATIENT' ? (
          /* ==================== PATIENT INTERFACE ==================== */
          <>
            {activeTab === 'doctors' && (
              <DoctorsPage
                onBookDoctor={handleBookDoctor}
                notify={notify}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsPage
                currentUser={user}
                isDoctor={false}
                onOpenAuth={() => handleOpenAuth('PATIENT', 'login')}
                notify={notify}
              />
            )}

            {activeTab === 'symptoms' && (
              <SymptomIntakePage
                onSelectDoctor={() => setActiveTab('doctors')}
                notify={notify}
              />
            )}
          </>
        ) : (
          /* ==================== DOCTOR INTERFACE ==================== */
          <div className="doctor-portal-body">
            {user && user.role === 'DOCTOR' ? (
              /* Authenticated Doctor Clinical Dashboard */
              <div className="container">
                <div className="doctor-hero-banner">
                  <div className="doctor-hero-content">
                    <span className="doctor-badge-pill">👨‍⚕️ Verified Clinical Provider</span>
                    <h2>Welcome, Dr. {userName}</h2>
                    <p>
                      Review patient bookings, confirm scheduled consults, inspect clinical briefings, and record medical notes upon completion.
                    </p>
                  </div>
                </div>

                {activeDoctorTab === 'schedule' && (
                  <AppointmentsPage
                    currentUser={user}
                    isDoctor={true}
                    initialFilter="ALL"
                    onOpenAuth={() => handleOpenAuth('DOCTOR', 'login')}
                    notify={notify}
                  />
                )}

                {activeDoctorTab === 'completed' && (
                  <AppointmentsPage
                    currentUser={user}
                    isDoctor={true}
                    initialFilter="COMPLETED"
                    onOpenAuth={() => handleOpenAuth('DOCTOR', 'login')}
                    notify={notify}
                  />
                )}
              </div>
            ) : (
              /* Doctor Authentication Guard Card (When Not Authenticated as Doctor) */
              <section className="container">
                <div className="doctor-auth-guard-card">
                  <div style={{ fontSize: '3.2rem', marginBottom: '12px' }}>🩺</div>
                  <span className="doctor-badge-pill" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }}>
                    Healthcare Provider Access
                  </span>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '12px 0 8px' }}>
                    Doctor Clinical Console
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.55, maxWidth: '460px', margin: '0 auto 24px' }}>
                    This console is dedicated to medical doctors and specialists to manage scheduled consultations, review patient intake, and issue prescriptions.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenAuth('DOCTOR', 'login')}
                    >
                      🔑 Doctor Sign In / Register
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleSwitchToPatientPortal}
                    >
                      👤 Return to Patient Portal
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Patient Booking Modal Form */}
      {selectedDoctorForBooking && (
        <AppointmentForm
          doctor={selectedDoctorForBooking}
          currentUser={user}
          onClose={() => setSelectedDoctorForBooking(null)}
          onSuccess={handleBookingSuccess}
          notify={notify}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialRole={authModalRole}
          initialMode={authModalMode}
          notify={notify}
        />
      )}

      {/* Toast Notification Container */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
