package com.healthcare.teleconsult.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.dto.ConsultationBookingRequest;
import com.healthcare.teleconsult.dto.ConsultationResponseDto;
import com.healthcare.teleconsult.entity.*;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.AiPreConsultationNoteRepository;
import com.healthcare.teleconsult.repository.ConsultationRepository;
import com.healthcare.teleconsult.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AiPreConsultationNoteRepository aiNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorService doctorService;
    private final PatientService patientService;
    private final GroqAiService groqAiService;
    private final ObjectMapper objectMapper;

    public ConsultationService(ConsultationRepository consultationRepository,
                               AiPreConsultationNoteRepository aiNoteRepository,
                               PrescriptionRepository prescriptionRepository,
                               DoctorService doctorService,
                               PatientService patientService,
                               GroqAiService groqAiService,
                               ObjectMapper objectMapper) {
        this.consultationRepository = consultationRepository;
        this.aiNoteRepository = aiNoteRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorService = doctorService;
        this.patientService = patientService;
        this.groqAiService = groqAiService;
        this.objectMapper = objectMapper;
    }

    public ConsultationResponseDto bookConsultation(ConsultationBookingRequest request) {
        Patient patient = patientService.getPatientById(request.getPatientId());
        Doctor doctor = doctorService.getDoctorEntity(request.getDoctorId());

        Consultation consultation = new Consultation(
                patient,
                doctor,
                request.getScheduledAt() != null ? request.getScheduledAt() : LocalDateTime.now().plusDays(1),
                ConsultationStatus.CONFIRMED,
                request.getChiefComplaint().trim(),
                request.getSymptomsDescription() != null ? request.getSymptomsDescription().trim() : "",
                request.getDurationDays() != null ? request.getDurationDays() : 1,
                request.getSeverity() != null ? request.getSeverity() : SeverityLevel.MODERATE
        );

        Consultation saved = consultationRepository.save(consultation);

        // Auto-generate AI Pre-Consultation note
        try {
            generateAndSaveAiPrep(saved);
        } catch (Exception e) {
            // Log but don't fail booking
        }

        return toDto(saved);
    }

    public List<ConsultationResponseDto> getConsultationsForPatient(Long patientId) {
        return consultationRepository.findByPatientIdOrderByScheduledAtDesc(patientId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ConsultationResponseDto> getConsultationsForDoctor(Long doctorId, ConsultationStatus status) {
        List<Consultation> list;
        if (status != null) {
            list = consultationRepository.findByDoctorIdAndStatusOrderByScheduledAtAsc(doctorId, status);
        } else {
            list = consultationRepository.findByDoctorIdOrderByScheduledAtDesc(doctorId);
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ConsultationResponseDto> getAllConsultations() {
        return consultationRepository.findAllByOrderByScheduledAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ConsultationResponseDto getConsultationById(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
        return toDto(consultation);
    }

    public Consultation getConsultationEntity(Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
    }

    public ConsultationResponseDto updateStatus(Long id, ConsultationStatus newStatus) {
        Consultation consultation = getConsultationEntity(id);
        consultation.setStatus(newStatus);
        Consultation updated = consultationRepository.save(consultation);
        return toDto(updated);
    }

    public AiPrepResponseDto getOrCreateAiPrep(Long consultationId) {
        return aiNoteRepository.findByConsultationId(consultationId)
                .map(this::noteToDto)
                .orElseGet(() -> {
                    Consultation consultation = getConsultationEntity(consultationId);
                    return generateAndSaveAiPrep(consultation);
                });
    }

    private AiPrepResponseDto generateAndSaveAiPrep(Consultation consultation) {
        AiPrepResponseDto prep = groqAiService.generatePreConsultationNote(
                consultation.getId(),
                consultation.getChiefComplaint(),
                consultation.getSymptomsDescription(),
                consultation.getDurationDays(),
                consultation.getSeverity()
        );

        String redFlagsJson = writeJson(prep.getPotentialRedFlags());
        String questionsJson = writeJson(prep.getSuggestedQuestions());

        AiPreConsultationNote note = new AiPreConsultationNote(
                consultation,
                prep.getPreliminaryAssessment(),
                prep.getRecommendedTriage(),
                redFlagsJson,
                questionsJson,
                prep.getPatientFriendlySummary()
        );

        aiNoteRepository.save(note);
        return prep;
    }

    public ConsultationResponseDto toDto(Consultation c) {
        ConsultationResponseDto dto = new ConsultationResponseDto();
        dto.setId(c.getId());
        dto.setPatientId(c.getPatient().getId());
        dto.setPatientName(c.getPatient().getUser().getFullName());
        dto.setPatientPhone(c.getPatient().getUser().getPhone());
        dto.setDoctorId(c.getDoctor().getId());
        dto.setDoctorName(c.getDoctor().getUser().getFullName());
        dto.setDoctorSpecialization(c.getDoctor().getSpecialization());
        dto.setConsultationFee(c.getDoctor().getConsultationFee());
        dto.setScheduledAt(c.getScheduledAt());
        dto.setStatus(c.getStatus());
        dto.setChiefComplaint(c.getChiefComplaint());
        dto.setSymptomsDescription(c.getSymptomsDescription());
        dto.setDurationDays(c.getDurationDays());
        dto.setSeverity(c.getSeverity());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setHasAiPrep(aiNoteRepository.existsByConsultationId(c.getId()));
        dto.setHasPrescription(prescriptionRepository.findByConsultationId(c.getId()).isPresent());
        return dto;
    }

    private AiPrepResponseDto noteToDto(AiPreConsultationNote note) {
        List<String> redFlags = readJsonList(note.getPotentialRedFlags());
        List<String> questions = readJsonList(note.getSuggestedQuestions());

        return new AiPrepResponseDto(
                note.getConsultation().getId(),
                note.getPreliminaryAssessment(),
                note.getRecommendedTriage(),
                redFlags,
                questions,
                note.getPatientFriendlySummary()
        );
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> readJsonList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}

