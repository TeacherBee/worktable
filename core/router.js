const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'modules');

/**
 * Scan modules/ directory, load each module's api.js, and register routes.
 * Returns an array of nav items: [{ name, label }] for modules that have a page.html.
 */
function registerModules(app) {
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  const navItems = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const moduleDir = path.join(MODULES_DIR, entry.name);
    const apiPath = path.join(moduleDir, 'api.js');

    let modLabel = entry.name;

    if (fs.existsSync(apiPath)) {
      try {
        const mod = require(apiPath);
        if (typeof mod.register === 'function') {
          mod.register(app, `/api/${entry.name}`);
        }
        if (mod.label) modLabel = mod.label;
      } catch (err) {
        console.error(`[router] Failed to load module "${entry.name}":`, err.message);
      }
    }

    // Only add to nav if it has a frontend page
    const pagePath = path.join(moduleDir, 'page.html');
    if (fs.existsSync(pagePath)) {
      navItems.push({ name: entry.name, label: modLabel });
    }
  }

  return navItems;
}

module.exports = { registerModules };
