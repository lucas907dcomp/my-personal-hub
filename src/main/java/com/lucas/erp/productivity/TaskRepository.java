package com.lucas.erp.productivity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface TaskRepository extends JpaRepository<RoutineTask, UUID> {
    // Traz a rotina ordenada pelo horário
    List<RoutineTask> findAllByOrderByTimeAsc();
}