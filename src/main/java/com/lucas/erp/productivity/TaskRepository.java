package com.lucas.erp.productivity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<RoutineTask, UUID> {
    List<RoutineTask> findByUserIdOrderByTimeAsc(UUID userId);
}
