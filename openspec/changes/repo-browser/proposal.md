## Why

Worktable 已经具备本地文件浏览功能，但对于 GitHub 仓库的代码浏览，目前只能通过浏览器访问 GitHub 网页。需要将代码浏览能力集成到 Worktable 内，方便快速浏览仓库结构、查看提交历史和对比差异，为后续的仓库分析和文档自动生成功能铺路。

使用 GitHub REST API 实时拉取数据，无需本地 clone，不占用磁盘空间。

## What Changes

- 新增 `repo-browser` 模块，入口在左侧导航栏
- 仓库选择界面：管理 GitHub 仓库 URL，默认内置 `TeacherBee/worktable`
- 项目文件树：以树形结构展示仓库目录，点击文件显示文件内容及同级文件列表
- Commit 列表：表格展示 commits（SHA、作者、日期、提交信息），支持分页
- Diff 对比：勾选两个 commit 后查看它们之间的差异
- GitHub Token 配置：写入 `config.json`，用于提高 API 限流配额

## Capabilities

### New Capabilities
- `repo-browser`: 代码管理界面，通过 GitHub REST API 实时拉取仓库数据，无需本地 clone；支持仓库选择、文件树浏览、commit 列表查看、diff 对比

### Modified Capabilities

（无现有 specs 需要修改）

## Impact

- 新增 `modules/repo-browser/api.js` — GitHub API 调用封装
- 新增 `modules/repo-browser/page.html` — 前端双栏布局（文件树 + commits 表格）
- `config.json` 新增 `githubToken` 字段
- `config.json` 加入 `.gitignore`（因包含 token）
- 无新增 npm 依赖（使用 Node.js 内置 https 模块请求 GitHub API）
