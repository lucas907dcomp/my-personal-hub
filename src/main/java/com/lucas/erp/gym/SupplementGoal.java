package com.lucas.erp.gym;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "tb_gym_supplements")
public class SupplementGoal {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    private Boolean whey = false;
    private Boolean creatina = false;
}
