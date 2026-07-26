# Worktable — 本地工具台

一站式本地多功能工具台，集成日程管理、文档管理、代码仓库与 AI 文档摘要功能。

## 项目定位

Worktable 是一款轻量级本地 Web 应用，无需联网（除 AI 摘要与 GitHub API 外）即可在浏览器中管理日程、浏览本地文档、浏览 GitHub 仓库，并利用 DeepSeek API 对仓库文档进行智能摘要。所有数据存储在本地 JSON 文件中，适合个人日常效率工具使用。

## 核心功能

- **📅 日程管理**  
  支持添加、编辑、删除日程，并自动在事件前 15 分钟发送系统通知。

- **📁 本地文档浏览**  
  浏览指定目录下的文件和文件夹，支持打开文件（通过系统默认程序）与复制路径。

- **📂 代码仓库浏览**  
  通过 GitHub API 列出指定组织/用户的公开仓库，并跳转到仓库链接。

- **📋 仓库文档摘要**  
  将 GitHub 仓库中的 Markdown 文档（如 README、设计文档）抓取到本地，并通过 DeepSeek API 生成中文摘要并存档。

## 项目结构

```
├── config.json                # 全局配置文件（端口、文档根目录、API 密钥等）
├── package.json               # Node.js 依赖与脚本
├── package-lock.json          # 依赖锁定文件
├── server.js                  # 入口文件：读取配置，启动 Express 服务
├── start.bat                  # 双击启动脚本
├── README.md                  # 项目说明文档
├── gen-init-doc.js            # 辅助脚本：生成初始文档摘要（可选）
├── core/                      # 核心模块
│   ├── server.js              # 创建 Express 应用，挂载中间件与路由
│   ├── router.js              # 自动扫描 modules/ 目录，注册每个模块的 API 路由
│   ├── storage.js             # 读写 data/ 目录下的 JSON 文件（简易持久化）
│   ├── notify.js              # 使用 node-notifier 发送系统通知
│   └── web-ui.js              # 静态资源服务及主页面路由
├── modules/                   # 功能模块目录
│   ├── calendar/              # 日程管理模块
│   │   ├── api.js             # API 路由：CRUD 操作（GET/POST/PUT/DELETE）
│   │   ├── engine.js          # 后台引擎：每 30 秒检查临近日程，触发提醒
│   │   └── page.html          # 前端页面：日历视图与日程列表
│   ├── doc-summary/           # 文档摘要模块
│   │   ├── api.js             # API 路由：抓取仓库文档、请求 DeepSeek 摘要、存储结果
│   │   ├── deepseek.js        # DeepSeek API 客户端（基于 Node.js https）
│   │   └── page.html          # 前端页面：仓库列表、摘要展示
│   ├── file-browser/          # 本地文档浏览模块
│   │   ├── api.js             # API 路由：列出目录、获取文件详情、打开文件
│   │   └── page.html          # 前端页面：文件树与操作按钮
│   └── repo-browser/          # 代码仓库浏览模块
│       ├── api.js             # API 路由：通过 GitHub API 列出仓库
│       └── page.html          # 前端页面：仓库卡片列表
└── data/                      # (运行时自动创建) 存储 JSON 数据文件
    ├── schedules.json         # 日程数据
    ├── docs/                  # 缓存抓取的原始文档
    └── summaries.json         # 文档摘要记录
```

**处理流程**：  
1. `server.js` 读取 `config.json`，调用 `core/server.js` 的 `createServer(config)` 启动 Express 应用。  
2. `core/server.js` 注册中间件（JSON 解析、静态文件服务），调用 `core/router.js` 的 `registerModules(app)` 扫描 `modules/` 目录。  
3. `router.js` 遍历每个模块目录，加载 `api.js` 并将路由挂载到 Express，同时收集含有 `page.html` 的模块生成导航栏数据。  
4. 浏览器访问主页面时，`web-ui.js` 返回包含导航栏的 HTML，用户点击模块后加载对应的 `page.html`，再通过 API 与后端交互。  
5. 各模块 API 使用 `core/storage.js` 读写 `data/` 下的 JSON 文件，`calendar/engine.js` 定时检查日程并调用 `core/notify.js` 发送通知。

## 技术栈

| 类别         | 技术                                                   |
|--------------|--------------------------------------------------------|
| 运行时       | Node.js (>=14)                                         |
| 后端框架     | Express                                                |
| 前端         | 原生 HTML + CSS + JavaScript (无框架)                  |
| 存储         | 本地 JSON 文件 (通过 `core/storage.js` 读写)          |
| 系统通知     | node-notifier                                          |
| API 调用     | DeepSeek Chat API (通过 https 模块)、GitHub REST API  |
| 依赖管理     | npm / package.json                                     |

## 配置说明

文件：`config.json`

```json
{
  "port": 8180,                  // 服务监听端口，默认 8180
  "docRoot": "C:/Documents",    // 本地文档浏览根目录（使用绝对路径）
  "githubToken": "ghp_xxx",     // GitHub Personal Access Token（用于 repo-browser 模块）
  "deepseekApiKey": "sk-xxx"    // DeepSeek API Key（用于 doc-summary 模块）
}
```

- `port`：服务启动端口，默认 8180。
- `docRoot`：`file-browser` 模块浏览的本地目录，需填写有效绝对路径。
- `githubToken`：访问 GitHub API 的令牌，需具有 `repo` 或 `public_repo` 权限。
- `deepseekApiKey`：调用 DeepSeek Chat API 的密钥。

## 快速开始

1. **克隆或下载项目**  
   ```bash
   git clone <repo-url>
   cd worktable
   ```

2. **安装依赖**  
   ```bash
   npm install
   ```

3. **配置`config.json`**  
   编辑 `config.json`，填写必要的 `docRoot`、`githubToken`、`deepseekApiKey`（至少填写 `docRoot`，其他模块按需配置）。

4. **启动服务**  
   - **方式一（推荐）**：双击 `start.bat`  
   - **方式二**：在终端执行  
     ```bash
     node server.js
     ```

5. **访问应用**  
   打开浏览器，访问 `http://localhost:8180`（端口与 config.json 一致）。  
   页面顶部导航栏显示所有模块，点击即可使用。

6. **（可选）生成初始文档摘要**  
   运行 `node gen-init-doc.js` 可批量抓取指定仓库的文档并请求 DeepSeek 摘要。