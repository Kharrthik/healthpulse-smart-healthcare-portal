import React from 'react';

/**
 * DoctorCard Component
 * Displays verified doctor profile, credentials, consultation fee,
 * and handles the booking action trigger.
 */
export const DoctorCard = ({ doctor, onBook }) => {
  const doctorName = doctor.name || doctor.fullName || 'Doctor Specialist';
  const feeFormatted = doctor.consultationFee 
    ? `₹${Number(doctor.consultationFee).toFixed(2)}` 
    : '₹500.00';

  return (
    <article className="card doctor-card">
      <div className="card-header">
        <div className="doctor-avatar" aria-hidden="true">
          {doctorName.replace(/^(Dr\.\s*)/i, '').charAt(0) || 'D'}
        </div>
        <div className="card-title-group">
          <h3>{doctorName}</h3>
          <span className="card-specialty">{doctor.specialization || 'General Medicine'}</span>
          <p className="card-meta">
            {doctor.qualification ? `${doctor.qualification} • ` : ''}
            {doctor.experienceYears ? `${doctor.experienceYears}+ years exp` : 'Experienced'}
          </p>
        </div>
      </div>

      <div className="card-body">
        {doctor.bio && (
          <p className="card-bio">{doctor.bio}</p>
        )}

        <div className="card-details">
          <div>
            <span className="detail-label">Available Days:</span>
            <span className="detail-val">{doctor.availableDays || 'Mon - Fri'}</span>
          </div>
          <div>
            <span className="detail-label">Hours:</span>
            <span className="detail-val">
              {doctor.availableTimeStart || '09:00'} - {doctor.availableTimeEnd || '17:00'}
            </span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="fee-display">
          <span className="fee-label">Consultation Fee</span>
          <span className="fee-amount">{feeFormatted}</span>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onBook(doctor)}
          aria-label={`Book appointment with ${doctorName}`}
        >
          📅 Book Consultation
        </button>
      </div>
    </article>
  );
};

export default DoctorCard;

