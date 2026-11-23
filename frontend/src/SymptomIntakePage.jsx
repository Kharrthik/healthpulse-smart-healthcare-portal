import React, { useState } from 'react';
import { aiApi } from './services/api';

/**
 * SymptomIntakePage Component
 * Provides an intelligent pre-consultation intake form powered by the Groq AI engine.
 * Prepares the patient with clinical triage insights and questions for their specialist.
 */
export const SymptomIntakePage = ({ onSelectDoctor, notify }) => {
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptomsDescription: '',
    durationDays: '3',
    severity: 'MODERATE'
  });

  const [submittedConcern, setSubmittedConcern] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required.';
    } else if (formData.chiefComplaint.trim().length < 4) {
      newErrors.chiefComplaint = 'Please enter at least 4 characters.';
    }

    if (!formData.symptomsDescription.trim()) {
      newErrors.symptomsDescription = 'Please describe your symptoms.';
    } else if (formData.symptomsDescription.trim().length < 8) {
      newErrors.symptomsDescription = 'Please describe symptoms in more detail (at least 8 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);
    setTriageResult(null);
    setSubmittedConcern(formData.chiefComplaint.trim());

    try {
      const data = await aiApi.previewTriage({
        chiefComplaint: formData.chiefComplaint.trim(),
        symptomsDescription: formData.symptomsDescription.trim(),
        durationDays: parseInt(formData.durationDays, 10),
        severity: formData.severity
      });

      setTriageResult(data);
      if (notify) notify('AI Clinical Pre-Consultation Summary ready!', 'success');
    } catch (err) {
      const errMsg = err.message || 'AI Triage evaluation failed. Please check backend connection.';
      setApiError(errMsg);
      if (notify) notify(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Robust field mapping supporting both backend DTO formats (Groq DTO & frontend alias conventions)
  const clinicalSummary = triageResult
    ? (triageResult.clinicalSummary || triageResult.preliminaryAssessment || triageResult.patientFriendlySummary || 'Clinical triage summary prepared.')
    : '';

  const triageCategory = triageResult
    ? (triageResult.triageCategory || triageResult.recommendedTriage || 'ROUTINE')
    : 'ROUTINE';

  const redFlagWarnings = triageResult
    ? (triageResult.redFlagWarnings || triageResult.potentialRedFlags || [])
    : [];

  const suggestedQuestionsForDoctor = triageResult
    ? (triageResult.suggestedQuestionsForDoctor || triageResult.suggestedQuestions || [])
    : [];

  const patientFriendlySummary = triageResult?.patientFriendlySummary;

  const getTriageBadgeClass = (category) => {
    const cat = String(category || '').toUpperCase();
    if (cat.includes('EMERG')) return 'badge-cancelled';
    if (cat.includes('URG')) return 'badge-pending';
    return 'badge-completed';
  };

  return (
    <section className="container symptom-intake-page">
      <header className="page-hero">
        <h2 className="page-title">✨ AI Pre-Consultation Symptom Intake</h2>
        <p className="page-subtitle">
          Describe your symptoms to receive an instant clinical briefing, recommended specialist category, and doctor preparation checklist before booking.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Left Column: Symptom Intake Form */}
        <article className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.4rem' }}>📝</span>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Symptom Information</h3>
          </div>

          <form onSubmit={handleTriageSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="chiefComplaint">
                Primary Concern / Chief Complaint *
              </label>
              <input
                id="chiefComplaint"
                name="chiefComplaint"
                type="text"
                required
                minLength={4}
                maxLength={120}
                className={`form-control ${errors.chiefComplaint ? 'is-invalid' : ''}`}
                placeholder="e.g. Typhoid or high fever with chills"
                value={formData.chiefComplaint}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.chiefComplaint && (
                <span className="invalid-feedback">{errors.chiefComplaint}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="symptomsDescription">
                Detailed Description of Symptoms *
              </label>
              <textarea
                id="symptomsDescription"
                name="symptomsDescription"
                rows={4}
                required
                minLength={8}
                className={`form-control ${errors.symptomsDescription ? 'is-invalid' : ''}`}
                placeholder="When did this start? What makes it better or worse? Any other symptoms like nausea, fever, headache, or fatigue?"
                value={formData.symptomsDescription}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.symptomsDescription && (
                <span className="invalid-feedback">{errors.symptomsDescription}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="durationDays">
                  Duration (Days)
                </label>
                <input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  min="1"
                  max="365"
                  className="form-control"
                  value={formData.durationDays}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="severity">
                  Perceived Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  className="form-control"
                  value={formData.severity}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="MILD">Mild - Manageable</option>
                  <option value="MODERATE">Moderate - Discomforting</option>
                  <option value="SEVERE">Severe - Urgent Attention</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></span>
                  Evaluating with Clinical AI...
                </>
              ) : (
                '✨ Generate Clinical Triage Briefing'
              )}
            </button>
          </form>
        </article>

        {/* Right Column: Clinical Pre-Consultation Summary Panel */}
        <article className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>Clinical Pre-Consultation Summary</h3>
            {triageResult && (
              <span className={`badge ${getTriageBadgeClass(triageCategory)}`}>
                {String(triageCategory).toUpperCase()}
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner"></div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-main)' }}>Synthesizing Clinical Intake...</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: 0 }}>
                Groq AI is analyzing symptom patterns, checking clinical safety guidelines, and preparing your doctor briefing.
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && apiError && (
            <div className="alert alert-danger" style={{ margin: '16px 0' }}>
              <div>
                <strong>⚠️ AI Triage Evaluation Unavailable:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{apiError}</p>
              </div>
            </div>
          )}

          {/* Empty / Initial State */}
          {!loading && !triageResult && !apiError && (
            <div style={{ textAlign: 'center', padding: '40px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🩺</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-main)' }}>Ready for Symptom Assessment</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', lineHeight: 1.5, marginBottom: '20px' }}>
                Complete the symptom details on the left and click <strong>&quot;Generate Clinical Triage Briefing&quot;</strong>.
              </p>
              <div style={{ background: '#ffffff', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '14px 18px', textAlign: 'left', width: '100%', maxWidth: '360px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '6px' }}>✅ Clinical triage impression &amp; timeline synthesis</div>
                <div style={{ marginBottom: '6px' }}>✅ Early safety red flags to monitor</div>
                <div>✅ Structured questions to ask your consulting doctor</div>
              </div>
            </div>
          )}

          {/* Populated Triage Results */}
          {!loading && triageResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Patient Reported Concern Banner */}
              {submittedConcern && (
                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.88rem', borderLeft: '3px solid var(--secondary)' }}>
                  <strong>Patient-Reported Concern:</strong> {submittedConcern}
                </div>
              )}

              {/* Clinical Impression */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Clinical Impression:
                </strong>
                <p style={{ marginTop: '6px', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {clinicalSummary}
                </p>
              </div>

              {/* Patient-Friendly Guidance (if distinct) */}
              {patientFriendlySummary && patientFriendlySummary !== clinicalSummary && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    💡 Patient Consultation Guidance:
                  </strong>
                  <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {patientFriendlySummary}
                  </p>
                </div>
              )}

              {/* Red Flag Warnings */}
              {redFlagWarnings.length > 0 && (
                <div className="alert alert-danger" style={{ marginBottom: 0, fontSize: '0.88rem' }}>
                  <div>
                    <strong>⚠️ Red Flag Symptoms to Monitor:</strong>
                    <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                      {redFlagWarnings.map((warning, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggested Questions for Doctor */}
              {suggestedQuestionsForDoctor.length > 0 && (
                <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--secondary)' }}>
                    📋 Recommended Questions for Your Doctor:
                  </strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {suggestedQuestionsForDoctor.map((q, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Safety Disclaimer */}
              <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', marginTop: 'auto' }}>
                <strong>⚠️ Notice:</strong> This pre-consultation briefing is generated by an AI assistant to prepare your consultation notes. It is NOT a medical diagnosis or treatment plan. If you experience severe chest pain, shortness of breath, sudden weakness, or high fever, seek emergency medical attention immediately.
              </div>

              {/* Action Button */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onSelectDoctor}
                >
                  Proceed to Doctor Selection ➔
                </button>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default SymptomIntakePage;
