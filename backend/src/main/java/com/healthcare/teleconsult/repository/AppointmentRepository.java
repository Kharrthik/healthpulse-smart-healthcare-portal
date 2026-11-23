package com.healthcare.teleconsult.repository;

import com.healthcare.teleconsult.entity.Appointment;
import com.healthcare.teleconsult.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorIdOrderByAppointmentDateTimeAsc(Long doctorId);

    List<Appointment> findByDoctorIdAndStatusOrderByAppointmentDateTimeAsc(Long doctorId, AppointmentStatus status);

    List<Appointment> findByPatientEmailOrderByAppointmentDateTimeAsc(String patientEmail);

    List<Appointment> findByPatientEmailAndStatusOrderByAppointmentDateTimeAsc(String patientEmail, AppointmentStatus status);

    List<Appointment> findByPatientIdOrderByAppointmentDateTimeAsc(Long patientId);

    /**
     * Checks if an active appointment already exists for the doctor at the exact appointment date and time.
     */
    boolean existsByDoctorIdAndAppointmentDateTimeAndStatusIn(
            Long doctorId,
            LocalDateTime appointmentDateTime,
            Collection<AppointmentStatus> statuses
    );

    /**
     * Checks for conflicting appointment within a +/- 29-minute window for the doctor to prevent overlapping slots.
     */
    @Query("""
        SELECT COUNT(a) > 0 FROM Appointment a
        WHERE a.doctor.id = :doctorId
          AND a.status IN :statuses
          AND a.appointmentDateTime >= :windowStart
          AND a.appointmentDateTime <= :windowEnd
    """)
    boolean hasConflictingAppointment(
            @Param("doctorId") Long doctorId,
            @Param("statuses") Collection<AppointmentStatus> statuses,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd
    );

    long countByAppointmentDateTimeAfter(LocalDateTime time);
}

