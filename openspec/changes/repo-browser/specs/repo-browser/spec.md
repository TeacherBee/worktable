## ADDED Requirements

### Requirement: 仓库管理

系统 SHALL 提供仓库选择和管理功能，默认预置 TeacherBee/worktable 仓库。

#### Scenario: 查看已添加的仓库

- **WHEN** 用户打开代码管理模块
- **THEN** 显示仓库选择下拉框，包含已添加的仓库列表，默认选中 TeacherBee/worktable

#### Scenario: 添加新仓库

- **WHEN** 用户点击"添加仓库"按钮，输入完整的 GitHub 仓库 URL（如 `https://github.com/owner/repo`）
- **THEN** 仓库被添加到列表并自动选中

#### Scenario: 删除仓库

- **WHEN** 用户从下拉框选择"管理仓库"，删除某个仓库
- **THEN** 该仓库从列表中移除

### Requirement: 项目文件树

系统 SHALL 展示选中仓库的文件树，以树形结构呈现目录和文件。

#### Scenario: 加载文件树

- **WHEN** 用户选择或切换仓库
- **THEN** 左侧展示该仓库根目录下的文件和子目录列表，目录可点击展开

#### Scenario: 展开/收起目录

- **WHEN** 用户点击目录名
- **THEN** 展开显示该目录下的子项，再次点击收起

### Requirement: 文件内容预览

系统 SHALL 在用户点击文件时，从 GitHub API 拉取该文件所在目录的下一级文件列表和文件内容，并展示。

#### Scenario: 查看文件内容

- **WHEN** 用户在文件树中点击一个文件
- **THEN** 右侧区域顶部显示文件路径（如 `core/server.js`）
- **AND** 显示该文件所在同级目录的文件列表（可快速点击切换）
- **AND** 显示文件内容（文本文件以纯文本展示）

#### Scenario: 文件内容加载失败

- **WHEN** 文件过大或 API 请求失败
- **THEN** 显示错误提示"无法加载文件内容"

### Requirement: Commit 列表

系统 SHALL 展示选中仓库的最近 commits，以表格形式呈现。

#### Scenario: 查看 commits

- **WHEN** 用户打开代码管理模块或切换仓库
- **THEN** 右侧 commits 表格加载最新 20 条 commit，每行显示：勾选框、SHA 值（前 7 位）、作者、日期、提交信息摘要

#### Scenario: 加载更多 commits

- **WHEN** 用户滚动到列表底部或点击"加载更多"
- **THEN** 加载下一页 commits 并追加到表格

### Requirement: Diff 对比

系统 SHALL 允许用户勾选两个 commit 并查看它们之间的差异。

#### Scenario: 选择两个 commit

- **WHEN** 用户在 commits 表格中勾选两个 commit
- **THEN** "查看 Diff"按钮变为可点击状态

#### Scenario: 查看 Diff

- **WHEN** 用户勾选两个 commit 后点击"查看 Diff"
- **THEN** 在 commits 表格下方展示 diff 结果，包含每个变更文件的状态（added/modified/removed）和具体变更内容（统一 diff 格式）

#### Scenario: 勾选数量不正确

- **WHEN** 用户勾选少于或超过 2 个 commit
- **THEN** "查看 Diff"按钮为禁用状态，提示"请勾选两个 commit"

### Requirement: Token 配置

系统 SHALL 使用 config.json 中的 githubToken 字段进行 API 认证，提升限流配额。

#### Scenario: 带 Token 请求

- **WHEN** config.json 中存在 githubToken 字段
- **THEN** 所有 GitHub API 请求携带 `Authorization: token ghp_xxx` 请求头

#### Scenario: 无 Token 降级

- **WHEN** config.json 中无 githubToken 字段
- **THEN** 以匿名方式请求 GitHub API（限流 60次/小时）
