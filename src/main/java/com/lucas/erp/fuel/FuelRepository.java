package com.lucas.erp.fuel;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FuelRepository extends JpaRepository<FuelRecord, UUID> {
    List<FuelRecord> findByUserIdOrderByDateDesc(UUID userId);
}
