package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_rules")
public class FamilyRule {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long familyId;

    private String title;

    private String content;

    private String category;

    private Integer sortOrder;

    private Integer isPinned;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
