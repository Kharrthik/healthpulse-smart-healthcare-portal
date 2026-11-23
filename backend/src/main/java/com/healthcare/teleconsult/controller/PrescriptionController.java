package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.dto.ApiResponse;
import com.healthcare.teleconsult.dto.PrescriptionCreateRequest;
import com.healthcare.teleconsult.dto.PrescriptionResponseDto;
import com.healthcare.teleconsult.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping("/consultation/{consultationId}")
    public ResponseEntity<ApiResponse<PrescriptionResponseDto>> createPrescription(
            @PathVariable Long consultationId,
            @Valid @RequestBody PrescriptionCreateRequest request) {
        PrescriptionResponseDto dto = prescriptionService.createPrescription(consultationId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Prescription issued successfully", dto));
    }

    @GetMapping("/consultation/{consultationId}")
    public ResponseEntity<ApiResponse<PrescriptionResponseDto>> getPrescriptionByConsultation(
            @PathVariable Long consultationId) {
        PrescriptionResponseDto dto = prescriptionService.getPrescriptionByConsultationId(consultationId);
        return ResponseEntity.ok(ApiResponse.ok("Prescription retrieved", dto));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<PrescriptionResponseDto>>> getPrescriptionsByDoctor(
            @PathVariable Long doctorId) {
        List<PrescriptionResponseDto> list = prescriptionService.getPrescriptionsByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Prescriptions retrieved", list));
    }
}

