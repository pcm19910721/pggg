import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readinessBin = path.join(root, 'bin', 'gstack-harness-readiness');
const testPath = `${path.dirname(process.execPath)}:/usr/bin:/bin`;

function tempProject() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-readiness-test-'));
  fs.mkdirSync(path.join(project, '.ai-context'), { recursive: true });
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, '.ai-context', 'project.json'), JSON.stringify({
    project_id: 'readiness-test',
    repo_path: project,
    gitnexus: { repo: 'readiness-test' },
  }, null, 2));
  fs.writeFileSync(path.join(project, '.gstack', 'project-state.json'), JSON.stringify({
    project_id: 'readiness-test',
    quality_gates: { code_context: 'ready' },
  }, null, 2));
  fs.writeFileSync(path.join(project, 'PROJECT_STATE.md'), '- Code Context: ready\n');
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'readiness@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Readiness Test'], { cwd: project, encoding: 'utf8' });
  fs.writeFileSync(path.join(project, 'tracked.txt'), 'initial\n');
  spawnSync('git', ['add', '.'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });
  return project;
}

function installTimeoutGbrain(bin) {
  fs.mkdirSync(bin, { recursive: true });
  const gstackRoot = path.join(bin, '.codex', 'skills', 'gstack');
  fs.mkdirSync(gstackRoot, { recursive: true });
  fs.writeFileSync(path.join(gstackRoot, 'SKILL.md'), '# test gstack skill\n');
  const gbrain = path.join(bin, 'gbrain');
  fs.writeFileSync(gbrain, `#!/usr/bin/env node
const [command, slug] = process.argv.slice(2);
if (command === '--version') {
  console.log('gbrain-test 0.0.0');
  process.exit(0);
}
if (command === 'list') {
  console.log('project/readiness-test/overview');
  console.log('project/readiness-test/state');
  console.log('project/readiness-test/foundation-readiness');
  console.log('project/readiness-test/code-context');
  console.log('project/readiness-test/quality-gates');
  console.log('project/readiness-test/handoff');
  process.exit(0);
}
if (command === 'get') {
  if (slug === 'project/readiness-test/code-context') process.exit(124);
  console.log('# page');
  process.exit(0);
}
if (command === 'query') {
  console.log('ok');
  process.exit(0);
}
process.exit(0);
`);
  fs.chmodSync(gbrain, 0o755);
}

test('readiness detects stale code context when status commit differs from HEAD', () => {
  const project = tempProject();
  const firstHead = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim();
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: firstHead,
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: {},
  }, null, 2));
  fs.writeFileSync(path.join(project, '.ai-context', 'gitnexus-status.json'), JSON.stringify({
    git_head: firstHead,
    last_commit: firstHead,
    indexed: true,
    stale: false,
  }, null, 2));

  fs.writeFileSync(path.join(project, 'tracked.txt'), 'second\n');
  spawnSync('git', ['add', 'tracked.txt'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'second'], { cwd: project, encoding: 'utf8' });

  const result = spawnSync(readinessBin, [
    '--target', project,
    '--mode', 'docs-only',
    '--skip-code-context',
    '--json',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: '/tmp/gstack-readiness-test-home',
      PATH: testPath,
    },
  });

  const output = JSON.parse(result.stdout);
  assert.equal(output.code_context, 'stale');
});

test('readiness reports gbrain get timeout separately from missing pages', () => {
  const project = tempProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-readiness-bin-'));
  installTimeoutGbrain(fakeBin);

  const result = spawnSync(readinessBin, [
    '--target', project,
    '--mode', 'docs-only',
    '--skip-code-context',
    '--json',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: fakeBin,
      GSTACK_GBRAIN_GET_TIMEOUT: '2s',
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.gbrain_core_missing.includes('project/readiness-test/code-context'), false);
  assert.equal(output.gbrain_core_timeout.includes('project/readiness-test/code-context'), true);
  assert.equal(output.warnings.includes('gbrain_core_pages_timeout'), true);
  assert.equal(output.gstack, 'ready');
});

test('readiness includes workspace hygiene status from installed report', () => {
  const project = tempProject();
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gstack', 'workspace-hygiene.json'), JSON.stringify({
    schema: 'gstack-harness.workspace_hygiene.v1',
    status: 'blocked',
    commit_gate: 'blocked',
    blockers: ['secret_risk_staged'],
    warnings: ['large_asset_staged'],
    report: 'docs/WORKSPACE_HYGIENE_REPORT.md',
  }, null, 2));

  const result = spawnSync(readinessBin, [
    '--target', project,
    '--mode', 'docs-only',
    '--skip-code-context',
    '--json',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: '/tmp/gstack-readiness-test-home',
      PATH: testPath,
    },
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.workspace_hygiene.status, 'blocked');
  assert.equal(output.workspace_hygiene.commit_gate, 'blocked');
  const state = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.workspace_hygiene.status, 'blocked');
  assert.equal(state.artifacts.workspace_hygiene_report, 'docs/WORKSPACE_HYGIENE_REPORT.md');
});
