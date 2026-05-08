package com.lucas.erp.productivity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DailyCompletionRepository extends JpaRepository<DailyCompletion, DailyCompletion.PK> {
    List<DailyCompletion> findByUserIdOrderByCompletionDateDesc(UUID userId);
}
