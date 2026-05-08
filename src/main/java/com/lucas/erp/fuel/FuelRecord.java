package com.lucas.erp.fuel;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_fuel_records")
public class FuelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    private LocalDateTime date = LocalDateTime.now();

    @NotNull @Positive
    @Column(precision = 10, scale = 2)
    private BigDecimal totalValue;

    @NotNull @Positive
    @Column(precision = 10, scale = 2)
    private BigDecimal pricePerLiter;

    @NotNull @Positive
    private Double odometer;

    @Column(precision = 8, scale = 3)
    private BigDecimal liters;

    private String fuelType;
}
