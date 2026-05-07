package com.lucas.erp.gym;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {
    List<Exercise> findByWorkoutId(UUID workoutId);
    void deleteByWorkoutId(UUID workoutId); // Para o efeito cascata
}