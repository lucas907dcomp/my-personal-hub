package com.lucas.erp.productivity;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/productivity")
@RequiredArgsConstructor
public class ProductivityController {

    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;

    // ==========================================
    // ENDPOINTS DE TAREFAS (ROTINA)
    // ==========================================

    @GetMapping("/tasks")
    public List<RoutineTask> getTasks() {
        return taskRepository.findAllByOrderByTimeAsc();
    }

    @PostMapping("/tasks")
    public RoutineTask addTask(@RequestBody RoutineTask task) {
        return taskRepository.save(task);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Marca a tarefa como concluída ou desfeita
    @PutMapping("/tasks/{id}/toggle")
    public RoutineTask toggleTask(@PathVariable UUID id) {
        RoutineTask task = taskRepository.findById(id).orElseThrow();
        task.setDone(!task.getDone());
        return taskRepository.save(task);
    }

    // O "Reset Diário" (Volta tudo para false)
    @PostMapping("/tasks/reset")
    public ResponseEntity<Void> resetDailyRoutine() {
        List<RoutineTask> allTasks = taskRepository.findAll();
        allTasks.forEach(task -> task.setDone(false));
        taskRepository.saveAll(allTasks);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // ENDPOINTS DO RASCUNHO (NOTAS)
    // ==========================================

    @GetMapping("/notes")
    public WorkspaceNote getNote() {
        // Se não existir, cria a nota número 1 em branco
        return noteRepository.findById(1).orElseGet(() -> {
            WorkspaceNote newNote = new WorkspaceNote();
            newNote.setContent("");
            return noteRepository.save(newNote);
        });
    }

    @PutMapping("/notes")
    public WorkspaceNote updateNote(@RequestBody WorkspaceNote noteAtualizada) {
        WorkspaceNote note = noteRepository.findById(1).orElse(new WorkspaceNote());
        note.setContent(noteAtualizada.getContent());
        return noteRepository.save(note);
    }
}