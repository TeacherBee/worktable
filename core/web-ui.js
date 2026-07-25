/**
 * Render the main application HTML page.
 * @param {Array} navItems - [{ name, label }] from module discovery
 * @returns {string} HTML content
 */
function renderMainPage(navItems) {
  const navLinks = navItems
    .map((item) => `      <a href="/app/${item.name}" class="nav-link" data-module="${item.name}">${item.label}</a>`)
    .join('\n');

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
      background: var(--pico-primary-background, #e9ecef);
      color: var(--pico-primary);
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
    /* ── 右侧主内容 ── */
    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      min-height: 100vh;
    }
    /* ── 模块页面加载动画 ── */
    .module-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: var(--pico-muted-color);
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
  </nav>

  <!-- 右侧内容区 -->
  <main class="main-content" id="contentArea">
    <article>
      <header><h2>👋 欢迎使用 Worktable</h2></header>
      <p>请从左侧导航栏选择一个功能开始使用。</p>
    </article>
  </main>

  <script>
    // ── 日期显示 ──
    function updateDate() {
      const now = new Date();
      const opts = { year: 'numeric', month: 'numeric', day: 'numeric' };
      document.getElementById('dateDisplay').textContent = now.toLocaleDateString('zh-CN', opts);
    }
    updateDate();

    // ── 导航点击：加载模块页面 ──
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        // 高亮当前
        document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
        link.classList.add('active');

        var url = link.getAttribute('href');
        var contentArea = document.getElementById('contentArea');

        // 显示加载中
        contentArea.innerHTML = '<div class="module-loading">加载中…</div>';

        // 用 fetch 获取模块 page.html 并注入
        fetch(url)
          .then(function(res) {
            if (!res.ok) throw new Error('页面加载失败');
            return res.text();
          })
          .then(function(html) {
            contentArea.innerHTML = html;
            // 执行 page.html 中的脚本
            var scripts = contentArea.querySelectorAll('script');
            scripts.forEach(function(oldScript) {
              var newScript = document.createElement('script');
              if (oldScript.src) {
                newScript.src = oldScript.src;
              } else {
                newScript.textContent = oldScript.textContent;
              }
              oldScript.parentNode.replaceChild(newScript, oldScript);
            });
          })
          .catch(function(err) {
            contentArea.innerHTML = '<article><header>⚠️ 错误</header><p>' + err.message + '</p></article>';
          });
      });
    });
  </script>
</body>
</html>`;
}

module.exports = { renderMainPage };
