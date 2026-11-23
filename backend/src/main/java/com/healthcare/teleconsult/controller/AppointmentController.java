package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.dto.ApiResponse;
import com.healthcare.teleconsult.dto.AppointmentResponse;
import com.healthcare.teleconsult.dto.CreateAppointmentRequest;
import com.healthcare.teleconsult.dto.UpdateAppointmentStatusRequest;
import com.healthcare.teleconsult.entity.AppointmentStatus;
import com.healthcare.teleconsult.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request,
            Authentication authentication) {
        AppointmentResponse response = appointmentService.createAppointment(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Appointment booked successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String patientEmail,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            Authentication authentication) {
        List<AppointmentResponse> list = appointmentService.getAppointments(doctorId, patientEmail, patientId, status, authentication);
        return ResponseEntity.ok(ApiResponse.ok("Appointments retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id,
            Authentication authentication) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok("Appointment retrieved successfully", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request,
            Authentication authentication) {
        AppointmentResponse response = appointmentService.updateAppointmentStatus(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok("Appointment status updated successfully", response));
    }
}

