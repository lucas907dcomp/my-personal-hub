package com.lucas.erp.gym;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_gym_exercises")
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID workoutId; // Chave estrangeira lógica para manter o padrão do seu front

    private String name;
    private Double weight;
    private String reps;
    private Integer rpe;
    private Boolean canIncreaseNext = false;
}