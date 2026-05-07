package com.lucas.erp.productivity;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductivityService {

    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;

    // --- TASKS ---

    public List<RoutineTask> getTasks(UUID userId) {
        return taskRepository.findByUserIdOrderByTimeAsc(userId);
    }

    public RoutineTask addTask(UUID userId, RoutineTask task) {
        task.setUserId(userId);
        return taskRepository.save(task);
    }

    public void deleteTask(UUID userId, UUID taskId) {
        RoutineTask task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        taskRepository.delete(task);
    }

    public RoutineTask toggleTask(UUID userId, UUID taskId) {
        RoutineTask task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        task.setDone(!task.getDone());
        return taskRepository.save(task);
    }

    public void resetDailyRoutine(UUID userId) {
        List<RoutineTask> tasks = taskRepository.findByUserIdOrderByTimeAsc(userId);
        tasks.forEach(t -> t.setDone(false));
        taskRepository.saveAll(tasks);
    }

    // --- NOTES ---

    public WorkspaceNote getNote(UUID userId) {
        return noteRepository.findById(userId).orElseGet(() -> {
            WorkspaceNote note = new WorkspaceNote();
            note.setUserId(userId);
            note.setContent("");
            return noteRepository.save(note);
        });
    }

    public WorkspaceNote updateNote(UUID userId, WorkspaceNote incoming) {
        WorkspaceNote note = noteRepository.findById(userId).orElse(new WorkspaceNote());
        note.setUserId(userId);
        note.setContent(incoming.getContent());
        return noteRepository.save(note);
    }
}
