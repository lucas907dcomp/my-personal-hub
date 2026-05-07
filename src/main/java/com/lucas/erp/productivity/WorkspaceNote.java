package com.lucas.erp.productivity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tb_workspace_notes")
public class WorkspaceNote {

    @Id
    private Integer id = 1; // Usamos sempre o ID 1, pois é um rascunho único fixo

    @Column(columnDefinition = "TEXT")
    private String content;
}