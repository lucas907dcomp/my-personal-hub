package com.lucas.erp.productivity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_workspace_notes")
public class WorkspaceNote {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(columnDefinition = "TEXT")
    private String content;
}
