package com.lucas.erp.productivity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_routine_tasks")
public class RoutineTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank
    private String title;
    private String time;
    private Boolean done = false;
    private String type;
}
