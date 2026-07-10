package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_user_roles")
public class FamilyUserRole {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long familyId;

    private Long userId;

    private Long memberId;

    private String role;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
