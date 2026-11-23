package com.healthcare.teleconsult;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.LoginRequest;
import com.healthcare.teleconsult.dto.RegisterRequest;
import com.healthcare.teleconsult.entity.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Public doctor discovery GET /api/doctors (exact path, no trailing slash) returns 200 without credentials")
    void testPublicDoctorEndpointPermitted() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Public doctor discovery GET /api/doctors?specialization=Cardiology returns 200 without credentials")
    void testPublicDoctorSpecializationFilter() throws Exception {
        mockMvc.perform(get("/api/doctors").param("specialization", "Cardiology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/csrf returns 200 with valid CSRF token (flat map, not ApiResponse)")
    void testCsrfTokenEndpoint() throws Exception {
        mockMvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Unauthenticated mutating request to /api/consultations without CSRF is rejected by CsrfFilter with 403")
    void testUnauthenticatedBookingRejected() throws Exception {
        mockMvc.perform(post("/api/consultations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patientId\":1,\"doctorId\":1,\"chiefComplaint\":\"Test\",\"symptomsDescription\":\"Test symptoms\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Mutating request with authenticated session but missing CSRF token is rejected with 403 Forbidden")
    void testMissingCsrfRejectedWith403() throws Exception {
        // 1. Log in to establish session (login endpoint is CSRF-exempt)
        LoginRequest req = new LoginRequest("patient.demo@example.com", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertNotNull(session, "Session must be established");

        // 2. Perform mutating request with session but WITHOUT CSRF header
        // CsrfFilter runs before AuthorizationFilter, so it intercepts first
        mockMvc.perform(post("/api/consultations")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patientId\":1,\"doctorId\":1,\"chiefComplaint\":\"Test\",\"symptomsDescription\":\"Test symptoms\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Login with valid credentials authenticates user and establishes Spring Security session")
    void testSuccessfulLogin() throws Exception {
        LoginRequest req = new LoginRequest("patient.demo@example.com", "Password123!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("patient.demo@example.com"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "Session must be established upon successful login");
    }

    @Test
    @DisplayName("Registration with valid patient data returns 201 Created (CSRF-exempt endpoint)")
    void testPatientRegistration() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Test Patient User");
        req.setEmail("testpatient.new@example.com");
        req.setPassword("TestPass1!");
        req.setRole(Role.PATIENT);
        req.setPhone("9876543299");

        // POST /api/auth/register is in ignoringRequestMatchers — no CSRF header needed
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("testpatient.new@example.com"))
                .andExpect(jsonPath("$.data.role").value("PATIENT"));
    }

    @Test
    @DisplayName("Unauthenticated GET /api/consultations returns 401 Unauthorized")
    void testProtectedConsultationListRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/consultations"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required. Please sign in."));
    }
}
