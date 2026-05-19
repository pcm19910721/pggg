import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bridge = path.join(root, 'scripts', 'ai-context-bridge.mjs');

function tempGitProject() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-test-'));
  fs.mkdirSync(path.join(project, '.ai-context'), { recursive: true });
  fs.writeFileSync(path.join(project, '.ai-context', 'project.json'), JSON.stringify({
    project_id: 'bridge-test',
    repo_path: project,
    gitnexus: {
      repo: 'bridge-test',
      command: ['gitnexus'],
      fallback_command: ['missing-gitnexus-fallback'],
      prefer_local: true,
      embeddings: false,
      skip_agents_md: true,
      no_stats: true,
    },
  }, null, 2));
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'bridge@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Bridge Test'], { cwd: project, encoding: 'utf8' });
  fs.writeFileSync(path.join(project, 'tracked.txt'), 'initial\n');
  spawnSync('git', ['add', '.'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });
  return project;
}

function installFakeNvmGitNexus(home) {
  const bin = path.join(home, '.nvm', 'versions', 'node', 'v24.99.0', 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const gitnexus = path.join(bin, 'gitnexus');
  fs.writeFileSync(gitnexus, `#!/bin/sh
set -eu
if [ "$1" != "analyze" ]; then
  echo "unexpected command: $1" >&2
  exit 2
fi
repo="$2"
mkdir -p "$repo/.gitnexus"
commit="$(git -C "$repo" rev-parse HEAD)"
cat > "$repo/.gitnexus/meta.json" <<EOF
{"lastCommit":"$commit","indexedAt":"2026-05-10T00:00:00.000Z","stats":{"files":1,"nodes":1,"edges":0,"communities":1,"processes":1,"embeddings":0}}
EOF
exit 0
`);
  fs.chmodSync(gitnexus, 0o755);
  return gitnexus;
}

function installFakeDetectGitNexus(bin, risk = 'high') {
  fs.mkdirSync(bin, { recursive: true });
  const gitnexus = path.join(bin, 'gitnexus');
  fs.writeFileSync(gitnexus, `#!/bin/sh
set -eu
if [ "$1" != "detect-changes" ]; then
  echo "unexpected command: $1" >&2
  exit 2
fi
printf 'Changes: 99 files, 30 symbols\\n'
printf 'Affected processes: 9\\n'
printf 'Risk level: ${risk}\\n'
`);
  fs.chmodSync(gitnexus, 0o755);
  return gitnexus;
}

function installSilentDetectGitNexus(bin) {
  fs.mkdirSync(bin, { recursive: true });
  const gitnexus = path.join(bin, 'gitnexus');
  fs.writeFileSync(gitnexus, `#!/bin/sh
set -eu
if [ "$1" != "detect-changes" ]; then
  echo "unexpected command: $1" >&2
  exit 2
fi
printf 'Changes detected without risk line\\n'
`);
  fs.chmodSync(gitnexus, 0o755);
  return gitnexus;
}

test('refresh discovers GitNexus installed under HOME nvm when default PATH lacks gitnexus', () => {
  const project = tempGitProject();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-home-'));
  const gitnexus = installFakeNvmGitNexus(home);

  const result = spawnSync(process.execPath, [bridge, 'refresh'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      PATH: '/usr/bin:/bin',
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, new RegExp(gitnexus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const status = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'gitnexus-status.json'), 'utf8'));
  assert.equal(status.stale, false);
  assert.equal(status.last_commit, spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim());
});

test('postchange separates raw dirty worktree risk from session delta risk', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installFakeDetectGitNexus(fakeBin, 'high');
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  fs.writeFileSync(path.join(project, 'preexisting-dirty.txt'), 'already dirty\n');
  const baseline = spawnSync(process.execPath, [bridge, 'baseline'], {
    cwd: project,
    encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  fs.writeFileSync(path.join(project, 'session-change.txt'), 'this session\n');
  const postchange = spawnSync(process.execPath, [bridge, 'postchange', '--scope', 'all', '--run-id', 'dirty-baseline'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(postchange.status, 0, postchange.stderr || postchange.stdout);
  const run = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'runs', 'dirty-baseline', 'run.json'), 'utf8'));
  assert.equal(run.detect_risk, 'high');
  assert.equal(run.harness_scope_risk, 'needs_review');
  assert.equal(run.risk, 'needs_review');
  assert.equal(run.preexisting_dirty_worktree, true);
  assert.deepEqual(run.session_changed_files, ['session-change.txt']);
  assert.deepEqual(run.preexisting_dirty_files, ['preexisting-dirty.txt']);
  assert.equal(run.warnings.includes('gitnexus_high_due_preexisting_dirty_worktree'), true);
});

test('staged postchange reports only staged files in session delta', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installFakeDetectGitNexus(fakeBin, 'low');
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  const baseline = spawnSync(process.execPath, [bridge, 'baseline'], {
    cwd: project,
    encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  fs.writeFileSync(path.join(project, 'staged-change.txt'), 'staged\n');
  fs.writeFileSync(path.join(project, 'unstaged-change.txt'), 'unstaged\n');
  spawnSync('git', ['add', 'staged-change.txt'], { cwd: project, encoding: 'utf8' });

  const postchange = spawnSync(process.execPath, [bridge, 'postchange', '--scope', 'staged', '--run-id', 'staged-only'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(postchange.status, 0, postchange.stderr || postchange.stdout);
  const run = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'runs', 'staged-only', 'run.json'), 'utf8'));
  assert.equal(run.commit_gate, 'pass');
  assert.deepEqual(run.session_changed_files, ['staged-change.txt']);
});

test('staged postchange requires review when detect risk is unknown', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installSilentDetectGitNexus(fakeBin);
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  const baseline = spawnSync(process.execPath, [bridge, 'baseline'], {
    cwd: project,
    encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

  fs.writeFileSync(path.join(project, 'staged-change.txt'), 'staged\n');
  spawnSync('git', ['add', 'staged-change.txt'], { cwd: project, encoding: 'utf8' });

  const postchange = spawnSync(process.execPath, [bridge, 'postchange', '--scope', 'staged', '--run-id', 'staged-unknown'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(postchange.status, 0, postchange.stderr || postchange.stdout);
  const run = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'runs', 'staged-unknown', 'run.json'), 'utf8'));
  assert.equal(run.detect_risk, 'unknown');
  assert.equal(run.commit_gate, 'needs_review');
  assert.equal(run.warnings.includes('staged_detect_risk_unknown'), true);
});
