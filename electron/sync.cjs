const fs = require('node:fs');
const path = require('node:path');
// Folder sync for Dropbox / Google Drive / any synced directory. Every device owns exactly one file
// (kaarnegar-sync-<deviceId>.json) so cloud clients never see two writers on the same file.
const FILE = /^kaarnegar-sync-([A-Za-z0-9-]{8,64})\.json$/;
const KINDS = ['organizations', 'projects', 'entries'];
const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const fileName = deviceId => `kaarnegar-sync-${deviceId}.json`;
const snapshot = state => Object.fromEntries(KINDS.flatMap(k => state[k].map(item => [item.id, stable(item)])));

function readRemote(folder, deviceId) {
  const remotes = [];
  for (const name of fs.readdirSync(folder)) {
    const m = FILE.exec(name);
    if (!m || m[1] === deviceId) continue;
    try {
      const file = path.join(folder, name);
      if (fs.statSync(file).size > 60e6) continue;
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data?.format !== 1 || !data.state || !Array.isArray(data.deleted) || !Number.isFinite(data.savedAt)) continue;
      if (!KINDS.every(k => Array.isArray(data.state[k]))) continue;
      remotes.push({ deviceId: m[1], deviceName: String(data.deviceName ?? '').slice(0, 100), savedAt: data.savedAt, state: data.state, deleted: data.deleted.filter(x => typeof x === 'string') });
    } catch { /* a half-synced or damaged file is skipped and picked up on the next pass */ }
  }
  return remotes;
}

// Pure merge. `meta` is this device's memory of the last sync: { known: {id: serialized}, deleted: {id: at}, seen: {deviceId: savedAt} }.
function merge(local, remotes, meta, now = Date.now()) {
  const current = snapshot(local);
  const deleted = { ...meta.deleted };
  for (const id of Object.keys(meta.known)) if (!(id in current)) deleted[id] ??= now;
  for (const id of Object.keys(current)) delete deleted[id];
  for (const r of remotes) for (const id of r.deleted) deleted[id] ??= r.savedAt;
  const newestFirst = [...remotes].sort((a, b) => b.savedAt - a.savedAt);
  const result = { ...local };
  for (const kind of KINDS) {
    const byId = new Map();
    for (const item of local[kind]) byId.set(item.id, item);
    for (const r of newestFirst) for (const item of r.state[kind]) {
      if (!item || typeof item.id !== 'string') continue;
      const mine = byId.get(item.id);
      // Keep the local version when this device edited it since the last sync; otherwise adopt the newest remote edit.
      // Files that have not changed since the last pass are stale snapshots: they may add items but never override.
      const fresh = r.savedAt > (meta.seen?.[r.deviceId] ?? 0);
      if (!mine || (fresh && stable(mine) === meta.known[item.id] && stable(item) !== stable(mine))) byId.set(item.id, item);
    }
    result[kind] = [...byId.values()].filter(x => !(x.id in deleted));
  }
  // Items removed by another device take their dependents with them instead of leaving dangling references.
  const orgs = new Set(result.organizations.map(o => o.id));
  result.projects = result.projects.filter(p => orgs.has(p.organizationId));
  const projects = new Set(result.projects.map(p => p.id));
  for (const e of result.entries) if (!orgs.has(e.organizationId) || (e.projectId && !projects.has(e.projectId))) deleted[e.id] ??= now;
  result.entries = result.entries.filter(e => orgs.has(e.organizationId) && !(e.projectId && !projects.has(e.projectId)));
  result.entries.sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1));
  const changed = KINDS.some(k => stable(result[k]) !== stable(local[k]));
  return { state: result, deleted, changed };
}

function syncFolder({ folder, deviceId, deviceName, local, meta, now = Date.now() }) {
  if (typeof folder !== 'string' || !path.isAbsolute(folder) || !fs.statSync(folder).isDirectory()) throw Error('Sync folder is not available');
  const remotes = readRemote(folder, deviceId);
  const { state, deleted, changed } = merge(local, remotes, meta, now);
  const shared = { organizations: state.organizations, projects: state.projects, entries: state.entries };
  const body = JSON.stringify({ format: 1, deviceId, deviceName, savedAt: now, state: shared, deleted: Object.keys(deleted) });
  const target = path.join(folder, fileName(deviceId));
  const same = (() => { try { const prev = JSON.parse(fs.readFileSync(target, 'utf8')); return stable(prev.state) === stable(shared) && stable(prev.deleted) === stable(Object.keys(deleted)); } catch { return false; } })();
  if (!same) {
    fs.writeFileSync(target + '.tmp', body, 'utf8');
    fs.renameSync(target + '.tmp', target);
  }
  return { state, changed, meta: { known: snapshot(state), deleted, seen: Object.fromEntries(remotes.map(r => [r.deviceId, r.savedAt])) }, devices: remotes.length, lastSync: now };
}

module.exports = { syncFolder, merge, readRemote, snapshot, fileName };
