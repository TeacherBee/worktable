## Context

Worktable 是一个模块化的本地 Web 工具台，采用 Express + 浏览器前端架构。现有 `repo-browser` 模块已提供 GitHub 仓库的文件树、Commit 列表和 Diff 对比能力，但缺乏对代码仓库的结构化文档管理与自动生成能力。

本设计为 Worktable 新增 `doc-summary` 模块，引入版本化文档存储 + DeepSeek 驱动的增量文档生成。

## Goals / Non-Goals

**Goals:**
- 在 `modules/doc-summary/` 中实现文档 CRUD + 增量生成功能
- 文档以 Markdown 格式存储，支持上传、查看、删除
- 增量生成：通过 DeepSeek API 分析 CodeDiff → 产出修改点 → 应用到现有文档 → 生成新版本
- 复用 `repo-browser` 模块的 compare API 获取 CodeDiff
- 零新增 npm 依赖（`https` 模块调 DeepSeek API）
- API key 安全存储在 `config.json`（已 .gitignore）

**Non-Goals:**
- 不做 Word/PDF 导出（后续可加）
- 不做语法高亮或富文本编辑器（纯 Markdown）
- 不做多仓库并行文档管理（v1 聚焦当前选中仓库）
- 不做文档版本 diff 对比（仅展示修改时间线）

## Decisions

### 1. 存储方案：JSON 元数据 + .md 文件

| 方案 | 评价 |
|------|------|
| 纯 JSON（所有文档内容嵌在 JSON 中） | 大文档后 JSON 臃肿，不方便手动编辑 |
| JSON 元数据 + `.md` 文件 ✅ | 文档独立成 .md，可用任何编辑器打开；元数据轻量 |

**选择**：`data/docs.json` 存元数据（版本列表、关联 commit、时间戳），实际文档内容存 `data/docs/` 下的 `.md` 文件。

```json
// data/docs.json
{
  "repoOwner": "TeacherBee",
  "repoName": "worktable",
  "docs": [
    {
      "id": "v1",
      "version": 1,
      "title": "Worktable 项目概览 (v1)",
      "commitSha": "a1b2c3d...",
      "shortSha": "a1b2c3d",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z",
      "filePath": "data/docs/v1.md",
      "source": "upload"  // "upload" | "generated"
    }
  ]
}
```

### 2. 增量生成流程（两阶段）

```
Phase 1: 提取修改点
─────────────────
Input:  CodeDiff (file list + patches from compare API)
Agent:  DeepSeek chat
Prompt: "分析以下代码变更，输出结构化的修改要点列表"
Output: Change Points (JSON 数组)

    [
      { "type": "新增"|"修改"|"删除",
        "file": "modules/repo-browser/api.js",
        "summary": "新增 GitHub API 封装，支持 tree/content/commits/compare",
        "details": "...",
        "docImpact": "需要新增 '代码管理' 章节描述新模块"
      },
      ...
    ]

Phase 2: 应用修改点生成新文档
─────────────────────────
Input:  现有 Doc v1 (.md) + Change Points
Agent:  DeepSeek chat
Prompt: "基于现有文档和以下修改点，生成更新后的完整文档"
Output: 完整的 Doc v2 (.md)
```

**为什么两阶段而不是直接输入 CodeDiff + 旧文档输出新文档？**
- 一阶段虽然更简单，但 CodeDiff 可能非常长（数百行 patch），容易超出上下文或丢失重点
- 修改点阶段压缩了信息量（从 patch → 结构化摘要），第二阶段专注"修改"而不是"分析"
- 修改点可供用户审查后再生成——用户可以在"提交修改点"和"最终生成"之间介入

### 3. DeepSeek API 调用方式

沿用现有 `repo-browser` 的 `githubAPI()` 模式——Node.js 内置 `https` 模块，零依赖：

```js
function deepseekChat(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-flash-v4',
      messages,
      temperature: 0.3,  // 低温度保证一致性
    });
    // POST https://api.deepseek.com/v1/chat/completions
    // Authorization: Bearer <token>
    // → resolve(choice.message.content)
  });
}
```

### 4. 复用现有 repo-browser 模块

doc-summary 的生成功能不自己调 GitHub API，而是**调用本地同机的 repo-browser API**：

```
生成请求 → doc-summary/api.js
              ↓
        fetch(http://localhost:${port}/api/repo-browser/compare?base=A&head=B)
              ↓
        CodeDiff → 传给 DeepSeek
```

这样 doc-summary 不需要关心 GitHub 认证逻辑，repo-browser 是唯一的 GitHub API 入口。

### 5. 前端交互流程

```
用户点击「生成新版本」
  → 弹出对话框
    → 选择"基于哪个已有版本"（下拉选之前生成的文档）
    → 选择"目标 Commit"（从 commit 列表选，复用 repo-browser 的 commits API）
  → 点击「分析变更」
    → 后端 fetch CodeDiff → DeepSeek 分析 → 返回修改点列表
    → 前端展示修改点（用户可审查/编辑/删除）
  → 用户确认修改点
    → 后端 DeepSeek 应用修改点到文档 → 返回新文档
    → 前端展示预览
  → 用户点击「保存」→ 文档存入 data/docs/
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| DeepSeek API 不稳定或超时 | 前端显示加载状态 + 后端 60s 超时兜底；失败时提示重试 |
| 生成的文档格式不符合预期 | 低温度 (0.3) + 详细 System Prompt 约束输出格式；用户可在保存前预览编辑 |
| CodeDiff 过大超 DeepSeek 上下文 | 仅传关键文件 patch（过滤二进制/非源码文件）+ 必要时分段发送 |
| 多个版本积累后磁盘占用 | .md 文件很小（通常 <50KB/份），可忽略不计 |
| API key 再次暴露 | 已在 .gitignore 中 + 之前已清理历史 |
