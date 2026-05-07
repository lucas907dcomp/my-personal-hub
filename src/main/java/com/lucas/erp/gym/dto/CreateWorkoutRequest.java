package com.lucas.erp.gym.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWorkoutRequest(@NotBlank String name) {}
