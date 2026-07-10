# 实体类说明

所有实体类位于 `org.example.zupu_demo.entity` 包下，使用 Lombok `@Data` + MyBatis-Plus `@TableName` 注解，一一对应 MySQL 数据库中的 7 张表。

---

## 实体类总览

| 实体类 | 对应表 | 说明 |
|--------|--------|------|
| `User` | `users` | 平台用户，登录认证 |
| `Family` | `families` | 家族/族谱，顶层容器 |
| `FamilyMember` | `family_members` | 家族成员，**核心表** |
| `SpouseRelationship` | `spouse_relationships` | 配偶关系 |
| `FamilyRule` | `family_rules` | 族规/家训 |
| `FamilyUserRole` | `family_user_roles` | 用户-家族-角色关联（权限） |
| `OperationLog` | `operation_logs` | 操作审计日志 |

---

## 1. User — 平台用户

```java
@TableName("users")
public class User {
    Long id;              // 主键，自增
    String username;      // 用户名（唯一）
    String passwordHash;  // 密码哈希（SHA-256 + 随机盐，格式：salt:hash）
    String realName;      // 真实姓名
    String phone;         // 手机号
    String avatarUrl;     // 头像 URL
    LocalDateTime createdAt; // 创建时间（自动填充）
}
```

**关联关系**：一个用户可加入多个家族（通过 `family_user_roles` 表关联）。

---

## 2. Family — 家族/族谱

```java
@TableName("families")
public class Family {
    Long id;                   // 主键，自增
    String name;               // 族谱名称，如"张氏宗谱"
    String surname;            // 姓氏
    String description;        // 家族简介
    String coverImageUrl;      // 封面图 URL
    Integer generationCount;   // 已录入总代数（冗余字段，便于查询）
    Integer memberCount;       // 成员总数（冗余字段）
    Long createdBy;            // 创建者用户 ID
    LocalDateTime createdAt;   // 创建时间
    LocalDateTime updatedAt;   // 更新时间
}
```

**关联关系**：
- 一个家族包含多个 `FamilyMember`
- 一个家族包含多条 `FamilyRule`
- 一个家族包含多条 `SpouseRelationship`
- 一个家族通过 `FamilyUserRole` 关联多个用户
- 删除家族时，以上关联数据**级联删除**（`ON DELETE CASCADE`）

---

## 3. FamilyMember — 家族成员 ⭐核心

```java
@TableName("family_members")
public class FamilyMember {
    // ===== 主键 =====
    Long id;                    // 主键，自增
    Long familyId;              // 所属家族 ID

    // ===== 基本信息 =====
    String name;                // 姓名
    String generationName;      // 字辈名/派语（如"泽"字辈）
    String alias;               // 曾用名/别名
    String gender;              // 性别：M=男, F=女
    LocalDate birthDate;        // 出生日期
    String birthPlace;          // 出生地
    LocalDate deathDate;        // 逝世日期
    Integer isAlive;            // 是否在世：1=是, 0=否
    String biography;           // 生平简介（TEXT）
    String avatarUrl;           // 照片 URL

    // ===== 代数 =====
    Integer generationOrder;    // 第几代（始祖=1，自动推算）

    // ===== 血缘关系（邻接表模型）=====
    Long fatherId;              // 生父 ID（自引用外键）
    Long motherId;              // 生母 ID（自引用外键）

    // ===== 过继/收养关系 =====
    Long adoptiveFatherId;      // 养父 ID（自引用外键）
    Long adoptiveMotherId;      // 养母 ID（自引用外键）

    // ===== 排序 =====
    Integer sortOrder;          // 同辈排序（越大越靠后，默认 0）

    // ===== 元数据 =====
    Long createdBy;             // 录入者用户 ID
    Long updatedBy;             // 最后修改者用户 ID
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**关系模型说明**：
- 采用**邻接表模型**（father_id / mother_id），每个成员记录直接父/母，非嵌套集
- 查询祖先：沿 `father_id` 逐级向上递归
- 查询后代：向下递归查找所有 `father_id = 当前id` 的记录
- 代数自动推算：有父亲的 → `父亲代数 + 1`；无父亲的 → 始祖（generation_order = 1）
- 外键删除策略：删除成员时，其子女的 `father_id`/`mother_id` 自动置 NULL（`ON DELETE SET NULL`），不断裂整个树

**权限规则**：
- 父亲/母亲天然拥有编辑其直系子女的权限

---

## 4. SpouseRelationship — 配偶关系

```java
@TableName("spouse_relationships")
public class SpouseRelationship {
    Long id;                // 主键，自增
    Long familyId;          // 所属家族
    Long husbandId;         // 丈夫 ID（关联 family_members）
    Long wifeId;            // 妻子 ID（关联 family_members）
    LocalDate marriageDate; // 结婚日期
    LocalDate divorceDate;  // 离婚日期（NULL = 未离异）
    Integer isCurrent;      // 是否当前配偶：1=是, 0=历史婚姻
    Integer sortOrder;      // 多段婚姻排序
    LocalDateTime createdAt;
}
```

**设计要点**：
- 配偶关系独立成表，而非在 `family_members` 中直接加 `spouse_id`
- 支持多段婚姻记录（通过 `sort_order` + `is_current` 区分）
- 双重唯一约束：同一家族中，同一对夫妻只能有一条记录（`UNIQUE KEY uk_spouse`）
- 查某人配偶时，需要同时查 `husband_id` 和 `wife_id` 两个方向

---

## 5. FamilyRule — 族规/家训

```java
@TableName("family_rules")
public class FamilyRule {
    Long id;            // 主键，自增
    Long familyId;      // 所属家族
    String title;       // 族规标题
    String content;     // 族规正文（TEXT，支持 Markdown）
    String category;    // 分类：家训 / 族规 / 乡约
    Integer sortOrder;  // 排序号
    Integer isPinned;   // 是否置顶：1=置顶, 0=普通
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**排序规则**：置顶优先（`is_pinned DESC`），同组内按 `sort_order` 升序。

---

## 6. FamilyUserRole — 家族用户角色（权限）

```java
@TableName("family_user_roles")
public class FamilyUserRole {
    Long id;            // 主键，自增
    Long familyId;      // 家族 ID
    Long userId;        // 用户 ID（关联 users 表）
    Long memberId;      // 用户对应的家族成员 ID（可为 NULL）
    String role;        // 角色：global_admin / member
    LocalDateTime createdAt;
}
```

**权限模型**：

| 角色 | 权限 |
|------|------|
| `global_admin` | 全局管理员 — 可增删改整棵族谱树的任意成员 |
| `member` | 普通成员 — 只读；但如果其绑定的 `member_id` 是目标成员的 father/mother，则自动拥有该子节点的编辑权 |

**唯一约束**：同一用户在同一家族中只能有一个角色（`UNIQUE KEY uk_family_user`）。

**关联**：
- `family_id` → `families` 表
- `user_id` → `users` 表
- `member_id` → `family_members` 表

---

## 7. OperationLog — 操作日志

```java
@TableName("operation_logs")
public class OperationLog {
    Long id;                // 主键，自增
    Long familyId;          // 操作所在家族
    Long userId;            // 操作人用户 ID
    Long targetMemberId;    // 操作对象（成员 ID）
    String action;          // 操作类型：create_member / update_member / delete_member / add_spouse …
    String detailJson;      // 变更详情（MySQL JSON 类型，存 JSON 字符串）
    LocalDateTime createdAt;
}
```

**常见 action 值**：
- `create_member` — 新增成员
- `update_member` — 修改成员信息
- `delete_member` — 删除成员
- `add_spouse` — 添加配偶关系
- `remove_spouse` — 移除配偶关系
- `grant_role` — 授予角色
- `revoke_role` — 撤销角色
- `create_rule` — 新建族规
- `update_rule` — 修改族规

---

## 实体关系图（ER）

```
users ──┐
        │ (family_user_roles)
families┼── family_user_roles ── family_members
        │
        ├── family_members ──(father_id)──┐
        │       │                         │ (自引用)
        │       └──(mother_id)────────────┘
        │
        ├── spouse_relationships ── family_members (husband_id / wife_id)
        │
        ├── family_rules
        │
        └── operation_logs ── family_members (target_member_id)
```

---

## MyBatis-Plus 自动映射说明

`application.yaml` 配置了 `map-underscore-to-camel-case: true`，因此数据库字段名（snake_case）自动映射到 Java 字段名（camelCase）：

| 数据库字段 | Java 字段 |
|-----------|----------|
| `family_id` | `familyId` |
| `generation_order` | `generationOrder` |
| `father_id` | `fatherId` |
| `created_at` | `createdAt` |
| ... | ... |
