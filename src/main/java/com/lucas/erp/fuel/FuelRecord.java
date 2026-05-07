package com.lucas.erp.fuel;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_fuel_records")
public class FuelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private LocalDateTime date = LocalDateTime.now();

    private Double totalValue;
    private Double pricePerLiter;
    private Double odometer;
    private Double liters;
    private String fuelType;
}