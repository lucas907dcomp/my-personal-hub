package com.lucas.erp.productivity;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductivityService {

    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final DailyCompletionRepository completionRepository;

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
        task.setIsRecurring(request.isRecurring() != null ? request.isRecurring() : true);
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

    @Transactional
    public void resetDailyRoutine(UUID userId) {
        List<RoutineTask> tasks = taskRepository.findByUserIdOrderByTimeAsc(userId);

        // 1. Calculate completion percentage BEFORE any changes
        long done = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getDone())).count();
        int percentage = tasks.isEmpty() ? 0 : (int) Math.round((done * 100.0) / tasks.size());

        // 2. Persist daily completion record (upsert)
        saveDailyCompletion(userId, percentage);

        // 3. Apply reset rules per ADR-023
        for (RoutineTask task : tasks) {
            boolean recurring = Boolean.TRUE.equals(task.getIsRecurring());
            boolean isDone = Boolean.TRUE.equals(task.getDone());

            if (recurring) {
                task.setDone(false);
                taskRepository.save(task);
            } else if (isDone) {
                taskRepository.delete(task);
            }
            // Non-recurring and not done: keep as-is
        }
    }

    private void saveDailyCompletion(UUID userId, int percentage) {
        DailyCompletion.PK pk = new DailyCompletion.PK();
        pk.setUserId(userId);
        pk.setCompletionDate(LocalDate.now());

        DailyCompletion record = completionRepository.findById(pk)
                .orElse(new DailyCompletion());
        record.setUserId(userId);
        record.setCompletionDate(LocalDate.now());
        record.setCompletionPercentage(percentage);
        completionRepository.save(record);
    }

    public StreakDTO getStreak(UUID userId) {
        List<DailyCompletion> history = completionRepository.findByUserIdOrderByCompletionDateDesc(userId);
        int totalDays = history.size();
        int streak = 0;

        if (history.isEmpty()) return new StreakDTO(0, 0);

        // Start counting from today or yesterday depending on whether today was already recorded
        LocalDate expected = history.get(0).getCompletionDate().equals(LocalDate.now())
                ? LocalDate.now()
                : LocalDate.now().minusDays(1);

        for (DailyCompletion entry : history) {
            if (!entry.getCompletionDate().equals(expected)) break;
            if (entry.getCompletionPercentage() < 100) break;
            streak++;
            expected = expected.minusDays(1);
        }

        return new StreakDTO(streak, totalDays);
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
