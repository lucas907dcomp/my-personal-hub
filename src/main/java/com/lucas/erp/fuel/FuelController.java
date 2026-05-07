package com.lucas.erp.fuel;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fuel")
@RequiredArgsConstructor
public class FuelController {

    private final FuelRepository repository;

    @GetMapping
    public List<FuelRecord> getRecords() {
        return repository.findAllByOrderByDateDesc();
    }

    @PostMapping
    public FuelRecord addRecord(@RequestBody FuelRecord record) {
        // Regra de negócio isolada no backend
        double calculatedLiters = Math.round((record.getTotalValue() / record.getPricePerLiter()) * 100.0) / 100.0;
        record.setLiters(calculatedLiters);

        return repository.save(record);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}