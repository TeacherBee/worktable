## 1. 配置准备

- [x] 1.1 config.json 新增 githubToken 字段；将 config.json 加入 .gitignore 并执行 git rm --cached（防止 token 泄露）
- [x] 1.2 创建 modules/repo-browser/ 目录

## 2. GitHub API 封装

- [x] 2.1 实现 githubAPI 工具函数（https 请求封装、自动带 token、错误处理、JSON 解析），放在 modules/repo-browser/api.js 内
- [x] 2.2 实现 GET /api/repo-browser/repo — 获取仓库信息（默认分支等）
- [x] 2.3 实现 GET /api/repo-browser/tree — 拉取文件树（递归）
- [x] 2.4 实现 GET /api/repo-browser/content — 拉取文件内容 + 同级目录列表
- [x] 2.5 实现 GET /api/repo-browser/commits — 拉取 commit 列表（分页）
- [x] 2.6 实现 GET /api/repo-browser/compare — 对比两个 commit 的 diff

## 3. 前端页面 — 仓库选择与文件树

- [x] 3.1 实现 repo-browser/page.html 整体布局（双栏 + 顶部仓库选择栏）
- [x] 3.2 实现仓库选择下拉框、添加仓库、切换仓库逻辑
- [x] 3.3 实现文件树组件（递归渲染、展开/收起、点击文件事件）
- [x] 3.4 实现文件内容展示区域（文件路径、同级文件标签页、文件内容预览）

## 4. 前端页面 — Commit 列表与 Diff

- [x] 4.1 实现 commits 表格渲染（SHA、作者、日期、提交信息、勾选框）
- [x] 4.2 实现分页/加载更多
- [x] 4.3 实现勾选逻辑（只能勾选 2 个，控制"查看 Diff"按钮状态）
- [x] 4.4 实现 diff 展示区域（调用 compare API，渲染变更文件列表和 patch 内容）

## 5. 集成与验证

- [x] 5.1 启动服务，验证 repo-browser 模块出现在左侧导航
- [x] 5.2 验证文件树加载、展开/收起、点击文件查看内容
- [x] 5.3 验证 commits 列表加载、勾选两个 commit 查看 diff
- [x] 5.4 验证无 token 时也能正常工作（降级匿名请求）
