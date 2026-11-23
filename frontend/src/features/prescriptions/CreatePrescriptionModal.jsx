import React, { useState } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import './prescriptions.css';

export const CreatePrescriptionModal = ({ consultation, doctorId, onClose, onSuccess, notify }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [adviceNotes, setAdviceNotes] = useState('Stay well hydrated. Rest and contact clinic if symptoms worsen.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Diagnosis is required');
      return;
    }

    const validMeds = medicines.filter(m => m.name.trim() !== '');
    if (validMeds.length === 0) {
      setError('Please provide at least one medicine name');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await prescriptionService.createPrescription(consultation.id, {
        doctorId: doctorId || consultation.doctorId || 1,
        diagnosis: diagnosis.trim(),
        medicinesJson: JSON.stringify(validMeds),
        adviceNotes: adviceNotes.trim()
      });

      notify('Digital Prescription issued and consultation marked completed!', 'success');
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card prescription-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Issue Digital Prescription</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Consultation #{consultation.id} • Patient: <strong>{consultation.patientName}</strong>
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="patient-complaint-summary">
              <strong>Patient Reported:</strong> {consultation.chiefComplaint}
            </div>

            <div className="form-group">
              <label htmlFor="rxDiagnosis">Clinical Diagnosis *</label>
              <input
                id="rxDiagnosis"
                type="text"
                className={`form-input ${error && !diagnosis ? 'is-invalid' : ''}`}
                placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>

            <div className="medicines-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Prescribed Medications</label>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleAddMedicine}>
                  + Add Medication
                </button>
              </div>

              {medicines.map((med, idx) => (
                <div key={idx} className="med-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Medicine name & strength (e.g. Paracetamol 650mg)"
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dosage (e.g. 1 tab)"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Frequency (e.g. Twice daily after meals)"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Duration (e.g. 5 days)"
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-med"
                      onClick={() => handleRemoveMedicine(idx)}
                      title="Remove medicine"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="adviceNotes">Physician Advice & Follow-Up Notes</label>
              <textarea
                id="adviceNotes"
                className="form-textarea"
                rows="3"
                value={adviceNotes}
                onChange={(e) => setAdviceNotes(e.target.value)}
              ></textarea>
            </div>

            {error && <span className="error-text">{error}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Signing & Saving...' : 'Sign & Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

