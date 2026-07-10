package org.example.zupu_demo.common.exception;

/**
 * 统一业务错误码枚举。
 *
 * 格式：模块前缀（2位）+ 具体错误（3位）
 *   10xxx — 用户模块
 *   20xxx — 家族模块
 *   30xxx — 成员模块
 *   40xxx — 权限模块
 *   50xxx — 通用/系统
 */
public enum ErrorCode {

    // ---------- 用户 ----------
    USER_NOT_FOUND(10001, "用户不存在"),
    DUPLICATE_USERNAME(10002, "用户名已存在"),
    LOGIN_FAILED(10003, "用户名或密码错误"),

    // ---------- 家族 ----------
    FAMILY_NOT_FOUND(20001, "家族不存在"),

    // ---------- 成员 ----------
    MEMBER_NOT_FOUND(30001, "成员不存在"),
    PARENT_NOT_FOUND(30002, "父亲/母亲成员不存在"),
    FAMILY_MISMATCH(30003, "父/母亲和子女必须在同一家族"),

    // ---------- 权限 ----------
    UNAUTHORIZED(40001, "未登录或 token 已过期"),
    FORBIDDEN(40002, "无此操作权限"),

    // ---------- 通用 ----------
    INTERNAL_ERROR(50001, "服务器内部错误"),
    VALIDATION_ERROR(50002, "参数校验失败");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
