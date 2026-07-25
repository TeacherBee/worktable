## ADDED Requirements

### Requirement: HTTP 服务启动

系统 SHALL 通过 Express 在本地端口启动 HTTP 服务，默认端口为 8180。

#### Scenario: 服务启动成功

- **WHEN** 运行 `node server.js`
- **THEN** 服务在端口 8180 启动成功，控制台输出 `Worktable running at http://localhost:8180`

#### Scenario: 端口被占用

- **WHEN** 端口 8180 已被其他程序占用
- **THEN** 服务启动失败并输出清晰的错误提示

### Requirement: 一键启动脚本

系统 SHALL 提供 `start.bat` 脚本，双击即可启动服务并自动打开浏览器。

#### Scenario: 双击启动

- **WHEN** 用户双击 `start.bat`
- **THEN** 启动 Node.js 服务，并自动用默认浏览器打开 `http://localhost:8180`

### Requirement: 模块自动发现与注册

系统 SHALL 在启动时自动扫描 `modules/` 目录，加载每个子目录中的 `api.js` 并注册其路由。

#### Scenario: 自动加载模块

- **WHEN** 服务启动
- **THEN** 遍历 `modules/` 下所有子目录，找到含 `api.js` 的模块并注册其 API 路由

#### Scenario: 新增模块无需改代码

- **WHEN** 用户在 `modules/` 下新建目录并放入 `api.js` + `page.html`
- **THEN** 重启服务后新模块自动生效，无需修改任何配置文件

### Requirement: 前端主页面框架

系统 SHALL 提供主页面，包含左侧导航栏和右侧内容区。

#### Scenario: 访问首页

- **WHEN** 浏览器访问 `http://localhost:8180`
- **THEN** 返回美观的主页面，左侧显示所有已注册模块的导航链接，右侧为内容展示区

#### Scenario: 导航切换模块

- **WHEN** 用户点击左侧导航栏中的模块名称
- **THEN** 右侧内容区加载对应模块的 `page.html` 并执行其中的脚本

### Requirement: 配置管理

系统 SHALL 从项目根目录的 `config.json` 读取配置（如文档目录路径）。

#### Scenario: 读取配置

- **WHEN** 服务启动
- **THEN** 读取 `config.json` 中的配置项，模块可通过 API 获取配置

### Requirement: 错误处理

系统 SHALL 对 API 错误返回统一的 JSON 错误格式 `{ error: string }`，HTTP 状态码符合 REST 惯例。

#### Scenario: API 请求出错

- **WHEN** API 请求发生错误
- **THEN** 返回 `{ "error": "描述信息" }` 和对应的 HTTP 状态码（4xx/5xx）
