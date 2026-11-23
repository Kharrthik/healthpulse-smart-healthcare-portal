package com.healthcare.teleconsult;

import com.healthcare.teleconsult.dto.ConsultationBookingRequest;
import com.healthcare.teleconsult.dto.ConsultationResponseDto;
import com.healthcare.teleconsult.dto.PrescriptionCreateRequest;
import com.healthcare.teleconsult.dto.PrescriptionResponseDto;
import com.healthcare.teleconsult.entity.ConsultationStatus;
import com.healthcare.teleconsult.entity.Doctor;
import com.healthcare.teleconsult.entity.Patient;
import com.healthcare.teleconsult.entity.SeverityLevel;
import com.healthcare.teleconsult.repository.DoctorRepository;
import com.healthcare.teleconsult.repository.PatientRepository;
import com.healthcare.teleconsult.service.ConsultationService;
import com.healthcare.teleconsult.service.PrescriptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class ConsultationWorkflowTest {

    @Autowired
    private ConsultationService consultationService;

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Test
    @DisplayName("Complete telemedicine workflow: booking -> AI prep -> prescription -> completion")
    void testFullWorkflow() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Doctor seed required"));
        Patient patient = patientRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Patient seed required"));

        // 1. Book Consultation
        ConsultationBookingRequest request = new ConsultationBookingRequest();
        request.setPatientId(patient.getId());
        request.setDoctorId(doctor.getId());
        request.setScheduledAt(LocalDateTime.now().plusDays(2));
        request.setChiefComplaint("Persistent throat soreness and intermittent mild fever");
        request.setSymptomsDescription("Onset 3 days ago, difficulty swallowing solids.");
        request.setDurationDays(3);
        request.setSeverity(SeverityLevel.MODERATE);

        ConsultationResponseDto booked = consultationService.bookConsultation(request);
        assertNotNull(booked.getId());
        assertEquals(ConsultationStatus.CONFIRMED, booked.getStatus());
        assertTrue(booked.isHasAiPrep(), "AI Pre-Consultation note should be generated automatically");

        // 2. Fetch AI Prep
        var prep = consultationService.getOrCreateAiPrep(booked.getId());
        assertNotNull(prep);
        assertNotNull(prep.getRecommendedTriage());
        assertFalse(prep.getSuggestedQuestions().isEmpty());

        // 3. Issue Prescription
        String medicinesJson = """
            [
              {"name": "Amoxicillin 500mg", "dosage": "1 cap", "frequency": "Thrice daily", "duration": "5 days"},
              {"name": "Paracetamol 650mg", "dosage": "1 tab", "frequency": "As needed for fever", "duration": "3 days"}
            ]
            """;
        PrescriptionCreateRequest rxReq = new PrescriptionCreateRequest(
                doctor.getId(),
                "Acute Pharyngitis",
                medicinesJson,
                "Salt water gargles thrice daily. Hydrate well."
        );

        PrescriptionResponseDto rx = prescriptionService.createPrescription(booked.getId(), rxReq);
        assertNotNull(rx.getId());
        assertEquals("Acute Pharyngitis", rx.getDiagnosis());

        // 4. Verify consultation status transitioned to COMPLETED
        ConsultationResponseDto completedConsultation = consultationService.getConsultationById(booked.getId());
        assertEquals(ConsultationStatus.COMPLETED, completedConsultation.getStatus());
        assertTrue(completedConsultation.isHasPrescription());
    }
}

