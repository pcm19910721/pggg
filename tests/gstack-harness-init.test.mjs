import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initBin = path.join(root, 'bin', 'gstack-harness-init');

test('init renders repeat work promotion state into installed targets', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-repeat-work-'));
  const result = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-')),
      PATH: '/usr/bin:/bin',
    },
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);

  const projectState = fs.readFileSync(path.join(target, 'PROJECT_STATE.md'), 'utf8');
  assert.match(projectState, /## Repeat Work Promotion/);
  assert.match(projectState, /- Known patterns:/);
  assert.match(projectState, /- Promotion backlog:/);
  assert.match(projectState, /- Scheduled candidates:/);
  assert.match(projectState, /- Recent memory misses:/);

  const stateJson = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.deepEqual(stateJson.repeat_work, {
    known_patterns: [],
    promotion_backlog: [],
    scheduled_candidates: [],
    recent_memory_misses: [],
  });
});

test('init preserves existing repeat work promotion state on reinstall', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-repeat-work-preserve-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  const env = {
    ...process.env,
    HOME: home,
    PATH: '/usr/bin:/bin',
  };

  const first = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(first.status, null, first.stderr || first.stdout);

  const statePath = path.join(target, '.gstack', 'project-state.json');
  const existing = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  existing.repeat_work = {
    known_patterns: [{ pattern_id: 'weekly-report' }],
    promotion_backlog: [{ pattern_id: 'weekly-report', promotion_type: 'scheduled_candidate' }],
    scheduled_candidates: [{ pattern_id: 'weekly-report', cadence: 'weekly' }],
    recent_memory_misses: [{ pattern_id: 'release-notes', observed_in: 'manual-test' }],
  };
  fs.writeFileSync(statePath, `${JSON.stringify(existing, null, 2)}\n`);

  const second = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(second.status, null, second.stderr || second.stdout);

  const updated = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.deepEqual(updated.repeat_work, existing.repeat_work);
});
