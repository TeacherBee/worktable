const express = require('express');
const path = require('path');
const fs = require('fs');
const { registerModules } = require('./router');

/**
 * Create and configure the Express application.
 * @param {Object} config - Application configuration from config.json
 * @returns {Object} Express app instance
 */
function createServer(config) {
  const app = express();

  // ── 中间件 ──
  app.use(express.json());

  // ── 模块发现与路由注册 ──
  let navItems = [];
  try {
    navItems = registerModules(app);
    console.log(`[server] Registered ${navItems.length} modules:`, navItems.map((n) => n.label).join(', '));
  } catch (err) {
    console.error('[server] Module registration error:', err.message);
  }

  // ── 主页面 ──
  const { renderMainPage } = require('./web-ui');
  app.get('/', (req, res) => {
    res.send(renderMainPage(navItems));
  });

  // ── 模块前端页面 ──
  app.get('/app/:moduleName', (req, res) => {
    const safeName = path.basename(req.params.moduleName);
    const pagePath = path.join(__dirname, '..', 'modules', safeName, 'page.html');
    if (fs.existsSync(pagePath)) {
      res.sendFile(pagePath);
    } else {
      res.status(404).json({ error: 'Module page not found' });
    }
  });

  // ── 停止服务 ──
  app.post('/api/shutdown', (req, res) => {
    res.json({ success: true, message: '服务正在关闭…' });
    console.log('[server] Shutting down by user request...');
    setTimeout(() => {
      const srv = req.app.get('serverInstance');
      if (srv) srv.close();
      process.exit(0);
    }, 500);
  });

  // ── 全局错误处理 ──
  app.use((err, req, res, next) => {
    console.error('[server] Unhandled error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createServer };
