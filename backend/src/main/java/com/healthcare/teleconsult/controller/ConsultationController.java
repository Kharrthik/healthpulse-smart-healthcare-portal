package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.dto.ApiResponse;
import com.healthcare.teleconsult.dto.ConsultationBookingRequest;
import com.healthcare.teleconsult.dto.ConsultationResponseDto;
import com.healthcare.teleconsult.entity.ConsultationStatus;
import com.healthcare.teleconsult.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> bookConsultation(
            @Valid @RequestBody ConsultationBookingRequest request) {
        ConsultationResponseDto dto = consultationService.bookConsultation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Consultation scheduled successfully", dto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsultationResponseDto>>> listConsultations(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) ConsultationStatus status) {

        List<ConsultationResponseDto> results;
        if (patientId != null) {
            results = consultationService.getConsultationsForPatient(patientId);
        } else if (doctorId != null) {
            results = consultationService.getConsultationsForDoctor(doctorId, status);
        } else {
            results = consultationService.getAllConsultations();
        }
        return ResponseEntity.ok(ApiResponse.ok("Found " + results.size() + " consultations", results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> getConsultation(@PathVariable Long id) {
        ConsultationResponseDto dto = consultationService.getConsultationById(id);
        return ResponseEntity.ok(ApiResponse.ok("Consultation retrieved", dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        ConsultationStatus status = ConsultationStatus.valueOf(statusStr.toUpperCase());
        ConsultationResponseDto updated = consultationService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated to " + status, updated));
    }

    @GetMapping("/{id}/ai-prep")
    public ResponseEntity<ApiResponse<AiPrepResponseDto>> getAiPrep(@PathVariable Long id) {
        AiPrepResponseDto prep = consultationService.getOrCreateAiPrep(id);
        return ResponseEntity.ok(ApiResponse.ok("AI pre-consultation summary ready", prep));
    }
}

