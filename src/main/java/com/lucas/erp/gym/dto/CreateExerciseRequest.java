package com.lucas.erp.gym.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateExerciseRequest(
        @NotNull UUID workoutId,
        @NotBlank String name,
        Double weight,
        String reps,
        Integer rpe,
        Boolean canIncreaseNext
) {}
