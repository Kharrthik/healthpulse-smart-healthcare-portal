package com.healthcare.teleconsult.repository;

import com.healthcare.teleconsult.entity.AiPreConsultationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiPreConsultationNoteRepository extends JpaRepository<AiPreConsultationNote, Long> {
    Optional<AiPreConsultationNote> findByConsultationId(Long consultationId);
    boolean existsByConsultationId(Long consultationId);
}

