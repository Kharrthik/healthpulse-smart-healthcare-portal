package com.healthcare.teleconsult.controller;

import com.healthcare.teleconsult.repository.AppointmentRepository;
import com.healthcare.teleconsult.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public DashboardController(DoctorRepository doctorRepository, AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long totalDoctors = doctorRepository.count();
        long totalAppointments = appointmentRepository.count();
        long upcomingAppointments = appointmentRepository.countByAppointmentDateTimeAfter(LocalDateTime.now());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDoctors", totalDoctors);
        stats.put("availableDoctors", totalDoctors);
        stats.put("totalAppointments", totalAppointments);
        stats.put("upcomingAppointments", upcomingAppointments);
        return ResponseEntity.ok(stats);
    }
}

