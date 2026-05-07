package com.lucas.erp.gym;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_gym_exercises")
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    private Workout workout;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank
    private String name;
    private Double weight;
    private String reps;
    private Integer rpe;
    private Boolean canIncreaseNext = false;
}
