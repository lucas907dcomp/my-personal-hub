package com.lucas.erp.gym.dto;

import java.util.List;
import java.util.UUID;

public record WorkoutDTO(
        UUID id,
        String name,
        int position,
        List<ExerciseDTO> exercises
) {}
