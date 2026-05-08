package com.lucas.erp.gym;

import com.lucas.erp.gym.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GymService {

    private final WorkoutRepository workoutRepository;
    private final ExerciseRepository exerciseRepository;
    private final SupplementRepository supplementRepository;
    private final SessionRepository sessionRepository;

    // --- WORKOUTS ---

    public List<WorkoutDTO> getWorkouts(UUID userId) {
        List<WorkoutDTO> result = workoutRepository.findByUserIdOrderByPositionAsc(userId).stream()
                .map(this::toWorkoutDTO)
                .toList();
        log.info("getWorkouts userId={} count={}", userId, result.size());
        return result;
    }

    public WorkoutDTO createWorkout(UUID userId, CreateWorkoutRequest req) {
        int maxPosition = workoutRepository.findByUserIdOrderByPositionAsc(userId).stream()
                .mapToInt(Workout::getPosition)
                .max()
                .orElse(-1);
        Workout workout = new Workout();
        workout.setName(req.name());
        workout.setUserId(userId);
        workout.setPosition(maxPosition + 1);
        WorkoutDTO dto = toWorkoutDTO(workoutRepository.save(workout));
        log.info("createWorkout userId={} workoutId={} name={} position={}", userId, dto.id(), req.name(), dto.position());
        return dto;
    }

    @Transactional
    public void deleteWorkout(UUID userId, UUID workoutId) {
        Workout workout = workoutRepository.findByIdAndUserId(workoutId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Workout not found"));
        exerciseRepository.deleteByWorkout_Id(workout.getId());
        workoutRepository.delete(workout);
        log.info("deleteWorkout userId={} workoutId={}", userId, workoutId);
    }

    @Transactional
    public void reorderWorkouts(UUID userId, List<UUID> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            UUID workoutId = orderedIds.get(i);
            Workout workout = workoutRepository.findByIdAndUserId(workoutId, userId)
                    .orElseThrow(() -> new EntityNotFoundException("Workout not found: " + workoutId));
            workout.setPosition(i);
            workoutRepository.save(workout);
        }
        log.info("reorderWorkouts userId={} count={}", userId, orderedIds.size());
    }

    // --- EXERCISES ---

    public List<ExerciseDTO> getExercises(UUID userId) {
        List<ExerciseDTO> result = exerciseRepository.findByUserId(userId).stream()
                .map(this::toExerciseDTO)
                .toList();
        log.info("getExercises userId={} count={}", userId, result.size());
        return result;
    }

    public Page<ExerciseDTO> getExercisesPage(UUID userId, Pageable pageable) {
        Page<ExerciseDTO> result = exerciseRepository.findByUserId(userId, pageable)
                .map(this::toExerciseDTO);
        log.info("getExercisesPage userId={} page={} size={} total={}", userId, pageable.getPageNumber(), pageable.getPageSize(), result.getTotalElements());
        return result;
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
        ExerciseDTO dto = toExerciseDTO(exerciseRepository.save(exercise));
        log.info("createExercise userId={} exerciseId={} name={}", userId, dto.id(), req.name());
        return dto;
    }

    public ExerciseDTO updateExercise(UUID userId, UUID exerciseId, UpdateExerciseRequest req) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));
        if (req.weight() != null) exercise.setWeight(req.weight());
        if (req.reps() != null) exercise.setReps(req.reps());
        // Allow null to clear RPE (ADR-017: optional RPE)
        exercise.setRpe(req.rpe());
        if (req.canIncreaseNext() != null) exercise.setCanIncreaseNext(req.canIncreaseNext());
        ExerciseDTO dto = toExerciseDTO(exerciseRepository.save(exercise));
        log.info("updateExercise userId={} exerciseId={}", userId, exerciseId);
        return dto;
    }

    public void deleteExercise(UUID userId, UUID exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));
        exerciseRepository.delete(exercise);
        log.info("deleteExercise userId={} exerciseId={}", userId, exerciseId);
    }

    // --- SESSIONS (ADR-022) ---

    @Transactional
    public GymSessionDTO logSession(UUID userId, UUID exerciseId, LogSessionRequest req) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));

        GymSession session = new GymSession();
        session.setUserId(userId);
        session.setExercise(exercise);
        session.setLoggedAt(LocalDateTime.now());
        session.setWeight(req.weight() != null ? req.weight() : exercise.getWeight());
        session.setReps(req.reps() != null ? req.reps() : exercise.getReps());
        session.setRpe(req.rpe() != null ? req.rpe() : exercise.getRpe());

        GymSessionDTO dto = GymSessionDTO.from(sessionRepository.save(session));
        log.info("logSession userId={} exerciseId={}", userId, exerciseId);
        return dto;
    }

    public Optional<GymSessionDTO> getLastSession(UUID userId, UUID exerciseId) {
        exerciseRepository.findById(exerciseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found"));
        return sessionRepository.findTopByExercise_IdAndUserIdOrderByLoggedAtDesc(exerciseId, userId)
                .map(GymSessionDTO::from);
    }

    // --- SUPPLEMENTS ---

    public SupplementGoalDTO getSupplements(UUID userId) {
        return supplementRepository.findById(userId)
                .map(sg -> new SupplementGoalDTO(sg.getWhey(), sg.getCreatina()))
                .orElse(new SupplementGoalDTO(false, false));
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
        return new WorkoutDTO(w.getId(), w.getName(), w.getPosition(), exercises);
    }

    private ExerciseDTO toExerciseDTO(Exercise e) {
        UUID workoutId = e.getWorkout() != null ? e.getWorkout().getId() : null;
        return new ExerciseDTO(e.getId(), workoutId, e.getName(),
                e.getWeight(), e.getReps(), e.getRpe(), e.getCanIncreaseNext());
    }
}
