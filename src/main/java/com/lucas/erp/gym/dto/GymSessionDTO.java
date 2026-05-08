package com.lucas.erp.gym.dto;

import com.lucas.erp.gym.GymSession;
import java.time.LocalDateTime;
import java.util.UUID;

public record GymSessionDTO(
        UUID id,
        UUID exerciseId,
        LocalDateTime loggedAt,
        Double weight,
        String reps,
        Integer rpe
) {
    public static GymSessionDTO from(GymSession s) {
        return new GymSessionDTO(
                s.getId(),
                s.getExercise().getId(),
                s.getLoggedAt(),
                s.getWeight(),
                s.getReps(),
                s.getRpe()
        );
    }
}
