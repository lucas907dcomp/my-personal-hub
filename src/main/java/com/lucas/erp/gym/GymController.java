package com.lucas.erp.gym;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gym")
@RequiredArgsConstructor
public class GymController {

    private final WorkoutRepository workoutRepository;
    private final ExerciseRepository exerciseRepository;
    private final SupplementRepository supplementRepository;

    // --- WORKOUTS ---
    @GetMapping("/workouts")
    public List<Workout> getWorkouts() {
        return workoutRepository.findAll();
    }

    @PostMapping("/workouts")
    public Workout addWorkout(@RequestBody Workout workout) {
        return workoutRepository.save(workout);
    }

    @DeleteMapping("/workouts/{id}")
    @Transactional // Garante que se der erro ao deletar os exercícios, o treino não é deletado (ACID)
    public ResponseEntity<Void> deleteWorkout(@PathVariable UUID id) {
        exerciseRepository.deleteByWorkoutId(id);
        workoutRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- EXERCISES ---
    @GetMapping("/exercises")
    public List<Exercise> getAllExercises() {
        return exerciseRepository.findAll();
    }

    @PostMapping("/exercises")
    public Exercise addExercise(@RequestBody Exercise exercise) {
        return exerciseRepository.save(exercise);
    }

    @PutMapping("/exercises/{id}")
    public Exercise updateExercise(@PathVariable UUID id, @RequestBody Exercise updatedData) {
        Exercise exercise = exerciseRepository.findById(id).orElseThrow();
        // Atualiza apenas os campos permitidos
        if (updatedData.getWeight() != null) exercise.setWeight(updatedData.getWeight());
        if (updatedData.getReps() != null) exercise.setReps(updatedData.getReps());
        if (updatedData.getRpe() != null) exercise.setRpe(updatedData.getRpe());
        if (updatedData.getCanIncreaseNext() != null) exercise.setCanIncreaseNext(updatedData.getCanIncreaseNext());

        return exerciseRepository.save(exercise);
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable UUID id) {
        exerciseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- SUPPLEMENTS ---
    @GetMapping("/supplements")
    public SupplementGoal getSupplements() {
        return supplementRepository.findById(1).orElseGet(() -> {
            SupplementGoal sg = new SupplementGoal();
            return supplementRepository.save(sg);
        });
    }

    @PutMapping("/supplements")
    public SupplementGoal updateSupplements(@RequestBody SupplementGoal data) {
        SupplementGoal sg = supplementRepository.findById(1).orElse(new SupplementGoal());
        sg.setWhey(data.getWhey());
        sg.setCreatina(data.getCreatina());
        return supplementRepository.save(sg);
    }
}