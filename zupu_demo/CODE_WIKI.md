# 族迹 · 电子族谱 Demo — Code Wiki

> 本文档为 `zupu_demo` 项目的结构化代码 Wiki，涵盖项目整体架构、主要模块职责、关键类与函数说明、依赖关系以及项目运行方式等关键信息。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [项目整体架构](#3-项目整体架构)
4. [目录结构](#4-目录结构)
5. [数据库设计](#5-数据库设计)
6. [主要模块职责](#6-主要模块职责)
7. [关键类与函数说明](#7-关键类与函数说明)
8. [模块间依赖关系](#8-模块间依赖关系)
9. [核心业务流程](#9-核心业务流程)
10. [安全与认证机制](#10-安全与认证机制)
11. [前端架构说明](#11-前端架构说明)
12. [项目运行方式](#12-项目运行方式)
13. [配置说明](#13-配置说明)

---

## 1. 项目概览

**项目名称**：族迹 · 电子族谱（`zupu_demo`）

**项目定位**：一个面向家族世系管理的电子族谱平台 Demo。支持家族成员的录入、世系树可视化、亲戚关系计算、族规家训管理、操作日志审计以及基于角色的权限控制。

**核心能力**：

- 家族 / 族谱的创建与管理
- 家族成员的增删改查，支持代数自动推算
- 世系树可视化（全族 / 向上追溯 / 向下展开 / 关系路径四种视图）
- 两人亲戚关系称呼的自动计算（父亲 / 兄弟 / 堂表亲等）
- 配偶关系管理（支持多段婚姻）
- 族规家训的维护（置顶、分类）
- 基于 JWT 的用户认证与权限控制（全局管理员 / 普通成员 / 父节点可改子节点）
- 操作日志审计追溯

---

## 2. 技术栈与依赖

### 2.1 后端技术栈

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| Spring Boot | 3.4.0 | 应用框架（parent POM） |
| Java | 17 | 编程语言 |
| Spring Web | 随 Boot | RESTful API |
| Spring Validation | 随 Boot | 参数校验（Jakarta Validation） |
| Spring Security | 随 Boot | 安全框架（BCrypt + JWT 认证） |
| JJWT | 0.12.6 | JWT 生成与解析（api / impl / jackson） |
| MyBatis-Plus | 3.5.12 | ORM（`mybatis-plus-spring-boot3-starter`） |
| MySQL Connector/J | 随 Boot | MySQL 驱动 |
| Lombok | 随 Boot | 实体样板代码消除 |
| spring-boot-devtools | 随 Boot | 开发热重载 |
| Logback | 随 Boot | 日志（`logback-spring.xml`） |

### 2.2 前端技术栈

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| 原生 HTML / CSS / JavaScript | — | 单文件前端 |
| ECharts | 5.5.0（CDN） | 树形世系图渲染 |

> 前端目前使用内置 Mock 数据，尚未与后端 API 对接，作为可视化 Demo 展示。

### 2.3 构建工具

- **Maven**（含 `mvnw` / `mvnw.cmd` Wrapper，版本见 `.mvn/wrapper/maven-wrapper.properties`）
- 编译插件配置了 Lombok 注解处理器（`default-compile` 与 `default-testCompile` 两个执行阶段）

---

## 3. 项目整体架构

项目采用经典的 **Spring Boot 四层 MVC 架构**，结合 MyBatis-Plus 的 `IService` 体系：

```
┌──────────────────────────────────────────────────────────────┐
│                     前端 (static/index.html)                 │
│              ECharts 树图 · Mock 数据 · 四种视图              │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / JSON (规划中对接)
┌───────────────────────────▼──────────────────────────────────┐
│  过滤器层  JwtAuthenticationFilter (Bearer token 解析→认证)    │
├──────────────────────────────────────────────────────────────┤
│  Controller 层  REST API (@RestController, /api/**)           │
│  User / Family / FamilyMember / Spouse / Rule / Role / Log   │
├──────────────────────────────────────────────────────────────┤
│  Service 层     接口(IService) + Impl(ServiceImpl)            │
│  业务逻辑：成员添加、关系计算、权限校验、操作日志……            │
├──────────────────────────────────────────────────────────────┤
│  Mapper 层      BaseMapper (MyBatis-Plus, @MapperScan)        │
├──────────────────────────────────────────────────────────────┤
│  数据库  MySQL 8.0+  (family_tree, 7 张表)                    │
└──────────────────────────────────────────────────────────────┘
```

**横切关注点（`common` + `config` 包）**：

- 统一响应包装 `ApiResponse`
- 统一异常处理 `GlobalExceptionHandler` + `BusinessException` + `ErrorCode`
- 安全配置 `SecurityConfig` + `JwtProperties` + `PasswordConfig`
- JWT 工具 `JwtUtils`

**请求处理链路**：

```
HTTP 请求
  → JwtAuthenticationFilter（提取并校验 token，写入 SecurityContext）
  → SecurityFilterChain（放行 register/login，其余需认证）
  → Controller（参数校验 @Valid）
  → Service（业务逻辑，抛 BusinessException）
  → Mapper（MyBatis-Plus 操作 DB）
  → ApiResponse.ok(data) 包装返回
  → 异常由 GlobalExceptionHandler 兜底转结构化错误
```

---

## 4. 目录结构

```
zupu_demo/
├── pom.xml                         # Maven 构建配置与依赖
├── mvnw / mvnw.cmd                 # Maven Wrapper
├── HELP.md                         # Spring Initializr 生成的基础说明
├── CODE_WIKI.md                    # 本文档
├── src/
│   ├── main/
│   │   ├── java/org/example/zupu_demo/
│   │   │   ├── ZupuDemoApplication.java        # 启动类（含 @MapperScan、DB 连接测试）
│   │   │   ├── controller/                     # REST 控制器（7 个）
│   │   │   │   ├── UserController.java
│   │   │   │   ├── FamilyController.java
│   │   │   │   ├── FamilyMemberController.java
│   │   │   │   ├── SpouseRelationshipController.java
│   │   │   │   ├── FamilyRuleController.java
│   │   │   │   ├── FamilyUserRoleController.java
│   │   │   │   ├── OperationLogController.java
│   │   │   │   └── CONTROLLER_API.md           # API 文档（项目自带）
│   │   │   ├── service/                        # 服务层
│   │   │   │   ├── UserService.java
│   │   │   │   ├── FamilyService.java
│   │   │   │   ├── FamilyMemberService.java
│   │   │   │   ├── SpouseRelationshipService.java
│   │   │   │   ├── FamilyRuleService.java
│   │   │   │   ├── FamilyUserRoleService.java
│   │   │   │   ├── OperationLogService.java
│   │   │   │   ├── SERVICE_GUIDE.md            # 服务层文档（项目自带）
│   │   │   │   └── impl/                       # 服务实现
│   │   │   ├── mapper/                         # MyBatis-Plus Mapper（7 个）
│   │   │   ├── entity/                         # 实体类（7 个）+ ENTITY_GUIDE.md
│   │   │   ├── dto/                            # 数据传输对象
│   │   │   │   ├── CreateMemberRequest.java
│   │   │   │   ├── CreateMemberResponse.java
│   │   │   │   └── user/{LoginRequest, RegisterRequest}.java
│   │   │   ├── config/                         # 配置类
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtProperties.java
│   │   │   │   ├── PasswordConfig.java
│   │   │   │   ├── security/JwtAuthenticationFilter.java
│   │   │   │   └── README.md
│   │   │   └── common/                         # 公共组件
│   │   │       ├── result/ApiResponse.java
│   │   │       ├── exception/{ErrorCode, BusinessException, GlobalExceptionHandler}.java
│   │   │       └── util/JwtUtils.java
│   │   └── resources/
│   │       ├── application.yaml                # 主配置
│   │       ├── application-dev.yaml            # 开发环境配置（已 gitignore）
│   │       ├── schema.sql                      # 数据库初始化脚本
│   │       ├── logback-spring.xml              # 日志配置
│   │       └── static/index.html               # 前端单页 Demo
│   └── test/java/.../ZupuDemoApplicationTests.java  # 上下文加载测试
└── target/                                      # 构建产物（已 gitignore）
```

---

## 5. 数据库设计

数据库：`family_tree`（MySQL 8.0+，utf8mb4_unicode_ci），共 7 张表。完整 DDL 见 [schema.sql](file:///d:/work_space/电子族谱/zupu_demo/src/main/resources/schema.sql)。

| 表名 | 说明 | 关键字段 / 关系 |
| --- | --- | --- |
| `users` | 平台用户 | `username`(唯一)、`password_hash`、`real_name` |
| `families` | 家族 / 族谱 | `name`、`surname`、`created_by`→users；冗余 `generation_count`/`member_count` |
| `family_members` ⭐ | 家族成员（核心） | `family_id`→families；`father_id`/`mother_id`/`adoptive_father_id`/`adoptive_mother_id` 自引用；`generation_order` 代数（始祖=1） |
| `spouse_relationships` | 配偶关系 | `husband_id`/`wife_id`→family_members；`(family_id,husband_id,wife_id)` 唯一；支持多段婚姻 |
| `family_rules` | 族规 / 家训 | `family_id`→families；`category`(家训/族规/乡约)；`is_pinned` 置顶 |
| `family_user_roles` | 家族-用户-角色（权限） | `(family_id,user_id)` 唯一；`role` ∈ {global_admin, member}；`member_id` 可选关联成员 |
| `operation_logs` | 操作日志（审计） | `action`、`detail_json`(JSON)；关联 family/user/target_member |

**血缘模型**：`family_members` 采用 **邻接表模型**（Adjacency List），通过 `father_id` / `mother_id` 自引用外键表达亲子关系，删除父/母时子代的对应字段置 NULL（`ON DELETE SET NULL`），删除家族时级联删除成员（`ON DELETE CASCADE`）。

**实体与表的映射**：7 个实体类（`@TableName`）与表一一对应，使用 Lombok `@Data` + MyBatis-Plus 注解（`@TableId(IdType.AUTO)`、`@TableField(fill=...)`）。时间字段通过 `FieldFill.INSERT` / `INSERT_UPDATE` 标记自动填充。

---

## 6. 主要模块职责

### 6.1 用户模块（User）

- **职责**：用户注册、登录认证、用户查询与维护。
- **入口**：[UserController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/UserController.java)（`/api/users`）
- **实现**：[UserServiceImpl](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/impl/UserServiceImpl.java)
- **要点**：注册时用 `BCryptPasswordEncoder` 哈希存储密码；登录成功后由 Controller 调用 `JwtUtils.generateToken` 签发 JWT。

### 6.2 家族模块（Family）

- **职责**：家族/族谱的创建与管理。
- **入口**：[FamilyController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/FamilyController.java)（`/api/families`）
- **实现**：[FamilyServiceImpl](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/impl/FamilyServiceImpl.java)
- **要点**：`createFamily` 在事务内创建家族记录，并自动将创建者设为该家族的 `global_admin`（插入 `family_user_roles`）。

### 6.3 家族成员模块（FamilyMember）⭐ 核心

- **职责**：成员录入、世系树查询、亲戚关系计算。是整个项目的业务核心。
- **入口**：[FamilyMemberController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/FamilyMemberController.java)（`/api/members`）
- **实现**：[FamilyMemberServiceImpl](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/impl/FamilyMemberServiceImpl.java)
- **核心能力**：
  - `addMember`：添加成员 + 自动推算代数 + 自动创建用户账号 + 自动授权（事务）
  - `getAncestors` / `getDescendants`（最多 5 代）/ `getSiblings`
  - `calculateRelationship`：基于共同祖先计算中文亲戚称呼

### 6.4 配偶关系模块（SpouseRelationship）

- **职责**：维护婚姻关系（夫妻、婚期、是否当前配偶、多段婚姻排序）。
- **入口**：[SpouseRelationshipController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/SpouseRelationshipController.java)（`/api/spouses`）
- **实现**：`SpouseRelationshipServiceImpl`（仅继承 MyBatis-Plus 通用 CRUD，无自定义逻辑）

### 6.5 族规家训模块（FamilyRule）

- **职责**：家族规则/家训的增删改查，支持置顶与分类排序。
- **入口**：[FamilyRuleController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/FamilyRuleController.java)（`/api/rules`）
- **实现**：`FamilyRuleServiceImpl`（仅通用 CRUD）

### 6.6 权限角色模块（FamilyUserRole）

- **职责**：家族-用户-角色的权限控制。
- **入口**：[FamilyUserRoleController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/FamilyUserRoleController.java)（`/api/roles`）
- **实现**：[FamilyUserRoleServiceImpl](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/impl/FamilyUserRoleServiceImpl.java)
- **权限模型**：
  - `global_admin`：全局管理员，可编辑整棵族谱树
  - `member`：普通成员，只读；但作为父节点时可编辑其直系子女（`canEditMember`）

### 6.7 操作日志模块（OperationLog）

- **职责**：审计追溯，记录对成员的操作（create/update/delete/add_spouse 等）。
- **入口**：[OperationLogController](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/OperationLogController.java)（`/api/logs`）
- **实现**：[OperationLogServiceImpl](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/impl/OperationLogServiceImpl.java)（提供 `log(...)` 便捷记录方法）

### 6.8 公共基础设施（common + config）

- **统一响应**：[ApiResponse](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/common/result/ApiResponse.java)（`{code, msg, data}`）
- **异常体系**：[ErrorCode](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/common/exception/ErrorCode.java)（模块化错误码枚举）+ [BusinessException](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/common/exception/BusinessException.java) + [GlobalExceptionHandler](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/common/exception/GlobalExceptionHandler.java)（`@RestControllerAdvice` 统一捕获）
- **安全配置**：[SecurityConfig](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/SecurityConfig.java)（无状态、放行注册登录、JWT 过滤器）+ [JwtProperties](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/JwtProperties.java) + [PasswordConfig](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/PasswordConfig.java)（BCrypt）
- **JWT 工具**：[JwtUtils](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/common/util/JwtUtils.java)
- **JWT 过滤器**：[JwtAuthenticationFilter](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/security/JwtAuthenticationFilter.java)

---

## 7. 关键类与函数说明

### 7.1 启动类

#### `ZupuDemoApplication`
- 位置：[ZupuDemoApplication.java](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/ZupuDemoApplication.java)
- 注解：`@SpringBootApplication`、`@MapperScan("org.example.zupu_demo.mapper")`
- `CommandLineRunner testConnection(DataSource)`：启动时测试数据库连接并打印 URL/Catalog 日志。

### 7.2 控制器层（REST API 一览）

| 控制器 | 基础路径 | 主要端点 |
| --- | --- | --- |
| `UserController` | `/api/users` | `GET /`、`GET /{id}`、`POST /register`、`POST /login`、`PUT /`、`DELETE /{id}` |
| `FamilyController` | `/api/families` | `GET /`、`GET /{id}`、`POST /`（从认证上下文取 userId）、`PUT /`、`DELETE /{id}` |
| `FamilyMemberController` | `/api/members` | `GET /{id}`、`GET /?familyId=`、`GET /generation`、`GET /children`、`GET /ancestors`、`GET /descendants`、`GET /siblings`、`GET /relationship`、`POST /`、`PUT /`、`DELETE /{id}` |
| `SpouseRelationshipController` | `/api/spouses` | `GET /?familyId=`、`GET /of?memberId=`、`POST /`、`PUT /`、`DELETE /{id}` |
| `FamilyRuleController` | `/api/rules` | `GET /?familyId=`、`GET /{id}`、`POST /`、`PUT /`、`DELETE /{id}` |
| `FamilyUserRoleController` | `/api/roles` | `GET /?familyId=`、`GET /check`（权限自检）、`POST /`、`PUT /`、`DELETE /{id}` |
| `OperationLogController` | `/api/logs` | `GET /?familyId=&limit=`、`GET /of-member?memberId=` |

> 端点详细签名与参数可参见项目自带文档 [CONTROLLER_API.md](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/CONTROLLER_API.md)。

**控制器设计要点**：

- 统一返回 `ApiResponse<T>`。
- `FamilyMemberController.create`：`familyId` 由后端从当前用户所属家族自动推导（`roleService.getFamilyIdByUserId`），并注入 `operatorId`，防止前端篡改。
- `FamilyMemberController.update/delete`：先查库中真实记录，通过 `roleService.belongsToFamily` 校验越权访问。
- `getCurrentUserId()`：从 `SecurityContextHolder` 取 `(Long) principal`。

### 7.3 服务层关键函数

#### `UserServiceImpl`

- `register(username, rawPassword, realName)`：查重 → BCrypt 哈希 → 保存；重名抛 `DUPLICATE_USERNAME`。
- `login(username, rawPassword)`：按用户名查 → `passwordEncoder.matches` 校验；成功返回 User，失败返回 null（由 Controller 抛 `LOGIN_FAILED`）。

#### `FamilyServiceImpl`

- `createFamily(name, surname, createdBy, description)`：`@Transactional`，保存家族后插入一条 `global_admin` 角色记录。

#### `FamilyMemberServiceImpl` ⭐

| 方法 | 说明 |
| --- | --- |
| `addMember(CreateMemberRequest)` | 事务核心方法。DTO→实体；**自动推算代数**（无显式代数时，有父取 `父代+1`，否则为 1）；校验父母同族；保存成员；**自动创建用户账号**（用户名格式 `m_{familyId}_{memberId}`，密码用前端传入的 `initialPassword`）；**自动授予 member 角色**；返回 `CreateMemberResponse`（含账号信息）。 |
| `getAncestors(memberId)` | 沿 `fatherId` 链向上递归收集祖先列表。 |
| `getDescendants(memberId)` | 向下递归收集后代，**最多 5 代**（`MAX_DESCENDANT_DEPTH=5`），匹配 `fatherId` 或 `motherId`。 |
| `getSiblings(memberId)` | 同父（`fatherId` 相同）且非本人的成员，按 `sortOrder` 升序。 |
| `calculateRelationship(aId, bId)` | 关系计算核心：收集 A 的祖先链 → 查找共同祖先 → 根据代数差调用 `buildDirectRelation`（直系：父/母/祖父母/曾祖）或 `buildCousinRelation`（旁系：兄弟姐妹/堂表亲/叔伯侄）。非同族返回「非同族」，无共同祖先返回「同族远亲」。 |

#### `FamilyUserRoleServiceImpl`

| 方法 | 说明 |
| --- | --- |
| `isGlobalAdmin(familyId, userId)` | 查 `family_user_roles` 是否存在 `global_admin` 记录。 |
| `canEditMember(familyId, userId, targetMemberId)` | 全局管理员 → true；否则查用户绑定的 member，判断是否为 target 的 father/mother。 |
| `belongsToFamily(familyId, userId)` | 用户是否属于该家族（任意角色）。 |
| `getFamilyIdByUserId(userId)` | 取用户所属家族；**多于一个时抛异常**（要求指定家族 ID）；无则抛 `FORBIDDEN`。 |

#### `OperationLogServiceImpl`

- `log(familyId, userId, targetMemberId, action, detail)`：便捷记录操作日志（构造实体并 `save`）。

### 7.4 公共组件关键类

#### `ApiResponse<T>`

- 字段：`code` / `msg` / `data`。
- 静态工厂：`ok()` / `ok(data)` / `ok(msg, data)` / `fail(code, msg)`。

#### `ErrorCode`（错误码枚举，格式：模块前缀2位 + 错误3位）

| 范围 | 模块 | 示例 |
| --- | --- | --- |
| `10xxx` | 用户 | `USER_NOT_FOUND(10001)`、`DUPLICATE_USERNAME(10002)`、`LOGIN_FAILED(10003)` |
| `20xxx` | 家族 | `FAMILY_NOT_FOUND(20001)` |
| `30xxx` | 成员 | `MEMBER_NOT_FOUND(30001)`、`PARENT_NOT_FOUND(30002)`、`FAMILY_MISMATCH(30003)` |
| `40xxx` | 权限 | `UNAUTHORIZED(40001)`、`FORBIDDEN(40002)` |
| `50xxx` | 通用 | `INTERNAL_ERROR(50001)`、`VALIDATION_ERROR(50002)` |

#### `GlobalExceptionHandler`

- `handleBusinessException`：业务异常 → HTTP 400 + `{code, msg}`。
- `handleValidation`：`MethodArgumentNotValidException` → 聚合字段错误信息 → HTTP 400。
- `handleException`：兜底 → HTTP 500 + 「服务器内部错误」。

#### `JwtUtils`

- `generateToken(userId, username)`：签发 token，subject=userId，claim 含 username，过期时间来自 `JwtProperties.expiration`（默认 7 天 = 604800 秒）。
- `getUserIdFromToken` / `getUsernameFromToken`：解析 claims。
- `validateToken`：尝试解析，捕获 `JwtException` 返回 false。

### 7.5 DTO

| DTO | 用途 | 校验 |
| --- | --- | --- |
| `RegisterRequest` | 注册请求 | `username`/`password` `@NotBlank` |
| `LoginRequest` | 登录请求 | `username`/`password` `@NotBlank` |
| `CreateMemberRequest` | 添加成员请求 | `name` `@NotBlank`；`gender` `@Pattern([MF])`；`initialPassword` `@NotBlank`；`familyId`/`operatorId` 由后端注入 |
| `CreateMemberResponse` | 添加成员响应 | 含 memberId、自动生成的 username/password、userId、message |

---

## 8. 模块间依赖关系

### 8.1 包/层依赖

```
controller  ──依赖──►  service(接口)  ──依赖──►  mapper  ──依赖──►  entity
    │                       │
    ├──依赖──► dto           ├──依赖──► entity
    ├──依赖──► common        └──依赖──► common (BusinessException/ErrorCode)
    │   (ApiResponse,
    │    BusinessException)
    └──依赖──► SecurityContext (取当前用户)
```

### 8.2 关键跨模块依赖

- `FamilyServiceImpl` → `FamilyUserRoleMapper`（创建家族时插入 global_admin 角色）
- `FamilyMemberServiceImpl` → `UserMapper` + `FamilyUserRoleMapper` + `PasswordEncoder`（addMember 三合一事务）
- `FamilyMemberController` → `FamilyUserRoleService`（推导 familyId、越权校验）
- `JwtAuthenticationFilter` → `JwtUtils` + `UserMapper`（解析 token 后查库装载用户）
- `SecurityConfig` → `JwtAuthenticationFilter`
- `UserController` → `UserService` + `JwtUtils`

### 8.3 外部依赖（Maven）

核心依赖关系（`pom.xml`）：

- `spring-boot-starter-parent:3.4.0` 统一版本管理。
- `spring-boot-starter-web` 提供 REST。
- `spring-boot-starter-validation` 提供参数校验。
- `spring-boot-starter-security` + `jjwt-{api,impl,jackson}:0.12.6` 提供认证。
- `mybatis-plus-spring-boot3-starter:3.5.12` + `mysql-connector-j` 提供数据访问。
- `lombok` 编译期注解处理（`maven-compiler-plugin` 配置 annotationProcessorPaths）。

---

## 9. 核心业务流程

### 9.1 注册 / 登录 / 认证流程

```
1. POST /api/users/register  (username, password, realName)
      → UserServiceImpl.register → BCrypt 哈希存库
2. POST /api/users/login     (username, password)
      → UserServiceImpl.login 校验密码
      → JwtUtils.generateToken 签发 7 天有效 token
      → 返回 {token, userId, username, realName}
3. 后续请求携带 Header: Authorization: Bearer <token>
      → JwtAuthenticationFilter 解析 → 校验 → 查 UserMapper
      → 写入 SecurityContext (principal=userId, details=user)
      → SecurityFilterChain 放行（除 register/login 外均需认证）
```

### 9.2 添加家族成员（三合一事务）

`POST /api/members` → `FamilyMemberServiceImpl.addMember`（`@Transactional`）：

1. Controller 从认证上下文取 `currentUserId`，经 `roleService.getFamilyIdByUserId` 推导 `familyId`，注入 `operatorId`。
2. DTO → `FamilyMember` 实体；解析日期字符串为 `LocalDate`。
3. **代数自动推算**：未显式传入时，有父→`父代数+1`，无父→1；并校验父亲存在且同族。
4. 校验母亲同族。
5. `save(member)` 持久化成员。
6. **自动创建账号**：用户名 `m_{familyId}_{memberId}`，密码 = 请求中的 `initialPassword`（BCrypt 哈希）。
7. **自动授权**：插入 `family_user_roles`，role=`member`，关联 `memberId`。
8. 返回 `CreateMemberResponse`（含账号密码，供管理员转交）。

### 9.3 权限校验流程（成员更新/删除）

`PUT/DELETE /api/members/{id}`：

1. 取 `currentUserId`，查库中真实成员记录（防篡改 familyId）。
2. 不存在 → `MEMBER_NOT_FOUND`。
3. `roleService.belongsToFamily(existing.familyId, currentUserId)` → false 抛 `FORBIDDEN`。
4. 通过则执行 `updateById` / `removeById`。

### 9.4 亲戚关系计算流程

`GET /api/members/relationship?aId=&bId=` → `calculateRelationship`：

1. 取 A、B，非同族 → 「非同族」；同一人 → 「本人」。
2. 收集 A 的祖先链（沿 `fatherId`）。
3. 若 B 在 A 的祖先链中 → 直系长辈（`buildDirectRelation`：按代数差返回父/母/祖父母/曾祖）。
4. 否则沿 B 的祖先链查找与 A 祖先链的**共同祖先**。
5. 找到 → 计算两侧距离 `aDist`/`bDist`，调用 `buildCousinRelation`（兄弟姐妹 / 叔伯侄 / 堂表亲 / 远亲）。
6. 无共同祖先 → 「同族远亲」。

### 9.5 家族创建流程

`POST /api/families`（name, surname, description）→ `FamilyServiceImpl.createFamily`（`@Transactional`）：

1. 从 `SecurityContextHolder` 取 `currentUserId`。
2. 保存 Family 记录（`createdBy` = 当前用户）。
3. 插入 `family_user_roles`，将创建者设为 `global_admin`。

---

## 10. 安全与认证机制

### 10.1 安全配置

[SecurityConfig](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/SecurityConfig.java)：

- `@EnableWebSecurity`，禁用 CSRF、formLogin、httpBasic。
- `SessionCreationPolicy.STATELESS`（无状态，纯 JWT）。
- 放行：`/api/users/register`、`/api/users/login`；其余 `anyRequest().authenticated()`。
- 在 `UsernamePasswordAuthenticationFilter` 之前插入 `JwtAuthenticationFilter`。

### 10.2 JWT 过滤器

[JwtAuthenticationFilter](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/security/JwtAuthenticationFilter.java)（继承 `OncePerRequestFilter`）：

1. 从 `Authorization: Bearer <token>` 头提取 token。
2. `jwtUtils.validateToken` 校验有效性。
3. 解析出 `userId`，`userMapper.selectById` 装载用户。
4. 构造 `UsernamePasswordAuthenticationToken(userId, null, emptyList)`，`setDetails(user)`，写入 `SecurityContextHolder`。

### 10.3 密码与密钥

- `PasswordConfig`：`BCryptPasswordEncoder` Bean。
- `JwtProperties`：`jwt.secret`（至少 256 位）、`jwt.expiration`（默认 604800 秒 = 7 天）。
- 密钥与数据库密码通过环境变量注入（见 [配置说明](#13-配置说明)）。

### 10.4 权限模型

| 角色 | 能力 |
| --- | --- |
| `global_admin` | 编辑整棵族谱树（全部成员） |
| `member`（作为父节点时） | 可编辑其直系子女 |
| `member`（非父节点） | 只读 |

权限判定入口：`FamilyUserRoleService.isGlobalAdmin` / `canEditMember` / `belongsToFamily`。

---

## 11. 前端架构说明

前端为 [src/main/resources/static/index.html](file:///d:/work_space/电子族谱/zupu_demo/src/main/resources/static/index.html) 单文件应用（约 2500 行），由 Spring Boot 静态资源服务托管。

### 11.1 整体布局

- **Header**：品牌「族迹 · 电子族谱」+ 视图切换（世系图谱 / 族规家训 / 操作日志）+ 家族信息徽章。
- **三栏主体**：
  - 左栏：成员列表（搜索、按代数/性别排序、添加成员按钮）
  - 中栏：ECharts 世系树图 + 工具栏（视图切换、纵横方向）
  - 右栏：成员详情面板 + 关系查询区
- **弹窗**：添加/编辑成员 Modal、删除确认 Dialog。

### 11.2 数据层（Mock）

前端内置 Mock 数据，与后端 API 返回格式一致：

- `mockFamily`：家族信息（张氏宗谱，9 代 48 人）
- `mockMembers`：扁平成员列表（48 条，9 代，字段与 `FamilyMember` 实体对齐）
- `mockSpouses`：配偶关系（18 条）
- `mockRules`：族规（3 条）

### 11.3 树形数据构建（核心）

将扁平成员列表转为 ECharts tree 数据，支持 4 种视图模式（`treeViewMode`）：

| 模式 | 构建函数 | 说明 |
| --- | --- | --- |
| `full` | `buildFullTree` / `buildForestData` | 全族树，默认展示 5 代，点击节点可逐层展开（`expandedIds`） |
| `ancestor` | `buildAncestorTree` | 以最顶层祖先为根，沿直系路径向下，旁支兄弟不展开后代 |
| `descendant` | `buildDescendantTree` | 以指定人为根向下展开 N 代子孙 |
| `relation` | `buildRelationTree` | 找两人共同祖先（LCA），高亮两条路径，标注 A/B/共同祖先 |

关键辅助函数：

- `getAncestorIds` / `getDescendantIds`：祖先/后代 ID 收集（DFS，最多 5 代）。
- `getParentForPath`：路径查找的「逻辑父节点」——普通成员返回 `fatherId`，**外来配偶（女、无 fatherId）返回丈夫 ID**，使外嫁女性能通过婚姻关系接入家族树。
- `isExternalSpouse`：判断是否为外来配偶。
- `makeNode` / `makeSpouseNode`：构造 ECharts 节点（含高亮样式、性别配色、字辈标注）。

### 11.4 关系查询（前端版）

`calcRelation(aId, bId)`：前端独立实现的亲戚称呼计算，逻辑与后端 `calculateRelationship` 类似但更细化（区分性别称呼：叔叔/伯父/舅舅、姑姑/姨妈、侄子/外甥、堂/表亲等），并处理配偶关系的边缘情况。

### 11.5 CRUD 与视图

- 成员增删改：`saveMember`（新增/编辑/添加配偶三种模式）、`executeDelete`（级联清理配偶关系、子女 fatherId/motherId）。
- 族规视图 `showRulesView`：卡片式展示，支持新增/编辑/删除/置顶。
- 日志视图 `showLogsView`：时间线式审计记录（Mock）。

> ⚠ 前端目前**未对接后端 API**，所有数据为内置 Mock。后端 API 已具备完整能力，对接时需将 Mock 调用替换为 `fetch` + `Authorization: Bearer` 请求。

---

## 12. 项目运行方式

### 12.1 环境要求

- **JDK 17**（`pom.xml` 中 `java.version=17`）
- **Maven 3.6+**（或使用项目自带 `mvnw`）
- **MySQL 8.0+**

### 12.2 数据库初始化

执行 [schema.sql](file:///d:/work_space/电子族谱/zupu_demo/src/main/resources/schema.sql)：

```sql
-- 脚本会自动创建 family_tree 数据库及 7 张表
CREATE DATABASE IF NOT EXISTS family_tree ...
```

可通过 MySQL 客户端或命令行执行：

```bash
mysql -u root -p < src/main/resources/schema.sql
```

### 12.3 配置环境变量

项目使用 `dev` Profile（`application.yaml` 中 `spring.profiles.active: dev`）。开发环境配置见 `application-dev.yaml`（已 gitignore），需配置以下环境变量：

| 环境变量 | 说明 | 默认值 |
| --- | --- | --- |
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USERNAME` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | （dev 配置中有占位默认值，生产必须覆盖） |
| `JWT_SECRET` | JWT 签名密钥（≥256 位） | `zupu-demo-default-secret-key-min-256-bits!!` |

### 12.4 启动方式

**方式一：IDEA**

1. 导入为 Maven 项目。
2. 配置 Run Configuration：Active Profile = `dev`，并设置上述环境变量。
3. 运行 [ZupuDemoApplication](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/ZupuDemoApplication.java)。
4. 启动成功日志会打印「数据库连接成功！」及 URL/Catalog。

**方式二：命令行（Maven Wrapper）**

```bash
# Windows
mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

需通过系统环境变量或 `-D` 参数传入数据库密码等，例如：

```bash
mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-DDB_PASSWORD=your_password -DJWT_SECRET=your_256_bit_secret"
```

**方式三：打包运行**

```bash
mvnw.cmd clean package
java -jar target/zupu_demo-0.0.1-SNAPSHOT.jar
```

### 12.5 访问应用

- **前端 Demo**：`http://localhost:8080/index.html`（或 `/`，由静态资源默认服务）
- **后端 API**：`http://localhost:8080/api/**`
  - 注册：`POST /api/users/register`
  - 登录：`POST /api/users/login`（获取 token）
  - 其余接口需在请求头携带 `Authorization: Bearer <token>`

### 12.6 测试

- 测试类：[ZupuDemoApplicationTests](file:///d:/work_space/电子族谱/zupu_demo/src/test/java/org/example/zupu_demo/ZupuDemoApplicationTests.java)
- 仅含 `contextLoads()` 上下文加载冒烟测试。

```bash
mvnw.cmd test
```

---

## 13. 配置说明

### 13.1 `application.yaml`（主配置）

```yaml
spring:
  application:
    name: zupu_demo
  profiles:
    active: dev              # 默认激活 dev 配置
  datasource:
    url: jdbc:mysql://localhost:3306/family_tree?...
    username: root
    password: ${DB_PASSWORD} # 必须由环境变量提供
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      connection-test-query: SELECT 1
      initialization-fail-timeout: 3000

jwt:
  secret: ${JWT_SECRET:zupu-demo-default-secret-key-min-256-bits!!}
  expiration: 604800         # 7 天（秒）

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true     # 下划线→驼峰
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
  global-config:
    db-config:
      id-type: auto          # 主键自增
```

### 13.2 `application-dev.yaml`（开发环境，已 gitignore）

覆盖 datasource 的 `username`/`password`/`url`，以及 `jwt.secret`，均带环境变量占位符与本地默认值。

### 13.3 `logback-spring.xml`（日志）

- 控制台彩色输出（`%highlight`、`%cyan`）。
- `org.springframework.security` = WARN（减少安全日志噪音）。
- `org.example.zupu_demo.mapper` = INFO（MyBatis SQL，开发时可改 DEBUG）。
- `org.example.zupu_demo` = DEBUG（业务日志）。

### 13.4 `.gitignore` 要点

- `target/`、IDE 配置、`application-dev.yaml`、`*.env` 均被忽略，防止敏感信息泄露。

---

## 附：项目自带文档

项目各包内已包含阶段性文档，可作为补充参考：

- [controller/CONTROLLER_API.md](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/controller/CONTROLLER_API.md) — API 接口文档
- [service/SERVICE_GUIDE.md](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/service/SERVICE_GUIDE.md) — 服务层指南
- [entity/ENTITY_GUIDE.md](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/entity/ENTITY_GUIDE.md) — 实体指南
- [config/README.md](file:///d:/work_space/电子族谱/zupu_demo/src/main/java/org/example/zupu_demo/config/README.md) — 配置说明
