package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("families")
public class Family {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String surname;

    private String description;

    private String coverImageUrl;

    private Integer generationCount;

    private Integer memberCount;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
