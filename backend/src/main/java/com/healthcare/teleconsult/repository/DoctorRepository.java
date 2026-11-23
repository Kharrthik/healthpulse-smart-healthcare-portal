package com.healthcare.teleconsult.repository;

import com.healthcare.teleconsult.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findBySpecializationIgnoreCase(String specialization);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:specialization IS NULL OR LOWER(d.specialization) = LOWER(:specialization)) AND " +
           "(:maxFee IS NULL OR d.consultationFee <= :maxFee) AND " +
           "(:search IS NULL OR LOWER(d.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Doctor> searchDoctors(@Param("specialization") String specialization,
                               @Param("maxFee") BigDecimal maxFee,
                               @Param("search") String search);
}

