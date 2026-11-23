package com.healthcare.teleconsult.dto;

import com.healthcare.teleconsult.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateAppointmentStatusRequest {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    @Size(max = 2000, message = "Consultation notes must not exceed 2000 characters")
    private String consultationNotes;

    public UpdateAppointmentStatusRequest() {
    }

    public UpdateAppointmentStatusRequest(AppointmentStatus status, String consultationNotes) {
        this.status = status;
        this.consultationNotes = consultationNotes;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getConsultationNotes() {
        return consultationNotes;
    }

    public void setConsultationNotes(String consultationNotes) {
        this.consultationNotes = consultationNotes;
    }
}

