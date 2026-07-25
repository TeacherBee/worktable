## Context

Worktable 目前有日程管理和文档管理两个模块。用户希望新增代码管理能力，能够查看 GitHub 仓库的目录结构、提交历史和 diff，为后续的仓库分析功能做准备。

当前限制：不能也不应该 clone 仓库到本地（磁盘占用、同步成本高）。GitHub REST API 提供了所需的所有数据端点。

## Goals / Non-Goals

**Goals:**
- 提供仓库选择界面，可管理多个 GitHub 仓库（默认预置 TeacherBee/worktable）
- 左侧展示项目文件树（GitHub Trees API 递归拉取）
- 右侧展示 commits 表格（SHA 缩写、作者、日期、提交信息）
- 点击文件时拉取文件内容并展示，同时显示同级文件列表方便切换
- 勾选两个 commit 后，通过 Compare API 获取 diff 并展示
- Token 保护：config.json 中的 githubToken 不提交到 git

**Non-Goals:**
- 不做语法高亮（v1 纯文本展示，后续可加 highlight.js）
- 不做本地 clone / git 操作
- 不做文件编辑/提交（纯浏览）
- 不做分支管理 UI（默认看 default branch，后续可加）
- 不做仓库搜索（仅 URL 添加）

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      repo-browser 模块                        │
│                                                             │
│  Browser (page.html)          Backend (api.js)               │
│  ┌───────────────────┐      ┌──────────────────┐            │
│  │ 仓库选择           │      │                  │            │
│  │ 下拉菜单 + 添加按钮 │────▶│  /api/repo-browser/*         │
│  └───────────────────┘      │                  │            │
│  ┌───────────────────┐      │  ┌────────────┐  │  ┌───────┐│
│  │ 左：文件树         │      │  │ githubAPI  │──▶│GitHub ││
│  │ 点击目录 → 展开    │      │  │ 封装模块    │  │REST   ││
│  │ 点击文件 → 内容    │      │  └────────────┘  │ API   ││
│  └───────────────────┘      │                  │  └───────┘│
│  ┌───────────────────┐      │  内置有限缓存：     │         │
│  │ 右：commits 表格   │      │  - 目录树（session）│         │
│  │ 勾选 → [查看Diff]  │      │  - commits 列表缓存│         │
│  └───────────────────┘      └──────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作              后端                            GitHub API
═══════════════      ═══════════════             ════════════════

1. 选择仓库 ──────────▶ 不请求（只需 owner/repo）
   或添加新仓库

2. 查看项目树 ───────▶ GET /repos/{o}/{r}/git/trees/{branch}?recursive=1
                      ← JSON 树结构 ──────────────
                      └→ 缓存到内存
                      返回前端渲染

3. 点击文件 ──────────▶ GET /repos/{o}/{r}/contents/{path}
                      ← 文件内容（base64）─────────
                      解码后返回前端

4. 加载 commits ─────▶ GET /repos/{o}/{r}/commits?per_page=20
                      ← JSON commits ─────────────
                      返回前端渲染表格

5. 勾选2个commit ────▶ GET /repos/{o}/{r}/compare/{base}...{head}
  → 点击查看 Diff      ← JSON diff ────────────────
                      返回 files.changes 给前端
```

### GitHub API 端点清单

| 用途 | 端点 | 备注 |
|------|------|------|
| 默认分支 | `GET /repos/{o}/{r}` | 获取 default_branch |
| 文件树 | `GET /repos/{o}/{r}/git/trees/{branch}?recursive=1` | 一次拉取整棵树 |
| 文件内容 | `GET /repos/{o}/{r}/contents/{path}` | 返回 base64 编码内容 |
| Commits | `GET /repos/{o}/{r}/commits?per_page=20&page=N` | 分页 |
| Commit详情 | `GET /repos/{o}/{r}/commits/{sha}` | 含完整 diff |
| Compare | `GET /repos/{o}/{r}/compare/{base}...{head}` | 两次 commit 的差异 |

### UI 布局

```
┌─────────── 仓库选择栏 ──────────────────────────────────────┐
│  [TeacherBee/worktable ▼]  [+ 添加]  [🔄 刷新]              │
├────────────────────────┬────────────────────────────────────┤
│  文件树                │  commits 表格（每页20条）             │
│                        │                                    │
│  📦 worktable          │  ┌─────┬────────┬──────┬──────────┐│
│  ├─ core/              │  │ ☐   │ SHA   │ 作者  │ 日期     ││
│  │  ├─ server.js [←]   │  ├─────┼────────┼──────┼──────────┤│
│  │  ├─ router.js       │  │ ☑   │ abc123 │ TB   │ 07-25   ││
│  │  └─ storage.js      │  │ ☑   │ def456 │ TB   │ 07-24   ││
│  ├─ modules/           │  │ ☐   │ ghi789 │ TB   │ 07-23   ││
│  │  ├─ calendar/       │  │ ...  │        │      │          ││
│  │  └─ file-browser/   │  └─────┴────────┴──────┴──────────┘│
│  ├─ server.js          │          [查看 Diff] ← 勾选2个后可用│
│  └─ package.json       │                                    │
│                        │  ┌── Diff 展示区域 ──────────────┐ │
│  同级文件:              │  │  @@ -10,6 +10,8 @@          │ │
│  [router.js]           │  │  + // 新增功能说明            │ │
│  [storage.js]          │  │  - const old = ...           │ │
│  [web-ui.js]           │  └──────────────────────────────┘ │
└────────────────────────┴────────────────────────────────────┘
```

## Decisions

### 1. GitHub API 调用方式：Node.js 内置 https 模块

- **理由**：不需要额外安装 npm 包，减少依赖。GitHub REST API 使用标准 HTTPS JSON 接口，`https.get` 完全可以胜任。封装一个 `githubAPI(path)` 工具函数处理所有请求。
- **替代方案**：`@octokit/rest`（官方 SDK 但需要额外安装）、`axios`（更简洁但多了依赖）

### 2. Token 配置

- 存在 `config.json` 的 `githubToken` 字段
- 请求时加 `Authorization: token ghp_xxx` 请求头
- `config.json` 加入 `.gitignore`，防止 token 泄露
- 若无 token，降级为匿名请求（60次/小时限流）

### 3. 缓存策略：仅内存缓存，不持久化

- 文件树：拉取后缓存在内存中（`Map<owner/repo, tree>`）
- Commits：不缓存（每次重新拉取）
- 文件内容：不缓存（频繁请求 API，但用户使用场景下很少反复看同一个文件）
- 服务重启后缓存清空（数据量小，重新拉取成本低）

### 4. 文件树处理

- 使用 `recursive=1` 一次性拉取整个仓库文件树（GitHub API 支持）
- 前端解析扁平结构转为嵌套树
- 初始只显示根目录子节点，点击目录时通过 JS 展开/收起子节点
- 大仓库（超过 10000 个文件）API 会截断，此时需要逐级拉取

### 5. Diff 展示

- 使用 GitHub Compare API 的 `files` 数组
- 每个文件展示：文件名、状态（added/modified/removed）、patch（统一 diff 格式）
- 前端用 `<pre>` 展示 patch 文本，不改写颜色
- v1 不支持 side-by-side diff

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| API 限流（匿名 60次/小时） | 引导用户配置 token（升到 5000次/小时）|
| 大仓库文件树截断（>10000文件） | 检测截断标志 `truncated=true`，回退到逐级拉取 |
| 文件内容含中文乱码 | GitHub API 返回 base64，正确解码 utf-8 |
| Token 泄露 | 将 config.json 加入 .gitignore，提醒用户不分享该文件 |
| Diff 展示在移动端不好看 | v1 不考虑移动端适配 |

## Open Questions

- 后续是否支持切换分支？当前使用 default_branch
- 是否要支持私有仓库？（需要 token 有 repo scope）
