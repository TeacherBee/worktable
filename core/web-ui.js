/**
 * Render the main application HTML page.
 * @param {Array} navItems - [{ name, label }] from module discovery
 * @param {string|null} [activeModuleName] - currently active module name for nav highlighting
 * @param {string|null} [moduleContent] - pre-rendered module HTML + inline scripts
 * @returns {string} HTML content
 */
function renderMainPage(navItems, activeModuleName, moduleContent) {
  const navLinks = navItems
    .map((item) => {
      const active = item.name === activeModuleName ? ' active' : '';
      return `      <a href="/app/${item.name}" class="nav-link${active}" data-module="${item.name}">${item.label}</a>`;
    })
    .join('\n');

  const mainContent = moduleContent || `    <article>
      <header><h2>👋 欢迎使用 Worktable</h2></header>
      <p>请从左侧导航栏选择一个功能开始使用。</p>
    </article>`;

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Worktable</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    :root {
      --nav-width: 200px;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
    }
    /* ── 左侧导航 ── */
    .sidebar {
      width: var(--nav-width);
      min-height: 100vh;
      background: var(--pico-card-background-color, #f8f9fa);
      border-right: 1px solid var(--pico-muted-border-color, #dee2e6);
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar .brand {
      padding: 0.5rem 1.25rem;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-bottom: 1rem;
      color: var(--pico-primary);
    }
    .sidebar .nav-link {
      display: block;
      padding: 0.5rem 1.25rem;
      color: var(--pico-color);
      text-decoration: none;
      font-size: 0.95rem;
      border-radius: 0;
      transition: background 0.15s;
    }
    .sidebar .nav-link:hover {
      background: var(--pico-primary-hover-background, #e9ecef);
      color: var(--pico-primary);
    }
    .sidebar .nav-link.active {
      background: var(--pico-primary);
      color: #fff;
      font-weight: 500;
    }
    .sidebar .spacer {
      flex: 1;
    }
    .sidebar .footer {
      padding: 0.5rem 1.25rem;
      font-size: 0.8rem;
      color: var(--pico-muted-color);
    }
    .sidebar .shutdown-link {
      display: block;
      padding: 0.4rem 1.25rem;
      font-size: 0.82rem;
      color: var(--pico-del-color, #d73a49);
      text-decoration: none;
      cursor: pointer;
      border-top: 1px solid var(--pico-muted-border-color, #eee);
      transition: background 0.15s;
    }
    .sidebar .shutdown-link:hover {
      background: var(--pico-del-color, #d73a49);
      color: #fff;
    }
    /* ── 右侧主内容 ── */
    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      min-height: 100vh;
    }
    /* ── 深色模式 ── */
    @media (prefers-color-scheme: dark) {
      .sidebar {
        background: var(--pico-card-background-color, #1a1a2e);
      }
    }
  </style>
</head>
<body>
  <!-- 左侧导航 -->
  <nav class="sidebar">
    <div class="brand">◐ Worktable</div>
${navLinks}
    <div class="spacer"></div>
    <div class="footer" id="dateDisplay"></div>
    <a id="shutdownBtn" class="shutdown-link">⏻ 停止服务</a>
  </nav>

  <!-- 右侧内容区 -->
  <main class="main-content" id="contentArea">
${mainContent}
  </main>

  <script>
    // ── 日期显示 ──
    function updateDate() {
      var now = new Date();
      var opts = { year: 'numeric', month: 'numeric', day: 'numeric' };
      document.getElementById('dateDisplay').textContent = now.toLocaleDateString('zh-CN', opts);
    }
    updateDate();

    // ── 停止服务 ──
    document.getElementById('shutdownBtn').addEventListener('click', function(e) {
      e.preventDefault();
      if (!confirm('确定要停止 Worktable 服务吗？')) return;
      fetch('/api/shutdown', { method: 'POST' })
        .then(function() {
          document.body.innerHTML = '<article style="max-width:400px;margin:4rem auto;text-align:center;">'
            + '<h2>⏻ 服务已关闭</h2>'
            + '<p>你可以关闭此标签页了。</p>'
            + '</article>';
        })
        .catch(function() {
          document.body.innerHTML = '<article style="max-width:400px;margin:4rem auto;text-align:center;">'
            + '<h2>⏻ 服务已关闭</h2>'
            + '<p>你可以关闭此标签页了。</p>'
            + '</article>';
        });
    });
  </script>
</body>
</html>`;
}

module.exports = { renderMainPage };
