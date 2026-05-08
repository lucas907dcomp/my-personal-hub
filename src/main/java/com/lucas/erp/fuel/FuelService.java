package com.lucas.erp.fuel;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FuelService {

    private final FuelRepository repository;

    public List<FuelRecordDTO> getRecords(UUID userId) {
        return repository.findByUserIdOrderByDateDesc(userId)
                .stream()
                .map(FuelRecordDTO::from)
                .toList();
    }

    public FuelRecordDTO addRecord(UUID userId, CreateFuelRecordRequest request) {
        FuelRecord record = new FuelRecord();
        record.setUserId(userId);
        record.setTotalValue(request.totalValue());
        record.setPricePerLiter(request.pricePerLiter());
        record.setOdometer(request.odometer());
        record.setFuelType(request.fuelType());
        BigDecimal liters = request.totalValue()
                .divide(request.pricePerLiter(), 3, RoundingMode.HALF_UP);
        record.setLiters(liters);
        return FuelRecordDTO.from(repository.save(record));
    }

    public void deleteRecord(UUID userId, UUID recordId) {
        FuelRecord record = repository.findById(recordId)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Fuel record not found"));
        repository.delete(record);
    }
}
