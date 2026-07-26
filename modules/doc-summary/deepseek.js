/**
 * DeepSeek API 客户端
 * 零外部依赖，使用 Node.js 内置 https 模块
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── 读取 API Key ──
const configPath = path.join(__dirname, '..', '..', 'config.json');
let apiKey = '';
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.deepseekKey) apiKey = config.deepseekKey;
} catch {}

const API_HOST = 'api.deepseek.com';
const API_PATH = '/v1/chat/completions';
const TIMEOUT = 60000;

/**
 * 发送聊天请求到 DeepSeek API
 * @param {Array} messages - [{ role: 'system'|'user'|'assistant', content: string }]
 * @param {Object} [options]
 * @param {number} [options.temperature=0.3] - 生成温度
 * @param {string} [options.model='deepseek-flash-v4'] - 模型名称
 * @param {boolean} [options.jsonMode=false] - 是否要求 JSON 格式输出
 * @returns {Promise<string>} 响应文本
 */
function deepseekChat(messages, options = {}) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      return reject(new Error('请先配置 DeepSeek API Key'));
    }

    const temperature = options.temperature ?? 0.3;
    const model = options.model || 'deepseek-v4-flash';
    const jsonMode = options.jsonMode || false;

    const requestBody = {
      model,
      messages,
      temperature,
    };

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const bodyStr = JSON.stringify(requestBody);

    const reqOptions = {
      hostname: API_HOST,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) {
            const errMsg = data.error?.message || data.error || `HTTP ${res.statusCode}`;
            return reject(new Error(`DeepSeek API 错误: ${errMsg}`));
          }
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            return reject(new Error('DeepSeek API 返回为空'));
          }
          resolve(content);
        } catch {
          reject(new Error(`DeepSeek API 响应解析失败: ${body.slice(0, 100)}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`DeepSeek 请求失败: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('DeepSeek API 请求超时'));
    });
    req.setTimeout(TIMEOUT);

    req.write(bodyStr);
    req.end();
  });
}

module.exports = { deepseekChat };
