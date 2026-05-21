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

function tempNonGitProject() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-non-git-'));
  fs.mkdirSync(path.join(project, '.ai-context'), { recursive: true });
  fs.writeFileSync(path.join(project, '.ai-context', 'project.json'), JSON.stringify({
    project_id: 'bridge-non-git',
    repo_path: project,
    gitnexus: {
      repo: 'bridge-non-git',
      command: ['gitnexus'],
      fallback_command: ['missing-gitnexus-fallback'],
      prefer_local: true,
      embeddings: false,
      skip_agents_md: true,
      no_stats: true,
    },
  }, null, 2));
  fs.writeFileSync(path.join(project, 'README.md'), '# non git bundle\n');
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

test('baseline records structured fallback in non-git bundles', () => {
  const project = tempNonGitProject();

  const result = spawnSync(process.execPath, [bridge, 'baseline'], {
    cwd: project,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const baseline = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'change-baseline.json'), 'utf8'));
  assert.equal(baseline.repository_state.status, 'not_git_repo');
  assert.equal(baseline.branch, 'not-a-git-repo');
  assert.deepEqual(baseline.dirty_files, []);
  assert.match(result.stdout, /not_git_repo/);
});

test('postchange writes structured fallback run in non-git bundles', () => {
  const project = tempNonGitProject();

  const result = spawnSync(process.execPath, [bridge, 'postchange', '--scope', 'all', '--run-id', 'non-git-fallback'], {
    cwd: project,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const run = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'runs', 'non-git-fallback', 'run.json'), 'utf8'));
  assert.equal(run.repository_state.status, 'not_git_repo');
  assert.equal(run.risk, 'unknown');
  assert.equal(run.commit_gate, 'blocked');
  assert.equal(run.risk_source, 'non_git_fallback');
  assert.equal(run.detect_changes_ok, false);
  assert.match(fs.readFileSync(path.join(project, 'docs', 'CODE_CONTEXT_REPORT.md'), 'utf8'), /Status: missing/);
});

function installFakeGbrain(bin, pages = {}) {
  fs.mkdirSync(bin, { recursive: true });
  const store = path.join(bin, 'gbrain-pages.json');
  fs.writeFileSync(store, JSON.stringify(pages, null, 2));
  const gbrain = path.join(bin, 'gbrain');
  fs.writeFileSync(gbrain, `#!/usr/bin/env node
const fs = require('fs');
const store = ${JSON.stringify(store)};
const pages = JSON.parse(fs.readFileSync(store, 'utf8'));
const [command, slug] = process.argv.slice(2);
if (command === '--version') {
  console.log('gbrain-test 0.0.0');
  process.exit(0);
}
if (command === 'get') {
  if (Object.prototype.hasOwnProperty.call(pages, slug)) {
    process.stdout.write(pages[slug]);
    process.exit(0);
  }
  process.exit(1);
}
if (command === 'query') {
  console.log('ok');
  process.exit(0);
}
process.exit(0);
`);
  fs.chmodSync(gbrain, 0o755);
  return gbrain;
}

function installTimeoutGbrain(bin, pages = {}, timeoutSlugs = []) {
  fs.mkdirSync(bin, { recursive: true });
  const store = path.join(bin, 'gbrain-pages.json');
  fs.writeFileSync(store, JSON.stringify(pages, null, 2));
  const gbrain = path.join(bin, 'gbrain');
  fs.writeFileSync(gbrain, `#!/usr/bin/env node
const fs = require('fs');
const store = ${JSON.stringify(store)};
const pages = JSON.parse(fs.readFileSync(store, 'utf8'));
const timeoutSlugs = new Set(${JSON.stringify(timeoutSlugs)});
const [command, slug] = process.argv.slice(2);
if (command === '--version') {
  console.log('gbrain-test 0.0.0');
  process.exit(0);
}
if (command === 'get') {
  if (timeoutSlugs.has(slug)) process.exit(124);
  if (Object.prototype.hasOwnProperty.call(pages, slug)) {
    process.stdout.write(pages[slug]);
    process.exit(0);
  }
  process.exit(1);
}
if (command === 'query') {
  console.log('ok');
  process.exit(0);
}
process.exit(0);
`);
  fs.chmodSync(gbrain, 0o755);
  return gbrain;
}

function installRecordingGbrain(bin, logPath) {
  fs.mkdirSync(bin, { recursive: true });
  const gbrain = path.join(bin, 'gbrain');
  fs.writeFileSync(gbrain, `#!/usr/bin/env node
const fs = require('fs');
const [command, slug] = process.argv.slice(2);
if (command === '--version') {
  console.log('gbrain-test 0.0.0');
  process.exit(0);
}
if (command === 'get') {
  console.log('# existing');
  process.exit(0);
}
if (command === 'query') {
  console.log('ok');
  process.exit(0);
}
if (command === 'put') {
  fs.appendFileSync(${JSON.stringify(logPath)}, slug + '\\n');
  process.exit(0);
}
process.exit(0);
`);
  fs.chmodSync(gbrain, 0o755);
  return gbrain;
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

test('staged postchange incorporates workspace hygiene commit gate blockers', () => {
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

  fs.writeFileSync(path.join(project, '.env'), 'TOKEN=secret\n');
  spawnSync('git', ['add', '.env'], { cwd: project, encoding: 'utf8' });

  const postchange = spawnSync(process.execPath, [bridge, 'postchange', '--scope', 'staged', '--run-id', 'staged-hygiene'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(postchange.status, 0, postchange.stderr || postchange.stdout);
  const run = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'runs', 'staged-hygiene', 'run.json'), 'utf8'));
  assert.equal(run.detect_risk, 'low');
  assert.equal(run.commit_gate, 'blocked');
  assert.equal(run.workspace_hygiene.commit_gate, 'blocked');
  assert.equal(run.workspace_hygiene.blockers.includes('secret_risk_staged'), true);
  assert.equal(run.warnings.includes('workspace_hygiene_commit_gate_blocked'), true);
});

test('memory-check reports stale code context and missing gbrain pages', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installFakeGbrain(fakeBin, {
    'project/bridge-test/overview': 'type: project_overview\n',
    'project/bridge-test/gitnexus-index': 'type: gitnexus_index\nindexed_commit: older-commit\n',
  });

  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: 'old-commit',
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));
  fs.writeFileSync(path.join(project, 'tracked.txt'), 'changed after index\n');
  spawnSync('git', ['add', 'tracked.txt'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'change after index'], { cwd: project, encoding: 'utf8' });

  const result = spawnSync(process.execPath, [bridge, 'memory-check'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.verdict, 'partial');
  assert.equal(report.gitnexus.status, 'stale');
  assert.equal(report.gbrain.status, 'missing');
  assert.equal(report.local_artifacts.status, 'missing');
  assert.equal(report.gbrain.missing_pages.includes('project/bridge-test/state'), true);
  assert.equal(report.gbrain.stale_pages.includes('project/bridge-test/gitnexus-index'), true);
  assert.equal(report.conflicts.some((conflict) => conflict.field === 'gitnexus_indexed_commit'), true);
});

test('memory-check reports gbrain get timeouts separately from missing pages', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installTimeoutGbrain(fakeBin, {
    'project/bridge-test/overview': 'type: project_overview\n',
    'project/bridge-test/state': 'type: project_state\n',
  }, ['project/bridge-test/state']);

  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  const result = spawnSync(process.execPath, [bridge, 'memory-check'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.gbrain.status, 'timeout');
  assert.equal(report.gbrain.timeout_pages.includes('project/bridge-test/state'), true);
  assert.equal(report.gbrain.missing_pages.includes('project/bridge-test/state'), false);
  assert.equal(report.next_actions.includes('inspect gbrain latency or rerun memory-check'), true);
});

test('sync-gbrain can write a minimal page set and reports per-page progress', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  const logPath = path.join(fakeBin, 'gbrain-put.log');
  installRecordingGbrain(fakeBin, logPath);
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  const result = spawnSync(process.execPath, [
    bridge,
    'sync-gbrain',
    '--page', 'state',
    '--page', 'handoff',
  ], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.pages_selected.map((page) => page.key), ['state', 'handoff']);
  assert.deepEqual(fs.readFileSync(logPath, 'utf8').trim().split(/\r?\n/), [
    'project/bridge-test/state',
    'project/bridge-test/handoff',
  ]);
  assert.match(result.stderr, /sync-gbrain writing 1\/2 state project\/bridge-test\/state/);
  assert.match(result.stderr, /sync-gbrain writing 2\/2 handoff project\/bridge-test\/handoff/);
});

test('sync-gbrain allows project uid migration when existing page repo path matches', () => {
  const project = tempGitProject();
  spawnSync('git', ['remote', 'add', 'origin', 'git@github.com:example/bridge-test.git'], { cwd: project, encoding: 'utf8' });
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-bridge-bin-'));
  installFakeGbrain(fakeBin, {
    'project/bridge-test/overview': `---
type: project_overview
project: bridge-test
project_uid: old-path-derived-id
repo_path: ${JSON.stringify(project)}
---

# Project Overview
`,
  });
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), JSON.stringify({
    lastCommit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim(),
    indexedAt: '2026-05-10T00:00:00.000Z',
    stats: { files: 1, nodes: 1, edges: 0 },
  }));

  const result = spawnSync(process.execPath, [bridge, 'sync-gbrain', '--page', 'state'], {
    cwd: project,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'synced');
  assert.deepEqual(report.pages_selected.map((page) => page.key), ['state']);
});
