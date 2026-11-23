import React from 'react';

const SPECIALTIES = [
  'ALL',
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Pediatrics'
];

export const DoctorFilters = ({ selectedSpecialty, onSelectSpecialty, searchQuery, onSearchChange, maxFee, onMaxFeeChange }) => {
  return (
    <div className="doctor-filter-panel">
      <div className="search-box">
        <input
          type="text"
          className="form-input"
          placeholder="Search by doctor name or specialty..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="specialty-pills">
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            className={`pill-btn ${selectedSpecialty === spec ? 'active' : ''}`}
            onClick={() => onSelectSpecialty(spec)}
          >
            {spec === 'ALL' ? 'All Specialties' : spec}
          </button>
        ))}
      </div>

      <div className="fee-filter">
        <label htmlFor="feeRange">
          Max Consultation Fee: <strong>₹{maxFee || 'Any'}</strong>
        </label>
        <input
          id="feeRange"
          type="range"
          min="300"
          max="1500"
          step="50"
          value={maxFee || 1500}
          onChange={(e) => onMaxFeeChange(e.target.value)}
        />
      </div>
    </div>
  );
};

