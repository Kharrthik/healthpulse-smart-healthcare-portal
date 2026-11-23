import React, { useState, useEffect } from 'react';
import { consultationService } from '../../services/consultationService';
import { getTriageBadgeClass } from '../../utils/formatters';
import './ai-triage.css';

export const AiTriageModal = ({ consultationId, isDoctor, onClose, notify }) => {
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrep = async () => {
      setLoading(true);
      try {
        const data = await consultationService.getAiPrep(consultationId);
        setPrepData(data);
      } catch (err) {
        notify('Failed to load AI pre-consultation notes.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchPrep();
    }
  }, [consultationId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ai-triage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header ai-modal-header">
          <div className="ai-title-wrap">
            <span className="ai-sparkle-icon">✨</span>
            <div>
              <h2 className="modal-title">Groq AI Pre-Consultation Summary</h2>
              <p style={{ fontSize: '0.8rem', color: '#6d28d9' }}>
                Automated clinical synthesis & triage briefing via Groq (openai/gpt-oss-120b)
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Synthesizing clinical intake with Groq AI...</p>
            </div>
          ) : !prepData ? (
            <p className="empty-state">No AI notes available for this appointment.</p>
          ) : (
            <div className="ai-content-stack">
              {/* Triage Banner */}
              <div className="triage-status-banner">
                <span className="triage-lead">Recommended Triage Priority:</span>
                <span className={`badge ${getTriageBadgeClass(prepData.recommendedTriage)}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {prepData.recommendedTriage}
                </span>
              </div>

              {/* Red Flags Alert Box */}
              {prepData.potentialRedFlags && prepData.potentialRedFlags.length > 0 && (
                <div className="red-flag-alert-box">
                  <div className="alert-header">
                    <span className="alert-icon">⚠️</span>
                    <strong>Potential Red Flags & Safety Checks</strong>
                  </div>
                  <ul className="alert-list">
                    {prepData.potentialRedFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preliminary Assessment */}
              <div className="ai-section">
                <h4 className="ai-section-title">Clinical Assessment Summary</h4>
                <div className="ai-text-box">
                  {prepData.preliminaryAssessment}
                </div>
              </div>

              {/* Doctor Probing Questions (Highlighted for Doctors) */}
              <div className="ai-section">
                <h4 className="ai-section-title">
                  {isDoctor ? 'Suggested Clinical Probing Questions' : 'What Your Doctor May Ask'}
                </h4>
                <div className="suggested-questions-list">
                  {prepData.suggestedQuestions && prepData.suggestedQuestions.map((q, idx) => (
                    <div key={idx} className="question-bubble">
                      <span className="q-number">Q{idx + 1}</span>
                      <p className="q-text">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Friendly Summary */}
              <div className="ai-section">
                <h4 className="ai-section-title">Patient Plain-Language Guide</h4>
                <div className="patient-guide-box">
                  {prepData.patientFriendlySummary}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
};

