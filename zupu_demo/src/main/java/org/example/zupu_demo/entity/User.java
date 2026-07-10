package org.example.zupu_demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String passwordHash;

    private String realName;

    private String phone;

    private String avatarUrl;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
