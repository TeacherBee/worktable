const { deepseekChat } = require('./deepseek');
const { readJSON, writeJSON } = require('../../core/storage');
const path = require('path');
const fs = require('fs');
const http = require('http');

const label = '📋 仓库文档';

const DOCS_DIR = path.join(__dirname, '..', '..', 'data', 'docs');
const META_FILE = 'docs.json';

// ══════════════════════════════════════════════════
//  工具函数
// ══════════════════════════════════════════════════

function metaPath() {
  return path.join(DOCS_DIR, '..', META_FILE);
}

function readMeta() {
  const data = readJSON(META_FILE);
  if (!data) return { docs: [] };
  return data;
}

function writeMeta(meta) {
  writeJSON(META_FILE, meta);
}

function shortSha(sha) {
  return sha ? sha.slice(0, 7) : '';
}

function nextId(meta) {
  const maxId = meta.docs.reduce((max, d) => Math.max(max, parseInt(d.id) || 0), 0);
  return String(maxId + 1);
}

function fetchCompare(port, owner, repo, base, head) {
  return new Promise((resolve, reject) => {
    const url = `/api/repo-browser/compare?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`;
    const options = {
      hostname: '127.0.0.1',
      port,
      path: url,
      method: 'GET',
    };
    const req = http.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) return reject(new Error(data.error || `HTTP ${res.statusCode}`));
          resolve(data);
        } catch { reject(new Error('解析 repo-browser 响应失败')); }
      });
    });
    req.on('error', (err) => reject(new Error(`无法获取代码差异: ${err.message}`)));
    req.end();
  });
}

function getPort() {
  const configPath = path.join(__dirname, '..', '..', 'config.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.port || 8180;
  } catch { return 8180; }
}

// ══════════════════════════════════════════════════
//  改进的提示词（含 few-shot 示例）
// ══════════════════════════════════════════════════

const SYSTEM_PROMPT_ANALYZE = `你是一个代码变更分析专家。你的任务是根据代码 Diff 分析代码变更，输出结构化的修改要点。

每个修改点包含：
- type: "新增" | "修改" | "删除"
- file: 文件路径
- summary: 一句话概括变更
- details: 详细说明变更内容（2-4句话）
- docImpact: 这个变更对项目概括文档的影响说明

参考示例输出：
{
  "changePoints": [
    {
      "type": "新增",
      "file": "modules/repo-browser/api.js",
      "summary": "新增 GitHub API 封装，支持 tree/content/commits/compare 四个接口",
      "details": "通过 Node.js https 模块封装了 GitHub REST API 调用，实现了递归文件树拉取、文件内容获取（base64 解码）、commit 历史分页、commit 对比四个核心功能。支持 Token 认证提升 API 限流额度。",
      "docImpact": "需要在「项目结构」中新增 repo-browser 模块说明，在「核心功能」中新增代码管理章节"
    },
    {
      "type": "修改",
      "file": "config.json",
      "summary": "新增 githubToken 配置项",
      "details": "在配置文件中增加了 githubToken 字段，用于 GitHub API 认证，提升 API 限流至 5000 次/小时。",
      "docImpact": "需要在「配置说明」中新增 githubToken 字段"
    },
    {
      "type": "删除",
      "file": "modules/old-feature/api.js",
      "summary": "移除旧版功能模块",
      "details": "该模块已被新模块替代，所有功能已迁移至 modules/replacement/。",
      "docImpact": "需要从「项目结构」中移除该模块条目"
    }
  ]
}

注意：
- 只关注对项目架构、功能、配置有实质影响的变更
- 忽略纯格式调整、注释变更、空白字符变更
- 每个变更点的 docImpact 必须具体说明需要更新文档的哪个部分
- 如果无显著变更，返回 { "changePoints": [] }
- 必须输出合法的 JSON 对象`;

const SYSTEM_PROMPT_OUTLINE = `你是一个技术文档架构师。你的任务是根据现有文档和变更要点，生成一份新版本文档的大纲。

大纲的作用是规划新文档的结构。你需要：
1. 阅读现有文档，识别其章节结构
2. 根据变更要点，决定哪些章节需要修改、新增或删除
3. 输出结构化的 Markdown 大纲

每一章用 "###" 标题，并标注状态：

- **[不变]**：内容保持不变
- **[更新]**：需要修改内容
- **[新增]**：全新章节
- **[删除]**：从文档中移除

示例输出大纲：

### 项目定位 [不变]
（概述部分保持不变）

### 核心功能 [更新]
- 保留：日程管理、文档管理
- 新增添加：代码管理（GitHub 仓库文件树、Commit 列表、Diff 对比）
- 排序调整：按重要性重新排列功能列表

### 项目结构 [更新]
- 新增模块：repo-browser/（api.js + page.html）
- 配置项新增：githubToken（可选）
- 移除模块：old-feature/

### 技术栈 [更新]
- 新增：GitHub REST API（零依赖 https 模块）

### 配置说明 [更新]
- 新增：githubToken 字段

注意：大纲要全面，但不需要展开详细内容。每个章节 2-5 句话说明即可。直接输出大纲，不要额外说明。`;

const SYSTEM_PROMPT_GENERATE = `你是一个技术文档作者。你的任务是根据现有文档、大纲和变更要点，生成一份更新后的完整文档。

要求：
1. 遵循大纲的结构组织文档
2. 保留原有文档中不需要修改的部分
3. 根据变更要点更新相关章节内容
4. 保持文档风格一致、语言流畅
5. 输出完整的 Markdown 文档

文档风格参考示例：

# Worktable 项目概览

## 项目定位
一个本地 Web 工具台，基于 Node.js + Express 构建，通过浏览器访问。采用模块化设计，每个功能独立成模块，即插即用。

## 核心功能

### 📅 日程管理
- 月视图日历：切换月份、查看日期
- 添加/删除日程：填写标题、日期、时间即可添加
- 定时提醒：到期自动弹系统通知（即使浏览器关闭）

### 📁 文档管理
- 文件列表：展示文件名、大小、修改日期
- 目录导航：点击进入子目录，面包屑返回

## 项目结构

\`\`\`
worktable/
├── server.js
│   └── 功能：入口文件，启动 HTTP 服务
│   └── 流程：读取 config.json → createServer() → listen()
├── core/
│   ├── server.js
│   │   └── 功能：创建 Express 实例，注册中间件
│   │   └── 流程：express() → json() → registerModules() → ...
│   ├── router.js
│   │   └── 功能：自动扫描 modules/ 目录，注册模块路由
│   └── storage.js
│       └── 功能：JSON 文件读写
│
├── modules/
│   └── calendar/
│       ├── api.js
│       │   └── 功能：日程增删查 API
│       └── engine.js
│           └── 功能：每 30s 轮询检查到期提醒
│
└── config.json
    └── 功能：端口、文档目录等配置
\`\`\`

## 技术栈

| 层 | 选型 |
|------|------|
| 运行时 | Node.js |
| Web 框架 | Express |
| 前端样式 | Pico CSS（CDN） |
| 数据存储 | JSON 文件 |

注意：直接输出完整的 Markdown 文档，不要添加任何额外说明。`;

// ══════════════════════════════════════════════════
//  路由注册
// ══════════════════════════════════════════════════

function register(app, basePath) {
  const port = getPort();

  // ─── 1. 获取文档列表 ───

  app.get(`${basePath}/docs`, (req, res) => {
    const meta = readMeta();
    const list = meta.docs.sort((a, b) => (b.version || 0) - (a.version || 0));
    res.json(list);
  });

  // ─── 2. 获取单篇文档内容 ───

  app.get(`${basePath}/docs/:id`, (req, res) => {
    const meta = readMeta();
    const doc = meta.docs.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: '文档未找到' });
    const filePath = path.join(DOCS_DIR, doc.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文档文件已丢失' });
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ ...doc, content });
  });

  // ─── 3. 上传文档 ───

  app.post(`${basePath}/upload`, (req, res) => {
    const { title, commitSha, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: '请填写标题和文档内容' });
    const meta = readMeta();
    const id = nextId(meta);
    const version = meta.docs.length + 1;
    const now = new Date().toISOString();
    const fileName = `doc-${id}.md`;
    const filePath = path.join(DOCS_DIR, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    const entry = { id, version, title, commitSha: commitSha || '', shortSha: shortSha(commitSha), createdAt: now, updatedAt: now, fileName, source: 'upload' };
    meta.docs.push(entry);
    writeMeta(meta);
    res.status(201).json(entry);
  });

  // ─── 4. 删除文档 ───

  app.delete(`${basePath}/docs/:id`, (req, res) => {
    const meta = readMeta();
    const idx = meta.docs.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '文档未找到' });
    const doc = meta.docs[idx];
    const filePath = path.join(DOCS_DIR, doc.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    meta.docs.splice(idx, 1);
    writeMeta(meta);
    res.json({ success: true });
  });

  // ─── 5. 分析变更（Phase 1） ───

  app.post(`${basePath}/analyze`, async (req, res) => {
    const { baseDocId, targetCommitSha, owner, repo } = req.body;
    if (!baseDocId || !targetCommitSha || !owner || !repo) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
      const meta = readMeta();
      const baseDoc = meta.docs.find((d) => d.id === baseDocId);
      if (!baseDoc) return res.status(404).json({ error: '基准文档未找到' });
      if (!baseDoc.commitSha) return res.status(400).json({ error: '基准文档未关联 commit' });

      const compareData = await fetchCompare(port, owner, repo, baseDoc.commitSha, targetCommitSha);
      const sourceFiles = compareData.files || [];
      const meaningfulFiles = sourceFiles.filter((f) => {
        const ext = path.extname(f.filename).toLowerCase();
        const sourceExts = ['.js', '.json', '.html', '.css', '.md', '.ts', '.jsx', '.tsx', '.py', '.yml', '.yaml', '.sh', '.bat'];
        return sourceExts.includes(ext) || !ext;
      });
      if (meaningfulFiles.length === 0) return res.json({ changePoints: [], message: '无显著代码变更' });

      const diffSummary = meaningfulFiles.map((f) => {
        return `文件: ${f.filename}\n状态: ${f.status}\n增删: +${f.additions}/-${f.deletions}\n补丁:\n${(f.patch || '').slice(0, 3000)}`;
      }).join('\n---\n');

      const maxLen = 80000;
      const truncatedDiff = diffSummary.length > maxLen ? diffSummary.slice(0, maxLen) + '\n...（以下内容已截断）' : diffSummary;

      const result = await deepseekChat([
        { role: 'system', content: SYSTEM_PROMPT_ANALYZE },
        { role: 'user', content: `请分析以下代码变更，输出修改要点 JSON：\n\n${truncatedDiff}` },
      ], { jsonMode: true });

      let changePoints = [];
      try {
        const parsed = JSON.parse(result);
        changePoints = parsed.changePoints || [];
      } catch {
        return res.status(502).json({ error: 'DeepSeek 返回格式异常，请重试' });
      }
      res.json({ changePoints, message: `识别到 ${changePoints.length} 个变更点` });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // ─── 6. 生成大纲（Phase 2） ───

  app.post(`${basePath}/outline`, async (req, res) => {
    const { baseDocId, changePoints } = req.body;
    if (!baseDocId || !changePoints) return res.status(400).json({ error: '缺少必要参数' });

    try {
      const meta = readMeta();
      const baseDoc = meta.docs.find((d) => d.id === baseDocId);
      if (!baseDoc) return res.status(404).json({ error: '基准文档未找到' });
      const filePath = path.join(DOCS_DIR, baseDoc.fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: '基准文档文件已丢失' });
      const existingContent = fs.readFileSync(filePath, 'utf-8');

      const changePointsText = changePoints.map((cp, i) => {
        return `变更 ${i + 1}:\n- 类型: ${cp.type}\n- 文件: ${cp.file}\n- 概述: ${cp.summary}\n- 详情: ${cp.details}\n- 文档影响: ${cp.docImpact}`;
      }).join('\n\n');

      const outline = await deepseekChat([
        { role: 'system', content: SYSTEM_PROMPT_OUTLINE },
        { role: 'user', content: `## 现有文档\n\n${existingContent}\n\n## 变更要点\n\n${changePointsText}\n\n请基于以上内容生成新版本文档的大纲。` },
      ]);

      res.json({ outline: outline || '' });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // ─── 7. 生成完整文档（Phase 3） ───

  app.post(`${basePath}/generate`, async (req, res) => {
    const { baseDocId, outline, changePoints } = req.body;
    if (!baseDocId || !outline) return res.status(400).json({ error: '缺少必要参数' });

    try {
      const meta = readMeta();
      const baseDoc = meta.docs.find((d) => d.id === baseDocId);
      if (!baseDoc) return res.status(404).json({ error: '基准文档未找到' });
      const filePath = path.join(DOCS_DIR, baseDoc.fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: '基准文档文件已丢失' });
      const existingContent = fs.readFileSync(filePath, 'utf-8');

      const changePointsText = changePoints ? changePoints.map((cp, i) => {
        return `变更 ${i + 1}:\n- 类型: ${cp.type}\n- 文件: ${cp.file}\n- 概述: ${cp.summary}\n- 详情: ${cp.details}\n- 文档影响: ${cp.docImpact}`;
      }).join('\n\n') : '';

      const userMsg = `## 现有文档\n\n${existingContent}\n\n## 大纲\n\n${outline}\n\n${changePointsText ? `## 变更要点\n\n${changePointsText}\n\n` : ''}请严格遵循大纲结构，基于现有文档和变更要点生成更新后的完整文档。`;

      const newContent = await deepseekChat([
        { role: 'system', content: SYSTEM_PROMPT_GENERATE },
        { role: 'user', content: userMsg },
      ]);

      if (!newContent) return res.status(502).json({ error: '生成内容为空' });
      res.json({ content: newContent });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // ─── 8. 保存生成结果 ───

  app.post(`${basePath}/save`, (req, res) => {
    const { content, title, commitSha, source } = req.body;
    if (!content || !title) return res.status(400).json({ error: '请填写标题和文档内容' });
    const meta = readMeta();
    const id = nextId(meta);
    const version = meta.docs.length + 1;
    const now = new Date().toISOString();
    const fileName = `doc-${id}.md`;
    const filePath = path.join(DOCS_DIR, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    const entry = { id, version, title, commitSha: commitSha || '', shortSha: shortSha(commitSha), createdAt: now, updatedAt: now, fileName, source: source || 'generated' };
    meta.docs.push(entry);
    writeMeta(meta);
    res.status(201).json(entry);
  });
}

module.exports = { register, label };
