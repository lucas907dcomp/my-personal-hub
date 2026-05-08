package com.lucas.erp.gym;

import com.lucas.erp.gym.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gym")
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

    @PatchMapping("/workouts/order")
    public ResponseEntity<Void> reorderWorkouts(@AuthenticationPrincipal Jwt jwt,
                                                @RequestBody ReorderWorkoutsRequest req) {
        gymService.reorderWorkouts(userId(jwt), req.orderedIds());
        return ResponseEntity.noContent().build();
    }

    // --- EXERCISES ---

    @GetMapping("/exercises")
    public Page<ExerciseDTO> getExercises(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
        return gymService.getExercisesPage(userId(jwt), pageable);
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

    // --- SESSIONS (ADR-022) ---

    @PostMapping("/exercises/{id}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public GymSessionDTO logSession(@AuthenticationPrincipal Jwt jwt,
                                    @PathVariable UUID id,
                                    @RequestBody LogSessionRequest req) {
        return gymService.logSession(userId(jwt), id, req);
    }

    @GetMapping("/exercises/{id}/sessions/last")
    public ResponseEntity<GymSessionDTO> getLastSession(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable UUID id) {
        return gymService.getLastSession(userId(jwt), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
