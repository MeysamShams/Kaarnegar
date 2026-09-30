const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { readPreferences, writePreferences, loginOptions, startupEnabled } = require('../electron/preferences.cjs');

test('preferences restore compact geometry and recover a damaged file from backup', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-prefs-'));
  const file = path.join(dir, 'preferences.json');
  const bounds = { x: -1000, y: 50, width: 470, height: 460 };
  assert.equal(readPreferences(file).theme, 'system');
  writePreferences(file, { theme: 'dark', compact: true, compactBounds: bounds, normalMaximized: true });
  const saved = readPreferences(file);
  assert.deepEqual(saved.compactBounds, bounds);
  assert.equal(saved.compact, true);
  assert.equal(saved.normalMaximized, true);
  writePreferences(file, { ...saved, theme: 'light' });
  fs.writeFileSync(file, '{broken');
  assert.deepEqual(readPreferences(file), saved);
});

test('invalid theme and geometry fall back to usable defaults', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-prefs-'));
  const file = path.join(dir, 'preferences.json');
  writePreferences(file, { theme: 'invalid', compact: 'yes', compactBounds: { x: 0, y: 0, width: -1, height: 0 } });
  assert.deepEqual(readPreferences(file), { theme: 'system', language:'en', compact: false, normalMaximized: false });
});

test('startup targets the persistent portable launcher, installed exe, or development project', () => {
  const app = { isPackaged: true, getAppPath: () => 'C:\\Projects\\Kaarnegar' };
  assert.deepEqual(loginOptions(app, { PORTABLE_EXECUTABLE_FILE: 'C:\\My Apps\\Kaarnegar.exe' }), { path: 'C:\\My Apps\\Kaarnegar.exe', args: [], name: 'Kaarnegar' });
  assert.equal(loginOptions(app, {}).path, process.execPath);
  assert.deepEqual(loginOptions({ ...app, isPackaged: false }, {}).args, ['C:\\Projects\\Kaarnegar']);
});

test('startup checks the named Windows launch item and its arguments', () => {
  const options = { path: 'C:\\My Apps\\Kaarnegar.exe', args: [], name: 'Kaarnegar' };
  let checked;
  const app = { getLoginItemSettings: value => { checked = value; return { openAtLogin: false, launchItems: [{ name: 'Kaarnegar', scope: 'user', enabled: true, args: [] }] }; } };
  assert.equal(startupEnabled(app, options), true);
  assert.deepEqual(checked, { path: '"C:\\My Apps\\Kaarnegar.exe"', args: [] });
  app.getLoginItemSettings = () => ({ openAtLogin: true, launchItems: [{ name: 'Other', scope: 'user', enabled: true, args: [] }] });
  assert.equal(startupEnabled(app, options), false);
  app.getLoginItemSettings = () => ({ launchItems: [{ name: 'Kaarnegar', scope: 'user', enabled: false, args: [] }] });
  assert.equal(startupEnabled(app, options), false);
});
