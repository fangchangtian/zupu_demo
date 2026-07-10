package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.dto.user.LoginRequest;
import org.example.zupu_demo.dto.user.RegisterRequest;
import org.example.zupu_demo.entity.User;
import org.example.zupu_demo.common.exception.BusinessException;
import org.example.zupu_demo.common.exception.ErrorCode;
import org.example.zupu_demo.service.UserService;
import org.example.zupu_demo.common.util.JwtUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    public UserController(UserService userService, JwtUtils jwtUtils) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping
    public ApiResponse<List<User>> list() {
        return ApiResponse.ok(userService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<User> getById(@PathVariable Long id) {
        return ApiResponse.ok(userService.getById(id));
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req.getUsername(), req.getPassword(), req.getRealName());
        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        return ApiResponse.ok("注册成功", result);
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        User user = userService.login(req.getUsername(), req.getPassword());
        if (user == null) {
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }
        String token = jwtUtils.generateToken(user.getId(), user.getUsername());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("realName", user.getRealName());
        return ApiResponse.ok("登录成功", result);
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody User user) {
        userService.updateById(user);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        userService.removeById(id);
        return ApiResponse.ok();
    }
}
