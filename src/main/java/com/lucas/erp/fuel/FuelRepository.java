package com.lucas.erp.fuel;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface FuelRepository extends JpaRepository<FuelRecord, UUID> {
    // Retorna ordenado do mais novo para o mais antigo, igual fizemos no React
    List<FuelRecord> findAllByOrderByDateDesc();
}