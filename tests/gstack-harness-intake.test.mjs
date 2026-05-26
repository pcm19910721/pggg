import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const intakeBin = path.join(root, 'bin', 'gstack-harness-intake');

function runIntake(args, cwd = root) {
  return spawnSync(intakeBin, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
  });
}

function parseJson(result) {
  assert.match(result.stdout, /^\{/);
  return JSON.parse(result.stdout);
}

test('intake simulate classifies non-git Python bundle as needing baseline', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-intake-non-git-'));
  fs.mkdirSync(path.join(project, 'app'), { recursive: true });
  fs.writeFileSync(path.join(project, 'app', 'web_app.py'), 'print("ready")\n');
  fs.writeFileSync(path.join(project, 'app', 'mima.txt'), 'fake password placeholder\n');
  fs.mkdirSync(path.join(project, 'server_materials', '10-access'), { recursive: true });
  fs.writeFileSync(path.join(project, 'server_materials', '10-access', 'PCM.pem'), 'fake key placeholder\n');

  const result = runIntake(['simulate', '--target', project, '--json']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.schema, 'gstack-harness.project_intake.v1');
  assert.equal(output.command, 'simulate');
  assert.equal(output.status, 'needs_baseline');
  assert.equal(output.git.status, 'missing');
  assert.equal(output.runtime.status, 'ready');
  assert.equal(output.runtime.mode, 'app');
  assert.equal(output.repository_baseline.required, true);
  assert.equal(output.recommended_next_step, 'Repository Baseline precheck');
  assert.equal(output.sensitive_paths.some((item) => item.path === 'app/mima.txt'), true);
  assert.equal(output.sensitive_paths.some((item) => item.path === 'server_materials/10-access/PCM.pem'), true);
  assert.match(output.recommended_codex_prompt, /Do not modify business code/);
  assert.match(output.recommended_codex_prompt, /Repository Baseline precheck/);
  assert.equal(fs.existsSync(path.join(project, '.gstack', 'intake-last.json')), true);
  assert.equal(fs.existsSync(path.join(project, 'docs', 'PROJECT_INTAKE_REPORT.md')), true);
});

test('intake simulate reports ready git project with missing remote warning', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-intake-git-'));
  fs.writeFileSync(path.join(project, 'README.md'), '# intake\n');
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'intake@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Intake Test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['add', 'README.md'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });

  const result = runIntake(['simulate', '--target', project, '--json']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'ready');
  assert.equal(output.git.status, 'ready');
  assert.equal(output.repository_baseline.required, false);
  assert.equal(output.remote.status, 'missing');
  assert.equal(output.warnings.includes('remote_missing'), true);
});
