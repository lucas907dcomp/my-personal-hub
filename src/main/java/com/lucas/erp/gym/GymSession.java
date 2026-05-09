package com.lucas.erp.gym;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_gym_sessions")
public class GymSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt = LocalDateTime.now();

    private BigDecimal weight;
    private String reps;
    private Integer rpe;
}
