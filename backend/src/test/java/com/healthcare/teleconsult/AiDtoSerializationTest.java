package com.healthcare.teleconsult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.entity.TriageCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AiDtoSerializationTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("AiPrepResponseDto should serialize both backend and frontend alias properties into JSON")
    void testSerializationAliases() throws Exception {
        AiPrepResponseDto dto = new AiPrepResponseDto(
                55L,
                "Clinical impression of suspected acute gastrointestinal infection.",
                TriageCategory.URGENT,
                List.of("High fever above 102F", "Signs of dehydration"),
                List.of("How long have you had persistent vomiting?", "Can you keep fluids down?"),
                "Please hydrate and consult your doctor today."
        );

        String json = objectMapper.writeValueAsString(dto);
        JsonNode root = objectMapper.readTree(json);

        // Verify primary backend properties
        assertEquals("Clinical impression of suspected acute gastrointestinal infection.", root.path("preliminaryAssessment").asText());
        assertEquals("URGENT", root.path("recommendedTriage").asText());
        assertEquals(2, root.path("potentialRedFlags").size());
        assertEquals(2, root.path("suggestedQuestions").size());
        assertEquals("Please hydrate and consult your doctor today.", root.path("patientFriendlySummary").asText());

        // Verify frontend SymptomIntakePage alias properties
        assertEquals("Clinical impression of suspected acute gastrointestinal infection.", root.path("clinicalSummary").asText());
        assertEquals("URGENT", root.path("triageCategory").asText());
        assertEquals(2, root.path("redFlagWarnings").size());
        assertEquals("High fever above 102F", root.path("redFlagWarnings").get(0).asText());
        assertEquals(2, root.path("suggestedQuestionsForDoctor").size());
        assertEquals("How long have you had persistent vomiting?", root.path("suggestedQuestionsForDoctor").get(0).asText());
    }

    @Test
    @DisplayName("AiPrepResponseDto should correctly deserialize from either set of JSON keys")
    void testDeserializationFromAliases() throws Exception {
        String json = """
            {
              "consultationId": 12,
              "clinicalSummary": "Moderate febrile illness with chills.",
              "triageCategory": "URGENT",
              "redFlagWarnings": ["Fever for 3 days"],
              "suggestedQuestionsForDoctor": ["Any joint pain?"]
            }
            """;

        AiPrepResponseDto dto = objectMapper.readValue(json, AiPrepResponseDto.class);

        assertEquals(12L, dto.getConsultationId());
        assertEquals("Moderate febrile illness with chills.", dto.getPreliminaryAssessment());
        assertEquals("Moderate febrile illness with chills.", dto.getClinicalSummary());
        assertEquals(TriageCategory.URGENT, dto.getRecommendedTriage());
        assertEquals("URGENT", dto.getTriageCategory());
        assertEquals(1, dto.getRedFlagWarnings().size());
        assertEquals("Fever for 3 days", dto.getRedFlagWarnings().get(0));
        assertEquals(1, dto.getSuggestedQuestionsForDoctor().size());
    }
}

