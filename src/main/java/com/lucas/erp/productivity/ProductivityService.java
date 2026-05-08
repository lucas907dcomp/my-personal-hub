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

    public List<RoutineTaskDTO> getTasks(UUID userId) {
        return taskRepository.findByUserIdOrderByTimeAsc(userId)
                .stream()
                .map(RoutineTaskDTO::from)
                .toList();
    }

    public RoutineTaskDTO addTask(UUID userId, CreateRoutineTaskRequest request) {
        RoutineTask task = new RoutineTask();
        task.setUserId(userId);
        task.setTitle(request.title());
        task.setTime(request.time());
        task.setType(request.type());
        task.setDone(false);
        return RoutineTaskDTO.from(taskRepository.save(task));
    }

    public void deleteTask(UUID userId, UUID taskId) {
        RoutineTask task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        taskRepository.delete(task);
    }

    public RoutineTaskDTO toggleTask(UUID userId, UUID taskId) {
        RoutineTask task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        task.setDone(!Boolean.TRUE.equals(task.getDone()));
        return RoutineTaskDTO.from(taskRepository.save(task));
    }

    public void resetDailyRoutine(UUID userId) {
        List<RoutineTask> tasks = taskRepository.findByUserIdOrderByTimeAsc(userId);
        tasks.forEach(t -> t.setDone(false));
        taskRepository.saveAll(tasks);
    }

    // --- NOTES ---

    public WorkspaceNoteDTO getNote(UUID userId) {
        WorkspaceNote note = noteRepository.findById(userId).orElseGet(() -> {
            WorkspaceNote n = new WorkspaceNote();
            n.setUserId(userId);
            n.setContent("");
            return noteRepository.save(n);
        });
        return WorkspaceNoteDTO.from(note);
    }

    public WorkspaceNoteDTO updateNote(UUID userId, WorkspaceNoteDTO noteDTO) {
        WorkspaceNote note = noteRepository.findById(userId).orElse(new WorkspaceNote());
        note.setUserId(userId);
        note.setContent(noteDTO.content());
        return WorkspaceNoteDTO.from(noteRepository.save(note));
    }
}
