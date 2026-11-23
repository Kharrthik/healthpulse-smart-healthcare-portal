package com.healthcare.teleconsult;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.AppointmentResponse;
import com.healthcare.teleconsult.dto.CreateAppointmentRequest;
import com.healthcare.teleconsult.dto.LoginRequest;
import com.healthcare.teleconsult.dto.UpdateAppointmentStatusRequest;
import com.healthcare.teleconsult.entity.AppointmentStatus;
import com.healthcare.teleconsult.entity.Doctor;
import com.healthcare.teleconsult.exception.BadRequestException;
import com.healthcare.teleconsult.exception.ConflictException;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.DoctorRepository;
import com.healthcare.teleconsult.service.AppointmentService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class AppointmentWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorRepository doctorRepository;

    private Doctor testDoctor;
    private Authentication doctorAuth;
    private Authentication patientAuth;

    @BeforeEach
    void setUp() {
        testDoctor = doctorRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Test doctor required in seeded testdb"));

        doctorAuth = new UsernamePasswordAuthenticationToken(
                testDoctor.getUser().getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );

        patientAuth = new UsernamePasswordAuthenticationToken(
                "patient.demo@example.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))
        );
    }

    private record SessionContext(MockHttpSession session, String csrfToken) {}

    private SessionContext loginAsDoctor() throws Exception {
        LoginRequest req = new LoginRequest("ananya.sharma@hospital.com", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        MvcResult csrfResult = mockMvc.perform(get("/api/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        String token = objectMapper.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();

        return new SessionContext(session, token);
    }

    private SessionContext loginAsPatient() throws Exception {
        LoginRequest req = new LoginRequest("patient.demo@example.com", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        MvcResult csrfResult = mockMvc.perform(get("/api/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        String token = objectMapper.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();

        return new SessionContext(session, token);
    }

    @Test
    @DisplayName("Service Layer: Book appointment with future date creates appointment with PENDING status")
    void testCreateAppointmentServiceSuccess() {
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setDoctorId(testDoctor.getId());
        request.setPatientName("Alice Cooper");
        request.setPatientEmail("alice.cooper@example.com");
        request.setPatientPhone("9812345678");
        request.setAppointmentDateTime(LocalDateTime.now().plusDays(5).withHour(14).withMinute(0));
        request.setReason("Evaluating mild persistent arrhythmia during aerobic exercise");

        AppointmentResponse response = appointmentService.createAppointment(request, patientAuth);

        assertNotNull(response.getId());
        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        assertEquals("Alice Cooper", response.getPatientName());
        assertEquals(testDoctor.getId(), response.getDoctorId());
        assertNotNull(response.getDoctorName());
    }

    @Test
    @DisplayName("Service Layer: Conflicting booking prevention within +/- 29 minute window throws ConflictException")
    void testConflictingBookingThrowsConflict() {
        LocalDateTime appointmentSlot = LocalDateTime.now().plusDays(6).withHour(10).withMinute(0);

        CreateAppointmentRequest firstReq = new CreateAppointmentRequest(
                testDoctor.getId(), null, "Patient One", "patient1@example.com",
                "9811223344", appointmentSlot, "First scheduled checkup"
        );
        appointmentService.createAppointment(firstReq, patientAuth);

        // Conflicting booking 15 minutes later for the same doctor
        CreateAppointmentRequest conflictReq = new CreateAppointmentRequest(
                testDoctor.getId(), null, "Patient Two", "patient2@example.com",
                "9899887766", appointmentSlot.plusMinutes(15), "Conflicting booking"
        );

        assertThrows(ConflictException.class, () -> appointmentService.createAppointment(conflictReq, patientAuth));
    }

    @Test
    @DisplayName("Service Layer: Status lifecycle PENDING -> CONFIRMED -> COMPLETED with consultation notes")
    void testStatusLifecycleAndConsultationNotes() {
        CreateAppointmentRequest createRequest = new CreateAppointmentRequest(
                testDoctor.getId(), null, "Robert Taylor", "robert.t@example.com",
                "9876501234", LocalDateTime.now().plusDays(4).withHour(11).withMinute(0),
                "Pre-hypertension evaluation"
        );
        AppointmentResponse created = appointmentService.createAppointment(createRequest, patientAuth);
        assertEquals(AppointmentStatus.PENDING, created.getStatus());

        // Step 1: Doctor confirms appointment
        UpdateAppointmentStatusRequest confirmReq = new UpdateAppointmentStatusRequest(
                AppointmentStatus.CONFIRMED,
                "Confirmed. Patient to bring ambulatory BP diary."
        );
        AppointmentResponse confirmed = appointmentService.updateAppointmentStatus(created.getId(), confirmReq, doctorAuth);
        assertEquals(AppointmentStatus.CONFIRMED, confirmed.getStatus());
        assertTrue(confirmed.getConsultationNotes().contains("ambulatory BP diary"));

        // Step 2: Doctor completes appointment and records consultation summary
        UpdateAppointmentStatusRequest completeReq = new UpdateAppointmentStatusRequest(
                AppointmentStatus.COMPLETED,
                "Teleconsultation finished. Advised sodium restriction and 30m daily brisk walking."
        );
        AppointmentResponse completed = appointmentService.updateAppointmentStatus(created.getId(), completeReq, doctorAuth);
        assertEquals(AppointmentStatus.COMPLETED, completed.getStatus());
        assertTrue(completed.getConsultationNotes().contains("sodium restriction"));
    }

    @Test
    @DisplayName("Service Layer: Invalid status transition COMPLETED -> CANCELLED throws BadRequestException")
    void testInvalidStatusTransitionThrowsBadRequest() {
        CreateAppointmentRequest createRequest = new CreateAppointmentRequest(
                testDoctor.getId(), null, "David Miller", "david.m@example.com",
                "9812309876", LocalDateTime.now().plusDays(3).withHour(16).withMinute(0),
                "Routine screening"
        );
        AppointmentResponse created = appointmentService.createAppointment(createRequest, patientAuth);

        // Transition PENDING -> CONFIRMED
        appointmentService.updateAppointmentStatus(created.getId(),
                new UpdateAppointmentStatusRequest(AppointmentStatus.CONFIRMED, null), doctorAuth);

        // Transition CONFIRMED -> COMPLETED
        appointmentService.updateAppointmentStatus(created.getId(),
                new UpdateAppointmentStatusRequest(AppointmentStatus.COMPLETED, "Completed"), doctorAuth);

        // Attempt invalid transition COMPLETED -> CANCELLED
        UpdateAppointmentStatusRequest invalidReq = new UpdateAppointmentStatusRequest(AppointmentStatus.CANCELLED, "Try cancel");
        assertThrows(BadRequestException.class, () ->
                appointmentService.updateAppointmentStatus(created.getId(), invalidReq, doctorAuth));
    }

    @Test
    @DisplayName("Service Layer: Non-existent doctor throws ResourceNotFoundException")
    void testNonExistentDoctorThrows404() {
        CreateAppointmentRequest notFoundReq = new CreateAppointmentRequest(
                999999L, null, "Jane Doe", "jane.doe@example.com",
                "9811223344", LocalDateTime.now().plusDays(2), "General inquiry"
        );
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.createAppointment(notFoundReq, patientAuth));
    }

    @Test
    @DisplayName("Service Layer: Past appointment date throws BadRequestException")
    void testPastAppointmentDateThrowsBadRequest() {
        CreateAppointmentRequest pastReq = new CreateAppointmentRequest(
                testDoctor.getId(), null, "Jane Doe", "jane.doe@example.com",
                "9811223344", LocalDateTime.now().minusDays(1), "Past checkup"
        );
        assertThrows(BadRequestException.class, () ->
                appointmentService.createAppointment(pastReq, patientAuth));
    }

    @Test
    @DisplayName("HTTP MockMvc: POST /api/appointments creates appointment with valid session & CSRF")
    void testHttpCreateAppointmentWithSession() throws Exception {
        SessionContext patientCtx = loginAsPatient();

        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setDoctorId(testDoctor.getId());
        request.setPatientName("Alice Cooper");
        request.setPatientEmail("alice.cooper@example.com");
        request.setPatientPhone("9812345678");
        request.setAppointmentDateTime(LocalDateTime.now().plusDays(8).withHour(15).withMinute(0));
        request.setReason("Evaluating mild persistent arrhythmia during aerobic exercise");

        mockMvc.perform(post("/api/appointments")
                        .session(patientCtx.session())
                        .header("X-XSRF-TOKEN", patientCtx.csrfToken())
                        .cookie(new Cookie("XSRF-TOKEN", patientCtx.csrfToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.patientName").value("Alice Cooper"))
                .andExpect(jsonPath("$.data.doctorId").value(testDoctor.getId()));
    }

    @Test
    @DisplayName("HTTP MockMvc: Validation error on missing required fields returns 400 Bad Request")
    void testHttpValidationErrorOnMissingFields() throws Exception {
        SessionContext patientCtx = loginAsPatient();

        CreateAppointmentRequest invalidRequest = new CreateAppointmentRequest();

        mockMvc.perform(post("/api/appointments")
                        .session(patientCtx.session())
                        .header("X-XSRF-TOKEN", patientCtx.csrfToken())
                        .cookie(new Cookie("XSRF-TOKEN", patientCtx.csrfToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.doctorId").exists())
                .andExpect(jsonPath("$.data.patientName").exists())
                .andExpect(jsonPath("$.data.patientEmail").exists())
                .andExpect(jsonPath("$.data.reason").exists());
    }

    @Test
    @DisplayName("HTTP MockMvc: Doctor list GET /api/appointments with doctor session returns 200 OK")
    void testDoctorFacingAppointmentsHttp() throws Exception {
        SessionContext docCtx = loginAsDoctor();

        mockMvc.perform(get("/api/appointments")
                        .session(docCtx.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("HTTP MockMvc: Unauthenticated GET /api/appointments returns 401 Unauthorized")
    void testUnauthenticatedGetAppointmentsReturns401() throws Exception {
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}

