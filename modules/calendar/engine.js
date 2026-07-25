const { readJSON, writeJSON } = require('../../core/storage');
const { notify } = require('../../core/notify');
const SCHEDULE_FILE = 'schedules.json';

const CHECK_INTERVAL = 30 * 1000; // 30 秒
const REMIND_MINUTES = 15;        // 提前 15 分钟

let timer = null;

/**
 * Parse a schedule's date+time into a Date object.
 */
function getScheduleDateTime(schedule) {
  return new Date(`${schedule.date}T${schedule.time}:00`);
}

/**
 * Check all schedules and notify for upcoming ones.
 */
function checkAndNotify() {
  try {
    const schedules = readJSON(SCHEDULE_FILE);
    if (!schedules || schedules.length === 0) return;

    const now = new Date();
    let changed = false;

    for (const schedule of schedules) {
      // Skip already notified or invalid
      if (schedule.notified) continue;
      if (!schedule.date || !schedule.time) continue;

      const eventTime = getScheduleDateTime(schedule);
      if (isNaN(eventTime.getTime())) continue;

      const diffMs = eventTime.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Within the 15-minute window (between 14 and 16 minutes before, to be safe)
      if (diffMinutes > 0 && diffMinutes <= REMIND_MINUTES + 1) {
        notify(
          '📅 日程提醒',
          `${schedule.title}\n${schedule.time} 即将开始`
        );
        schedule.notified = true;
        changed = true;
      }
    }

    if (changed) {
      writeJSON(SCHEDULE_FILE, schedules);
    }
  } catch (err) {
    console.error('[calendar/engine] Check error:', err.message);
  }
}

/**
 * Start the reminder engine.
 */
function start() {
  if (timer) return; // already running
  console.log('[calendar] Reminder engine started (checking every 30s)');
  checkAndNotify(); // immediate first check
  timer = setInterval(checkAndNotify, CHECK_INTERVAL);
}

/**
 * Stop the reminder engine.
 */
function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[calendar] Reminder engine stopped');
  }
}

module.exports = { start, stop };
