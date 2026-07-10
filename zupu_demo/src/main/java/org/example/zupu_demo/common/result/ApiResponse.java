package org.example.zupu_demo.common.result;

import lombok.Data;

/**
 * 统一 API 响应包装。
 *
 * 前端统一解析格式：{ "code": 200, "msg": "success", "data": ... }
 */
@Data
public class ApiResponse<T> {

    private int code;
    private String msg;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.code = 200;
        r.msg = "success";
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> ok() {
        return ok(null);
    }

    public static <T> ApiResponse<T> ok(String msg, T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.code = 200;
        r.msg = msg;
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> fail(int code, String msg) {
        ApiResponse<T> r = new ApiResponse<>();
        r.code = code;
        r.msg = msg;
        return r;
    }
}
