package com.healthcare.teleconsult.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.entity.SeverityLevel;
import com.healthcare.teleconsult.entity.TriageCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class GroqAiService {

    private static final Logger log = LoggerFactory.getLogger(GroqAiService.class);

    private String apiKey;
    private String model;
    private final ObjectMapper objectMapper;

    public GroqAiService(@Value("${groq.api.key:${GROQ_API_KEY:}}") String apiKey,
                         @Value("${groq.model:${GROQ_MODEL:openai/gpt-oss-120b}}") String model,
                         ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "openai/gpt-oss-120b";
        this.objectMapper = objectMapper;

        // Auto-detect .env file in project root if apiKey was not injected via environment
        if (this.apiKey.isBlank()) {
            loadFromDotEnv();
        }
    }

    private void loadFromDotEnv() {
        try {
            Path envPath = Paths.get(".env");
            if (!Files.exists(envPath)) {
                envPath = Paths.get("..", ".env");
            }
            if (Files.exists(envPath)) {
                List<String> lines = Files.readAllLines(envPath);
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("GROQ_API_KEY")) {
                        String[] parts = trimmed.split("=", 2);
                        if (parts.length > 1) {
                            String val = parts[1].trim().replaceAll("^[\"']|[\"']$", "");
                            if (!val.isBlank()) {
                                this.apiKey = val;
                                log.info("Loaded GROQ_API_KEY from .env file");
                            }
                        }
                    } else if (trimmed.startsWith("GROQ_MODEL")) {
                        String[] parts = trimmed.split("=", 2);
                        if (parts.length > 1) {
                            String val = parts[1].trim().replaceAll("^[\"']|[\"']$", "");
                            if (!val.isBlank()) {
                                this.model = val;
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not read .env file: {}", ex.getMessage());
        }
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
    }

    public void setModel(String model) {
        this.model = model != null ? model.trim() : "openai/gpt-oss-120b";
    }

    public String getModel() {
        return model;
    }

    public boolean isLiveKeyConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public AiPrepResponseDto generatePreConsultationNote(Long consultationId,
                                                         String chiefComplaint,
                                                         String symptomsDescription,
                                                         Integer durationDays,
                                                         SeverityLevel severity) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                return callGroqApi(consultationId, chiefComplaint, symptomsDescription, durationDays, severity);
            } catch (Exception ex) {
                log.warn("Groq API call failed (falling back to clinical heuristics engine): {}", ex.getMessage());
            }
        } else {
            log.info("No GROQ_API_KEY configured. Using labeled clinical triage heuristics fallback.");
        }

        return generateHeuristicTriage(consultationId, chiefComplaint, symptomsDescription, durationDays, severity);
    }

    public AiPrepResponseDto callGroqApi(Long consultationId,
                                         String chiefComplaint,
                                         String symptomsDescription,
                                         Integer durationDays,
                                         SeverityLevel severity) throws Exception {

        String systemPrompt = """
            You are an AI Clinical Telemedicine Pre-Consultation Assistant.
            Your sole purpose is to synthesize patient-reported symptoms, highlight safety checks, and suggest clinical probing questions for a licensed human physician.
            CLINICAL BOUNDARIES:
            1. You must NOT diagnose diseases or prescribe medications.
            2. Recommended triage priority MUST strictly be one of: "ROUTINE", "URGENT", "EMERGENCY".
            3. Highlight any life-threatening symptoms (e.g. crushing chest pain, radiating arm/jaw pain, severe dyspnea, stroke signs) as "EMERGENCY" with explicit safety checks.
            4. You must return strictly valid JSON matching this schema:
            {
              "preliminaryAssessment": "string (concise summary of reported issues)",
              "recommendedTriage": "ROUTINE" | "URGENT" | "EMERGENCY",
              "potentialRedFlags": ["string"],
              "suggestedQuestions": ["string"],
              "patientFriendlySummary": "string"
            }
            """;

        String userPrompt = """
            Patient Intake:
            - Chief Complaint: %s
            - Detailed Symptoms: %s
            - Duration: %s days
            - Patient-reported Severity: %s
            """.formatted(
                chiefComplaint != null ? chiefComplaint : "Not specified",
                symptomsDescription != null ? symptomsDescription : "Not specified",
                durationDays != null ? durationDays : 1,
                severity != null ? severity.name() : "MODERATE"
        );

        String requestJson = objectMapper.writeValueAsString(new GroqChatRequest(
                model,
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userPrompt)
                ),
                0.2,
                new ResponseFormat("json_object")
        ));

        String urlString = "https://api.groq.com/openai/v1/chat/completions";
        URL url = URI.create(urlString).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(15000);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = requestJson.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int statusCode = conn.getResponseCode();
        InputStream responseStream = (statusCode >= 200 && statusCode < 300)
                ? conn.getInputStream()
                : conn.getErrorStream();

        String responseBody = new String(responseStream.readAllBytes(), StandardCharsets.UTF_8);

        if (statusCode >= 200 && statusCode < 300) {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String rawContent = choices.get(0).path("message").path("content").asText();
                return parseGroqJsonResponse(consultationId, rawContent);
            }
        }
        throw new RuntimeException("Groq API returned HTTP " + statusCode + ": " + responseBody);
    }

    public AiPrepResponseDto parseGroqJsonResponse(Long consultationId, String rawText) {
        try {
            String cleanJson = rawText.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode parsed = objectMapper.readTree(cleanJson);
            String assessment = parsed.path("preliminaryAssessment").asText("Clinical triage assessment ready.");
            String triageStr = parsed.path("recommendedTriage").asText("ROUTINE").toUpperCase();
            TriageCategory triage;
            try {
                triage = TriageCategory.valueOf(triageStr);
            } catch (Exception e) {
                triage = TriageCategory.ROUTINE;
            }

            List<String> redFlags = new ArrayList<>();
            JsonNode rfNode = parsed.path("potentialRedFlags");
            if (rfNode.isArray()) {
                rfNode.forEach(n -> redFlags.add(n.asText()));
            }

            List<String> questions = new ArrayList<>();
            JsonNode qNode = parsed.path("suggestedQuestions");
            if (qNode.isArray()) {
                qNode.forEach(n -> questions.add(n.asText()));
            }

            String patientSummary = parsed.path("patientFriendlySummary").asText("Your consultation preparation is ready.");

            return new AiPrepResponseDto(consultationId, assessment, triage, redFlags, questions, patientSummary);
        } catch (Exception e) {
            log.error("Failed to parse Groq JSON output: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Groq AI response", e);
        }
    }

    public AiPrepResponseDto generateHeuristicTriage(Long consultationId,
                                                     String chiefComplaint,
                                                     String symptomsDescription,
                                                     Integer durationDays,
                                                     SeverityLevel severity) {
        String text = ((chiefComplaint != null ? chiefComplaint : "") + " " +
                       (symptomsDescription != null ? symptomsDescription : "")).toLowerCase();

        TriageCategory triage = TriageCategory.ROUTINE;
        List<String> redFlags = new ArrayList<>();
        List<String> questions = new ArrayList<>();
        String assessment;
        String patientSummary;

        boolean hasChestPain = text.contains("chest pain") || text.contains("heart") || text.contains("angina");
        boolean hasBreathingDifficulty = text.contains("shortness of breath") || text.contains("difficulty breathing") || text.contains("breathless");
        boolean hasHighFever = text.contains("high fever") || text.contains("103") || text.contains("104") || text.contains("chills");

        if (hasChestPain || (hasBreathingDifficulty && severity == SeverityLevel.SEVERE)) {
            triage = TriageCategory.EMERGENCY;
            redFlags.add("Acute cardiopulmonary symptom cluster detected.");
            redFlags.add("If pressure, tightness, or pain radiates to jaw/arm, seek immediate emergency care.");
            assessment = "[Heuristic Fallback] Emergency Priority: Patient reported acute chest or severe respiratory discomfort. Immediate emergency triage advised.";
            questions.add("Are you experiencing active diaphoresis (sweating), nausea, or radiation to your arm or jaw?");
            questions.add("Does resting relieve the discomfort, or does it worsen on minimal exertion?");
            patientSummary = "[Automated Intake Guide] Critical Safety Check: Because chest or severe breathing difficulty was reported, please proceed to an emergency care facility if symptoms persist or intensify.";
        } else if (hasHighFever || hasBreathingDifficulty || severity == SeverityLevel.SEVERE || (durationDays != null && durationDays > 14)) {
            triage = TriageCategory.URGENT;
            if (hasHighFever) redFlags.add("Persistent elevated temperature requiring prompt investigation.");
            if (durationDays != null && durationDays > 14) redFlags.add("Prolonged symptom course exceeding two weeks.");
            assessment = "[Heuristic Fallback] Urgent Priority: Presentation warrants prompt same-day physician evaluation and monitoring.";
            questions.add("Have you been able to maintain oral hydration and retain fluids?");
            questions.add("Are you currently taking any over-the-counter antipyretics or prescription medications?");
            questions.add("When did symptoms peak, and have they altered your daily activities?");
            patientSummary = "[Automated Intake Guide] Your consulting doctor will review your temperature and symptom timeline. Please have any recent readings ready for your call.";
        } else {
            triage = TriageCategory.ROUTINE;
            assessment = "[Heuristic Fallback] Routine Tele-Consultation: Stable clinical presentation suitable for standard outpatient review and lifestyle or symptom guidance.";
            questions.add("Have you had similar symptoms in the past?");
            questions.add("Are there any specific triggers or times of day when symptoms worsen?");
            questions.add("Do you have any known drug allergies or chronic medical conditions?");
            patientSummary = "[Automated Intake Guide] Your consultation briefing is prepared. Your physician will review this intake during your call. Please keep any past medication details handy.";
        }

        return new AiPrepResponseDto(consultationId, assessment, triage, redFlags, questions, patientSummary);
    }

    public String answerHealthQuery(String query) {
        if (!isLiveKeyConfigured() || query == null || query.isBlank()) {
            return "Based on standard health guidelines, please ensure adequate hydration, balanced nutrition, and rest. For persistent symptoms or specific health concerns, we encourage booking an appointment with a specialist in our doctors directory.";
        }
        try {
            String systemPrompt = "You are a professional AI Health & Wellness Assistant for the HealthPortal teleconsultation platform. Provide clear, empathetic, and evidence-based guidance in 2-3 concise paragraphs. Always remind the user that this does not substitute for an in-person clinical examination or diagnostic test.";
            String requestJson = objectMapper.writeValueAsString(new GroqChatRequest(
                    model,
                    List.of(
                            new ChatMessage("system", systemPrompt),
                            new ChatMessage("user", query)
                    ),
                    0.3,
                    null
            ));

            URL url = URI.create("https://api.groq.com/openai/v1/chat/completions").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestJson.getBytes(StandardCharsets.UTF_8));
            }

            int statusCode = conn.getResponseCode();
            InputStream is = (statusCode >= 200 && statusCode < 300) ? conn.getInputStream() : conn.getErrorStream();
            String responseBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            if (statusCode >= 200 && statusCode < 300) {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    return choices.get(0).path("message").path("content").asText();
                }
            }
        } catch (Exception ex) {
            log.error("Error calling Groq API for assistant query: {}", ex.getMessage());
        }
        return "Thank you for reaching out. Based on your health query, we recommend scheduling a teleconsultation with a relevant specialist on our platform for accurate evaluation.";
    }

    // Helper records for Groq OpenAI-compatible request structure
    public record GroqChatRequest(String model, List<ChatMessage> messages, double temperature, ResponseFormat response_format) {}
    public record ChatMessage(String role, String content) {}
    public record ResponseFormat(String type) {}
}

