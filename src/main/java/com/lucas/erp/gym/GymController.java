package com.lucas.erp.gym;

import com.lucas.erp.gym.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gym")
@RequiredArgsConstructor
public class GymController {

    private final GymService gymService;

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    // --- WORKOUTS ---

    @GetMapping("/workouts")
    public List<WorkoutDTO> getWorkouts(@AuthenticationPrincipal Jwt jwt) {
        return gymService.getWorkouts(userId(jwt));
    }

    @PostMapping("/workouts")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutDTO addWorkout(@AuthenticationPrincipal Jwt jwt,
                                 @Valid @RequestBody CreateWorkoutRequest req) {
        return gymService.createWorkout(userId(jwt), req);
    }

    @DeleteMapping("/workouts/{id}")
    public ResponseEntity<Void> deleteWorkout(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable UUID id) {
        gymService.deleteWorkout(userId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    // --- EXERCISES ---

    @GetMapping("/exercises")
    public List<ExerciseDTO> getAllExercises(@AuthenticationPrincipal Jwt jwt) {
        return gymService.getExercises(userId(jwt));
    }

    @PostMapping("/exercises")
    @ResponseStatus(HttpStatus.CREATED)
    public ExerciseDTO addExercise(@AuthenticationPrincipal Jwt jwt,
                                   @Valid @RequestBody CreateExerciseRequest req) {
        return gymService.createExercise(userId(jwt), req);
    }

    @PutMapping("/exercises/{id}")
    public ExerciseDTO updateExercise(@AuthenticationPrincipal Jwt jwt,
                                      @PathVariable UUID id,
                                      @RequestBody UpdateExerciseRequest req) {
        return gymService.updateExercise(userId(jwt), id, req);
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable UUID id) {
        gymService.deleteExercise(userId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    // --- SUPPLEMENTS ---

    @GetMapping("/supplements")
    public SupplementGoalDTO getSupplements(@AuthenticationPrincipal Jwt jwt) {
        return gymService.getSupplements(userId(jwt));
    }

    @PutMapping("/supplements")
    public SupplementGoalDTO updateSupplements(@AuthenticationPrincipal Jwt jwt,
                                               @RequestBody SupplementGoalDTO data) {
        return gymService.saveSupplements(userId(jwt), data);
    }
}
