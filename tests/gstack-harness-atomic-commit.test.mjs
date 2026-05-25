import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const atomicCommitBin = path.join(root, 'bin', 'gstack-harness-atomic-commit');

function tempGitProject(prefix = 'gstack-atomic-commit-') {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'atomic@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Atomic Commit Test'], { cwd: project, encoding: 'utf8' });
  fs.writeFileSync(path.join(project, 'README.md'), '# test\n');
  spawnSync('git', ['add', 'README.md'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });
  return project;
}

function runAtomic(project, args = [], env = process.env) {
  return spawnSync(atomicCommitBin, ['--target', project, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    env,
  });
}

function commitCount(project) {
  const result = spawnSync('git', ['rev-list', '--count', 'HEAD'], {
    cwd: project,
    encoding: 'utf8',
  });
  return Number(result.stdout.trim());
}

function createPassingBridge(project) {
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(project, 'scripts', 'ai-context-bridge.mjs'), `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const command = process.argv[2];
if (command === 'baseline') {
  fs.mkdirSync('.ai-context', { recursive: true });
  fs.appendFileSync('.ai-context/baseline-calls.log', 'baseline\\n');
  fs.writeFileSync('.ai-context/change-baseline.json', JSON.stringify({ refreshed: true }) + '\\n');
  process.exit(0);
}
if (command === 'postchange') {
  const runId = process.argv[process.argv.indexOf('--run-id') + 1];
  const dir = path.join('.ai-context', 'runs', runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ commit_gate: 'pass' }) + '\\n');
  process.exit(0);
}
process.exit(2);
`, 'utf8');
  spawnSync('git', ['add', 'scripts/ai-context-bridge.mjs'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'install fake bridge'], { cwd: project, encoding: 'utf8' });
}

function createBlockedBridge(project) {
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(project, 'scripts', 'ai-context-bridge.mjs'), `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const command = process.argv[2];
if (command === 'baseline') process.exit(0);
if (command === 'postchange') {
  const runId = process.argv[process.argv.indexOf('--run-id') + 1];
  const dir = path.join('.ai-context', 'runs', runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ commit_gate: 'blocked', warnings: ['test_blocked'] }) + '\\n');
  process.exit(0);
}
process.exit(2);
`, 'utf8');
  spawnSync('git', ['add', 'scripts/ai-context-bridge.mjs'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'install fake bridge'], { cwd: project, encoding: 'utf8' });
}

function createAliasSensitiveBridge(project) {
  fs.mkdirSync(path.join(project, '.ai-context'), { recursive: true });
  fs.writeFileSync(path.join(project, '.ai-context', 'project.json'), JSON.stringify({
    gitnexus: { repo: 'gstack-multiagent' },
  }, null, 2));
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(project, 'scripts', 'ai-context-bridge.mjs'), `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const command = process.argv[2];
if (command === 'baseline') process.exit(0);
if (command === 'postchange') {
  const config = JSON.parse(fs.readFileSync('.ai-context/project.json', 'utf8'));
  if (config.gitnexus.repo !== 'pggg') {
    console.error('Error: Repository "gstack-multiagent" not found. Available: pggg');
    process.exit(1);
  }
  const runId = process.argv[process.argv.indexOf('--run-id') + 1];
  const dir = path.join('.ai-context', 'runs', runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ commit_gate: 'pass' }) + '\\n');
  process.exit(0);
}
process.exit(2);
`, 'utf8');
  spawnSync('git', ['add', '.ai-context/project.json', 'scripts/ai-context-bridge.mjs'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'install alias bridge'], { cwd: project, encoding: 'utf8' });
}

function createFakeGitNexusList(project) {
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-atomic-gitnexus-'));
  const gitnexus = path.join(fakeBin, 'gitnexus');
  fs.writeFileSync(gitnexus, `#!/usr/bin/env bash
if [ "$1" = "list" ]; then
  cat <<'OUT'
Indexed Repositories (1)

  pggg
    Path:    ${project}
    Indexed: today
OUT
  exit 0
fi
exit 2
`, 'utf8');
  fs.chmodSync(gitnexus, 0o755);
  return fakeBin;
}

function createNoIndexedChangesBridge(project) {
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(project, 'scripts', 'ai-context-bridge.mjs'), `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const command = process.argv[2];
if (command === 'baseline') process.exit(0);
if (command === 'postchange') {
  const runId = process.argv[process.argv.indexOf('--run-id') + 1];
  const dir = path.join('.ai-context', 'runs', runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'detect-changes.txt'), 'No changes detected.\\n');
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({
    commit_gate: 'needs_review',
    session_changed_files: ['bin/new-runner'],
    workspace_hygiene: { commit_gate: 'pass' }
  }) + '\\n');
  process.exit(0);
}
process.exit(2);
`, 'utf8');
  spawnSync('git', ['add', 'scripts/ai-context-bridge.mjs'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'install no-index bridge'], { cwd: project, encoding: 'utf8' });
}

test('atomic commit dry-run groups changes without committing', () => {
  const project = tempGitProject();
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(project, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(project, 'docs', 'guide.md'), '# guide\n');
  fs.writeFileSync(path.join(project, 'tests', 'sample.test.mjs'), 'import test from "node:test";\n');
  fs.writeFileSync(path.join(project, 'WORKFLOW_RECIPES.md'), '# recipes\n');
  fs.writeFileSync(path.join(project, '.gitignore'), 'node_modules/\n');

  const result = runAtomic(project, ['--dry-run']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /docs: update harness documentation/);
  assert.match(result.stdout, /test: update harness tests/);
  assert.match(result.stdout, /docs: update project protocol/);
  assert.equal(commitCount(project), 1);
  assert.equal(spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: project, encoding: 'utf8' }).stdout.trim(), '');
});

test('atomic commit creates safe grouped commits and refreshes baseline', () => {
  const project = tempGitProject('gstack-atomic-commit-pass-');
  createPassingBridge(project);
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(project, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(project, 'docs', 'guide.md'), '# guide\n');
  fs.writeFileSync(path.join(project, 'tests', 'sample.test.mjs'), 'import test from "node:test";\n');
  const before = commitCount(project);

  const result = runAtomic(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(commitCount(project), before + 2);
  const log = spawnSync('git', ['log', '--oneline', '--format=%s', '-2'], {
    cwd: project,
    encoding: 'utf8',
  }).stdout;
  assert.match(log, /test: update harness tests/);
  assert.match(log, /docs: update harness documentation/);
  const baselineCalls = fs.readFileSync(path.join(project, '.ai-context', 'baseline-calls.log'), 'utf8');
  assert.equal(baselineCalls.split(/\r?\n/).filter(Boolean).length >= 2, true);
});

test('atomic commit stops without committing when staged gate is blocked', () => {
  const project = tempGitProject('gstack-atomic-commit-blocked-');
  createBlockedBridge(project);
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'docs', 'guide.md'), '# guide\n');
  const before = commitCount(project);

  const result = runAtomic(project);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr + result.stdout, /blocked/);
  assert.equal(commitCount(project), before);
  assert.equal(spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: project, encoding: 'utf8' }).stdout.trim(), '');
});

test('atomic commit retries staged gate with matching GitNexus repo alias', () => {
  const project = tempGitProject('gstack-atomic-commit-alias-');
  createAliasSensitiveBridge(project);
  const fakeBin = createFakeGitNexusList(project);
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'docs', 'guide.md'), '# guide\n');
  const before = commitCount(project);

  const result = runAtomic(project, [], {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH}`,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(commitCount(project), before + 1);
  const config = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'project.json'), 'utf8'));
  assert.equal(config.gitnexus.repo, 'gstack-multiagent');
});

test('atomic commit allows known groups when GitNexus reports no indexed changes', () => {
  const project = tempGitProject('gstack-atomic-commit-no-indexed-');
  createNoIndexedChangesBridge(project);
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'new-runner'), '#!/usr/bin/env bash\n');
  const before = commitCount(project);

  const result = runAtomic(project);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(commitCount(project), before + 1);
});

test('script-only dry-run includes script files and reports excluded files', () => {
  const project = tempGitProject('gstack-atomic-commit-script-only-');
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'runner'), '#!/usr/bin/env bash\n');
  fs.writeFileSync(path.join(project, 'scripts', 'runner.mjs'), 'console.log("run");\n');
  fs.writeFileSync(path.join(project, 'docs', 'plan.md'), '# plan\n');
  fs.writeFileSync(path.join(project, 'WORKFLOW_RECIPES.md'), '# recipes\n');
  fs.writeFileSync(path.join(project, 'notes.txt'), 'local note\n');

  const result = runAtomic(project, ['--script-only', '--dry-run', '--json']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.deepEqual(summary.groups.map((group) => group.id), ['harness']);
  assert.deepEqual(summary.groups[0].files, ['bin/runner', 'scripts/runner.mjs']);
  assert.equal(summary.script_only, true);
  assert.deepEqual(summary.excluded_files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)), [
    { path: 'WORKFLOW_RECIPES.md', reason: 'outside_script_only_allowlist' },
    { path: 'docs/plan.md', reason: 'outside_script_only_allowlist' },
    { path: 'notes.txt', reason: 'outside_script_only_allowlist' },
  ]);
  assert.equal(commitCount(project), 1);
});

test('script-only push commits allowed scripts to origin current branch only', () => {
  const project = tempGitProject('gstack-atomic-commit-script-push-');
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-atomic-remote-'));
  spawnSync('git', ['init', '--bare'], { cwd: remote, encoding: 'utf8' });
  spawnSync('git', ['remote', 'add', 'origin', remote], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['push', '-u', 'origin', 'HEAD'], { cwd: project, encoding: 'utf8' });
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'market-runner'), '#!/usr/bin/env bash\n');
  fs.writeFileSync(path.join(project, 'docs', 'local-discussion.md'), '# local\n');
  const before = commitCount(project);

  const result = runAtomic(project, ['--script-only', '--push', '--json']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(commitCount(project), before + 1);
  assert.equal(summary.push.status, 'pushed');
  assert.equal(summary.push.remote, 'origin');
  const remoteFiles = spawnSync('git', ['--git-dir', remote, 'ls-tree', '-r', '--name-only', 'HEAD'], {
    encoding: 'utf8',
  }).stdout.split(/\r?\n/).filter(Boolean);
  assert.equal(remoteFiles.includes('bin/market-runner'), true);
  assert.equal(remoteFiles.includes('docs/local-discussion.md'), false);
  assert.equal(fs.existsSync(path.join(project, 'docs', 'local-discussion.md')), true);
});
