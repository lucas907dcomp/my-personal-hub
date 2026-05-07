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
@RequestMapping("/api/productivity")
@RequiredArgsConstructor
public class ProductivityController {

    private final ProductivityService productivityService;

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @GetMapping("/tasks")
    public List<RoutineTask> getTasks(@AuthenticationPrincipal Jwt jwt) {
        return productivityService.getTasks(userId(jwt));
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineTask addTask(@AuthenticationPrincipal Jwt jwt,
                               @Valid @RequestBody RoutineTask task) {
        return productivityService.addTask(userId(jwt), task);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable UUID id) {
        productivityService.deleteTask(userId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tasks/{id}/toggle")
    public RoutineTask toggleTask(@AuthenticationPrincipal Jwt jwt,
                                  @PathVariable UUID id) {
        return productivityService.toggleTask(userId(jwt), id);
    }

    @PostMapping("/tasks/reset")
    public ResponseEntity<Void> resetDailyRoutine(@AuthenticationPrincipal Jwt jwt) {
        productivityService.resetDailyRoutine(userId(jwt));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/notes")
    public WorkspaceNote getNote(@AuthenticationPrincipal Jwt jwt) {
        return productivityService.getNote(userId(jwt));
    }

    @PutMapping("/notes")
    public WorkspaceNote updateNote(@AuthenticationPrincipal Jwt jwt,
                                    @RequestBody WorkspaceNote noteAtualizada) {
        return productivityService.updateNote(userId(jwt), noteAtualizada);
    }
}
