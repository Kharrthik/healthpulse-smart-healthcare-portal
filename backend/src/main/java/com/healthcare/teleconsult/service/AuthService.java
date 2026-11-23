package com.healthcare.teleconsult.service;

import com.healthcare.teleconsult.dto.AuthResponse;
import com.healthcare.teleconsult.dto.LoginRequest;
import com.healthcare.teleconsult.dto.RegisterRequest;
import com.healthcare.teleconsult.entity.Doctor;
import com.healthcare.teleconsult.entity.Patient;
import com.healthcare.teleconsult.entity.Role;
import com.healthcare.teleconsult.entity.User;
import com.healthcare.teleconsult.exception.BadRequestException;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.DoctorRepository;
import com.healthcare.teleconsult.repository.PatientRepository;
import com.healthcare.teleconsult.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(UserRepository userRepository,
                       DoctorRepository doctorRepository,
                       PatientRepository patientRepository,
                       PasswordEncoder passwordEncoder,
                       SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("An account with email " + request.getEmail() + " already exists");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(
                request.getEmail().trim().toLowerCase(),
                encodedPassword,
                request.getFullName().trim(),
                request.getRole(),
                request.getPhone() != null ? request.getPhone().trim() : null
        );
        User savedUser = userRepository.save(user);

        Long profileId = null;
        if (savedUser.getRole() == Role.DOCTOR) {
            Doctor doctor = new Doctor(
                    savedUser,
                    request.getSpecialization() != null ? request.getSpecialization() : "General Medicine",
                    request.getQualification() != null ? request.getQualification() : "MBBS",
                    request.getExperienceYears() != null ? request.getExperienceYears() : 5,
                    request.getConsultationFee() != null ? request.getConsultationFee() : java.math.BigDecimal.valueOf(500),
                    request.getBio() != null ? request.getBio() : "Experienced healthcare provider.",
                    request.getAvailableDays() != null ? request.getAvailableDays() : "Mon-Fri",
                    request.getAvailableTimeStart() != null ? request.getAvailableTimeStart() : "09:00",
                    request.getAvailableTimeEnd() != null ? request.getAvailableTimeEnd() : "17:00"
            );
            Doctor savedDoctor = doctorRepository.save(doctor);
            profileId = savedDoctor.getId();
        } else if (savedUser.getRole() == Role.PATIENT) {
            Patient patient = new Patient(
                    savedUser,
                    request.getDateOfBirth(),
                    request.getGender(),
                    request.getBloodGroup(),
                    request.getMedicalHistorySummary(),
                    request.getEmergencyContact()
            );
            Patient savedPatient = patientRepository.save(patient);
            profileId = savedPatient.getId();
        }

        establishSecurityContext(savedUser, httpRequest, httpResponse);

        String simulatedToken = generateToken(savedUser.getId(), savedUser.getEmail());
        return new AuthResponse(simulatedToken, savedUser.getId(), savedUser.getEmail(),
                savedUser.getFullName(), savedUser.getRole(), savedUser.getPhone(), profileId);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        boolean matches = verifyPassword(request.getPassword(), user.getPasswordHash());
        if (!matches) {
            throw new BadRequestException("Invalid email or password");
        }

        // Seamless upgrade: if password was stored in legacy SHA-256, upgrade to BCrypt
        if (!user.getPasswordHash().startsWith("$2a$") && !user.getPasswordHash().startsWith("$2b$")) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        Long profileId = null;
        if (user.getRole() == Role.DOCTOR) {
            profileId = doctorRepository.findByUserId(user.getId())
                    .map(Doctor::getId).orElse(null);
        } else if (user.getRole() == Role.PATIENT) {
            profileId = patientRepository.findByUserId(user.getId())
                    .map(Patient::getId).orElse(null);
        }

        establishSecurityContext(user, httpRequest, httpResponse);

        String simulatedToken = generateToken(user.getId(), user.getEmail());
        return new AuthResponse(simulatedToken, user.getId(), user.getEmail(),
                user.getFullName(), user.getRole(), user.getPhone(), profileId);
    }

    public AuthResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Long profileId = null;
        if (user.getRole() == Role.DOCTOR) {
            profileId = doctorRepository.findByUserId(user.getId()).map(Doctor::getId).orElse(null);
        } else if (user.getRole() == Role.PATIENT) {
            profileId = patientRepository.findByUserId(user.getId()).map(Patient::getId).orElse(null);
        }

        String token = generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFullName(), user.getRole(), user.getPhone(), profileId);
    }

    public boolean verifyPassword(String rawPassword, String storedHash) {
        if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
            return passwordEncoder.matches(rawPassword, storedHash);
        }
        // Legacy SHA-256 verification
        String legacyHash = hashPasswordSha256(rawPassword);
        return storedHash.equals(legacyHash);
    }

    public String hashPassword(String password) {
        return passwordEncoder.encode(password);
    }

    public String hashPasswordSha256(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private void establishSecurityContext(User user, HttpServletRequest request, HttpServletResponse response) {
        if (request == null || response == null) return;
        String roleAuthority = "ROLE_" + user.getRole().name();
        Authentication auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority(roleAuthority))
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    private String generateToken(Long userId, String email) {
        return Base64.getEncoder().encodeToString(
                (userId + ":" + email + ":" + UUID.randomUUID()).getBytes(StandardCharsets.UTF_8)
        );
    }
}
