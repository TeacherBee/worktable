const notifier = require('node-notifier');

/**
 * Send a system notification.
 * @param {string} title - Notification title
 * @param {string} message - Notification body text
 */
function notify(title, message) {
  notifier.notify({
    title,
    message,
    sound: true,
    wait: false,
  });
}

module.exports = { notify };
