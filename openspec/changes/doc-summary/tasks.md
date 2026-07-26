## 1. 基础配置

- [x] 1.1 在 `config.json` 中新增 `deepseekKey` 字段说明
- [x] 1.2 在 `data/` 下创建 `docs/` 目录（存储 .md 文档文件）
- [x] 1.3 创建 `modules/doc-summary/` 模块目录和 api.js 骨架

## 2. DeepSeek API 客户端

- [x] 2.1 实现 `deepseekChat(messages, options)` — 基于 Node.js `https` 模块的 POST 请求封装
- [x] 2.2 从 `config.json` 读取 `deepseekKey`，缺失时返回明确错误
- [x] 2.3 实现 60 秒超时处理
- [x] 2.4 实现结构化 JSON 输出提取（用于修改点解析）
- [x] 2.5 导出模块：`module.exports = { deepseekChat }`

## 3. 文档存储管理（后端 API）

- [x] 3.1 实现 `GET /api/doc-summary/docs` — 从 `data/docs.json` 读取文档元数据列表（按版本降序）
- [x] 3.2 实现 `POST /api/doc-summary/upload` — 上传 .md 文件到 `data/docs/`，写入元数据到 `data/docs.json`
- [x] 3.3 实现 `GET /api/doc-summary/docs/:id` — 读取指定文档的 .md 文件内容返回
- [x] 3.4 实现 `DELETE /api/doc-summary/docs/:id` — 删除文档 .md 文件 + 元数据
- [x] 3.5 定义 `data/docs.json` 的数据结构：`{ id, version, title, commitSha, shortSha, createdAt, updatedAt, fileName, source }`

## 4. 文档生成引擎（后端 API）

- [x] 4.1 实现 `POST /api/doc-summary/analyze` — 接收 `{ baseDocId, targetCommitSha, owner, repo }`
  - [x] 4.1.1 查询 base 文档的关联 commit SHA
  - [x] 4.1.2 调用本地 `/api/repo-browser/compare?base=...&head=...` 获取 CodeDiff
  - [x] 4.1.3 过滤非源码文件（二进制、图片等），整理 patch 数据
  - [x] 4.1.4 调用 DeepSeek Phase 1：分析 CodeDiff → 产出修改点 JSON
  - [x] 4.1.5 返回修改点列表给前端审查

- [x] 4.2 实现 `POST /api/doc-summary/generate` — 接收 `{ baseDocId, changePoints }`
  - [x] 4.2.1 读取 base 文档内容
  - [x] 4.2.2 调用 DeepSeek Phase 2：现有文档 + 修改点 → 新文档
  - [x] 4.2.3 返回生成的新文档内容（暂不保存）

- [x] 4.3 实现 `POST /api/doc-summary/save` — 接收 `{ content, title, commitSha, source=generated }`
  - [x] 4.3.1 写入 .md 文件到 `data/docs/`
  - [x] 4.3.2 写入元数据到 `data/docs.json`（自动递增版本号）

## 5. 前端页面

- [x] 5.1 创建 `modules/doc-summary/page.html` — 左侧文档列表 + 右侧预览/操作的左右布局
- [x] 5.2 文档列表区域：展示版本号、标题、commit SHA、日期、来源标签、操作按钮（查看/删除）
- [x] 5.3 文档预览面板：渲染 Markdown 内容（基础样式：标题、列表、代码块）
- [x] 5.4 上传文档弹窗：选择 .md 文件 + 填写标题 + 填写关联 commit SHA
- [x] 5.5 生成文档弹窗：
  - [x] 5.5.1 下拉选择"基于哪个版本"
  - [x] 5.5.2 输入目标 commit SHA（或从 repo-browser 的 commit 列表选择）
  - [x] 5.5.3 「分析变更」按钮 → 展示修改点列表（可勾选/删除）
  - [x] 5.5.4 「生成文档」按钮 → 预览生成结果
  - [x] 5.5.5 「保存」按钮 → 存入存储
- [x] 5.6 加载状态和错误提示的处理

## 6. 模块注册与集成

- [x] 6.1 设置 `label = '📋 文档'`，确保模块自动出现在导航栏
- [x] 6.2 更新 `README.md`：新增 doc-summary 功能说明、配置项、项目结构

## 7. 清理与验证

- [x] 7.1 端到端验证：启动服务 → 上传文档 → 查看列表 → 生成新版本 → 保存 → 查看
- [x] 7.2 验证 `data/docs.json` 内容和文件结构正确
- [x] 7.3 验证 DeepSeek 超时和错误处理正常
