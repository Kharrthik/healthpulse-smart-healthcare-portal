package com.healthcare.teleconsult;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.entity.SeverityLevel;
import com.healthcare.teleconsult.entity.TriageCategory;
import com.healthcare.teleconsult.service.GroqAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GroqAiServiceTest {

    private GroqAiService groqAiService;

    @BeforeEach
    void setUp() {
        groqAiService = new GroqAiService("", "openai/gpt-oss-120b", new ObjectMapper());
    }

    @Test
    @DisplayName("Should categorize chest pain and acute shortness of breath as EMERGENCY with labeled fallback")
    void testEmergencyTriage() {
        AiPrepResponseDto result = groqAiService.generateHeuristicTriage(
                1L,
                "Severe crushing chest pain radiating to left arm",
                "Patient also has shortness of breath and cold sweat",
                1,
                SeverityLevel.SEVERE
        );

        assertNotNull(result);
        assertEquals(TriageCategory.EMERGENCY, result.getRecommendedTriage());
        assertFalse(result.getPotentialRedFlags().isEmpty(), "Red flags must be highlighted for emergency symptoms");
        assertTrue(result.getSuggestedQuestions().size() >= 2);
        assertTrue(result.getPreliminaryAssessment().contains("[Heuristic Fallback]"),
                "Fallback output must be clearly labeled as non-validated heuristic triage");
        assertTrue(result.getPatientFriendlySummary().contains("[Automated Intake Guide]"));
    }

    @Test
    @DisplayName("Should categorize mild seasonal cold as ROUTINE")
    void testRoutineTriage() {
        AiPrepResponseDto result = groqAiService.generateHeuristicTriage(
                2L,
                "Mild sneezing and clear nasal drip",
                "Started yesterday after dusty weather, no fever",
                1,
                SeverityLevel.MILD
        );

        assertNotNull(result);
        assertEquals(TriageCategory.ROUTINE, result.getRecommendedTriage());
        assertNotNull(result.getPatientFriendlySummary());
        assertTrue(result.getPreliminaryAssessment().contains("[Heuristic Fallback]"));
    }

    @Test
    @DisplayName("Should categorize high fever for several days as URGENT")
    void testUrgentTriage() {
        AiPrepResponseDto result = groqAiService.generateHeuristicTriage(
                3L,
                "High fever 103F with shaking chills",
                "Body ache and extreme weakness for 3 days",
                3,
                SeverityLevel.SEVERE
        );

        assertNotNull(result);
        assertEquals(TriageCategory.URGENT, result.getRecommendedTriage());
    }

    @Test
    @DisplayName("Should correctly parse mocked Groq OpenAI-compatible JSON completion response")
    void testParseMockedGroqResponse() {
        String mockGroqContent = """
            {
              "preliminaryAssessment": "Reported subacute respiratory symptoms with dry cough and mild fever following travel.",
              "recommendedTriage": "ROUTINE",
              "potentialRedFlags": [
                "Monitor for fever spikes over 101F"
              ],
              "suggestedQuestions": [
                "Did symptoms develop after travel?",
                "Are you experiencing any nocturnal wheezing?"
              ],
              "patientFriendlySummary": "Your doctor will conduct a focused respiratory check. Keep your past prescription details ready."
            }
            """;

        AiPrepResponseDto dto = groqAiService.parseGroqJsonResponse(101L, mockGroqContent);

        assertNotNull(dto);
        assertEquals(101L, dto.getConsultationId());
        assertEquals(TriageCategory.ROUTINE, dto.getRecommendedTriage());
        assertEquals(1, dto.getPotentialRedFlags().size());
        assertEquals(2, dto.getSuggestedQuestions().size());
        assertEquals("Did symptoms develop after travel?", dto.getSuggestedQuestions().get(0));
        assertTrue(dto.getPreliminaryAssessment().contains("respiratory symptoms"));
    }
}

