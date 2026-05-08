package com.lucas.erp.productivity;

import jakarta.validation.constraints.NotBlank;

public record CreateRoutineTaskRequest(
        @NotBlank String title,
        String time,
        String type
) {}
