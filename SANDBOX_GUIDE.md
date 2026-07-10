# 无风险沙箱试错 — 使用指南

## 三层沙箱体系

```
┌─────────────────────────────────────────────────────────────┐
│  L1: 对话分叉 (Conversation Fork)                           │
│  工具：Claude Code 桌面版 Fork 按钮                          │
│  作用：复制当前对话到新会话，独立探索不同方向                   │
│                                                            │
│  Claude Code 左侧会话列表：                                  │
│  ├── 树状图重构 (原始对话)                                   │
│  ├── ⚡ 方案A: 改用Canvas   ← 点 Fork 产生的新会话           │
│  └── ⚡ 方案B: 改用D3.js    ← 再从原始对话 Fork             │
├─────────────────────────────────────────────────────────────┤
│  L2: 文件沙箱 (Git Worktree)                                │
│  工具：EnterWorktree / ExitWorktree                         │
│  作用：在独立目录中修改文件，主目录不受影响                   │
│                                                            │
│  D:\work_space\电子族谱\                                    │
│  ├── index.html (main — 稳定版本)                           │
│  └── .claude/worktrees/exp-canvas/                         │
│       └── index.html (独立分支，随便改)                      │
├─────────────────────────────────────────────────────────────┤
│  L3: 远程沙箱 (GitHub Fork)                                 │
│  工具：git push / git PR                                    │
│  作用：实验代码安全保存在云端，随时可合入主分支               │
│                                                            │
│  github.com/fangchangtian/zupu_demo                         │
│  ├── main (保护分支)                                        │
│  ├── exp-canvas ← 推送实验                                  │
│  └── 提 PR → Review → 合入                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 标准工作流

### Step 1：Fork 对话（探索不同方向）

你在主对话中做了一些分析，想试两个不同的方向：

1. 点击桌面版左侧对话旁的 **Fork 按钮**
2. 新会话自动创建，继承当前对话的完整上下文
3. 左侧出现一个新会话条目，你可以：

```
原始对话: "分析一下 ECharts 树状图性能" 
     │
     ├── ⚡ Fork 1: "试试用 Canvas 替换 ECharts"  ← 各自独立探索
     │
     └── ⚡ Fork 2: "试试用 D3.js 替换 ECharts" 
```

两个 Fork 里的对话互不干扰，原始对话也不受影响。

### Step 2：在 Fork 的对话中开文件沙箱

进入某个 Fork 会话后，对 Claude 说：

> "开个沙箱，把树状图改成 Canvas 渲染"

Claude 会调用 `EnterWorktree`，在 `.claude/worktrees/` 下创建隔离目录，所有文件改动都在沙箱里，主目录纹丝不动。

### Step 3：实验收尾

| 结果 | 在 Fork 对话中对 Claude 说 | 效果 |
|------|--------------------------|------|
| **失败** | "删掉沙箱" | `ExitWorktree("remove")` — 沙箱目录和分支全部消失 |
| **成功，想保留** | "推送到 GitHub" | `git push origin exp-canvas` — 代码安全存到云端 |
| **成功，想合入** | "从沙箱提 PR" | 在 GitHub 创建 Pull Request，Review 后合入 main |

### Step 4：清理 Fork 对话

实验结束后，左侧的 Fork 会话可以随时关闭，不影响原始对话和 main 分支。

---

## 三种安全维度的关系

| 维度 | 保护什么 | 实体 | 命令/操作 |
|------|---------|------|----------|
| **对话安全** | 原始对话上下文不被新思路打乱 | 左侧会话列表 | 点 Fork 按钮 |
| **文件安全** | main 分支代码不被实验性修改污染 | `.claude/worktrees/` | `EnterWorktree` / `ExitWorktree` |
| **代码安全** | GitHub 主仓库不被未测试代码污染 | `github.com/你的用户名/zupu_demo` | `git push` 到自己仓库 / 提 PR |

---

## 完整场景示例

### 场景：我想试试用 Canvas 重写树状图

**第 1 步** — 在桌面版点击 **Fork**，左侧出现新会话 "Fork 1"

**第 2 步** — 在新会话里说：

> "开个沙箱，用 Canvas 重写树状图渲染"

Claude 进入 `.claude/worktrees/exp-canvas/`，开始改代码

**第 3 步** — 改到一半发现跑偏了：

> "删掉沙箱重新来"

沙箱一键清除，main 分支完全干净。再试一次：

> "开个新沙箱，重新开始"

**第 4 步** — 改好了，满意：

> "推送到 GitHub"

代码进入 `github.com/fangchangtian/zupu_demo` 的 `exp-canvas` 分支

**第 5 步** — 之前 Fork 的那个旧对话不用了，关闭即可。按需回到原始对话继续工作。

---

## 并行探索模式

```
原始对话                                    GitHub
┌──────────────┐                           ┌──────────────┐
│ 分析需求      │                           │ main (稳定)   │
└──────┬───────┘                           └──────┬───────┘
       │ Fork                                       │ PR
  ┌────┴────┐  ┌────┴────┐                  ┌──────┴───────┐
  │ Fork A  │  │ Fork B  │                  │ exp-canvas   │
  │ Canvas  │  │ D3.js   │                  │ exp-d3       │
  └────┬────┘  └────┬────┘                  └──────────────┘
       │             │
  沙箱目录 1      沙箱目录 2
  exp-canvas/     exp-d3/

  A 和 B 同时进行，互不干扰。最终哪个好就合入哪个。
```

---

## 速查表

### Claude Code 桌面版

| 操作 | 怎么做 |
|------|--------|
| Fork 对话 | 点击左侧会话旁的 Fork 按钮 |
| 切换到原始对话 | 点击左侧原始会话条目 |
| 关闭 Fork | 右键 → 关闭（不影响已保存的代码） |

### 在对话中对 Claude 说

| 你说 | Claude 执行 |
|------|------------|
| "开个沙箱" | `EnterWorktree` |
| "删掉沙箱" | `ExitWorktree(action: "remove")` |
| "退出沙箱但保留" | `ExitWorktree(action: "keep")` |
| "推送到 GitHub" | `git push origin <分支>` |
| "从沙箱提 PR" | `gh pr create` |

### 如何检查当前状态

```bash
# 我在沙箱里吗？
git worktree list

# 我在哪个分支？
git branch --show-current

# 当前文件修改了什么？
git diff --stat
```

---

## 注意事项

1. **对话 Fork 不自动带文件沙箱** — 对话 Fork 只是复制对话历史，文件隔离仍需对 Claude 说"开个沙箱"。
2. **用完即删** — 实验失败的沙箱及时删除节省磁盘空间；无用的 Fork 对话及时关闭。
3. **Fork 对话可以安全关闭** — 只要你把代码 push 到了 GitHub，关闭 Fork 会话不会丢代码。
4. **GitHub 仓库** — `github.com/fangchangtian/zupu_demo` 已经配置好，可以直接推送。

---

## 核心理念

> **对话 Fork 让你敢想 — 新思路不打断当前工作**
>
> **文件沙箱让你敢改 — 改错了不污染主代码**
>
> **GitHub 让你敢存 — 推上去就不丢，随时提 PR**
