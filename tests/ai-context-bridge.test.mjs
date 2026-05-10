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
