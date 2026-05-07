package com.lucas.erp.gym.dto;

import java.util.UUID;

public record ExerciseDTO(
        UUID id,
        UUID workoutId,
        String name,
        Double weight,
        String reps,
        Integer rpe,
        Boolean canIncreaseNext
) {}
