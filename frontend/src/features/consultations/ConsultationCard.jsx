import React from 'react';
import { formatDateTime, getStatusBadgeClass } from '../../utils/formatters';

export const ConsultationCard = ({ consultation, isDoctor, onViewAiPrep, onOpenPrescription, onIssuePrescription }) => {
  return (
    <article className="consultation-card">
      <div className="card-top">
        <div className="card-person-info">
          <span className="person-label">{isDoctor ? 'Patient' : 'Consultant'}</span>
          <h3 className="person-name">
            {isDoctor ? consultation.patientName : consultation.doctorName}
          </h3>
          <span className="person-sub">
            {isDoctor ? `Phone: ${consultation.patientPhone || 'N/A'}` : consultation.doctorSpecialization}
          </span>
        </div>

        <div className="status-container">
          <span className={`badge ${getStatusBadgeClass(consultation.status)}`}>
            {consultation.status}
          </span>
          <span className="appointment-time">{formatDateTime(consultation.scheduledAt)}</span>
        </div>
      </div>

      <div className="complaint-box">
        <strong className="complaint-title">Chief Complaint:</strong>
        <p className="complaint-text">{consultation.chiefComplaint}</p>
        {consultation.symptomsDescription && (
          <p className="symptoms-text">
            <strong>Intake Notes:</strong> {consultation.symptomsDescription}
          </p>
        )}
      </div>

      <div className="card-actions">
        {/* AI Briefing Button */}
        <button
          className="btn btn-purple btn-sm"
          onClick={() => onViewAiPrep(consultation.id)}
        >
          ✨ AI Clinical Prep
        </button>

        {/* Prescription Action */}
        {consultation.hasPrescription ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenPrescription(consultation.id)}
          >
            📄 View Digital Rx
          </button>
        ) : isDoctor && consultation.status !== 'CANCELLED' ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onIssuePrescription(consultation)}
          >
            ✍️ Issue Prescription
          </button>
        ) : null}
      </div>
    </article>
  );
};

