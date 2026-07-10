# Service 层说明

所有 Service 接口位于 `org.example.zupu_demo.service` 包下，实现类位于 `service.impl` 子包。均继承 MyBatis-Plus 的 `IService<T>` / `ServiceImpl<M, T>`，自动获得通用 CRUD 能力。

---

## Service 总览

| 接口 | 实现类 | 核心职责 |
|------|--------|---------|
| `UserService` | `UserServiceImpl` | 用户注册、登录认证、密码哈希 |
| `FamilyService` | `FamilyServiceImpl` | 家族创建（事务：建家族 + 授权管理员） |
| `FamilyMemberService` | `FamilyMemberServiceImpl` | 族谱核心：增删改查、树形遍历、关系计算 |
| `SpouseRelationshipService` | `SpouseRelationshipServiceImpl` | 配偶关系 CRUD（通用实现，无额外方法） |
| `FamilyRuleService` | `FamilyRuleServiceImpl` | 族规 CRUD（通用实现，无额外方法） |
| `FamilyUserRoleService` | `FamilyUserRoleServiceImpl` | 权限校验：管理员判断、父节点编辑权限 |
| `OperationLogService` | `OperationLogServiceImpl` | 操作审计日志写入 |

---

## 1. UserService — 用户认证

```java
public interface UserService extends IService<User> {
```

继承自 `IService<User>`，自带：`save()`, `getById()`, `updateById()`, `removeById()`, `list()`, `lambdaQuery()` 等。

### 自定义方法

#### `register(username, rawPassword, realName)` → User

注册新用户，流程：

1. 检查用户名是否已存在（`LambdaQueryWrapper` 按 `username` 查询），存在则抛异常
2. 对原始密码做 **SHA-256 + 16 字节随机盐** 哈希，结果格式为 `Base64(salt):Base64(hash)`
3. 保存用户到 `users` 表，返回带 id 的 User 对象

> ⚠️ 生产环境建议替换为 BCrypt（`spring-boot-starter-security` 内置 `PasswordEncoder`）。

#### `login(username, rawPassword)` → User | null

1. 按用户名查 User，不存在返回 `null`
2. 从 `password_hash` 中分离盐值和哈希，对输入密码做相同哈希后比较（`MessageDigest.isEqual` 防时序攻击）
3. 匹配成功返回 User，失败返回 `null`

```
调用链：Controller.register() / Controller.login() → UserService → UserMapper
```

---

## 2. FamilyService — 家族管理

```java
public interface FamilyService extends IService<Family> {
```

#### `createFamily(name, surname, createdBy, description)` → Family

**事务方法**（`@Transactional`），两步操作原子执行：

1. 在 `families` 表插入新家族记录
2. 在 `family_user_roles` 表插入一条 `role = "global_admin"` 的记录，将创建者绑定为全局管理员

```
调用链：Controller.create() → FamilyService.createFamily()
          ├── FamilyMapper.insert(family)
          └── FamilyUserRoleMapper.insert(role)
```

---

## 3. FamilyMemberService — 族谱核心 ⭐

```java
public interface FamilyMemberService extends IService<FamilyMember> {
```

这是整个项目最核心的 Service，承载族谱树形的所有业务逻辑。

### 3.1 addMember(member, operatorId) → FamilyMember

添加家族成员，包含以下业务规则：

- 设置 `createdBy` 为操作人 ID
- **自动推算代数**：
  - 如果有 `fatherId` → 查父亲，验证同族，代数 = 父亲代数 + 1
  - 如果没有 `fatherId` → 代数 = 1（始祖）
- **校验母亲同族**：如有 `motherId`，查母亲并验证 `familyId` 一致
- 调用 `save()` 入库

```
调用链：POST /api/members → Controller.create() → FamilyMemberService.addMember()
```

### 3.2 getAncestors(memberId) → List\<FamilyMember\>

查询某成员的所有**直系祖先**（父 → 祖父 → 曾祖父 …）：

- 以 `memberId` 为起点，沿 `father_id` 逐级向上递归
- 遇到 `fatherId = null` 时停止
- 返回列表顺序：父亲 → 祖父 → 曾祖父 …（由近到远）

```
实现：while 循环沿 fatherId 链向上查
时间复杂度：O(代数)，单条族谱通常 ≤ 30 代
```

### 3.3 getDescendants(memberId) → List\<FamilyMember\>

查询某成员的所有**后代**（子女 → 孙子女 → 曾孙 …）：

- 递归 DFS 向下遍历：查找所有 `father_id = 当前 id` 或 `mother_id = 当前 id` 的成员
- 对每个子女继续递归，**不限制深度**
- 返回所有子孙的扁平列表

```
实现：DFS 递归，每次查 father_id/mother_id = parentId 的记录
注意：大族谱（数千人）下需注意性能，可后续加缓存
```

### 3.4 getSiblings(memberId) → List\<FamilyMember\>

查询某成员的同辈**兄弟姐妹**：

- 以成员的 `father_id` 为准，查同父的所有其他子女
- 排除自己
- 按 `sort_order` 排序

> 注意：当前实现查同父，同母异父的兄弟姐妹需要扩展（查 mother_id 侧）

### 3.5 calculateRelationship(memberAId, memberBId) → String

计算两个家族成员之间的**亲戚关系称呼**，核心算法：

1. 校验两人是否同族（`familyId` 相同）
2. 相同 id → 返回 "本人"
3. 沿 A 向上构建祖先列表 `[父亲id, 祖父id, 曾祖父id, …]`
4. 检查 B 是否在 A 的祖先链中 → 直系关系（父亲/母亲/祖父母…）
5. 沿 B 向上逐级查找，找到与 A 祖先链的**最近共同祖先**
6. 根据两人到共同祖先的距离（`aDist`, `bDist`）输出称呼：

| 条件 | 输出示例 |
|------|---------|
| aDist=1, bDist=1 | 兄弟姐妹 |
| aDist=1, bDist=2 | 叔伯/侄 |
| aDist=2, bDist=2 | 堂/表兄弟姐妹 |
| 无共同祖先 | 同族远亲 |
| 非同族 | 非同族 |

```
调用链：GET /api/members/relationship?aId=1&bId=5 → Controller → FamilyMemberService.calculateRelationship()
```

---

## 4. SpouseRelationshipService

```java
public interface SpouseRelationshipService extends IService<SpouseRelationship> {
```

无额外自定义方法，完全依赖 `IService` 的通用 CRUD。

Controller 中通过 `lambdaQuery()` 链式调用：
- 按家族查配偶列表
- 按成员查其所有配偶（同时查 husband_id 和 wife_id）

---

## 5. FamilyRuleService

```java
public interface FamilyRuleService extends IService<FamilyRule> {
```

无额外自定义方法。Controller 中通过 `lambdaQuery()` 实现排序逻辑：
- 置顶优先（`isPinned DESC`）
- 其次按 `sortOrder ASC`

---

## 6. FamilyUserRoleService — 权限校验

```java
public interface FamilyUserRoleService extends IService<FamilyUserRole> {
```

### 6.1 isGlobalAdmin(familyId, userId) → boolean

判断某个用户是否为**全局管理员**：

```sql
SELECT COUNT(*) FROM family_user_roles
WHERE family_id = ? AND user_id = ? AND role = 'global_admin'
```

返回值 > 0 即为管理员。

### 6.2 canEditMember(familyId, userId, targetMemberId) → boolean

判断用户是否有**编辑某成员**的权限，两级判断：

```
┌─ 是否为 global_admin？
│   └─ 是 → 返回 true
│   └─ 否 ↓
│
├─ 查询用户的 member_id（即该用户对应的家族成员）
│   └─ 不存在 → 返回 false
│   └─ 存在 ↓
│
└─ member_id 是否等于 target 的 father_id 或 mother_id？
    └─ 是 → 返回 true（父节点可改子节点）
    └─ 否 → 返回 false
```

```
权限模型：
  全局管理员 ──→ 可编辑整棵树
  父节点       ──→ 可编辑直属子女
  普通成员     ──→ 只读
```

---

## 7. OperationLogService — 审计日志

```java
public interface OperationLogService extends IService<OperationLog> {
```

### 7.1 log(familyId, userId, targetMemberId, action, detail) → void

记录一条操作日志，5 个参数：

| 参数 | 说明 | 示例 |
|------|------|------|
| familyId | 操作所在家族 | 1 |
| userId | 操作人用户 ID | 3 |
| targetMemberId | 被操作的成员 ID | 5 |
| action | 操作类型字符串 | `"create_member"` |
| detail | 变更详情 JSON | `"{\"name\":\"张三\",\"gender\":\"M\"}"` |

> 当前 Service 层方法（如 `addMember`）并未自动调用 `OperationLogService.log()`。后续可在各 Service 方法中注入 `OperationLogService` 并统一记录，实现审计自动化。

---

## Service 依赖关系

```
Controller
    │
    ├── UserService ──────────→ UserMapper
    ├── FamilyService ────────→ FamilyMapper + FamilyUserRoleMapper
    ├── FamilyMemberService ──→ FamilyMemberMapper
    ├── SpouseRelationshipService → SpouseRelationshipMapper
    ├── FamilyRuleService ────→ FamilyRuleMapper
    ├── FamilyUserRoleService → FamilyUserRoleMapper + FamilyMemberMapper
    └── OperationLogService ──→ OperationLogMapper
```

`FamilyServiceImpl` 和 `FamilyUserRoleServiceImpl` 在自身 Mapper 之外额外注入了其他 Mapper（用于跨表事务或关联查询）。

---

## MyBatis-Plus 继承能力速查

所有 Service 实现类因继承 `ServiceImpl` 而自带以下常用方法（无需手写）：

| 方法 | 说明 |
|------|------|
| `save(entity)` | 插入一条记录（insert） |
| `saveBatch(list)` | 批量插入 |
| `getById(id)` | 按主键查询 |
| `updateById(entity)` | 按主键更新 |
| `removeById(id)` | 按主键删除 |
| `list()` / `list(wrapper)` | 查询全表 / 条件查询 |
| `count()` / `count(wrapper)` | 计数 |
| `lambdaQuery()` | 开启 Lambda 链式查询（类型安全） |
| `lambdaUpdate()` | 开启 Lambda 链式更新 |
