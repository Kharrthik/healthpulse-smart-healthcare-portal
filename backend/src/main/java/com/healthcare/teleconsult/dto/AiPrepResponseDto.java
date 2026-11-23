package com.healthcare.teleconsult.dto;

import com.healthcare.teleconsult.entity.TriageCategory;
import java.time.LocalDateTime;
import java.util.List;

public class AiPrepResponseDto {

    private Long consultationId;
    private String preliminaryAssessment;
    private TriageCategory recommendedTriage;
    private List<String> potentialRedFlags;
    private List<String> suggestedQuestions;
    private String patientFriendlySummary;
    private LocalDateTime generatedAt;

    public AiPrepResponseDto() {
        this.generatedAt = LocalDateTime.now();
    }

    public AiPrepResponseDto(Long consultationId, String preliminaryAssessment,
                             TriageCategory recommendedTriage, List<String> potentialRedFlags,
                             List<String> suggestedQuestions, String patientFriendlySummary) {
        this.consultationId = consultationId;
        this.preliminaryAssessment = preliminaryAssessment;
        this.recommendedTriage = recommendedTriage;
        this.potentialRedFlags = potentialRedFlags;
        this.suggestedQuestions = suggestedQuestions;
        this.patientFriendlySummary = patientFriendlySummary;
        this.generatedAt = LocalDateTime.now();
    }

    public Long getConsultationId() {
        return consultationId;
    }

    public void setConsultationId(Long consultationId) {
        this.consultationId = consultationId;
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

    public List<String> getPotentialRedFlags() {
        return potentialRedFlags;
    }

    public void setPotentialRedFlags(List<String> potentialRedFlags) {
        this.potentialRedFlags = potentialRedFlags;
    }

    public List<String> getSuggestedQuestions() {
        return suggestedQuestions;
    }

    public void setSuggestedQuestions(List<String> suggestedQuestions) {
        this.suggestedQuestions = suggestedQuestions;
    }

    public String getPatientFriendlySummary() {
        return patientFriendlySummary;
    }

    public void setPatientFriendlySummary(String patientFriendlySummary) {
        this.patientFriendlySummary = patientFriendlySummary;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    // Compatibility aliases for frontend SymptomIntakePage and alternate client naming
    public String getClinicalSummary() {
        return preliminaryAssessment;
    }

    public void setClinicalSummary(String clinicalSummary) {
        this.preliminaryAssessment = clinicalSummary;
    }

    public String getTriageCategory() {
        return recommendedTriage != null ? recommendedTriage.name() : "ROUTINE";
    }

    public void setTriageCategory(String triageCategory) {
        try {
            this.recommendedTriage = TriageCategory.valueOf(triageCategory);
        } catch (Exception e) {
            this.recommendedTriage = TriageCategory.ROUTINE;
        }
    }

    public List<String> getRedFlagWarnings() {
        return potentialRedFlags;
    }

    public void setRedFlagWarnings(List<String> redFlagWarnings) {
        this.potentialRedFlags = redFlagWarnings;
    }

    public List<String> getSuggestedQuestionsForDoctor() {
        return suggestedQuestions;
    }

    public void setSuggestedQuestionsForDoctor(List<String> suggestedQuestionsForDoctor) {
        this.suggestedQuestions = suggestedQuestionsForDoctor;
    }
}

