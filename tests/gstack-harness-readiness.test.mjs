import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readinessBin = path.join(root, 'bin', 'gstack-harness-readiness');

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
      PATH: '/usr/bin:/bin',
    },
  });

  const output = JSON.parse(result.stdout);
  assert.equal(output.code_context, 'stale');
});
