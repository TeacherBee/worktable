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

  // ── 模块前端页面（整页加载，含侧边栏） ──
  app.get('/app/:moduleName', (req, res) => {
    const safeName = path.basename(req.params.moduleName);
    const pagePath = path.join(__dirname, '..', 'modules', safeName, 'page.html');
    if (fs.existsSync(pagePath)) {
      const fullHtml = fs.readFileSync(pagePath, 'utf-8');
      // 判断格式：有 <body> 标签的完整 HTML，还是纯内容片段
      const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let moduleContent;
      if (bodyMatch) {
        // 完整 HTML 格式：提取 head 中的 <style> + <body> 内内容
        const styleTags = [];
        const styleRe = /<style[^>]*>[\s\S]*?<\/style>/gi;
        let m;
        while ((m = styleRe.exec(fullHtml)) !== null) styleTags.push(m[0]);
        moduleContent = styleTags.join('\n') + '\n' + bodyMatch[1].trim();
      } else {
        // 片段格式：直接作为内容（无 html/head/body 包裹）
        moduleContent = fullHtml;
      }
      res.send(renderMainPage(navItems, safeName, moduleContent));
    } else {
      res.redirect('/');
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
