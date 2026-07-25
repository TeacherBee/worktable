/**
 * Worktable — 本地工具台入口
 *
 * 双击 start.bat 启动，或:
 *   node server.js
 */

const path = require('path');
const fs = require('fs');

// 读取配置
const configPath = path.join(__dirname, 'config.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch {
  console.error('[worktable] Failed to read config.json');
  process.exit(1);
}

const { createServer } = require('./core/server');

const port = config.port || 8180;
const app = createServer(config);

const server = app.listen(port, () => {
  console.log(`\n  ◐ Worktable running at http://localhost:${port}\n`);
});

// 把 server 实例存到 app 上，/api/shutdown 路由能调用 server.close()
app.set('serverInstance', server);
