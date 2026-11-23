package com.healthcare.teleconsult.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PrescriptionCreateRequest {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    @NotBlank(message = "Medicines list in JSON format is required")
    private String medicinesJson;

    private String adviceNotes;

    public PrescriptionCreateRequest() {
    }

    public PrescriptionCreateRequest(Long doctorId, String diagnosis, String medicinesJson, String adviceNotes) {
        this.doctorId = doctorId;
        this.diagnosis = diagnosis;
        this.medicinesJson = medicinesJson;
        this.adviceNotes = adviceNotes;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getMedicinesJson() {
        return medicinesJson;
    }

    public void setMedicinesJson(String medicinesJson) {
        this.medicinesJson = medicinesJson;
    }

    public String getAdviceNotes() {
        return adviceNotes;
    }

    public void setAdviceNotes(String adviceNotes) {
        this.adviceNotes = adviceNotes;
    }
}

