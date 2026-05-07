package com.lucas.erp.gym;

import com.lucas.erp.gym.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GymService {

    private final WorkoutRepository workoutRepository;
    private final ExerciseRepository exerciseRepository;
    private final SupplementRepository supplementRepository;

    // --- WORKOUTS ---

    public List<WorkoutDTO> getWorkouts(UUID userId) {
        return workoutRepository.findByUserId(userId).stream()
                .map(this::toWorkoutDTO)
                .toList();
    }

    public WorkoutDTO createWorkout(UUID userId, CreateWorkoutRequest req) {
        Workout workout = new Workout();
        workout.setName(req.name());
        workout.setUserId(userId);
        return toWorkoutDTO(workoutRepository.save(workout));
    }

    @Transactional
    public void deleteWorkout(UUID userId, UUID workoutId) {
        Workout workout = workoutRepository.findByIdAndUserId(workoutId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Workout not found"));
        exerciseRepository.deleteByWorkout_Id(workout.getId());
        workoutRepository.delete(workout);
    }

    // --- EXERCISES ---

    public List<ExerciseDTO> getExercises(UUID userId) {
        return exerciseRepository.findByUserId(userId).stream()
                .map(this::toExerciseDTO)
                .toList();
    }

    public ExerciseDTO createExercise(UUID userId, CreateExerciseRequest req) {
        Workout workout = workoutRepository.findByIdAndUserId(req.workoutId(), userId)
                .orElseThrow(() -> new EntityNotFoundException("Workout not found"));
        Exercise exercise = new Exercise();
        exercise.setWorkout(workout);
        exercise.setUserId(userId);
        exercise.setName(req.name());
        exercise.setWeight(req.weight());
        exercise.setReps(req.reps());
        exercise.setRpe(req.rpe());
        exercise.setCanIncreaseNext(req.canIncreaseNext() != null ? req.canIncreaseNext() : false);
        return toExerciseDTO(exerciseRepository.save(exercise));
    }

    public ExerciseDTO updateExercise(UUID userId, UUID exerciseId, UpdateExerciseRequest req) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));
        if (req.weight() != null) exercise.setWeight(req.weight());
        if (req.reps() != null) exercise.setReps(req.reps());
        if (req.rpe() != null) exercise.setRpe(req.rpe());
        if (req.canIncreaseNext() != null) exercise.setCanIncreaseNext(req.canIncreaseNext());
        return toExerciseDTO(exerciseRepository.save(exercise));
    }

    public void deleteExercise(UUID userId, UUID exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));
        exerciseRepository.delete(exercise);
    }

    // --- SUPPLEMENTS ---

    public SupplementGoalDTO getSupplements(UUID userId) {
        return supplementRepository.findById(userId)
                .map(sg -> new SupplementGoalDTO(sg.getWhey(), sg.getCreatina()))
                .orElse(new SupplementGoalDTO(false, false));
    }

    public SupplementGoalDTO updateSupplements(UUID userId, SupplementGoalDTO data) {
        SupplementGoal sg = supplementRepository.findById(userId).orElse(new SupplementGoal());
        sg.setUserId(userId);
        sg.setWhey(data.whey());
        sg.setCreatina(data.creatina());
        return new SupplementGoalDTO(sg.getWhey(), sg.getCreatina());
        // note: save happens after setting userId — avoids detached entity issues
    }

    @Transactional
    public SupplementGoalDTO saveSupplements(UUID userId, SupplementGoalDTO data) {
        SupplementGoal sg = supplementRepository.findById(userId).orElse(new SupplementGoal());
        sg.setUserId(userId);
        sg.setWhey(data.whey() != null ? data.whey() : false);
        sg.setCreatina(data.creatina() != null ? data.creatina() : false);
        supplementRepository.save(sg);
        return new SupplementGoalDTO(sg.getWhey(), sg.getCreatina());
    }

    // --- Mapping helpers ---

    private WorkoutDTO toWorkoutDTO(Workout w) {
        List<ExerciseDTO> exercises = w.getExercises().stream()
                .map(this::toExerciseDTO)
                .toList();
        return new WorkoutDTO(w.getId(), w.getName(), exercises);
    }

    private ExerciseDTO toExerciseDTO(Exercise e) {
        UUID workoutId = e.getWorkout() != null ? e.getWorkout().getId() : null;
        return new ExerciseDTO(e.getId(), workoutId, e.getName(),
                e.getWeight(), e.getReps(), e.getRpe(), e.getCanIncreaseNext());
    }
}
