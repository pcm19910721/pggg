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
  assert.match(projectState, /## Session Interaction Context/);
  assert.match(projectState, /- Recent interaction evidence:/);
  assert.match(projectState, /- Current user message summary:/);
  assert.match(projectState, /- Previous Codex output summary:/);
  assert.match(projectState, /- Previous two Codex output summary:/);

  const claudeMd = fs.readFileSync(path.join(target, 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /Session interaction context:/);
  assert.match(claudeMd, /recent 1-2 Codex outputs in the same session/);

  const codexPrompt = fs.readFileSync(path.join(target, 'docs', 'CODEX_START_PROMPT.md'), 'utf8');
  assert.match(codexPrompt, /同一个 session 内最近 1-2 次 Codex 输出/);

  const stateJson = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.deepEqual(stateJson.repeat_work, {
    known_patterns: [],
    promotion_backlog: [],
    scheduled_candidates: [],
    recent_memory_misses: [],
    interaction_context: {
      recent_evidence: [],
    },
  });
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-workspace-hygiene')), true);
  assert.match(fs.readFileSync(path.join(target, '.gstack', 'harness', 'agents', 'TEAM.md'), 'utf8'), /Workspace Hygiene Agent/);
  assert.equal(stateJson.workspace_hygiene.status, 'unknown');
  assert.equal(stateJson.workspace_hygiene.policy.auto_delete_files, false);
  assert.equal(stateJson.artifacts.workspace_hygiene_report, 'docs/WORKSPACE_HYGIENE_REPORT.md');
  assert.match(result.stdout, /"workspace-hygiene"/);
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
    interaction_context: {
      recent_evidence: [{
        current_user_message_summary: '用户要求按上次报告格式继续',
        previous_codex_output_summary: 'Codex 提供了报告格式',
        previous_2_codex_output_summary: '',
        user_message_role: 'confirmation',
        inferred_delta: '复用已有格式',
        durable_candidate: false,
      }],
    },
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
