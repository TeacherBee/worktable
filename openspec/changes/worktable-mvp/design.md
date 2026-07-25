## Context

构建一个本地运行的轻量工具台（Worktable），通过浏览器作为 UI 层，Node.js 作为后台服务。用户双击启动脚本即可运行，无需复杂配置。

当前项目目录 `worktable/` 是全新的，无遗留代码或历史包袱。用户拥有 Node.js v26.3.0 环境。

核心挑战：如何在保持极简启动体验的前提下，建立足够灵活的模块化架构，支撑后续持续扩展（仓库分析、GitHub 监控等）。

## Goals / Non-Goals

**Goals:**
- 提供一键启动体验（双击 start.bat → 服务跑起来 → 浏览器自动打开）
- 实现日程管理（月视图日历 + 增删日程 + 15 分钟前系统通知）
- 实现文档管理（读取本地目录文件列表并展示）
- 建立模块化架构，新功能 = 在 modules/ 下新建一个文件夹即可
- 前端美观可用，零构建步骤

**Non-Goals:**
- 不处理用户认证 / 多用户（单机本地工具）
- 不做跨平台分发打包（当前仅 Windows）
- 不引入数据库（JSON 文件存储已满足需求）
- 不做前端构建工具链（Webpack / Vite 等暂不需要）
- 不包括仓库分析 / GitHub 监控（后续阶段实现）

## Decisions

### 1. Web 框架：Express（内置，不用 Koa/Fastify）

- **理由**：Express 是 Node.js 最成熟的 Web 框架，生态系统丰富，中间件选择多。对于这个规模的项目，Express 的简单直接是优势而非不足。Koa 需要额外学习其中间件模型，Fastify 的性能优势在此场景不显著。
- **替代方案**：Koa（更现代但生态略弱）、Fastify（更快但社区较小）

### 2. 模块加载机制：基于文件约定的手动注册

```
modules/<name>/
├── api.js      # 导出 { route, register() } 自动挂载到 /api/<name>/*
└── page.html   # 前端页面，通过 /app/<name> 访问
```

- **理由**：每个模块的 `api.js` 负责注册自己的路由，`core/router.js` 在启动时遍历 `modules/` 目录自动加载。不需要动态 import、不需要插件系统，够用且直观。
- **替代方案**：Webpack 动态打包（太重）、npm link 插件体系（过度设计）

### 3. 前端方案：Pico CSS + 原生 JavaScript

- **理由**：Pico CSS 是一个极简 CSS 框架，只需写标准 HTML 语义标签即可获得美观的样式。零构建步骤，CDN 引入。配合原生 JS 做 API 交互，无需 npm 构建流程。
- **替代方案**：Vue（需要构建工具）、Alpine.js（轻量但需学习其语法）、纯手写 CSS（维护成本高）

### 4. 数据存储：JSON 文件

- **理由**：日程数据量小（个人使用），JSON 文件读写简单，人类可读可编辑。无需安装数据库。未来如有复杂查询需求可升级为 SQLite。
- **替代方案**：SQLite（需要 better-sqlite3 编译）、lowdb（JSON DB 封装）

### 5. 系统通知：node-notifier

- **理由**：`node-notifier` 是 Node.js 生态中最成熟的原生通知库，支持 Windows Toast、macOS Notification Center、Linux notify-send。即使浏览器标签关闭，服务端依然可以触发通知。
- **替代方案**：浏览器 Notification API（需要页面打开）、electron-notify（依赖 Electron）

### 6. 路由架构：纯后端 API + 前端 SPA 风格

```
GET  /               → 渲染主页面
GET  /app/<module>   → 加载模块前端页面（iframe 或内容区替换）
GET  /api/<module>/* → JSON API
```

- **理由**：前后端通过 JSON API 通信，前端页面以独立 HTML 文件形式存在于每个模块中，主框架通过导航切换显示不同模块页面。这种模式对新增模块最友好——不需要改路由配置。
- **替代方案**：服务端模板渲染（EJS/Pug）—— 模块化和灵活性不如独立 HTML

### 7. 端口号：8180

- **理由**：避免与常见端口（3000、8080、8000）冲突，简短易记

### 8. 提醒引擎：轮询 + 去重

- **理由**：后端每 30 秒检查一次即将到来的日程，发现日程进入 15 分钟窗口且未被通知过，触发系统通知。简单可靠，无需定时任务调度器。
- **替代方案**：node-cron（固定时间触发，不适合"相对时间"）、setTimeout（服务重启后丢失）

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Worktable 系统架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  server.js  (入口)                                           │
│    │                                                        │
│    ├── core/                                                 │
│    │   ├── server.js     ← Express 实例 + 启动                │
│    │   ├── router.js     ← 模块发现 + 路由注册                 │
│    │   ├── storage.js    ← JSON 文件读写                      │
│    │   ├── notify.js     ← 系统通知封装                       │
│    │   └── web-ui.js     ← 前端静态服务 + 主页面渲染           │
│    │                                                        │
│    ├── modules/                                              │
│    │   ├── calendar/                                         │
│    │   │   ├── api.js       ← /api/calendar/*               │
│    │   │   ├── engine.js    ← 轮询 + 提醒触发                 │
│    │   │   └── page.html    ← 前端页面                       │
│    │   │                                                     │
│    │   └── file-browser/                                     │
│    │       ├── api.js       ← /api/files/*                  │
│    │       └── page.html    ← 前端页面                       │
│    │                                                        │
│    ├── data/                                                 │
│    │   └── schedules.json  ← 日程数据                         │
│    │                                                        │
│    ├── config.json         ← 用户配置（如文档目录路径）          │
│    ├── package.json                                          │
│    └── start.bat           ← 一键启动                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据流：日程提醒

```
calendar/engine.js (轮询每30s)
       │
       ▼
  检查 schedules.json → 有没有日程在 15 分钟窗口内？
       │
       ├── 有且未通知过 → core/notify.js → Windows 弹窗
       │                    标记已通知（防重复）
       │
       └── 没有 → 继续等待下一轮
```

### 数据流：文件浏览

```
浏览器点击 "文件管理" 模块
       │
       ▼
  GET /api/files/list
       │
       ▼
  file-browser/api.js → fs.readdir + fs.stat
       │
       ▼
  返回 JSON: [{name, size, isDir, modifiedAt}]
       │
       ▼
  前端渲染为文件列表表格
```

## Frontend Design

### 主题与视觉风格

- **配色**：浅色/深色自适应（跟随系统），柔和中性色调
- **排版**：系统字体栈，良好的行距和间距
- **布局**：左侧导航栏 + 右侧主内容区

```
┌─────────────────────────────────────────────────────┐
│  ◐ Worktable                               2026/7/25│
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  📅 日程 │    (模块内容区域)                          │
│  📁 文档 │                                          │
│          │   每个模块的 page.html 渲染在此            │
│          │                                          │
│          │                                          │
│          │                                          │
│  ⚙️ 设置 │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 导航切换机制

- 左侧导航栏固定，点击切换右侧内容区
- 每个模块的 `page.html` 通过 fetch 获取，注入到内容区容器中
- 模块页面内的 `<script>` 标签自动执行（使用 `eval` 或动态创建 script 元素）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| JSON 文件并发写入冲突 | 写操作用 `fs.writeFileSync` 简单序列化，个人使用场景无并发 |
| 日程提醒引擎在服务重启后丢失"已通知"标记 | 已通知标记持久化到 JSON 中，重启后不会重复通知 |
| 前端 `<script>` 注入执行的安全性（page.html 内容注入） | page.html 来自本地模块文件，非用户输入，无 XSS 风险 |
| node-notifier 在 Windows 上的兼容性 | node-notifier 已成熟，Windows Toast 支持良好 |
| Pico CSS 对复杂 UI 支持不足 | MVP 阶段的 UI 复杂度低，Pico CSS 完全够用；后续可替换 |

## Open Questions

- 配置文件 config.json 的初始内容：文档目录是否默认为项目根目录？后续是否支持多个目录？
- start.bat 是否需要以管理员权限运行？当前预计不需要，普通用户权限即可监听 8180 端口
