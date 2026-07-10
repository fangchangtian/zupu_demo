package org.example.zupu_demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    /** JWT 签名密钥（至少 256 位，生产环境必须使用环境变量覆盖） */
    private String secret = "zupu-demo-default-secret-key-min-256-bits!!";

    /** Token 过期时间（秒），默认 7 天 */
    private long expiration = 604800;
}
