package com.lucas.erp.productivity;

import java.util.UUID;

public record RoutineTaskDTO(
        UUID id,
        String title,
        String time,
        boolean done,
        String type,
        boolean isRecurring
) {
    public static RoutineTaskDTO from(RoutineTask t) {
        return new RoutineTaskDTO(
                t.getId(),
                t.getTitle(),
                t.getTime(),
                Boolean.TRUE.equals(t.getDone()),
                t.getType(),
                Boolean.TRUE.equals(t.getIsRecurring())
        );
    }
}
