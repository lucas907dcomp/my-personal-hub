package com.lucas.erp.gym.dto;

public record LogSessionRequest(
        Double weight,
        String reps,
        Integer rpe
) {}
