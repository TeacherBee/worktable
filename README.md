# ◐ Worktable

**本地工具台** — 一个轻量、可扩展的本地 Web 工具集，Node.js 后台 + 浏览器前端，双击启动即可使用。

---

## 快速开始

```bash
# 确保已安装依赖
npm install

# 启动服务（开发，看控制台日志）
node server.js
```

**日常使用**：双击 `start.bat`（无黑框，自动打开浏览器）

浏览器访问 **http://localhost:8180**

关闭服务：浏览器左侧导航栏底部 → **⏻ 停止服务**

---

## 已实现功能

### 📅 日程管理

- **月视图日历** — 切换月份、查看日期
- **添加/删除日程** — 填写标题、日期、时间即可添加
- **当日日程列表** — 点击日期查看当日所有日程
- **15 分钟前系统提醒** — 后台引擎每 30 秒轮询，到期自动弹 Windows 通知（即使浏览器标签关闭）

### 📁 文档管理

- **文件列表** — 读取本地目录，展示文件名、大小、修改日期、类型
- **目录导航** — 点击进入子目录、面包屑返回、返回上级
- **打开文件** — 点击文件用系统默认程序打开
- **定位文件** — 在资源管理器中定位文件/文件夹

### 📂 代码管理

- **仓库选择** — 内置 `TeacherBee/worktable`，支持添加/删除 GitHub 仓库
- **文件树浏览** — 以树形结构展示仓库目录，点击展开/收起，点击文件查看内容
- **同级文件导航** — 查看文件时显示同级文件列表，快速切换
- **Commit 列表** — 表格展示 SHA、作者、日期、提交信息，支持分页加载
- **Diff 对比** — 勾选两个 commit，一键查看它们之间的差异（增删行高亮）
- **数据源** — 通过 GitHub REST API 实时拉取，无需本地 clone，不占磁盘

---

## 架构概览

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                            │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐   │
│  │ 📅 日程  │  │ 📁 文档  │  │ 📂 代码管理            │   │
│  │ page.html│  │ page.html│  │ page.html              │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬────────────┘   │
│       │             │                   │                 │
│       ▼             ▼                   ▼                 │
│  /api/calendar  /api/file-browser  /api/repo-browser      │
│                                              │            │
│                                              ▼            │
│                                      GitHub REST API      │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    core/     │
                    │              │
                    │  notify.js   │── node-notifier → Windows 弹窗
                    │  storage.js  │── data/schedules.json
                    │  router.js   │── 模块自动发现
                    │  server.js   │── Express 服务 + /api/shutdown
                    │  web-ui.js   │── 主页面框架 (Pico CSS)
                    └──────────────┘
```

---

## 项目结构

```
worktable/
│
├── server.js                 入口 — 启动 HTTP 服务 + 关闭接口
├── package.json              依赖声明
├── config.json               配置（端口、文档目录、GitHub Token）
├── start.bat                 一键启动（无黑框自动隐藏）
├── README.md                 本文件
│
├── core/                     核心基础设施
│   ├── server.js             Express 实例 + 中间件 + /api/shutdown
│   ├── router.js             模块自动扫描与路由注册
│   ├── storage.js            JSON 文件读写
│   ├── notify.js             系统通知封装
│   └── web-ui.js             主页面 HTML 渲染（含导航栏 + 停止按钮）
│
├── modules/                  功能模块（每个独立子目录）
│   ├── calendar/             日程管理
│   │   ├── api.js            后端 API (增删查)
│   │   ├── engine.js         提醒引擎 (轮询 + 通知)
│   │   └── page.html         前端页面
│   │
│   ├── file-browser/         文档管理
│   │   ├── api.js            后端 API (文件列表/打开/定位)
│   │   └── page.html         前端页面
│   │
│   └── repo-browser/         代码管理
│       ├── api.js            GitHub API 封装 (tree/content/commits/compare)
│       └── page.html         前端页面 (双栏布局)
│
├── data/                     运行时数据
│   └── schedules.json        日程持久化
│
└── node_modules/             npm 依赖
```

---

## 核心概念：模块化

**加新功能 = 新建一个文件夹**

```
modules/<模块名>/
├── api.js        # 后端 API（路由注册）
└── page.html     # 前端页面（自动出现在导航栏）
```

### api.js 规范

```js
const label = '📌 我的功能';  // 导航栏显示的名称

function register(app, basePath) {
  // basePath = /api/<模块名>
  app.get(basePath + '/data', (req, res) => { ... });
  app.post(basePath + '/data', (req, res) => { ... });
}

module.exports = { register, label };
```

### page.html 规范

标准 HTML 文件，可以使用 Pico CSS 类、fetch API 调用后端、任意 JavaScript。内容会被注入到主界面的右侧内容区。

---

## 配置

编辑 `config.json`：

```json
{
  "port": 8180,
  "docRoot": ".",
  "githubToken": ""
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `port` | HTTP 服务端口 | `8180` |
| `docRoot` | 文档管理读取的根目录 | `.`（项目目录） |
| `githubToken` | GitHub 个人访问令牌（提 API 限流到 5000次/小时） | `""`（匿名限流 60次/小时） |

> ⚠️ `config.json` 已在 `.gitignore` 中，不会提交到 Git，防止 Token 泄露。

---

## 技术栈

| 层 | 选型 |
|------|------|
| 运行时 | Node.js v26.3.0 |
| Web 框架 | Express |
| 系统通知 | node-notifier |
| GitHub API | Node.js 内置 https 模块（零额外依赖） |
| 前端样式 | Pico CSS（CDN 零构建） |
| 前端逻辑 | 原生 JavaScript |
| 数据存储 | JSON 文件 |

---

## 未来规划

- **repo-analyzer** — 读取本地 Git 仓库代码，基于用户手写的模板文档生成/更新概括性 Word 文档
- **github-watcher** — 监控 GitHub PR 合入，分析 diff，增量更新概括文档并归档旧版
- 更多工具模块持续加入…

---

## 开发

```bash
# 安装依赖
npm install

# 启动（开发，看控制台日志）
node server.js

# 启动（日常，无黑框自动隐藏）
双击 start.bat

# 停止
浏览器左侧导航栏 → ⏻ 停止服务
```
