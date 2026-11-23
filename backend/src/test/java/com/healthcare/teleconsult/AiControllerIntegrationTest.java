package com.healthcare.teleconsult;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AiControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Public POST /api/ai/preview-triage should succeed without auth/CSRF and return structured clinical summary")
    void testPublicAiPreviewTriageEndpoint() throws Exception {
        Map<String, Object> request = Map.of(
                "chiefComplaint", "typhoid",
                "symptomsDescription", "fever for two days",
                "durationDays", 3,
                "severity", "MODERATE"
        );

        mockMvc.perform(post("/api/ai/preview-triage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clinicalSummary").isNotEmpty())
                .andExpect(jsonPath("$.data.preliminaryAssessment").isNotEmpty())
                .andExpect(jsonPath("$.data.triageCategory").isNotEmpty())
                .andExpect(jsonPath("$.data.recommendedTriage").isNotEmpty())
                .andExpect(jsonPath("$.data.redFlagWarnings").isArray())
                .andExpect(jsonPath("$.data.potentialRedFlags").isArray())
                .andExpect(jsonPath("$.data.suggestedQuestionsForDoctor").isArray())
                .andExpect(jsonPath("$.data.suggestedQuestions").isArray());
    }
}

