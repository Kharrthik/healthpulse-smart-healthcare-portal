import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validatePhone } from '../../utils/validation';
import './auth.css';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics'
];

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AuthModal = ({ onClose, onSuccess, notify, initialMode = 'login', initialRole = 'PATIENT' }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [role, setRole] = useState(initialRole || 'PATIENT');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor Specific
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS');
  const [fee, setFee] = useState(500);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  // Errors & Loading
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Live password validation checks
  const pwdChecks = {
    length: password.length >= 8 && password.length <= 32,
    case: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[@$!%*?&]/.test(password)
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return ALL_DAYS.filter((d) => prev.includes(d) || d === day);
      }
    });
    if (errors.availableDays) {
      setErrors((prev) => ({ ...prev, availableDays: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    let phoneErr = '';
    let nameErr = '';
    let daysErr = '';

    if (isRegister) {
      phoneErr = validatePhone(phone);
      if (!fullName.trim()) nameErr = 'Full legal name is required';
      if (role === 'DOCTOR' && selectedDays.length === 0) {
        daysErr = 'Please select at least one available consultation day';
      }
    }

    if (emailErr || passwordErr || phoneErr || nameErr || daysErr) {
      setErrors({
        email: emailErr,
        password: passwordErr,
        phone: phoneErr,
        fullName: nameErr,
        availableDays: daysErr
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      if (isRegister) {
        const newUser = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
          phone: phone.trim(),
          specialization: role === 'DOCTOR' ? specialization : undefined,
          qualification: role === 'DOCTOR' ? qualification : undefined,
          consultationFee: role === 'DOCTOR' ? Number(fee) : undefined,
          availableDays: role === 'DOCTOR' ? selectedDays.join(', ') : undefined
        });
        if (notify) notify(`Welcome to HealthPulse, ${fullName}! Account created successfully.`, 'success');
        if (typeof onSuccess === 'function') {
          onSuccess(newUser?.role || role);
        }
      } else {
        const user = await login(email.trim(), password);
        if (notify) notify(`Welcome back, ${user.fullName || 'Doctor'}!`, 'success');
        if (typeof onSuccess === 'function') {
          onSuccess(user?.role);
        }
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      if (err.validationErrors && typeof err.validationErrors === 'object') {
        setErrors(err.validationErrors);
      } else {
        if (notify) notify(err.message || 'Authentication failed. Please verify your credentials.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Medical Theme Gradient */}
        <header className="auth-header">
          <div className="auth-header-top">
            <span className="auth-brand-badge">
              <span>✚</span> HealthPulse Security
            </span>
            <button
              type="button"
              className="auth-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              &times;
            </button>
          </div>
          <h2 className="auth-title">
            {isRegister ? 'Create Your Account' : 'Welcome to HealthPulse'}
          </h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Join our virtual telemedicine network as a patient or verified physician.'
              : 'Sign in to access your consultations, prescriptions, and medical records.'}
          </p>
        </header>

        {/* Tab Switcher: Sign In vs Register */}
        <nav className="auth-tabs" aria-label="Authentication mode selection">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setErrors({}); }}
          >
            <span>🔑</span> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setErrors({}); }}
          >
            <span>📝</span> Register New Account
          </button>
        </nav>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-body">
            {/* Registration Specific Fields */}
            {isRegister && (
              <>
                {/* Role Selector Cards */}
                <div className="auth-role-section">
                  <span className="auth-role-label">Choose Account Type *</span>
                  <div className="auth-role-grid">
                    <div
                      className={`auth-role-card ${role === 'PATIENT' ? 'active' : ''}`}
                      onClick={() => setRole('PATIENT')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="auth-role-title">
                        <span>👤 Patient</span>
                        <span className="auth-role-badge">Care Seeker</span>
                      </div>
                      <p className="auth-role-desc">
                        Book specialist appointments, AI symptom intake, and digital prescriptions.
                      </p>
                    </div>

                    <div
                      className={`auth-role-card ${role === 'DOCTOR' ? 'active' : ''}`}
                      onClick={() => setRole('DOCTOR')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="auth-role-title">
                        <span>🩺 Doctor / Specialist</span>
                        <span className="auth-role-badge">Provider</span>
                      </div>
                      <p className="auth-role-desc">
                        Conduct consultations, view AI clinical notes, and manage schedule.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Legal Name */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="regFullName">
                    <span>Full Legal Name <span className="auth-required">*</span></span>
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">👤</span>
                    <input
                      id="regFullName"
                      type="text"
                      required
                      className={`auth-input ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder={role === 'DOCTOR' ? 'e.g. Dr. Sarah Jenkins' : 'e.g. Sarah Jenkins'}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
                      }}
                    />
                  </div>
                  {errors.fullName && <div className="auth-error"><span>⚠️</span> {errors.fullName}</div>}
                </div>

                {/* Mobile Phone Number */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="regPhone">
                    <span>Mobile Phone (10 Digits) <span className="auth-required">*</span></span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Must start with 6-9</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">📱</span>
                    <input
                      id="regPhone"
                      type="tel"
                      maxLength={10}
                      required
                      className={`auth-input ${errors.phone ? 'is-invalid' : ''}`}
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                      }}
                    />
                  </div>
                  {errors.phone && <div className="auth-error"><span>⚠️</span> {errors.phone}</div>}
                </div>

                {/* Doctor-Specific Fields */}
                {role === 'DOCTOR' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="auth-field">
                        <label className="auth-label" htmlFor="regSpec">
                          <span>Specialization</span>
                        </label>
                        <div className="auth-input-wrapper">
                          <span className="auth-input-icon">🩺</span>
                          <select
                            id="regSpec"
                            className="auth-input"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                          >
                            {SPECIALIZATIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="auth-field">
                        <label className="auth-label" htmlFor="regFee">
                          <span>Consultation Fee (₹)</span>
                        </label>
                        <div className="auth-input-wrapper">
                          <span className="auth-input-icon">₹</span>
                          <input
                            id="regFee"
                            type="number"
                            min={100}
                            max={10000}
                            step={50}
                            className="auth-input"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Available Consultation Days */}
                    <div className="auth-field" style={{ marginTop: '12px' }}>
                      <label className="auth-label">
                        <span>Available Consultation Days <span className="auth-required">*</span></span>
                        <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                          {selectedDays.length > 0 ? selectedDays.join(', ') : 'None selected'}
                        </span>
                      </label>
                      <div className="auth-days-selector">
                        {ALL_DAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            className={`auth-day-pill ${selectedDays.includes(day) ? 'active' : ''}`}
                            onClick={() => toggleDay(day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <div className="auth-days-presets">
                        <button
                          type="button"
                          className="auth-preset-btn"
                          onClick={() => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                        >
                          Weekdays (Mon-Fri)
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          className="auth-preset-btn"
                          onClick={() => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])}
                        >
                          Mon - Sat
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          className="auth-preset-btn"
                          onClick={() => setSelectedDays([...ALL_DAYS])}
                        >
                          All 7 Days
                        </button>
                      </div>
                      {errors.availableDays && <div className="auth-error"><span>⚠️</span> {errors.availableDays}</div>}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Email Address */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="authEmail">
                <span>Email Address <span className="auth-required">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="authEmail"
                  type="email"
                  required
                  autoComplete="username"
                  className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                  }}
                />
              </div>
              {errors.email && <div className="auth-error"><span>⚠️</span> {errors.email}</div>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="authPassword">
                <span>Password <span className="auth-required">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="authPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className={`auth-input ${errors.password ? 'is-invalid' : ''}`}
                  placeholder={isRegister ? 'Enter secure password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                  }}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <div className="auth-error"><span>⚠️</span> {errors.password}</div>}

              {/* Password Requirement Checklist (Live helper in Registration view) */}
              {isRegister && (
                <div className="pwd-requirements" aria-label="Password complexity rules">
                  <div className="pwd-req-title">Password Security Requirements:</div>
                  <div className="pwd-req-grid">
                    <div className={`pwd-req-item ${pwdChecks.length ? 'valid' : ''}`}>
                      <span className="pwd-req-icon">{pwdChecks.length ? '✓' : '○'}</span>
                      8 to 32 characters
                    </div>
                    <div className={`pwd-req-item ${pwdChecks.case ? 'valid' : ''}`}>
                      <span className="pwd-req-icon">{pwdChecks.case ? '✓' : '○'}</span>
                      Upper &amp; lowercase letters
                    </div>
                    <div className={`pwd-req-item ${pwdChecks.number ? 'valid' : ''}`}>
                      <span className="pwd-req-icon">{pwdChecks.number ? '✓' : '○'}</span>
                      At least one digit (0-9)
                    </div>
                    <div className={`pwd-req-item ${pwdChecks.symbol ? 'valid' : ''}`}>
                      <span className="pwd-req-icon">{pwdChecks.symbol ? '✓' : '○'}</span>
                      Special symbol (@$!%*?&amp;)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <footer className="auth-footer">
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></span>
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Register Account ➔' : 'Sign In to Portal ➔'
              )}
            </button>

            <p className="auth-switch-link">
              {isRegister ? (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => { setIsRegister(false); setErrors({}); }}
                  >
                    Sign In here
                  </button>
                </>
              ) : (
                <>
                  New to HealthPulse?{' '}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => { setIsRegister(true); setErrors({}); }}
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
