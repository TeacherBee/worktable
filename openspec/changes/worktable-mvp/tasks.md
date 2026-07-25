## 1. 项目初始化

- [x] 1.1 创建项目目录结构（core/、modules/、data/）
- [x] 1.2 初始化 package.json，安装依赖（express、node-notifier）
- [x] 1.3 创建 config.json 配置文件（含文档目录路径等配置项）
- [x] 1.4 创建 data/schedules.json 初始空数据文件

## 2. 核心框架（core-framework）

- [x] 2.1 实现 core/server.js — 创建 Express 实例，配置中间件（JSON 解析、静态文件、错误处理），在指定端口启动
- [x] 2.2 实现 core/router.js — 扫描 modules/ 目录，自动加载每个模块的 api.js 并注册路由到 /api/<模块名> 前缀下
- [x] 2.3 实现 core/storage.js — JSON 文件的读写封装（读/写特定 key 的数据），提供简单的类 DB 接口
- [x] 2.4 实现 core/notify.js — 封装 node-notifier，提供统一的系统通知调用接口
- [x] 2.5 实现 core/web-ui.js — 提供主页面 HTML 渲染，包含左侧导航栏和右侧内容区框架；提供模块 page.html 的动态加载接口
- [x] 2.6 实现 server.js 入口 — 整合 core 各模块，启动服务，输出启动信息

## 3. 日历模块（calendar）

- [x] 3.1 实现日历 API（modules/calendar/api.js）：
  - GET /api/calendar/schedules — 获取所有日程
  - POST /api/calendar/schedules — 添加日程
  - DELETE /api/calendar/schedules/:id — 删除日程
- [x] 3.2 实现提醒引擎（modules/calendar/engine.js）— 每 30 秒轮询即将到来的日程，触发系统通知（含去重逻辑）
- [x] 3.3 实现日历前端页面（modules/calendar/page.html）：
  - 月视图日历组件（原生 JavaScript 渲染，支持月份切换）
  - 添加/删除日程的交互界面
  - 当日日程列表展示
  - 带日程标记的日期视觉高亮
- [x] 3.4 在主框架导航栏中注册日历模块

## 4. 文件管理模块（file-browser）

- [x] 4.1 实现文件浏览 API（modules/file-browser/api.js）：
  - GET /api/files/list — 读取当前目录文件列表
  - GET /api/files/list?path=xxx — 读取子目录
  - GET /api/files/open?path=xxx — 用系统默认程序打开文件
  - POST /api/files/reveal — 在资源管理器中显示文件/文件夹
- [x] 4.2 实现文件浏览前端页面（modules/file-browser/page.html）：
  - 文件列表表格展示（名称、大小、类型、修改日期）
  - 目录导航（进入子目录、返回上级）
  - 点击文件打开、点击"显示在文件夹中"按钮
  - 当前路径面包屑导航

## 5. 启动脚本与收尾

- [x] 5.1 创建 start.bat — 启动 Node.js 服务，自动打开浏览器到 http://localhost:8180
- [x] 5.2 全局测试：验证所有模块加载正确、API 正常响应、前端页面渲染正常
- [x] 5.3 验证日历提醒引擎：添加一个 2 分钟后的测试日程，确认到期弹出系统通知
- [x] 5.4 验证文件浏览可正确读取和导航目录
