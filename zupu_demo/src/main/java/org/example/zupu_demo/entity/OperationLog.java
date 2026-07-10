package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("operation_logs")
public class OperationLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long familyId;

    private Long userId;

    private Long targetMemberId;

    private String action;

    private String detailJson;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
