package com.healthcare.teleconsult.service;

import com.healthcare.teleconsult.dto.PrescriptionCreateRequest;
import com.healthcare.teleconsult.dto.PrescriptionResponseDto;
import com.healthcare.teleconsult.entity.Consultation;
import com.healthcare.teleconsult.entity.ConsultationStatus;
import com.healthcare.teleconsult.entity.Doctor;
import com.healthcare.teleconsult.entity.Prescription;
import com.healthcare.teleconsult.exception.BadRequestException;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationService consultationService;
    private final DoctorService doctorService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               ConsultationService consultationService,
                               DoctorService doctorService) {
        this.prescriptionRepository = prescriptionRepository;
        this.consultationService = consultationService;
        this.doctorService = doctorService;
    }

    public PrescriptionResponseDto createPrescription(Long consultationId, PrescriptionCreateRequest request) {
        if (prescriptionRepository.findByConsultationId(consultationId).isPresent()) {
            throw new BadRequestException("A prescription has already been issued for consultation id: " + consultationId);
        }

        Consultation consultation = consultationService.getConsultationEntity(consultationId);
        Doctor doctor = doctorService.getDoctorEntity(request.getDoctorId());

        Prescription prescription = new Prescription(
                consultation,
                doctor,
                request.getDiagnosis().trim(),
                request.getMedicinesJson().trim(),
                request.getAdviceNotes() != null ? request.getAdviceNotes().trim() : ""
        );

        Prescription saved = prescriptionRepository.save(prescription);

        // Mark consultation as completed
        consultationService.updateStatus(consultationId, ConsultationStatus.COMPLETED);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponseDto getPrescriptionByConsultationId(Long consultationId) {
        Prescription prescription = prescriptionRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for consultation id: " + consultationId));
        return toDto(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponseDto> getPrescriptionsByDoctor(Long doctorId) {
        return prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private PrescriptionResponseDto toDto(Prescription p) {
        PrescriptionResponseDto dto = new PrescriptionResponseDto();
        dto.setId(p.getId());
        dto.setConsultationId(p.getConsultation().getId());
        dto.setDoctorId(p.getDoctor().getId());
        dto.setDoctorName(p.getDoctor().getUser().getFullName());
        dto.setDoctorSpecialization(p.getDoctor().getSpecialization());
        dto.setDoctorQualification(p.getDoctor().getQualification());
        dto.setPatientId(p.getConsultation().getPatient().getId());
        dto.setPatientName(p.getConsultation().getPatient().getUser().getFullName());
        dto.setDiagnosis(p.getDiagnosis());
        dto.setMedicinesJson(p.getMedicinesJson());
        dto.setAdviceNotes(p.getAdviceNotes());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}

