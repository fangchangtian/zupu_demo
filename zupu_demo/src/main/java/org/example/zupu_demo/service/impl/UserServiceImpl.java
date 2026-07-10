package org.example.zupu_demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.zupu_demo.entity.User;
import org.example.zupu_demo.mapper.UserMapper;
import org.example.zupu_demo.service.UserService;
import org.example.zupu_demo.common.exception.BusinessException;
import org.example.zupu_demo.common.exception.ErrorCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User register(String username, String rawPassword, String realName) {
        User exist = getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (exist != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_USERNAME);
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRealName(realName);
        save(user);
        return user;
    }

    @Override
    public User login(String username, String rawPassword) {
        User user = getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) return null;
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) return null;
        return user;
    }
}
