package org.example.zupu_demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.zupu_demo.entity.User;

public interface UserService extends IService<User> {
    /** 注册新用户（密码哈希存储） */
    User register(String username, String rawPassword, String realName);

    /** 登录校验，成功返回用户，失败返回 null */
    User login(String username, String rawPassword);
}
