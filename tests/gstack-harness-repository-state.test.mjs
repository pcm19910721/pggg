import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateBin = path.join(root, 'bin', 'gstack-harness-repository-state');

function run(bin, args, cwd) {
  return spawnSync(bin, args, { cwd, encoding: 'utf8', timeout: 120_000 });
}

function tempProject(prefix = 'gstack-repository-state-') {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gstack', 'project-state.json'), JSON.stringify({
    schema: 'gstack-harness.project_state.v1',
    project_id: path.basename(project),
  }, null, 2));
  return project;
}

function initRepo(project) {
  run('git', ['init'], project);
  run('git', ['config', 'user.email', 'state@example.test'], project);
  run('git', ['config', 'user.name', 'Repository State Test'], project);
  fs.writeFileSync(path.join(project, 'README.md'), '# state\n');
  run('git', ['add', 'README.md', '.gstack/project-state.json'], project);
  run('git', ['commit', '-m', 'initial'], project);
}

function runState(project, args = []) {
  return spawnSync(stateBin, ['--target', project, '--json', ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  });
}

function parseJson(result) {
  assert.match(result.stdout, /^\{/);
  return JSON.parse(result.stdout);
}

test('repository state reports non-git targets without initializing git', () => {
  const project = tempProject('gstack-repository-state-not-git-');
  fs.writeFileSync(path.join(project, 'app.js'), 'console.log("ready");\n');

  const result = runState(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(project, '.git')), false);
  const output = parseJson(result);
  assert.equal(output.status, 'partial');
  assert.equal(output.git, 'missing');
  assert.equal(output.has_initial_commit, false);
  assert.equal(output.blockers.includes('not_git_repo'), true);
  assert.equal(fs.existsSync(path.join(project, '.gstack', 'repository-state.json')), true);
  assert.equal(fs.existsSync(path.join(project, 'docs', 'REPOSITORY_STATE_REPORT.md')), true);
  assert.equal(fs.existsSync(path.join(project, 'docs', 'agents', 'repository-state.json')), true);

  const state = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.repository_state.status, 'partial');
  assert.equal(state.artifacts.repository_state_report, 'docs/REPOSITORY_STATE_REPORT.md');
});

test('repository state reports ready repos with branch head dirty files and remote status', () => {
  const project = tempProject('gstack-repository-state-ready-');
  initRepo(project);
  fs.writeFileSync(path.join(project, 'README.md'), '# state\n\nmodified\n');
  fs.writeFileSync(path.join(project, 'staged.js'), 'console.log("staged");\n');
  fs.writeFileSync(path.join(project, 'untracked.js'), 'console.log("untracked");\n');
  run('git', ['add', 'staged.js'], project);
  const currentBranch = run('git', ['branch', '--show-current'], project).stdout.trim();

  const result = runState(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'ready');
  assert.equal(output.git, 'ready');
  assert.equal(output.branch, currentBranch);
  assert.match(output.head, /^[0-9a-f]{40}$/);
  assert.equal(output.has_initial_commit, true);
  assert.equal(output.dirty, true);
  assert.equal(output.modified_files.includes('README.md'), true);
  assert.equal(output.staged_files.includes('staged.js'), true);
  assert.equal(output.untracked_files.includes('untracked.js'), true);
  assert.equal(output.remote_status, 'missing');
  assert.equal(output.warnings.includes('remote_missing'), true);
});

test('repository state warns when target is nested below the git root', () => {
  const repo = tempProject('gstack-repository-state-parent-');
  initRepo(repo);
  const nested = path.join(repo, 'packages', 'app');
  fs.mkdirSync(path.join(nested, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(nested, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(nested, '.gstack', 'project-state.json'), JSON.stringify({
    schema: 'gstack-harness.project_state.v1',
    project_id: 'nested-app',
  }, null, 2));

  const result = runState(nested);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'warning');
  assert.equal(output.repo_root, repo);
  assert.equal(output.target_inside_repo, true);
  assert.equal(output.target_is_repo_root, false);
  assert.equal(output.warnings.includes('git_repo_root_mismatch'), true);
});
