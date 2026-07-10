package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("family_members")
public class FamilyMember {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long familyId;

    private String name;

    private String generationName;

    private String alias;

    private String gender;

    private LocalDate birthDate;

    private String birthPlace;

    private LocalDate deathDate;

    private Integer isAlive;

    private String biography;

    private String avatarUrl;

    private Integer generationOrder;

    private Long fatherId;

    private Long motherId;

    private Long adoptiveFatherId;

    private Long adoptiveMotherId;

    private Integer sortOrder;

    private Long createdBy;

    private Long updatedBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
