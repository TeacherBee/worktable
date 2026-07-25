const https = require('https');
const fs = require('fs');
const path = require('path');

const label = '📂 代码';

// ── 读取 Token ──
let githubToken = '';
const configPath = path.join(__dirname, '..', '..', 'config.json');
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.githubToken) githubToken = config.githubToken;
} catch {}

// ── 已添加的仓库（内存） ──
let repos = [
  { id: '1', owner: 'TeacherBee', repo: 'worktable', label: 'TeacherBee/worktable' },
];
let nextId = 2;

// ── 内存缓存 ──
const treeCache = new Map(); // key: "owner/repo/branch"

// ══════════════════════════════════════════════════
//  GitHub API 调用封装
// ══════════════════════════════════════════════════

function githubAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'Worktable/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    if (githubToken) {
      options.headers['Authorization'] = `token ${githubToken}`;
    }

    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve(null);
          return;
        }
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(data.message || `HTTP ${res.statusCode}`));
          } else {
            resolve(data);
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${body.slice(0, 100)}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));
    req.end();
  });
}

// ══════════════════════════════════════════════════
//  路由注册
// ══════════════════════════════════════════════════

function register(app, basePath) {
  // ─── 仓库管理 ───

  // 获取仓库列表
  app.get(`${basePath}/repos`, (req, res) => {
    res.json(repos);
  });

  // 添加仓库
  app.post(`${basePath}/repos`, (req, res) => {
    const { url, label: customLabel } = req.body;
    if (!url) return res.status(400).json({ error: '请输入仓库 URL' });

    // 从 URL 解析 owner/repo
    const match = url.match(/github\.com[/:]([^/]+)\/([^/\s?#]+)/);
    if (!match) return res.status(400).json({ error: '无法解析 GitHub 仓库 URL' });

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const displayLabel = customLabel || `${owner}/${repo}`;

    // 去重
    const exists = repos.some((r) => r.owner === owner && r.repo === repo);
    if (exists) return res.status(409).json({ error: '该仓库已存在' });

    const newRepo = { id: String(nextId++), owner, repo, label: displayLabel };
    repos.push(newRepo);
    res.status(201).json(newRepo);
  });

  // 删除仓库
  app.delete(`${basePath}/repos/:id`, (req, res) => {
    const idx = repos.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '仓库未找到' });
    repos.splice(idx, 1);
    res.json({ success: true });
  });

  // ─── 仓库信息（获取默认分支） ───

  app.get(`${basePath}/repo`, (req, res) => {
    const { owner, repo } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: 'Missing owner/repo' });

    githubAPI(`/repos/${owner}/${repo}`)
      .then((data) => res.json({ defaultBranch: data.default_branch, description: data.description }))
      .catch((err) => res.status(502).json({ error: err.message }));
  });

  // ─── 文件树 ───

  app.get(`${basePath}/tree`, async (req, res) => {
    const { owner, repo, branch } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: 'Missing owner/repo' });

    const defaultBranch = branch || 'main';
    const cacheKey = `${owner}/${repo}/${defaultBranch}`;

    // 检查缓存
    if (treeCache.has(cacheKey)) {
      return res.json(treeCache.get(cacheKey));
    }

    try {
      // 先获取仓库信息确定默认分支
      const repoInfo = await githubAPI(`/repos/${owner}/${repo}`);
      const actualBranch = branch || repoInfo.default_branch || 'main';

      // 递归拉取文件树
      const treeData = await githubAPI(`/repos/${owner}/${repo}/git/trees/${actualBranch}?recursive=1`);

      const result = {
        branch: actualBranch,
        truncated: treeData.truncated || false,
        tree: treeData.tree || [],
        sha: treeData.sha,
      };

      // 缓存（只在非截断时缓存完整树）
      if (!result.truncated) {
        treeCache.set(cacheKey, result);
      }

      res.json(result);
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // ─── 文件内容（同时返回同级目录列表） ───

  app.get(`${basePath}/content`, async (req, res) => {
    const { owner, repo, path: filePath, branch } = req.query;
    if (!owner || !repo || !filePath) return res.status(400).json({ error: 'Missing owner/repo/path' });

    try {
      // 获取文件内容
      const ref = branch ? `?ref=${branch}` : '';
      const contentData = await githubAPI(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}${ref}`);

      // 获取同级目录列表（从文件路径取目录部分）
      const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
      let siblings = [];
      if (dir) {
        try {
          const dirData = await githubAPI(`/repos/${owner}/${repo}/contents/${encodeURIComponent(dir)}${ref}`);
          if (Array.isArray(dirData)) {
            siblings = dirData.map((item) => ({
              name: item.name,
              type: item.type,
              path: item.path,
            }));
          }
        } catch {
          // 获取同级文件列表失败不阻塞
        }
      }

      // 解码文件内容（base64 → utf-8）
      let content = '';
      if (contentData.content) {
        content = Buffer.from(contentData.content, 'base64').toString('utf-8');
      }

      res.json({
        name: contentData.name,
        path: contentData.path,
        size: contentData.size,
        encoding: 'text',
        content,
        siblings,
        htmlUrl: contentData.html_url,
      });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // ─── Commit 列表 ───

  app.get(`${basePath}/commits`, (req, res) => {
    const { owner, repo, page, branch } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: 'Missing owner/repo' });

    const perPage = 20;
    const pageNum = page || 1;
    const sha = branch ? `&sha=${branch}` : '';
    const url = `/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${pageNum}${sha}`;

    githubAPI(url)
      .then((data) => {
        const commits = Array.isArray(data) ? data.map((c) => ({
          sha: c.sha,
          shortSha: c.sha.slice(0, 7),
          author: c.commit?.author?.name || 'Unknown',
          date: c.commit?.author?.date || '',
          message: c.commit?.message?.split('\n')[0] || '',
        })) : [];
        res.json({ commits, page: pageNum, perPage });
      })
      .catch((err) => res.status(502).json({ error: err.message }));
  });

  // ─── Compare Diff ───

  app.get(`${basePath}/compare`, (req, res) => {
    const { owner, repo, base, head } = req.query;
    if (!owner || !repo || !base || !head) {
      return res.status(400).json({ error: 'Missing owner/repo/base/head' });
    }

    githubAPI(`/repos/${owner}/${repo}/compare/${base}...${head}`)
      .then((data) => {
        const files = (data.files || []).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch || '',
          rawUrl: f.raw_url,
        }));
        res.json({
          totalCommits: data.total_commits || 0,
          aheadBy: data.ahead_by || 0,
          behindBy: data.behind_by || 0,
          files,
        });
      })
      .catch((err) => res.status(502).json({ error: err.message }));
  });
}

module.exports = { register, label };
