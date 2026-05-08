package com.lucas.erp.productivity;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_daily_completions")
@IdClass(DailyCompletion.PK.class)
public class DailyCompletion {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "completion_percentage", nullable = false)
    private int completionPercentage;

    @Data
    public static class PK implements Serializable {
        private UUID userId;
        private LocalDate completionDate;
    }
}
