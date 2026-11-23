package com.healthcare.teleconsult.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "consultation_id", nullable = false, unique = true)
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false, length = 255)
    private String diagnosis;

    @Column(name = "medicines_json", nullable = false, columnDefinition = "TEXT")
    private String medicinesJson;

    @Column(name = "advice_notes", columnDefinition = "TEXT")
    private String adviceNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Prescription() {
    }

    public Prescription(Consultation consultation, Doctor doctor, String diagnosis,
                        String medicinesJson, String adviceNotes) {
        this.consultation = consultation;
        this.doctor = doctor;
        this.diagnosis = diagnosis;
        this.medicinesJson = medicinesJson;
        this.adviceNotes = adviceNotes;
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

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

