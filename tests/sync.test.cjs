const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { syncFolder } = require('../electron/sync.cjs');
const { validate } = require('../electron/validation.cjs');

const entry = (id, title, createdAt) => ({ id, title, date: '2026-09-01', durationMs: 3600000, rate: 10, currency: 'USD', organizationId: 'o', projectId: null, source: 'manual', createdAt });
const base = () => ({ version: 1, rate: 0, name: '', organizations: [{ id: 'o', name: 'Acme', rate: 10, currency: 'USD' }], projects: [], entries: [], active: null });
function device(folder, id) {
  let state = base(), meta = { known: {}, deleted: {}, seen: {} }, clock = 1000;
  return {
    get state() { return state; },
    set state(s) { state = s; },
    sync(now) {
      const r = syncFolder({ folder, deviceId: id, deviceName: id, local: state, meta, now: now ?? (clock += 1000) });
      meta = r.meta; state = validate(r.state); return r;
    },
  };
}
const A = 'aaaaaaaa-0000', B = 'bbbbbbbb-0000';

test('entries from two devices merge and stay valid', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-sync-'));
  const a = device(dir, A), b = device(dir, B);
  a.state = { ...a.state, entries: [entry('1', 'from A', 1)] };
  a.sync(); b.state = { ...b.state, entries: [entry('2', 'from B', 2)] };
  b.sync(); a.sync();
  assert.deepEqual(a.state.entries.map(e => e.id), ['1', '2']);
  assert.deepEqual(b.state.entries.map(e => e.id), ['1', '2']);
  assert.equal(fs.readdirSync(dir).length, 2);
});

test('deletes propagate and do not resurrect', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-sync-'));
  const a = device(dir, A), b = device(dir, B);
  a.state = { ...a.state, entries: [entry('1', 'x', 1), entry('2', 'y', 2)] };
  a.sync(); b.sync(); a.sync();
  a.state = { ...a.state, entries: a.state.entries.filter(e => e.id !== '1') };
  a.sync(); b.sync(); a.sync(); b.sync();
  assert.deepEqual(a.state.entries.map(e => e.id), ['2']);
  assert.deepEqual(b.state.entries.map(e => e.id), ['2']);
});

test('remote edits arrive, and a stale remote file never overwrites newer local edits', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-sync-'));
  const a = device(dir, A), b = device(dir, B);
  a.state = { ...a.state, entries: [entry('1', 'old', 1)] };
  a.sync(); b.sync(); a.sync();
  b.state = { ...b.state, entries: [{ ...b.state.entries[0], title: 'edited on B' }] };
  b.sync(); a.sync();
  assert.equal(a.state.entries[0].title, 'edited on B');
  a.state = { ...a.state, entries: [{ ...a.state.entries[0], title: 'edited on A' }] };
  a.sync(); a.sync();
  assert.equal(a.state.entries[0].title, 'edited on A');
});

test('the running timer is never shared and damaged peer files are ignored', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-sync-'));
  fs.writeFileSync(path.join(dir, 'kaarnegar-sync-cccccccc-0000.json'), '{broken');
  const a = device(dir, A);
  a.state = { ...a.state, active: { id: 't', title: 'live', rate: 10, currency: 'USD', organizationId: 'o', projectId: null, segments: [], runningSince: 5 } };
  a.sync();
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, `kaarnegar-sync-${A}.json`), 'utf8')).state.active, undefined);
});
