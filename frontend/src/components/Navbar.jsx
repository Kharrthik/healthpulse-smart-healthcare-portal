import React from 'react';
import { useAuth } from '../context/AuthContext';
import './navbar.css';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenSymptomChecker, notify }) => {
  const { user, logout, switchRole, isLoggedIn, isDoctor } = useAuth();

  return (
    <header className="site-header">
      <div className="container nav-container">
        <div className="brand" onClick={() => setActiveTab('doctors')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">✚</div>
          <div className="brand-text">
            <span className="brand-title">HealthPulse</span>
            <span className="brand-subtitle">AI Smart TeleConsult</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            Find Doctors
          </button>

          <button
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            {isDoctor ? 'Doctor Schedule' : 'My Appointments'}
          </button>

          <button
            className="nav-item btn-ai-nav"
            onClick={onOpenSymptomChecker}
          >
            ✨ AI Symptom Checker
          </button>
        </nav>

        <div className="nav-actions">
          {/* Quick Persona Switcher for easy testing */}
          <div className="role-switcher">
            <span className="switcher-label">View as:</span>
            <button
              className={`switcher-btn ${!isDoctor ? 'active' : ''}`}
              onClick={async () => {
                try {
                  await switchRole('PATIENT');
                  setActiveTab('doctors');
                  notify?.('Switched to Patient view: Sarah Jenkins', 'info');
                } catch (e) {
                  notify?.(e.message || 'Failed to switch to Patient view', 'error');
                }
              }}
              title="Test as Patient"
            >
              Patient
            </button>
            <button
              className={`switcher-btn ${isDoctor ? 'active' : ''}`}
              onClick={async () => {
                try {
                  await switchRole('DOCTOR');
                  setActiveTab('appointments');
                  notify?.('Switched to Doctor view: Dr. Ananya Sharma', 'info');
                } catch (e) {
                  notify?.(e.message || 'Failed to switch to Doctor view', 'error');
                }
              }}
              title="Test as Doctor"
            >
              Doctor
            </button>
          </div>

          {isLoggedIn ? (
            <div className="user-profile-menu">
              <div className="user-badge">
                <span className="user-avatar">{user.fullName.charAt(0)}</span>
                <div className="user-details">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-role-tag">{user.role}</span>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

