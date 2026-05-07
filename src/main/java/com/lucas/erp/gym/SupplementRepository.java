package com.lucas.erp.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SupplementRepository extends JpaRepository<SupplementGoal, UUID> {
}
