package com.lucas.erp.gym.dto;

public record UpdateExerciseRequest(
        Double weight,
        String reps,
        Integer rpe,
        Boolean canIncreaseNext
) {}
