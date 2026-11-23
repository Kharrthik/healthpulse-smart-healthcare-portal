package com.healthcare.teleconsult.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class CreateAppointmentRequest {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long patientId;

    @NotBlank(message = "Patient name is required")
    @Size(min = 2, max = 120, message = "Patient name must be between 2 and 120 characters")
    private String patientName;

    @NotBlank(message = "Patient email is required")
    @Email(message = "Please provide a valid email address")
    private String patientEmail;

    @NotBlank(message = "Patient phone is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must contain between 10 and 15 digits")
    private String patientPhone;

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment date and time must be scheduled in the future")
    @JsonAlias({"appointmentTime", "appointment_time"})
    private LocalDateTime appointmentDateTime;

    @JsonAlias({"consultationType", "consultation_type", "consultationMode", "consultation_mode"})
    private String consultationType = "TELECONSULTATION";

    @NotBlank(message = "Reason for appointment is required")
    @Size(min = 5, max = 500, message = "Reason must be between 5 and 500 characters")
    private String reason;

    public CreateAppointmentRequest() {
    }

    public CreateAppointmentRequest(Long doctorId, Long patientId, String patientName,
                                    String patientEmail, String patientPhone,
                                    LocalDateTime appointmentDateTime, String reason) {
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.patientName = patientName;
        this.patientEmail = patientEmail;
        this.patientPhone = patientPhone;
        this.appointmentDateTime = appointmentDateTime;
        this.reason = reason;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
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

    public String getConsultationType() {
        return consultationType;
    }

    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

