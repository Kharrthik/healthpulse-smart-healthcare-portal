package com.healthcare.teleconsult.dto;

import com.healthcare.teleconsult.entity.Appointment;
import com.healthcare.teleconsult.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AppointmentResponse {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String doctorQualification;
    private BigDecimal consultationFee;

    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    private LocalDateTime appointmentDateTime;
    private AppointmentStatus status;
    private String reason;
    private String consultationNotes;
    private String consultationType;

    public static class DoctorSummary {
        private Long id;
        private String name;
        private String specialization;

        public DoctorSummary() {}
        public DoctorSummary(Long id, String name, String specialization) {
            this.id = id;
            this.name = name;
            this.specialization = specialization;
        }
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getSpecialization() { return specialization; }
    }

    private DoctorSummary doctor;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AppointmentResponse() {
    }

    public static AppointmentResponse fromEntity(Appointment appointment) {
        if (appointment == null) return null;

        AppointmentResponse res = new AppointmentResponse();
        res.setId(appointment.getId());

        if (appointment.getDoctor() != null) {
            res.setDoctorId(appointment.getDoctor().getId());
            if (appointment.getDoctor().getUser() != null) {
                res.setDoctorName(appointment.getDoctor().getUser().getFullName());
            }
            res.setDoctorSpecialization(appointment.getDoctor().getSpecialization());
            res.setDoctorQualification(appointment.getDoctor().getQualification());
            res.setConsultationFee(appointment.getDoctor().getConsultationFee());
        }

        if (appointment.getPatient() != null) {
            res.setPatientId(appointment.getPatient().getId());
        }

        res.setPatientName(appointment.getPatientName());
        res.setPatientEmail(appointment.getPatientEmail());
        res.setPatientPhone(appointment.getPatientPhone());
        res.setAppointmentDateTime(appointment.getAppointmentDateTime());
        res.setStatus(appointment.getStatus());
        res.setReason(appointment.getReason());
        res.setConsultationNotes(appointment.getConsultationNotes());
        res.setConsultationType(appointment.getConsultationType());
        if (appointment.getDoctor() != null) {
            String dName = appointment.getDoctor().getUser() != null ? appointment.getDoctor().getUser().getFullName() : "Doctor #" + appointment.getDoctor().getId();
            res.doctor = new DoctorSummary(appointment.getDoctor().getId(), dName, appointment.getDoctor().getSpecialization());
        }
        res.setCreatedAt(appointment.getCreatedAt());
        res.setUpdatedAt(appointment.getUpdatedAt());

        return res;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorSpecialization() {
        return doctorSpecialization;
    }

    public void setDoctorSpecialization(String doctorSpecialization) {
        this.doctorSpecialization = doctorSpecialization;
    }

    public String getDoctorQualification() {
        return doctorQualification;
    }

    public void setDoctorQualification(String doctorQualification) {
        this.doctorQualification = doctorQualification;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getPatientEmail() {
        return patientEmail;
    }

    public void setPatientEmail(String patientEmail) {
        this.patientEmail = patientEmail;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public LocalDateTime getAppointmentDateTime() {
        return appointmentDateTime;
    }

    public void setAppointmentDateTime(LocalDateTime appointmentDateTime) {
        this.appointmentDateTime = appointmentDateTime;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getConsultationNotes() {
        return consultationNotes;
    }

    public void setConsultationNotes(String consultationNotes) {
        this.consultationNotes = consultationNotes;
    }

    public String getConsultationType() {
        return consultationType != null ? consultationType : "TELECONSULTATION";
    }

    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }

    public DoctorSummary getDoctor() {
        if (doctor != null) return doctor;
        return new DoctorSummary(doctorId, doctorName, doctorSpecialization);
    }

    public void setDoctor(DoctorSummary doctor) {
        this.doctor = doctor;
    }

    public LocalDateTime getAppointmentTime() {
        return appointmentDateTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

