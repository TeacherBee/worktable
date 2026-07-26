## Why

Worktable 已有 GitHub 代码浏览能力（文件树、Commits、Diff），但缺少对代码仓库的**概括性文档**管理。用户需要一种方式：

1. 为代码仓库的不同版本维护结构化的 Markdown 说明文档
2. 在代码变更时，**增量更新**文档而非从头重写
3. 将文档作为可追溯的版本化资产进行管理（每份文档关联一个 commit）

解决这个问题后，用户可以为项目生成清晰的项目结构说明、功能概览、技术栈描述等文档，并随着代码演进持续维护。

## What Changes

- **新增 `doc-summary` 模块**（`modules/doc-summary/`），提供完整的文档生命周期管理
- **Markdown 文档存储** — 在 `data/docs/` 下以 `.md` 文件存储文档，`data/docs.json` 维护元数据索引
- **上传文档** — 从本地上传 `.md` 文件作为某个版本的基础文档
- **查看文档列表** — 展示所有已存储的文档版本，含修改日期、关联 commit
- **增量文档生成** — 选择已有文档版本 + 目标 commit：
  1. 调用 DeepSeek API 分析 `CodeDiff`（跨 commit 的文件差异）→ 产出结构化**修改点**
  2. 基于现有文档 + 修改点，调用 DeepSeek API → 产出更新后的完整文档
- **DeepSeek 集成** — 通过 Node.js `https` 模块调用 DeepSeek API（零额外依赖），API key 存 `config.json`
- **前端界面** — 左侧文档列表 + 右侧文档预览/编辑，内嵌生成流程

## Capabilities

### New Capabilities

- `doc-storage`: 版本化文档的存储管理（增删查、上传、元数据索引、关联 commit）
- `doc-generation`: 基于 CodeDiff 的增量文档生成引擎（DeepSeek 驱动的修改点提取 + 文档更新）
- `deepseek-integration`: DeepSeek API 客户端封装（与 GitHub API 类似的零依赖 https 调用方式）

### Modified Capabilities

- （无现有 specs 需要修改）

## Impact

- **新增文件**：
  - `modules/doc-summary/api.js` — 文档 CRUD + 生成 API
  - `modules/doc-summary/page.html` — 前端界面
  - `data/docs.json` — 文档元数据索引
  - `data/docs/` — .md 文档文件存储目录
- **修改文件**：
  - `config.json` — 新增 `deepseekKey` 字段
  - `README.md` — 更新功能列表、项目结构
- **依赖**：零新增 npm 依赖（复用 Node.js 内置 `https` 调用 DeepSeek API）
- **存储**：`data/docs/` 目录下的 `.md` 文件建议加入 `.gitignore`（自动生成内容）
