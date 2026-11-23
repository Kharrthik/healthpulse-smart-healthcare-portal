package com.healthcare.teleconsult.repository;

import com.healthcare.teleconsult.entity.Consultation;
import com.healthcare.teleconsult.entity.ConsultationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByPatientIdOrderByScheduledAtDesc(Long patientId);
    List<Consultation> findByDoctorIdOrderByScheduledAtDesc(Long doctorId);
    List<Consultation> findByDoctorIdAndStatusOrderByScheduledAtAsc(Long doctorId, ConsultationStatus status);
    List<Consultation> findAllByOrderByScheduledAtDesc();
}

