package com.lucas.erp.gym;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tb_gym_supplements")
public class SupplementGoal {
    @Id
    private Integer id = 1; // Registro único para o MVP

    private Boolean whey = false;
    private Boolean creatina = false;
}