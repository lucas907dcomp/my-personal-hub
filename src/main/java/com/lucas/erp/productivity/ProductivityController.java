package com.lucas.erp.productivity;

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
@RequestMapping("/api/v1/productivity")
@RequiredArgsConstructor
public class ProductivityController {

    private final ProductivityService productivityService;

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @GetMapping("/tasks")
    public List<RoutineTaskDTO> getTasks(@AuthenticationPrincipal Jwt jwt) {
        return productivityService.getTasks(userId(jwt));
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineTaskDTO addTask(@AuthenticationPrincipal Jwt jwt,
                                  @Valid @RequestBody CreateRoutineTaskRequest request) {
        return productivityService.addTask(userId(jwt), request);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable UUID id) {
        productivityService.deleteTask(userId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tasks/{id}/toggle")
    public RoutineTaskDTO toggleTask(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable UUID id) {
        return productivityService.toggleTask(userId(jwt), id);
    }

    @PostMapping("/tasks/reset")
    public ResponseEntity<Void> resetDailyRoutine(@AuthenticationPrincipal Jwt jwt) {
        productivityService.resetDailyRoutine(userId(jwt));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/streak")
    public StreakDTO getStreak(@AuthenticationPrincipal Jwt jwt) {
        return productivityService.getStreak(userId(jwt));
    }

    @GetMapping("/notes")
    public WorkspaceNoteDTO getNote(@AuthenticationPrincipal Jwt jwt) {
        return productivityService.getNote(userId(jwt));
    }

    @PutMapping("/notes")
    public WorkspaceNoteDTO updateNote(@AuthenticationPrincipal Jwt jwt,
                                       @RequestBody WorkspaceNoteDTO noteDTO) {
        return productivityService.updateNote(userId(jwt), noteDTO);
    }
}
