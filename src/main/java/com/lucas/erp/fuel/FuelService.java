package com.lucas.erp.fuel;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FuelService {

    private final FuelRepository repository;

    public List<FuelRecord> getRecords(UUID userId) {
        return repository.findByUserIdOrderByDateDesc(userId);
    }

    public FuelRecord addRecord(UUID userId, FuelRecord record) {
        record.setUserId(userId);
        double calculatedLiters = Math.round((record.getTotalValue() / record.getPricePerLiter()) * 100.0) / 100.0;
        record.setLiters(calculatedLiters);
        return repository.save(record);
    }

    public void deleteRecord(UUID userId, UUID recordId) {
        FuelRecord record = repository.findById(recordId)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Fuel record not found"));
        repository.delete(record);
    }
}
