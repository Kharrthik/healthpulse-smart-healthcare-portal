package com.healthcare.teleconsult.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_preconsultation_notes")
public class AiPreConsultationNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "consultation_id", nullable = false, unique = true)
    private Consultation consultation;

    @Column(name = "preliminary_assessment", columnDefinition = "TEXT")
    private String preliminaryAssessment;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_triage", length = 20)
    private TriageCategory recommendedTriage = TriageCategory.ROUTINE;

    @Column(name = "potential_red_flags", columnDefinition = "TEXT")
    private String potentialRedFlags;

    @Column(name = "suggested_questions", columnDefinition = "TEXT")
    private String suggestedQuestions;

    @Column(name = "patient_friendly_summary", columnDefinition = "TEXT")
    private String patientFriendlySummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AiPreConsultationNote() {
    }

    public AiPreConsultationNote(Consultation consultation, String preliminaryAssessment,
                                 TriageCategory recommendedTriage, String potentialRedFlags,
                                 String suggestedQuestions, String patientFriendlySummary) {
        this.consultation = consultation;
        this.preliminaryAssessment = preliminaryAssessment;
        this.recommendedTriage = recommendedTriage != null ? recommendedTriage : TriageCategory.ROUTINE;
        this.potentialRedFlags = potentialRedFlags;
        this.suggestedQuestions = suggestedQuestions;
        this.patientFriendlySummary = patientFriendlySummary;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Consultation getConsultation() {
        return consultation;
    }

    public void setConsultation(Consultation consultation) {
        this.consultation = consultation;
    }

    public String getPreliminaryAssessment() {
        return preliminaryAssessment;
    }

    public void setPreliminaryAssessment(String preliminaryAssessment) {
        this.preliminaryAssessment = preliminaryAssessment;
    }

    public TriageCategory getRecommendedTriage() {
        return recommendedTriage;
    }

    public void setRecommendedTriage(TriageCategory recommendedTriage) {
        this.recommendedTriage = recommendedTriage;
    }

    public String getPotentialRedFlags() {
        return potentialRedFlags;
    }

    public void setPotentialRedFlags(String potentialRedFlags) {
        this.potentialRedFlags = potentialRedFlags;
    }

    public String getSuggestedQuestions() {
        return suggestedQuestions;
    }

    public void setSuggestedQuestions(String suggestedQuestions) {
        this.suggestedQuestions = suggestedQuestions;
    }

    public String getPatientFriendlySummary() {
        return patientFriendlySummary;
    }

    public void setPatientFriendlySummary(String patientFriendlySummary) {
        this.patientFriendlySummary = patientFriendlySummary;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

