const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const label = '📁 本地文档';

// 从 config.json 读取文档根目录
const configPath = path.join(__dirname, '..', '..', 'config.json');
let docRoot = '.';
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.docRoot) docRoot = config.docRoot;
} catch {}

/**
 * Resolve a safe absolute path within docRoot.
 */
function resolvePath(inputPath) {
  // If relative, resolve from docRoot; if absolute, use as-is but validate
  const base = path.resolve(docRoot);
  const target = inputPath
    ? path.resolve(base, inputPath)
    : base;

  // Ensure the resolved path is within docRoot (basic security)
  if (!target.startsWith(base)) {
    return null;
  }
  return target;
}

/**
 * Format file size in human-readable format.
 */
function formatSize(bytes) {
  if (bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

/**
 * Read directory contents.
 */
function readDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    try {
      const fullPath = path.join(dirPath, entry.name);
      const stat = fs.statSync(fullPath);
      items.push({
        name: entry.name,
        isDir: entry.isDirectory(),
        size: entry.isDirectory() ? 0 : stat.size,
        sizeFormatted: entry.isDirectory() ? '-' : formatSize(stat.size),
        modifiedAt: stat.mtime.toISOString().slice(0, 19).replace('T', ' '),
        ext: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
      });
    } catch {
      // Skip files we can't stat
    }
  }

  // Sort: directories first, then by name
  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  return items;
}

function register(app, basePath) {
  // ── 获取文件列表 ──
  app.get(`${basePath}/list`, (req, res) => {
    try {
      const targetPath = resolvePath(req.query.path || '');
      if (!targetPath) {
        return res.status(400).json({ error: '路径不合法' });
      }
      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: '指定目录不存在' });
      }
      if (!fs.statSync(targetPath).isDirectory()) {
        return res.status(400).json({ error: '指定路径不是目录' });
      }

      const items = readDirectory(targetPath);
      const currentDir = path.relative(path.resolve(docRoot), targetPath) || '.';

      res.json({
        currentDir: currentDir.replace(/\\/g, '/'),
        absolutePath: targetPath,
        parentDir: currentDir === '.' ? null : path.dirname(currentDir).replace(/\\/g, '/'),
        items: items,
        docRoot: path.resolve(docRoot),
      });
    } catch (err) {
      res.status(500).json({ error: '读取目录失败：' + err.message });
    }
  });

  // ── 用系统默认程序打开文件 ──
  app.get(`${basePath}/open`, (req, res) => {
    try {
      const targetPath = resolvePath(req.query.path);
      if (!targetPath || !fs.existsSync(targetPath)) {
        return res.status(404).json({ error: '文件未找到' });
      }
      // Windows: use start, macOS: open, Linux: xdg-open
      const cmd = process.platform === 'win32'
        ? `start "" "${targetPath}"`
        : process.platform === 'darwin'
          ? `open "${targetPath}"`
          : `xdg-open "${targetPath}"`;
      execSync(cmd);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '打开文件失败：' + err.message });
    }
  });

  // ── 在资源管理器中显示 ──
  app.post(`${basePath}/reveal`, (req, res) => {
    try {
      const targetPath = resolvePath(req.body.path);
      if (!targetPath || !fs.existsSync(targetPath)) {
        return res.status(404).json({ error: '路径未找到' });
      }
      if (process.platform === 'win32') {
        execSync(`explorer /select,"${targetPath}"`);
      } else if (process.platform === 'darwin') {
        execSync(`open -R "${targetPath}"`);
      } else {
        execSync(`xdg-open "${path.dirname(targetPath)}"`);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '操作失败：' + err.message });
    }
  });
}

module.exports = { register, label };
