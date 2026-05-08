package com.lucas.erp.fuel;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateFuelRecordRequest(
        @NotNull @Positive BigDecimal totalValue,
        @NotNull @Positive BigDecimal pricePerLiter,
        @NotNull @Positive Double odometer,
        String fuelType
) {}
