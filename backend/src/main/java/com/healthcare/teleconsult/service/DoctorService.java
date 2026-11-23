package com.healthcare.teleconsult.service;

import com.healthcare.teleconsult.dto.DoctorCardDto;
import com.healthcare.teleconsult.entity.Doctor;
import com.healthcare.teleconsult.exception.ResourceNotFoundException;
import com.healthcare.teleconsult.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public List<DoctorCardDto> searchDoctors(String specialization, BigDecimal maxFee, String search) {
        String cleanSpec = (specialization != null && !specialization.isBlank() && !specialization.equalsIgnoreCase("ALL"))
                ? specialization.trim() : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        List<Doctor> doctors = doctorRepository.searchDoctors(cleanSpec, maxFee, cleanSearch);
        return doctors.stream().map(this::toDto).collect(Collectors.toList());
    }

    public DoctorCardDto getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return toDto(doctor);
    }

    public Doctor getDoctorEntity(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
    }

    public DoctorCardDto toDto(Doctor doctor) {
        return new DoctorCardDto(
                doctor.getId(),
                doctor.getUser().getId(),
                doctor.getUser().getFullName(),
                doctor.getUser().getEmail(),
                doctor.getUser().getPhone(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getExperienceYears(),
                doctor.getConsultationFee(),
                doctor.getBio(),
                doctor.getAvailableDays(),
                doctor.getAvailableTimeStart(),
                doctor.getAvailableTimeEnd()
        );
    }
}

