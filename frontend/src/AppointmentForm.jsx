import React, { useState } from 'react';
import { appointmentApi } from './services/api';

// JavaScript Regular Expressions for Client-Side Validation
const NAME_REGEX = /^[a-zA-Z\s.']{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10,15}$/;

/**
 * Calculates default tomorrow 10:00 AM in ISO format (YYYY-MM-DDTHH:MM)
 */
function getDefaultDateTime() {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(10, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * AppointmentForm Component
 * Renders patient booking form with HTML5 constraints and JavaScript Regex validation.
 */
export const AppointmentForm = ({ doctor, currentUser, onClose, onSuccess, notify }) => {
  const [formData, setFormData] = useState({
    patientName: currentUser?.fullName || '',
    patientEmail: currentUser?.email || '',
    patientPhone: currentUser?.phone || '',
    appointmentDateTime: getDefaultDateTime(),
    reason: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-level error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  // Client-side validation using JavaScript Regex
  const validate = () => {
    const newErrors = {};

    // 1. Patient Name Validation
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient full name is required.';
    } else if (!NAME_REGEX.test(formData.patientName.trim())) {
      newErrors.patientName = 'Name must be 2-50 characters and contain only letters, dots, or spaces.';
    }

    // 2. Patient Email Validation
    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'Contact email address is required.';
    } else if (!EMAIL_REGEX.test(formData.patientEmail.trim())) {
      newErrors.patientEmail = 'Please provide a valid email format (e.g., patient@example.com).';
    }

    // 3. Patient Phone Validation
    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Phone number is required for consultation notifications.';
    } else if (!PHONE_REGEX.test(formData.patientPhone.trim())) {
      newErrors.patientPhone = 'Phone must contain 10 to 15 digits without spaces or special characters.';
    }

    // 4. Appointment Date & Time Validation
    if (!formData.appointmentDateTime) {
      newErrors.appointmentDateTime = 'Please select an appointment date and time.';
    } else {
      const selected = new Date(formData.appointmentDateTime);
      if (selected <= new Date()) {
        newErrors.appointmentDateTime = 'Appointment date and time must be scheduled in the future.';
      }
    }

    // 5. Reason for Visit Validation
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide the primary reason or symptoms for the appointment.';
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters long.';
    } else if (formData.reason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        doctorId: doctor.id,
        patientName: formData.patientName.trim(),
        patientEmail: formData.patientEmail.trim().toLowerCase(),
        patientPhone: formData.patientPhone.trim(),
        appointmentDateTime: formData.appointmentDateTime,
        reason: formData.reason.trim(),
        patientId: currentUser?.profileId || null
      };

      const result = await appointmentApi.create(payload);

      if (notify) notify('Appointment booked successfully! Status is PENDING confirmation.', 'success');
      if (typeof onSuccess === 'function') onSuccess(result);
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      // Handles 409 Conflict (overlapping slot) or 400 Validation Errors
      setServerError(err.message || 'Failed to submit appointment request.');
      if (err.validationErrors && typeof err.validationErrors === 'object') {
        setErrors(err.validationErrors);
      }
      if (notify) notify(err.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = doctor.name || doctor.fullName || 'Doctor Specialist';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2 className="modal-title">Book Doctor Appointment</h2>
            <p className="page-subtitle" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
              Consultant: <strong>{doctorName}</strong> ({doctor.specialization}) • Fee: ₹{doctor.consultationFee || '500'}
            </p>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close dialog">&times;</button>
        </header>

        {serverError && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️ {serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Patient Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientName">
              Patient Full Name *
            </label>
            <input
              id="patientName"
              name="patientName"
              type="text"
              required
              minLength={2}
              maxLength={50}
              className={`form-control ${errors.patientName ? 'is-invalid' : ''}`}
              placeholder="e.g. Sarah Jenkins"
              value={formData.patientName}
              onChange={handleChange}
            />
            {errors.patientName && (
              <span className="invalid-feedback">{errors.patientName}</span>
            )}
          </div>

          {/* Patient Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientEmail">
              Email Address *
            </label>
            <input
              id="patientEmail"
              name="patientEmail"
              type="email"
              required
              className={`form-control ${errors.patientEmail ? 'is-invalid' : ''}`}
              placeholder="patient@example.com"
              value={formData.patientEmail}
              onChange={handleChange}
            />
            {errors.patientEmail && (
              <span className="invalid-feedback">{errors.patientEmail}</span>
            )}
            <small className="form-hint">Confirmation & meeting links will be sent here.</small>
          </div>

          {/* Patient Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientPhone">
              Phone Number (10 Digits) *
            </label>
            <input
              id="patientPhone"
              name="patientPhone"
              type="tel"
              required
              pattern="[0-9]{10,15}"
              className={`form-control ${errors.patientPhone ? 'is-invalid' : ''}`}
              placeholder="9876543210"
              value={formData.patientPhone}
              onChange={handleChange}
            />
            {errors.patientPhone && (
              <span className="invalid-feedback">{errors.patientPhone}</span>
            )}
          </div>

          {/* Appointment Date and Time */}
          <div className="form-group">
            <label className="form-label" htmlFor="appointmentDateTime">
              Preferred Date & Time *
            </label>
            <input
              id="appointmentDateTime"
              name="appointmentDateTime"
              type="datetime-local"
              required
              min={getMinDateTime()}
              className={`form-control ${errors.appointmentDateTime ? 'is-invalid' : ''}`}
              value={formData.appointmentDateTime}
              onChange={handleChange}
            />
            {errors.appointmentDateTime && (
              <span className="invalid-feedback">{errors.appointmentDateTime}</span>
            )}
            <small className="form-hint">
              Doctor Hours: {doctor.availableDays || 'Mon-Fri'} ({doctor.availableTimeStart || '09:00'} - {doctor.availableTimeEnd || '17:00'})
            </small>
          </div>

          {/* Reason for Appointment */}
          <div className="form-group">
            <label className="form-label" htmlFor="reason">
              Reason for Visit / Primary Symptoms *
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              required
              minLength={5}
              maxLength={500}
              className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
              placeholder="Describe your health symptoms, medical concern, duration, or previous diagnosis..."
              value={formData.reason}
              onChange={handleChange}
            />
            {errors.reason && (
              <span className="invalid-feedback">{errors.reason}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting Booking...' : '✓ Confirm & Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;

