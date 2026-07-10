package org.example.zupu_demo.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 业务异常 */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBusinessException(BusinessException e) {
        log.warn("业务异常 [{}] {}", e.getCode(), e.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("code", e.getCode());
        body.put("msg", e.getMessage());
        return body;
    }

    /** 参数校验失败（Step 4 启用，这里先写好） */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException e) {
        String fields = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", fields);
        Map<String, Object> body = new HashMap<>();
        body.put("code", ErrorCode.VALIDATION_ERROR.getCode());
        body.put("msg", fields);
        return body;
    }

    /** 兜底异常 */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleException(Exception e) {
        log.error("未捕获异常", e);
        Map<String, Object> body = new HashMap<>();
        body.put("code", ErrorCode.INTERNAL_ERROR.getCode());
        body.put("msg", "服务器内部错误");
        return body;
    }
}
