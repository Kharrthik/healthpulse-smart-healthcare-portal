package com.healthcare.teleconsult.service;

import com.healthcare.teleconsult.dto.AppointmentResponse;
import com.healthcare.teleconsult.dto.CreateAppointmentRequest;
import com.healthcare.teleconsult.dto.UpdateAppointmentStatusRequest;
import com.healthcare.teleconsult.entity.*;
import com.healthcare.teleconsult.exception.BadRequestException;
import com.healthcare.teleconsult.exception.ConflictException;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.AppointmentRepository;
import com.healthcare.teleconsult.repository.DoctorRepository;
import com.healthcare.teleconsult.repository.PatientRepository;
import com.healthcare.teleconsult.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              DoctorRepository doctorRepository,
                              PatientRepository patientRepository,
                              UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    /**
     * Books a new appointment with a selected doctor.
     */
    public AppointmentResponse createAppointment(CreateAppointmentRequest request, Authentication authentication) {
        log.info("Creating appointment for doctor ID: {}, patient: {}", request.getDoctorId(), request.getPatientEmail());

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + request.getDoctorId()));

        if (request.getAppointmentDateTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Appointment date and time must be in the future.");
        }

        // Prevent conflicting bookings for the doctor within +/- 29 minutes
        LocalDateTime windowStart = request.getAppointmentDateTime().minusMinutes(29);
        LocalDateTime windowEnd = request.getAppointmentDateTime().plusMinutes(29);
        boolean conflict = appointmentRepository.hasConflictingAppointment(
                doctor.getId(),
                AppointmentStatus.activeStatuses(),
                windowStart,
                windowEnd
        );
        if (conflict) {
            String docName = (doctor.getUser() != null) ? doctor.getUser().getFullName() : "Doctor #" + doctor.getId();
            throw new ConflictException("Doctor " + docName + " already has an active appointment scheduled around "
                    + request.getAppointmentDateTime() + ". Please select another time slot.");
        }

        Patient linkedPatient = resolvePatientForBooking(request, authentication);

        Appointment appointment = new Appointment(
                doctor,
                linkedPatient,
                request.getPatientName().trim(),
                request.getPatientEmail().trim().toLowerCase(),
                request.getPatientPhone().trim(),
                request.getAppointmentDateTime(),
                request.getReason().trim()
        );

        if (request.getConsultationType() != null && !request.getConsultationType().isBlank()) {
            appointment.setConsultationType(request.getConsultationType().trim());
        } else {
            appointment.setConsultationType("TELECONSULTATION");
        }

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with ID: {}", saved.getId());
        return AppointmentResponse.fromEntity(saved);
    }

    /**
     * Retrieves appointments filtered by doctorId, patientEmail, patientId, and status,
     * enforcing role-based boundaries.
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments(Long doctorId, String patientEmail, Long patientId,
                                                    AppointmentStatus status, Authentication authentication) {
        String userEmail = (authentication != null) ? authentication.getName() : null;
        boolean isDoctor = hasRole(authentication, "ROLE_DOCTOR");
        boolean isPatient = hasRole(authentication, "ROLE_PATIENT");
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");

        Long effectiveDoctorId = doctorId;
        String effectivePatientEmail = patientEmail;

        if (isDoctor && !isAdmin) {
            // Doctors can only view appointments assigned to them
            Doctor doc = doctorRepository.findByUserId(getUserIdByEmail(userEmail))
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userEmail));
            effectiveDoctorId = doc.getId();
        } else if (isPatient && !isAdmin) {
            // Patients can only view their own appointments
            effectivePatientEmail = userEmail;
        }

        List<Appointment> list;
        if (effectiveDoctorId != null) {
            if (status != null) {
                list = appointmentRepository.findByDoctorIdAndStatusOrderByAppointmentDateTimeAsc(effectiveDoctorId, status);
            } else {
                list = appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeAsc(effectiveDoctorId);
            }
        } else if (effectivePatientEmail != null) {
            if (status != null) {
                list = appointmentRepository.findByPatientEmailAndStatusOrderByAppointmentDateTimeAsc(effectivePatientEmail.toLowerCase(), status);
            } else {
                list = appointmentRepository.findByPatientEmailOrderByAppointmentDateTimeAsc(effectivePatientEmail.toLowerCase());
            }
        } else if (patientId != null) {
            list = appointmentRepository.findByPatientIdOrderByAppointmentDateTimeAsc(patientId);
        } else {
            list = appointmentRepository.findAll();
        }

        return list.stream().map(AppointmentResponse::fromEntity).toList();
    }

    /**
     * Retrieves a single appointment by ID with role-based access checks.
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        validateAccessPermission(appointment, authentication, "view");
        return AppointmentResponse.fromEntity(appointment);
    }

    /**
     * Updates appointment status and optional doctor consultation notes.
     */
    public AppointmentResponse updateAppointmentStatus(Long id, UpdateAppointmentStatusRequest request,
                                                       Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        AppointmentStatus currentStatus = appointment.getStatus();
        AppointmentStatus newStatus = request.getStatus();

        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new BadRequestException("Invalid status transition: Cannot move appointment from "
                    + currentStatus + " to " + newStatus + ".");
        }

        boolean isDoctor = hasRole(authentication, "ROLE_DOCTOR");
        boolean isPatient = hasRole(authentication, "ROLE_PATIENT");
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");

        // Role-based transition guard
        if (isPatient && !isDoctor && !isAdmin) {
            if (newStatus != AppointmentStatus.CANCELLED) {
                throw new AccessDeniedException("Patients can only cancel their appointments; cannot set status to " + newStatus);
            }
            validateAccessPermission(appointment, authentication, "cancel");
        } else if (isDoctor && !isAdmin) {
            validateAccessPermission(appointment, authentication, "update status for");
        }

        if (request.getConsultationNotes() != null && !request.getConsultationNotes().isBlank()) {
            appointment.setConsultationNotes(request.getConsultationNotes().trim());
        }

        appointment.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment ID {} status updated to {}", saved.getId(), saved.getStatus());
        return AppointmentResponse.fromEntity(saved);
    }

    private Patient resolvePatientForBooking(CreateAppointmentRequest request, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            Optional<User> authUser = userRepository.findByEmail(authentication.getName().toLowerCase());
            if (authUser.isPresent()) {
                Optional<Patient> p = patientRepository.findByUserId(authUser.get().getId());
                if (p.isPresent()) return p.get();
            }
        }

        if (request.getPatientId() != null) {
            return patientRepository.findById(request.getPatientId()).orElse(null);
        }

        // Try looking up patient by provided email
        return userRepository.findByEmail(request.getPatientEmail().trim().toLowerCase())
                .flatMap(u -> patientRepository.findByUserId(u.getId()))
                .orElse(null);
    }

    private void validateAccessPermission(Appointment appointment, Authentication authentication, String action) {
        if (authentication == null || hasRole(authentication, "ROLE_ADMIN")) {
            return;
        }

        String userEmail = authentication.getName().toLowerCase();
        boolean isDoctor = hasRole(authentication, "ROLE_DOCTOR");
        boolean isPatient = hasRole(authentication, "ROLE_PATIENT");

        if (isDoctor) {
            String docEmail = (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null)
                    ? appointment.getDoctor().getUser().getEmail().toLowerCase() : "";
            if (!docEmail.equalsIgnoreCase(userEmail)) {
                throw new AccessDeniedException("You are not authorized to " + action + " appointments assigned to other doctors.");
            }
        } else if (isPatient) {
            String patientEmail = appointment.getPatientEmail().toLowerCase();
            if (!patientEmail.equalsIgnoreCase(userEmail)) {
                throw new AccessDeniedException("You are not authorized to " + action + " appointments of other patients.");
            }
        }
    }

    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null) return false;
        for (GrantedAuthority ga : authentication.getAuthorities()) {
            if (ga.getAuthority().equalsIgnoreCase(role)) return true;
        }
        return false;
    }

    private Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email != null ? email.toLowerCase() : "")
                .map(User::getId)
                .orElse(null);
    }
}

