package com.lucas.erp.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {
    List<Exercise> findByWorkout_Id(UUID workoutId);
    void deleteByWorkout_Id(UUID workoutId);
    List<Exercise> findByUserId(UUID userId);
}
