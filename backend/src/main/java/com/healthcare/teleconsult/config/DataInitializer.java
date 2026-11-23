package com.healthcare.teleconsult.config;

import com.healthcare.teleconsult.entity.*;
import com.healthcare.teleconsult.repository.*;
import com.healthcare.teleconsult.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final AiPreConsultationNoteRepository aiNoteRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuthService authService;

    public DataInitializer(UserRepository userRepository,
                           DoctorRepository doctorRepository,
                           PatientRepository patientRepository,
                           ConsultationRepository consultationRepository,
                           AiPreConsultationNoteRepository aiNoteRepository,
                           AppointmentRepository appointmentRepository,
                           AuthService authService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.consultationRepository = consultationRepository;
        this.aiNoteRepository = aiNoteRepository;
        this.appointmentRepository = appointmentRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded with {} users.", userRepository.count());
            seedAppointmentsIfEmpty();
            return;
        }

        log.info("Seeding initial healthcare providers and demo patient...");

        String defaultPassHash = authService.hashPassword("Password123!");

        // Doctor 1: Cardiologist
        User uDoc1 = userRepository.save(new User(
                "ananya.sharma@hospital.com", defaultPassHash, "Dr. Ananya Sharma", Role.DOCTOR, "9876543210"
        ));
        Doctor doc1 = doctorRepository.save(new Doctor(
                uDoc1, "Cardiology", "MBBS, MD (Cardiology), FACC", 12,
                BigDecimal.valueOf(800.00),
                "Senior Consultant Cardiologist specializing in preventative heart health, hypertension, and arrhythmias.",
                "Mon,Wed,Fri", "09:00", "14:00"
        ));

        // Doctor 2: Dermatologist
        User uDoc2 = userRepository.save(new User(
                "rajesh.verma@hospital.com", defaultPassHash, "Dr. Rajesh Verma", Role.DOCTOR, "9876543211"
        ));
        Doctor doc2 = doctorRepository.save(new Doctor(
                uDoc2, "Dermatology", "MBBS, MD (Dermatology)", 8,
                BigDecimal.valueOf(600.00),
                "Expert in clinical dermatology, adult eczema, acne management, and tele-dermatology consultations.",
                "Tue,Thu,Sat", "10:00", "16:00"
        ));

        // Doctor 3: General Physician
        User uDoc3 = userRepository.save(new User(
                "priya.nair@hospital.com", defaultPassHash, "Dr. Priya Nair", Role.DOCTOR, "9876543212"
        ));
        Doctor doc3 = doctorRepository.save(new Doctor(
                uDoc3, "General Medicine", "MBBS, DNB (Internal Medicine)", 15,
                BigDecimal.valueOf(500.00),
                "Primary care specialist treating metabolic disorders, infectious diseases, and seasonal illnesses.",
                "Mon-Sat", "08:30", "15:30"
        ));

        // Doctor 4: Pediatrician
        User uDoc4 = userRepository.save(new User(
                "amit.kulkarni@hospital.com", defaultPassHash, "Dr. Amit Kulkarni", Role.DOCTOR, "9876543213"
        ));
        Doctor doc4 = doctorRepository.save(new Doctor(
                uDoc4, "Pediatrics", "MBBS, MD (Pediatrics)", 10,
                BigDecimal.valueOf(550.00),
                "Compassionate child specialist focusing on pediatric nutrition, developmental milestones, and infections.",
                "Mon,Wed,Fri,Sat", "11:00", "18:00"
        ));

        // Demo Patient
        User uPat = userRepository.save(new User(
                "patient.demo@example.com", defaultPassHash, "Sarah Jenkins", Role.PATIENT, "9823456789"
        ));
        Patient pat = patientRepository.save(new Patient(
                uPat, "1994-08-14", "Female", "B+", "Mild pollen allergy; no chronic illnesses.", "9812345678"
        ));

        // Demo Consultation
        Consultation consult = consultationRepository.save(new Consultation(
                pat, doc3, LocalDateTime.now().plusDays(1).withHour(10).withMinute(0),
                ConsultationStatus.CONFIRMED,
                "Persistent dry cough and low-grade evening fever",
                "Cough began 4 days ago after travel. No chest pain, but mild fatigue and throat tickle.",
                4, SeverityLevel.MODERATE
        ));

        // Demo AI Pre-Consultation Note
        aiNoteRepository.save(new AiPreConsultationNote(
                consult,
                "Subacute upper respiratory symptoms following travel. Presentation is consistent with post-viral tracheobronchitis or mild allergic airway irritation.",
                TriageCategory.ROUTINE,
                "[\"Monitor for persistent fever above 101F\",\"Watch for any exertional shortness of breath\"]",
                "[\"Did you travel by air or public transit prior to cough onset?\",\"Are you experiencing nocturnal waking due to coughing spells?\",\"Have you tried any antihistamines or steam inhalation?\"]",
                "Your symptoms point toward upper airway irritation. The doctor will review your travel timeline and suggest targeted relief. Keep any previous medication details handy."
        ));

        seedAppointmentsIfEmpty();

        log.info("Data initialization complete. Seeded 4 doctors, 1 demo patient, consultations, and sample appointments.");
    }

    private void seedAppointmentsIfEmpty() {
        if (appointmentRepository.count() > 0) {
            return;
        }

        List<Doctor> doctors = doctorRepository.findAll();
        List<Patient> patients = patientRepository.findAll();

        if (doctors.isEmpty() || patients.isEmpty()) {
            return;
        }

        Doctor doc1 = doctors.get(0); // Dr. Ananya Sharma
        Patient pat = patients.get(0); // Sarah Jenkins

        // Appointment 1: Confirmed future cardiology follow-up
        Appointment appt1 = new Appointment(
                doc1,
                pat,
                pat.getUser().getFullName(),
                pat.getUser().getEmail(),
                pat.getUser().getPhone(),
                LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0),
                "Routine preventative cardiac follow-up and blood pressure monitoring"
        );
        appt1.setStatus(AppointmentStatus.CONFIRMED);
        appointmentRepository.save(appt1);

        // Appointment 2: Pending appointment
        Appointment appt2 = new Appointment(
                doc1,
                pat,
                "Michael Davies",
                "michael.davies@example.com",
                "9811223344",
                LocalDateTime.now().plusDays(3).withHour(15).withMinute(30).withSecond(0).withNano(0),
                "Evaluation for sporadic resting tachycardia and palpitations"
        );
        appt2.setStatus(AppointmentStatus.PENDING);
        appointmentRepository.save(appt2);

        log.info("Seeded initial appointments for doctor workflow testing.");
    }
}

