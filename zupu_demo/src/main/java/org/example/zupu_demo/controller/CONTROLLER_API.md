# 族迹 API 接口文档

Base URL: `http://localhost:8080`

---

## 1. UserController — 用户模块

**路径**: `/api/users`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/users` | 获取所有用户列表 |
| `GET` | `/api/users/{id}` | 按 ID 查询用户 |
| `POST` | `/api/users/register?username=&password=&realName=` | 注册新用户（SHA-256 加盐哈希） |
| `POST` | `/api/users/login?username=&password=` | 登录校验 |
| `PUT` | `/api/users` | 更新用户信息（JSON body） |
| `DELETE` | `/api/users/{id}` | 删除用户 |

---

## 2. FamilyController — 家族模块

**路径**: `/api/families`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/families` | 获取所有家族列表 |
| `GET` | `/api/families/{id}` | 按 ID 查询家族 |
| `POST` | `/api/families?name=&surname=&createdBy=&description=` | 创建家族（自动将创建者设为全局管理员） |
| `PUT` | `/api/families` | 更新家族信息（JSON body） |
| `DELETE` | `/api/families/{id}` | 删除家族（级联删除成员、族规等） |

---

## 3. FamilyMemberController — 家族成员模块 ⭐核心

**路径**: `/api/members`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/members/{id}` | 按 ID 查询成员 |
| `GET` | `/api/members?familyId=1` | 查询某家族全部成员（按代数→同辈排序排列） |
| `GET` | `/api/members/generation?familyId=1&generationOrder=3` | 查询某家族第 N 代成员 |
| `GET` | `/api/members/children?parentId=5` | 查某人的子女（默认按父亲查） |
| `GET` | `/api/members/children?parentId=5&parentType=mother` | 按母亲查子女 |
| `GET` | `/api/members/ancestors?memberId=10` | 查询某成员的所有祖先（向上递归 father_id） |
| `GET` | `/api/members/descendants?memberId=10` | 查询某成员的所有后代（DFS 向下递归） |
| `GET` | `/api/members/siblings?memberId=10` | 查询某成员的同辈兄弟姐妹（同父） |
| `GET` | `/api/members/relationship?aId=1&bId=10` | 计算两人的亲戚关系称呼 |
| `POST` | `/api/members?operatorId=1` | 添加成员（自动推算代数，校验父母同族） |
| `PUT` | `/api/members` | 更新成员信息 |
| `DELETE` | `/api/members/{id}` | 删除成员（其子节点 father_id 置 NULL） |

---

## 4. SpouseRelationshipController — 配偶关系模块

**路径**: `/api/spouses`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/spouses?familyId=1` | 查询某家族全部配偶关系 |
| `GET` | `/api/spouses/of?memberId=5` | 查某人的所有配偶（按 husband_id + wife_id 双方向查） |
| `POST` | `/api/spouses` | 创建配偶关系（JSON body） |
| `PUT` | `/api/spouses` | 更新配偶关系 |
| `DELETE` | `/api/spouses/{id}` | 删除配偶关系 |

---

## 5. FamilyRuleController — 族规/家训模块

**路径**: `/api/rules`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/rules?familyId=1` | 查询某家族全部族规（置顶优先 → 排序号升序） |
| `GET` | `/api/rules/{id}` | 按 ID 查询族规详情 |
| `POST` | `/api/rules` | 新建族规（JSON body：title, content 支持 Markdown, category） |
| `PUT` | `/api/rules` | 更新族规 |
| `DELETE` | `/api/rules/{id}` | 删除族规 |

---

## 6. FamilyUserRoleController — 权限角色模块

**路径**: `/api/roles`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/roles?familyId=1` | 查询某家族全部角色分配 |
| `GET` | `/api/roles/check?familyId=1&userId=1` | 查用户角色（可选传 targetMemberId 查父节点编辑权限） |
| `POST` | `/api/roles` | 授予角色（JSON body：familyId, userId, role） |
| `PUT` | `/api/roles` | 修改角色 |
| `DELETE` | `/api/roles/{id}` | 撤销角色 |

**权限模型**：
- `global_admin` — 全局管理员，可编辑整个族谱树
- `member` — 普通成员，只读；但如果该用户对应的 member 是目标成员的 father/mother，则自动拥有编辑权（父节点可改子节点）

---

## 7. OperationLogController — 操作日志模块（只读）

**路径**: `/api/logs`

| 方法 | URL | 说明 |
|------|-----|------|
| `GET` | `/api/logs?familyId=1` | 查询某家族最近的操作日志（默认 50 条，按时间倒序） |
| `GET` | `/api/logs/of-member?memberId=10` | 查询某成员相关的所有操作记录 |

日志内容为 JSON 格式，记录 action（create_member / update_member / delete_member / add_spouse 等）及变更详情。

---

## 调用链路

```
前端请求 → Controller → Service → Mapper → MySQL
```

- Controller 层：接收 HTTP 请求，参数校验，调用 Service
- Service 层：业务逻辑（注册加密、权限判断、代数推算、关系计算）
- Mapper 层：MyBatis-Plus BaseMapper 通用 CRUD
