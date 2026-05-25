import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncBin = path.join(root, 'bin', 'gstack-harness-sync-repository');

function run(bin, args, cwd) {
  return spawnSync(bin, args, { cwd, encoding: 'utf8', timeout: 120_000 });
}

function tempProject(prefix = 'gstack-sync-') {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gstack', 'project-state.json'), JSON.stringify({
    schema: 'gstack-harness.project_state.v1',
    project_id: path.basename(project),
  }, null, 2));
  return project;
}

function initRepo(project) {
  run('git', ['init'], project);
  run('git', ['config', 'user.email', 'sync@example.test'], project);
  run('git', ['config', 'user.name', 'Repository Sync Test'], project);
  fs.writeFileSync(path.join(project, 'README.md'), '# sync\n');
  run('git', ['add', 'README.md', '.gstack/project-state.json'], project);
  run('git', ['commit', '-m', 'initial'], project);
}

function addBareOrigin(project) {
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-sync-remote-'));
  run('git', ['init', '--bare'], remote);
  run('git', ['remote', 'add', 'origin', remote], project);
  run('git', ['push', '-u', 'origin', 'HEAD'], project);
  return remote;
}

function runSync(project, args = []) {
  return spawnSync(syncBin, ['--target', project, '--json', ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  });
}

function parseJson(result) {
  assert.match(result.stdout, /^\{/);
  return JSON.parse(result.stdout);
}

function head(project, ref = 'HEAD') {
  return run('git', ['rev-parse', ref], project).stdout.trim();
}

function status(project) {
  return run('git', ['status', '--short', '--untracked-files=all'], project).stdout.trim();
}

test('sync blocks outside a git repository and writes state', () => {
  const project = tempProject('gstack-sync-not-git-');

  const result = runSync(project);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'blocked');
  assert.deepEqual(output.blockers, ['not_git_repo']);
  const state = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.repository_sync.status, 'blocked');
});

test('sync blocks detached HEAD', () => {
  const project = tempProject('gstack-sync-detached-');
  initRepo(project);
  run('git', ['checkout', '--detach', 'HEAD'], project);

  const result = runSync(project);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'blocked');
  assert.equal(output.blockers.includes('detached_head'), true);
});

test('sync reports local_only when origin is missing', () => {
  const project = tempProject('gstack-sync-no-origin-');
  initRepo(project);

  const result = runSync(project);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'local_only');
  assert.equal(output.last_push_status, 'missing_remote');
  assert.equal(output.blockers.includes('no_remote_repository'), true);
});

test('sync reports no_changes when local and origin already match', () => {
  const project = tempProject('gstack-sync-no-changes-');
  initRepo(project);
  addBareOrigin(project);

  const result = runSync(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'no_changes');
  assert.equal(output.unpushed_commits, 0);
  assert.equal(output.head, output.origin_head);
  assert.equal(status(project), '');
});

test('sync pushes existing local commits and confirms remote match', () => {
  const project = tempProject('gstack-sync-existing-commit-');
  initRepo(project);
  addBareOrigin(project);
  fs.writeFileSync(path.join(project, 'README.md'), '# sync\n\nlocal change\n');
  run('git', ['add', 'README.md'], project);
  run('git', ['commit', '-m', 'docs: local change'], project);
  const localHead = head(project);

  const result = runSync(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'synced');
  assert.equal(output.head, localHead);
  assert.equal(output.origin_head, localHead);
  assert.equal(output.unpushed_commits, 0);
  assert.equal(status(project), '');
});

test('sync script-only commits eligible scripts, excludes docs, pushes, and records state', () => {
  const project = tempProject('gstack-sync-script-only-');
  initRepo(project);
  const remote = addBareOrigin(project);
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'market-runner'), '#!/usr/bin/env bash\n');
  fs.writeFileSync(path.join(project, 'docs', 'discussion.md'), '# local discussion\n');

  const result = runSync(project, ['--script-only']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'synced');
  assert.equal(output.last_commit_status, 'committed');
  assert.equal(output.last_push_status, 'pushed');
  assert.deepEqual(output.excluded_files, [
    { path: 'docs/discussion.md', reason: 'outside_script_only_allowlist' },
  ]);
  const remoteFiles = run('git', ['--git-dir', remote, 'ls-tree', '-r', '--name-only', 'HEAD'], project)
    .stdout.split(/\r?\n/)
    .filter(Boolean);
  assert.equal(remoteFiles.includes('bin/market-runner'), true);
  assert.equal(remoteFiles.includes('docs/discussion.md'), false);
  assert.equal(status(project), '?? docs/discussion.md');
  const syncState = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'repository-sync.json'), 'utf8'));
  assert.equal(syncState.status, 'synced');
});

test('sync no-push commits locally and records local_only', () => {
  const project = tempProject('gstack-sync-no-push-');
  initRepo(project);
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'local-runner'), '#!/usr/bin/env bash\n');
  const before = head(project);

  const result = runSync(project, ['--script-only', '--no-push']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'local_only');
  assert.equal(output.last_commit_status, 'committed');
  assert.equal(output.last_push_status, 'skipped');
  assert.notEqual(head(project), before);
});

test('sync records push_failed when remote cannot be pushed', () => {
  const project = tempProject('gstack-sync-push-failed-');
  initRepo(project);
  run('git', ['remote', 'add', 'origin', '/tmp/gstack-sync-missing-remote.git'], project);
  fs.writeFileSync(path.join(project, 'README.md'), '# sync\n\ncannot push\n');
  run('git', ['add', 'README.md'], project);
  run('git', ['commit', '-m', 'docs: cannot push'], project);

  const result = runSync(project);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = parseJson(result);
  assert.equal(output.status, 'push_failed');
  assert.equal(output.last_push_status, 'failed');
  assert.equal(output.blockers.includes('push_failed'), true);
});
