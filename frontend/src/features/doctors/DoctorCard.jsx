import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export const DoctorCard = ({ doctor, onBook, isDoctor }) => {
  return (
    <article className="doctor-card">
      <div className="doc-header">
        <div className="doc-avatar">
          {doctor.fullName.replace('Dr. ', '').charAt(0)}
        </div>
        <div className="doc-meta">
          <h3 className="doc-name">{doctor.fullName}</h3>
          <span className="doc-specialty">{doctor.specialization}</span>
          <span className="doc-qualification">{doctor.qualification}</span>
        </div>
      </div>

      <p className="doc-bio">{doctor.bio || 'Experienced certified physician available for tele-consultation.'}</p>

      <div className="doc-details-grid">
        <div className="detail-item">
          <span className="detail-label">Experience</span>
          <span className="detail-value">{doctor.experienceYears} Years</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Available Days</span>
          <span className="detail-value">{doctor.availableDays || 'Mon-Fri'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Hours</span>
          <span className="detail-value">
            {doctor.availableTimeStart} - {doctor.availableTimeEnd}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Fee</span>
          <span className="detail-value doc-fee">{formatCurrency(doctor.consultationFee)}</span>
        </div>
      </div>

      <div className="doc-actions">
        <button
          className={`btn ${isDoctor ? 'btn-outline' : 'btn-primary'}`}
          style={{ width: '100%' }}
          onClick={() => onBook(doctor)}
        >
          {isDoctor ? 'Switch to Patient to Book' : 'Book Tele-Consultation'}
        </button>
      </div>
    </article>
  );
};

