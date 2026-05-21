import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evaluateBin = path.join(root, 'bin', 'gstack-harness-evaluate');
const testPath = `${path.dirname(process.execPath)}:/usr/bin:/bin`;

function writeExecutable(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  fs.chmodSync(file, 0o755);
}

function tempGitProject() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-evaluate-test-'));
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'README.md'), '# evaluate test\n');
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'evaluate@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Evaluate Test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['add', '.'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });
  return project;
}

test('evaluation runner records multi-round harness readiness scorecard', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-evaluate-bin-'));
  const initLog = path.join(fakeBin, 'init.log');

  writeExecutable(path.join(fakeBin, 'init'), `#!/usr/bin/env bash
printf 'init %s\\n' "$*" >> "${initLog}"
mkdir -p "$2/.gstack" "$2/docs"
exit 0
`);
  writeExecutable(path.join(fakeBin, 'readiness'), `#!/usr/bin/env bash
cat <<'JSON'
{
  "status": "ready",
  "git": "ready",
  "github_cli": {
    "status": "ready",
    "auth": "authenticated",
    "command": "gh",
    "owns": ["github_remote", "ci_runs", "pull_requests", "workflow_runs"]
  },
  "repository": { "status": "ready" },
  "long_term_readiness": { "status": "ready", "blockers": [] },
  "code_context": "ready",
  "workspace_hygiene": { "status": "unknown" },
  "blockers": [],
  "warnings": []
}
JSON
`);
  writeExecutable(path.join(fakeBin, 'hygiene'), `#!/usr/bin/env bash
cat <<'JSON'
{
  "status": "warning",
  "git": { "status_count": 0 },
  "buckets": {
    "backup_noise": { "count": 0 },
    "secret_risk": { "count": 0 },
    "large_asset": { "count": 0 }
  },
  "warnings": ["runtime_artifacts_detected"],
  "blockers": []
}
JSON
`);

  const result = spawnSync(evaluateBin, [
    '--target', project,
    '--rounds', '3',
    '--json',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      PATH: testPath,
      GSTACK_HARNESS_INIT_BIN: path.join(fakeBin, 'init'),
      GSTACK_HARNESS_READINESS_BIN: path.join(fakeBin, 'readiness'),
      GSTACK_HARNESS_HYGIENE_BIN: path.join(fakeBin, 'hygiene'),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.schema, 'gstack-harness.evaluation.v1');
  assert.equal(summary.rounds.length, 3);
  assert.equal(summary.summary.rounds, 3);
  assert.equal(summary.summary.readiness_ready_rounds, 3);
  assert.equal(summary.summary.github_cli_ready_rounds, 3);
  assert.equal(summary.summary.backup_noise_rounds, 0);
  assert.equal(summary.summary.scattered_backup_rounds, 0);
  assert.equal(summary.summary.overall_status, 'ready');

  const jsonPath = path.join(project, '.gstack', 'harness-evaluation.json');
  const reportPath = path.join(project, 'docs', 'HARNESS_EVALUATION_REPORT.md');
  assert.equal(fs.existsSync(jsonPath), true);
  assert.equal(fs.existsSync(reportPath), true);
  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /# Harness Evaluation Report/);
  assert.match(report, /Rounds: 3/);
  assert.match(report, /GitHub CLI Ready Rounds: 3\/3/);
  assert.match(report, /\| Round \| Readiness \| Git \| GitHub CLI \| Code Context \| Backup Noise \| Scattered Backups \| Status Count \|/);
  assert.equal(fs.readFileSync(initLog, 'utf8').trim().split(/\r?\n/).length, 3);
});

test('evaluation runner can run init once before repeated readiness rounds', () => {
  const project = tempGitProject();
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-evaluate-once-bin-'));
  const initLog = path.join(fakeBin, 'init.log');

  writeExecutable(path.join(fakeBin, 'init'), `#!/usr/bin/env bash
printf 'init %s\\n' "$*" >> "${initLog}"
exit 0
`);
  writeExecutable(path.join(fakeBin, 'readiness'), `#!/usr/bin/env bash
printf '{"status":"ready","git":"ready","github_cli":{"status":"ready","auth":"authenticated"},"repository":{"status":"ready"},"long_term_readiness":{"status":"ready"},"code_context":"ready","blockers":[],"warnings":[]}\\n'
`);
  writeExecutable(path.join(fakeBin, 'hygiene'), `#!/usr/bin/env bash
printf '{"status":"warning","git":{"status_count":0},"buckets":{"backup_noise":{"count":0},"secret_risk":{"count":0},"large_asset":{"count":0}},"warnings":[],"blockers":[]}\\n'
`);

  const result = spawnSync(evaluateBin, [
    '--target', project,
    '--rounds', '4',
    '--init-mode', 'once',
    '--json',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      PATH: testPath,
      GSTACK_HARNESS_INIT_BIN: path.join(fakeBin, 'init'),
      GSTACK_HARNESS_READINESS_BIN: path.join(fakeBin, 'readiness'),
      GSTACK_HARNESS_HYGIENE_BIN: path.join(fakeBin, 'hygiene'),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.init_mode, 'once');
  assert.equal(summary.rounds.length, 4);
  assert.equal(summary.rounds[0].init.status, 0);
  assert.equal(summary.rounds[1].init.status, 'skipped');
  assert.equal(fs.readFileSync(initLog, 'utf8').trim().split(/\r?\n/).length, 1);
});
