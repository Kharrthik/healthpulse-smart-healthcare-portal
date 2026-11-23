package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.dto.ApiResponse;
import com.healthcare.teleconsult.dto.DoctorCardDto;
import com.healthcare.teleconsult.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorCardDto>>> getDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) BigDecimal maxFee,
            @RequestParam(required = false) String search) {

        List<DoctorCardDto> doctors = doctorService.searchDoctors(specialization, maxFee, search);
        return ResponseEntity.ok(ApiResponse.ok("Found " + doctors.size() + " doctors", doctors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorCardDto>> getDoctorById(@PathVariable Long id) {
        DoctorCardDto doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.ok("Doctor details retrieved", doctor));
    }
}

