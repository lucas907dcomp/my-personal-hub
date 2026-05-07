package com.lucas.erp.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {
    List<Workout> findByUserId(UUID userId);
    Optional<Workout> findByIdAndUserId(UUID id, UUID userId);
}
