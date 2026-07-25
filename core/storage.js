const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Read JSON data from a file in data/ directory.
 * @param {string} filename - e.g. 'schedules.json'
 * @returns {any|null} Parsed JSON or null if file doesn't exist
 */
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write JSON data to a file in data/ directory.
 * @param {string} filename - e.g. 'schedules.json'
 * @param {any} data - Data to serialize
 */
function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJSON, writeJSON };
