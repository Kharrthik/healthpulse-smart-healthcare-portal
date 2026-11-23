import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { DoctorCard } from './DoctorCard';
import { DoctorFilters } from './DoctorFilters';
import './doctors.css';

export const DoctorList = ({ onBookDoctor, notify }) => {
  const { isDoctor } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxFee, setMaxFee] = useState('');

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getDoctors({
        specialization: selectedSpecialty,
        search: searchQuery,
        maxFee: maxFee || undefined
      });
      setDoctors(data || []);
    } catch (err) {
      notify('Failed to load doctors list. Please ensure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty, searchQuery, maxFee]);

  return (
    <section className="doctors-section container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Verified Doctors & TeleConsultants</h1>
          <p className="section-desc">
            Connect with board-certified healthcare professionals with AI-assisted pre-consultation briefings.
          </p>
        </div>
      </div>

      <DoctorFilters
        selectedSpecialty={selectedSpecialty}
        onSelectSpecialty={setSelectedSpecialty}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        maxFee={maxFee}
        onMaxFeeChange={setMaxFee}
      />

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available healthcare specialists...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="empty-state">
          <p>No doctors found matching your criteria. Try adjusting filters or search term.</p>
        </div>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={onBookDoctor} isDoctor={isDoctor} />
          ))}
        </div>
      )}
    </section>
  );
};

