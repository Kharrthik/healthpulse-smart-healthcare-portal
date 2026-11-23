import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { formatDate } from '../../utils/formatters';
import './prescriptions.css';

export const PrescriptionViewModal = ({ consultationId, onClose, notify }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRx = async () => {
      setLoading(true);
      try {
        const data = await prescriptionService.getPrescriptionByConsultation(consultationId);
        setPrescription(data);
      } catch (err) {
        notify('Failed to load prescription.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchRx();
    }
  }, [consultationId]);

  let medicinesList = [];
  if (prescription?.medicinesJson) {
    try {
      medicinesList = JSON.parse(prescription.medicinesJson);
    } catch (e) {
      medicinesList = [];
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card prescription-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Official Tele-Prescription</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body printable-rx-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading prescription record...</p>
            </div>
          ) : !prescription ? (
            <p className="empty-state">No prescription record found.</p>
          ) : (
            <div className="rx-paper">
              {/* Rx Header */}
              <div className="rx-letterhead">
                <div className="rx-clinic-brand">
                  <span className="rx-logo">✚</span>
                  <div>
                    <h3 className="rx-clinic-name">HealthPulse Telemedicine Network</h3>
                    <span className="rx-clinic-sub">Digital Consultation & Care Delivery</span>
                  </div>
                </div>
                <div className="rx-meta-info">
                  <span>Rx ID: <strong>#RX-{prescription.id}</strong></span>
                  <span>Date: <strong>{formatDate(prescription.createdAt)}</strong></span>
                </div>
              </div>

              <div className="rx-divider"></div>

              {/* Doctor & Patient Info */}
              <div className="rx-parties-grid">
                <div className="rx-party">
                  <span className="rx-party-label">PRESCRIBING DOCTOR</span>
                  <h4 className="rx-party-name">{prescription.doctorName}</h4>
                  <span className="rx-party-sub">{prescription.doctorSpecialization}</span>
                  <span className="rx-party-sub">{prescription.doctorQualification}</span>
                </div>

                <div className="rx-party">
                  <span className="rx-party-label">PATIENT DETAILS</span>
                  <h4 className="rx-party-name">{prescription.patientName}</h4>
                  <span className="rx-party-sub">Consultation Ref: #{prescription.consultationId}</span>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="rx-diagnosis-box">
                <span className="rx-section-label">DIAGNOSIS</span>
                <p className="rx-diagnosis-text">{prescription.diagnosis}</p>
              </div>

              {/* Medicines Table */}
              <div className="rx-meds-container">
                <div className="rx-symbol">℞</div>
                <table className="rx-meds-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicinesList.map((m, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.dosage || '-'}</td>
                        <td>{m.frequency || '-'}</td>
                        <td>{m.duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advice */}
              {prescription.adviceNotes && (
                <div className="rx-advice-box">
                  <span className="rx-section-label">GENERAL ADVICE & INSTRUCTIONS</span>
                  <p className="rx-advice-text">{prescription.adviceNotes}</p>
                </div>
              )}

              {/* Footer Sign-off */}
              <div className="rx-footer-signoff">
                <span className="rx-signed-tag">Electronically Verified & Signed</span>
                <span className="rx-signed-by">{prescription.doctorName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={loading || !prescription}>
            🖨️ Print Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

