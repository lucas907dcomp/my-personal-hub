package com.lucas.erp.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<GymSession, UUID> {
    Optional<GymSession> findTopByExercise_IdAndUserIdOrderByLoggedAtDesc(UUID exerciseId, UUID userId);
}
