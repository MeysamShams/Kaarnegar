const fs = require('node:fs');
const path = require('node:path');
const defaults = { theme: 'system', language:'en', compact: false, normalMaximized: false };
function normalize(value = {}) {
  const result = { ...defaults };
  if (['light', 'dark', 'system'].includes(value.theme)) result.theme = value.theme;
  if (['fa','en'].includes(value.language)) result.language=value.language;
  result.compact = value.compact === true;
  result.normalMaximized = value.normalMaximized === true;
  for (const key of ['normalBounds', 'compactBounds']) {
    const b = value[key];
    if (b && ['x', 'y', 'width', 'height'].every(k => Number.isInteger(b[k])) && b.width >= 390 && b.height >= 360 && b.width <= 10000 && b.height <= 10000) result[key] = b;
  }
  return result;
}
function readPreferences(file) {
  for (const candidate of [file, file + '.bak']) {
    try { return normalize(JSON.parse(fs.readFileSync(candidate, 'utf8'))); } catch {}
  }
  return { ...defaults };
}
function writePreferences(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak');
  fs.writeFileSync(file + '.tmp', JSON.stringify(normalize(value), null, 2));
  fs.renameSync(file + '.tmp', file);
}
function loginOptions(app, env = process.env) {
  return { path: env.PORTABLE_EXECUTABLE_FILE || process.execPath, args: app.isPackaged ? [] : [app.getAppPath()], name: 'Kaarnegar' };
}
module.exports = { readPreferences, writePreferences, loginOptions };
