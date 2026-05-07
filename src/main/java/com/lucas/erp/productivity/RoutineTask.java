package com.lucas.erp.productivity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_routine_tasks")
public class RoutineTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    private String time; // Ex: "07:15"
    private Boolean done = false;
    private String type; // Ex: "health", "study"
}