# config 包说明文档

`config` 包是电子族谱项目的**配置层**，集中管理 Spring Boot 应用的各项配置，包括 JWT 认证参数、密码加密策略以及 Spring Security 安全规则。所有类均采用**构造器注入**方式获取依赖，符合 Spring 最佳实践。

---

## 包结构

```
config/
├── JwtProperties.java              # JWT 配置属性
├── PasswordConfig.java             # 密码加密器配置
├── SecurityConfig.java             # Spring Security 安全配置
└── security/
    └── JwtAuthenticationFilter.java # JWT 认证过滤器
```

---

## 1. JwtProperties — JWT 配置属性

**路径**: `config/JwtProperties.java`

### 职责
从配置文件（`application.yml` / `application.properties`）中读取以 `jwt` 为前缀的属性，并绑定到 Java 对象上，供整个应用使用。

### 注解

| 注解 | 作用 |
|---|---|
| `@Data` | Lombok 注解，自动生成 `getter/setter`、`toString`、`equals`、`hashCode` 方法 |
| `@Component` | 将该类注册为 Spring 容器中的 Bean，可被其他组件注入 |
| `@ConfigurationProperties(prefix = "jwt")` | 将配置文件中 `jwt.*` 的属性值自动绑定到该类的字段上 |

### 字段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `secret` | `String` | `zupu-demo-default-secret-key-min-256-bits!!` | JWT 签名密钥，至少 256 位。生产环境**必须**通过环境变量覆盖，不可使用默认值 |
| `expiration` | `long` | `604800` | Token 过期时间，单位秒。默认值 604800 即为 7 天 |

### 配置示例（application.yml）
```yaml
jwt:
  secret: ${JWT_SECRET}           # 生产环境从环境变量读取
  expiration: 604800              # 7 天
```

---

## 2. PasswordConfig — 密码加密器配置

**路径**: `config/PasswordConfig.java`

### 职责
定义密码加密的 Bean，供用户注册和登录认证时使用。

### 注解

| 注解 | 作用 |
|---|---|
| `@Configuration` | 标识该类为 Spring 配置类，其中的 `@Bean` 方法会被 Spring 容器管理 |

### Bean 定义

#### `passwordEncoder()`

- **返回类型**: `PasswordEncoder`
- **实现**: `BCryptPasswordEncoder`
- **说明**: BCrypt 是 Spring Security 推荐的密码哈希算法，具有以下特点：
  - 自动加盐（salt），每次加密结果不同
  - 计算成本可调节（默认强度为 10，即 2¹⁰ 轮哈希）
  - 抗彩虹表攻击
  - 输出格式 `$2a$10$...` 内含算法版本、强度和盐值

### 使用方式
在需要加密或验证密码的地方注入 `PasswordEncoder`：
```java
@Service
public class UserService {
    private final PasswordEncoder passwordEncoder;

    // 注册时加密密码
    public void register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
    }

    // 登录时验证密码
    public boolean login(String rawPwd, String encodedPwd) {
        return passwordEncoder.matches(rawPwd, encodedPwd);
    }
}
```

---

## 3. SecurityConfig — Spring Security 安全配置

**路径**: `config/SecurityConfig.java`

### 职责
Spring Security 的核心配置类，定义了整个应用的访问控制规则、会话策略和过滤器链。

### 注解

| 注解 | 作用 |
|---|---|
| `@Configuration` | 标识为 Spring 配置类 |
| `@EnableWebSecurity` | 启用 Spring Security 的 Web 安全功能，替换默认安全配置 |

### 构造器注入

```java
public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter)
```
通过构造器注入 `JwtAuthenticationFilter`，用于在过滤器链中执行 JWT 认证。

### Bean 定义

#### `securityFilterChain(HttpSecurity http)`

这是整个应用安全策略的入口，配置了以下规则：

| 配置项 | 策略 | 说明 |
|---|---|---|
| **CSRF** | `disable()` | 关闭跨站请求伪造防护。因为使用 JWT 无状态认证，无需 CSRF token |
| **Session** | `SessionCreationPolicy.STATELESS` | 无状态会话。服务端不创建 HTTP Session，每次请求独立认证 |
| **表单登录** | `disable()` | 禁用默认的 `/login` 表单登录页 |
| **HTTP Basic** | `disable()` | 禁用 HTTP Basic 认证 |
| **JWT 过滤器** | `addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)` | 在 Spring 默认的用户名密码过滤器**之前**插入自定义 JWT 过滤器 |

### URL 访问规则

| URL Pattern | 权限 | 说明 |
|---|---|---|
| `/api/users/register` | `permitAll()` | 注册接口，无需认证即可访问 |
| `/api/users/login` | `permitAll()` | 登录接口，无需认证即可访问 |
| 其他所有请求 | `authenticated()` | 需要携带有效 JWT Token 才能访问 |

### 请求处理流程

```
客户端请求
    │
    ▼
JwtAuthenticationFilter  ← 从 Authorization 头提取并验证 JWT
    │
    ▼
SecurityFilterChain  ← 检查 URL 权限
    │
    ▼
Controller  ← 处理业务逻辑
```

---

## 4. JwtAuthenticationFilter — JWT 认证过滤器

**路径**: `config/security/JwtAuthenticationFilter.java`

### 职责
在每个 HTTP 请求到达 Controller 之前，从请求头中提取 JWT Token 并完成身份认证。它是整个无状态认证体系的关键环节。

### 继承关系

```
GenericFilterBean → OncePerRequestFilter → JwtAuthenticationFilter
```

- `OncePerRequestFilter`：Spring 提供的过滤器基类，确保在单次请求中只执行一次 `doFilterInternal`（即使请求在不同 dispatcher 之间转发）。

### 注解

| 注解 | 作用 |
|---|---|
| `@Component` | 注册为 Spring Bean，使其能被 `SecurityConfig` 注入 |

### 构造器注入

```java
public JwtAuthenticationFilter(JwtUtils jwtUtils, UserMapper userMapper)
```

| 依赖 | 用途 |
|---|---|
| `JwtUtils` | JWT 工具类，负责 Token 的验证和解析（校验签名、提取用户 ID） |
| `UserMapper` | MyBatis 数据访问层，根据用户 ID 查询数据库中的用户信息 |

### 核心方法

#### `doFilterInternal(request, response, filterChain)`

每个请求到来时自动调用，执行以下流程：

```
提取 Authorization 头
    │
    ▼
判断是否以 "Bearer " 开头  ──否──▶  跳过认证
    │是
    ▼
去掉 "Bearer " 前缀，得到 Token
    │
    ▼
JwtUtils.validateToken(token)  ──无效──▶  跳过认证
    │有效
    ▼
JwtUtils.getUserIdFromToken(token)  → 得到用户 ID
    │
    ▼
UserMapper.selectById(userId)  → 查询用户
    │存在
    ▼
构建 UsernamePasswordAuthenticationToken
    │
    ▼
存入 SecurityContextHolder  → 后续代码可通过 SecurityContext 获取当前用户
    │
    ▼
filterChain.doFilter(request, response)  → 继续执行后续过滤器
```

**关键细节**：
- 即使 Token 无效或用户不存在，过滤器也**不会中断请求**，而是调用 `filterChain.doFilter()` 继续执行。认证失败由后续的安全机制（URL 权限校验）统一处理。
- `authentication.setDetails(user)` 将完整的 User 实体附加到认证对象上，方便下游代码通过 `SecurityContextHolder` 获取当前登录用户的详细信息。
- 当前版本传入空权限列表 `Collections.emptyList()`，属于简化实现，后续可按需扩展为 RBAC 角色权限。

#### `extractToken(request)`

从 HTTP 请求头中提取 JWT Token 的私有辅助方法：
- 读取 `Authorization` 请求头
- 判断是否以 `"Bearer "` 开头
- 截取第 7 个字符之后的内容作为 Token 返回
- 不符合条件时返回 `null`

---

## 配置类协作关系图

```
application.yml
    │
    ▼
JwtProperties  ← 读取 jwt.secret、jwt.expiration
    │
    ├──▶ JwtUtils  ← 使用密钥签名/验证 Token
    │        │
    │        ▼
    │    JwtAuthenticationFilter  ← 提取 Token，调用 JwtUtils 验证
    │        │
    │        ▼
    │    SecurityConfig  ← 将过滤器插入安全链
    │
    └──▶ PasswordConfig  ← 提供 BCryptPasswordEncoder
              │
              ▼
          UserService  ← 注册/登录时加密和验证密码
```

---

## 设计特点总结

1. **无状态认证**: 采用 JWT + 禁用 Session 的方案，服务端不存储会话信息，适合水平扩展。
2. **构造器注入**: 所有依赖通过构造器注入，而非 `@Autowired` 字段注入，便于单元测试和依赖追溯。
3. **类型安全配置**: 使用 Spring Boot 的 `@ConfigurationProperties` 替代手动 `@Value` 注入，支持 IDE 自动补全和编译期校验。
4. **最小暴露面**: 仅 `/api/users/register` 和 `/api/users/login` 两个接口对外开放，其余接口强制认证。
5. **防御纵深**: 关闭 CSRF、表单登录、HTTP Basic 等不需要的特性，减少攻击面。

---

> 📅 生成时间：2026-06-28
