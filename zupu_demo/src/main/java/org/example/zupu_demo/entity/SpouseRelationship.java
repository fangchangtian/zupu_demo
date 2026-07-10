package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("spouse_relationships")
public class SpouseRelationship {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long familyId;

    private Long husbandId;

    private Long wifeId;

    private LocalDate marriageDate;

    private LocalDate divorceDate;

    private Integer isCurrent;

    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
