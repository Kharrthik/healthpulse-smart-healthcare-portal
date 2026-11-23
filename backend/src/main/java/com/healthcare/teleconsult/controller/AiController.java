package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.dto.AiPrepResponseDto;
import com.healthcare.teleconsult.dto.ApiResponse;
import com.healthcare.teleconsult.entity.SeverityLevel;
import com.healthcare.teleconsult.service.GroqAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GroqAiService groqAiService;

    public AiController(GroqAiService groqAiService) {
        this.groqAiService = groqAiService;
    }

    @PostMapping("/preview-triage")
    public ResponseEntity<ApiResponse<AiPrepResponseDto>> previewTriage(@RequestBody Map<String, Object> body) {
        String chiefComplaint = (String) body.getOrDefault("chiefComplaint", "");
        String symptoms = (String) body.getOrDefault("symptomsDescription", "");
        Integer durationDays = null;
        if (body.get("durationDays") != null) {
            try {
                durationDays = Integer.parseInt(body.get("durationDays").toString());
            } catch (Exception ignored) {}
        }
        SeverityLevel severity = SeverityLevel.MODERATE;
        if (body.get("severity") != null) {
            try {
                severity = SeverityLevel.valueOf(body.get("severity").toString().toUpperCase());
            } catch (Exception ignored) {}
        }

        AiPrepResponseDto prep = groqAiService.generatePreConsultationNote(
                0L, chiefComplaint, symptoms, durationDays, severity
        );

        return ResponseEntity.ok(ApiResponse.ok("Triage preview generated successfully via Groq AI", prep));
    }
}
