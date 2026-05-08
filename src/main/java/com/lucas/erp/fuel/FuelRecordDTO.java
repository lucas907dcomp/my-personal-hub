package com.lucas.erp.fuel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record FuelRecordDTO(
        UUID id,
        LocalDateTime date,
        BigDecimal totalValue,
        BigDecimal pricePerLiter,
        double odometer,
        BigDecimal liters,
        String fuelType
) {
    public static FuelRecordDTO from(FuelRecord r) {
        return new FuelRecordDTO(
                r.getId(),
                r.getDate(),
                r.getTotalValue(),
                r.getPricePerLiter(),
                r.getOdometer(),
                r.getLiters(),
                r.getFuelType()
        );
    }
}
