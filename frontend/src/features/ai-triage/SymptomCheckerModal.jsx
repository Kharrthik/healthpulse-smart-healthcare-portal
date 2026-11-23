import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { getTriageBadgeClass } from '../../utils/formatters';
import { validateChiefComplaint } from '../../utils/validation';
import './ai-triage.css';

export const SymptomCheckerModal = ({ onClose, onNavigateToDoctors, notify }) => {
  const [complaint, setComplaint] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(2);
  const [severity, setSeverity] = useState('MILD');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const valErr = validateChiefComplaint(complaint);
    if (valErr) {
      setError(valErr);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await aiService.previewTriage({
        chiefComplaint: complaint,
        symptomsDescription: description,
        durationDays: parseInt(duration, 10),
        severity: severity
      });
      setResult(data);
    } catch (err) {
      notify('Failed to generate symptom triage. Please check backend status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ai-triage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header ai-modal-header">
          <div className="ai-title-wrap">
            <span className="ai-sparkle-icon">🩺</span>
            <div>
              <h2 className="modal-title">AI Symptom Checker & Triage Guide</h2>
              <p style={{ fontSize: '0.8rem', color: '#6d28d9' }}>
                Instant guidance powered by Groq (openai/gpt-oss-120b)
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {!result ? (
            <form onSubmit={handleAnalyze}>
              <div className="form-group">
                <label htmlFor="scComplaint">What are you feeling? (Primary symptom) *</label>
                <input
                  id="scComplaint"
                  type="text"
                  className={`form-input ${error ? 'is-invalid' : ''}`}
                  placeholder="e.g. Sharp pain in lower right abdomen, or dry persistent cough"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
                {error && <span className="error-text">{error}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="scDescription">Additional Details & Context</label>
                <textarea
                  id="scDescription"
                  className="form-textarea"
                  rows="3"
                  placeholder="When did it begin? Does anything make it better or worse? Mention any fever or nausea."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="scDuration">Duration (Days)</label>
                  <input
                    id="scDuration"
                    type="number"
                    min="1"
                    className="form-input"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scSeverity">Severity</label>
                  <select
                    id="scSeverity"
                    className="form-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn btn-purple"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Analyzing with Groq AI...' : 'Analyze Symptoms Now'}
                </button>
              </div>
            </form>
          ) : (
            <div className="ai-content-stack">
              <div className="triage-status-banner">
                <span className="triage-lead">Recommended Triage Priority:</span>
                <span className={`badge ${getTriageBadgeClass(result.recommendedTriage)}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {result.recommendedTriage}
                </span>
              </div>

              {result.potentialRedFlags && result.potentialRedFlags.length > 0 && (
                <div className="red-flag-alert-box">
                  <div className="alert-header">
                    <span className="alert-icon">🚨</span>
                    <strong>Alert: Red Flag Symptoms Detected</strong>
                  </div>
                  <ul className="alert-list">
                    {result.potentialRedFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="ai-section">
                <h4 className="ai-section-title">Assessment Overview</h4>
                <div className="ai-text-box">
                  {result.preliminaryAssessment}
                </div>
              </div>

              <div className="ai-section">
                <h4 className="ai-section-title">Next Recommended Steps</h4>
                <div className="patient-guide-box">
                  {result.patientFriendlySummary}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setResult(null)}
                  style={{ flex: 1 }}
                >
                  Test Another Symptom
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onNavigateToDoctors();
                  }}
                  style={{ flex: 1 }}
                >
                  Consult a Doctor Now
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

