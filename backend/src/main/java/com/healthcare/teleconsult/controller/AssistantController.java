package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.service.GroqAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final GroqAiService groqAiService;

    public AssistantController(GroqAiService groqAiService) {
        this.groqAiService = groqAiService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> askAssistant(@RequestBody Map<String, Object> body) {
        String query = "";
        if (body.get("query") != null) {
            query = body.get("query").toString();
        } else if (body.get("message") != null) {
            query = body.get("message").toString();
        }

        String reply = groqAiService.answerHealthQuery(query);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("query", query);
        resp.put("message", reply);
        resp.put("reply", reply);
        resp.put("model", groqAiService.getModel());
        resp.put("disclaimer", "Disclaimer: This AI health assistant provides general information for guidance only and is not a substitute for clinical medical evaluation, diagnosis, or treatment. In emergencies, please visit the nearest hospital immediately.");
        return ResponseEntity.ok(resp);
    }
}

