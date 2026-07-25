const { readJSON, writeJSON } = require('../../core/storage');
const SCHEDULE_FILE = 'schedules.json';

const label = '📅 日程';

/**
 * Generate a simple unique ID.
 */
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/**
 * Validate schedule input.
 */
function validateSchedule(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('标题不能为空');
  }
  if (!body.date || typeof body.date !== 'string') {
    errors.push('日期不能为空');
  }
  return errors;
}

function register(app, basePath) {
  // 启动提醒引擎
  const { start } = require('./engine');
  start();

  // ── 获取所有日程 ──
  app.get(`${basePath}/schedules`, (req, res) => {
    try {
      const schedules = readJSON(SCHEDULE_FILE) || [];
      res.json(schedules);
    } catch (err) {
      res.status(500).json({ error: '读取日程数据失败' });
    }
  });

  // ── 添加日程 ──
  app.post(`${basePath}/schedules`, (req, res) => {
    try {
      const errors = validateSchedule(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('; ') });
      }

      const schedules = readJSON(SCHEDULE_FILE) || [];
      const newSchedule = {
        id: generateId(),
        title: req.body.title.trim(),
        date: req.body.date,
        time: req.body.time || '09:00',
        notified: false,
        createdAt: new Date().toISOString(),
      };
      schedules.push(newSchedule);
      writeJSON(SCHEDULE_FILE, schedules);

      res.status(201).json(newSchedule);
    } catch (err) {
      res.status(500).json({ error: '添加日程失败' });
    }
  });

  // ── 删除日程 ──
  app.delete(`${basePath}/schedules/:id`, (req, res) => {
    try {
      const schedules = readJSON(SCHEDULE_FILE) || [];
      const index = schedules.findIndex((s) => s.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: '日程未找到' });
      }
      schedules.splice(index, 1);
      writeJSON(SCHEDULE_FILE, schedules);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '删除日程失败' });
    }
  });
}

module.exports = { register, label };
