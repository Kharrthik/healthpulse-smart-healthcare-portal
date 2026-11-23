import React, { useState, useEffect } from 'react';
import { doctorApi } from './services/api';
import DoctorCard from './DoctorCard';

const SPECIALIZATIONS = [
  'All',
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Neurology',
  'Orthopedics'
];

/**
 * DoctorsPage Component
 * Fetches real doctor directory from Spring Boot REST API,
 * enables filtering by clinical specialization, and handles loading/error states.
 */
export const DoctorsPage = ({ onBookDoctor, notify }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors from backend whenever filter changes
  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
      setLoading(true);
      setError(null);
      try {
        const filterParam = selectedSpecialty === 'All' ? '' : selectedSpecialty;
        const data = await doctorApi.getAll(filterParam);
        if (isMounted) {
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load doctors from backend.');
          if (notify) notify(err.message || 'Failed to load doctors', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, [selectedSpecialty]);

  const doctorsList = Array.isArray(doctors) ? doctors : [];

  return (
    <section className="container doctors-page">
      <header className="page-hero">
        <h2 className="page-title">Find Specialized Healthcare Providers</h2>
        <p className="page-subtitle">
          Connect with verified medical specialists for virtual tele-consultations, prescription management, and clinical guidance.
        </p>

        {/* Specialization Filter Chips */}
        <nav className="filter-bar" aria-label="Filter doctors by specialization">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              className={`filter-chip ${selectedSpecialty === spec ? 'active' : ''}`}
              onClick={() => setSelectedSpecialty(spec)}
            >
              {spec}
            </button>
          ))}
        </nav>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="state-container" role="status">
          <div className="spinner"></div>
          <h3 className="state-title">Loading Doctor Directory</h3>
          <p className="state-desc">Fetching verified specialists from the clinical registry...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <div>
            <strong>Error connecting to server:</strong> {error}
            <div style={{ marginTop: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedSpecialty(selectedSpecialty)}
              >
                🔄 Retry Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && doctorsList.length === 0 && (
        <div className="state-container">
          <div className="state-icon">🩺</div>
          <h3 className="state-title">No Specialists Found</h3>
          <p className="state-desc">
            No doctors found matching "{selectedSpecialty}". Try selecting "All" or a different medical category.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedSpecialty('All')}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Success State: Doctor Grid */}
      {!loading && !error && doctorsList.length > 0 && (
        <div className="doctors-grid">
          {doctorsList.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBook={onBookDoctor}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default DoctorsPage;
