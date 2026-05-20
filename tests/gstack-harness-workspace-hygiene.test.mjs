import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hygieneBin = path.join(root, 'bin', 'gstack-harness-workspace-hygiene');

function tempGitProject(prefix = 'gstack-hygiene-test-') {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  spawnSync('git', ['init'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'hygiene@example.test'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Hygiene Test'], { cwd: project, encoding: 'utf8' });
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gstack', 'project-state.json'), JSON.stringify({
    schema: 'gstack-harness.project_state.v1',
    project_id: 'hygiene-test',
  }, null, 2));
  fs.writeFileSync(path.join(project, 'README.md'), '# test\n');
  spawnSync('git', ['add', '.'], { cwd: project, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: project, encoding: 'utf8' });
  return project;
}

function runHygiene(project, args = []) {
  return spawnSync(hygieneBin, ['--target', project, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
  });
}

test('workspace hygiene classifies target project artifacts and writes reports', () => {
  const project = tempGitProject();
  fs.mkdirSync(path.join(project, 'outputs', 'p1'), { recursive: true });
  fs.mkdirSync(path.join(project, 'TPW-amz', 'chrome-profile', 'Default', 'Network'), { recursive: true });
  fs.mkdirSync(path.join(project, 'captures', 'run1'), { recursive: true });
  fs.mkdirSync(path.join(project, '.gitnexus'), { recursive: true });
  fs.writeFileSync(path.join(project, 'outputs', 'p1', 'image.png'), Buffer.alloc(11 * 1024 * 1024));
  fs.writeFileSync(path.join(project, 'TPW-amz', 'chrome-profile', 'Default', 'Network', 'Cookies'), 'cookie-db\n');
  fs.writeFileSync(path.join(project, 'captures', 'run1', 'raw.jsonl'), '{}\n');
  fs.writeFileSync(path.join(project, '.env'), 'TOKEN=secret\n');
  fs.writeFileSync(path.join(project, 'CLAUDE.md.bak-20260520-010101'), '# backup\n');
  fs.writeFileSync(path.join(project, '.gitnexus', 'meta.json'), '{}\n');
  fs.writeFileSync(path.join(project, 'feature.js'), 'console.log("ok");\n');

  const result = runHygiene(project);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const reportPath = path.join(project, 'docs', 'WORKSPACE_HYGIENE_REPORT.md');
  const jsonPath = path.join(project, '.gstack', 'workspace-hygiene.json');
  const agentJsonPath = path.join(project, 'docs', 'agents', 'workspace-hygiene.json');
  assert.equal(fs.existsSync(reportPath), true);
  assert.equal(fs.existsSync(jsonPath), true);
  assert.equal(fs.existsSync(agentJsonPath), true);

  const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(report.schema, 'gstack-harness.workspace_hygiene.v1');
  assert.equal(report.buckets.secret_risk.count >= 2, true);
  assert.equal(report.buckets.runtime_artifact.count >= 2, true);
  assert.equal(report.buckets.harness_owned.count >= 1, true);
  assert.equal(report.buckets.large_asset.count >= 1, true);
  assert.equal(report.buckets.backup_noise.count >= 1, true);
  assert.equal(report.buckets.source_candidate.items.some((item) => item.path === 'feature.js'), true);
  assert.equal(report.secret_risks.some((item) => item.path === '.env'), true);
  assert.equal(report.secret_risks.some((item) => item.path.endsWith('Cookies')), true);
  assert.equal(report.large_assets.some((item) => item.path === 'outputs/p1/image.png'), true);
  assert.equal(report.ignore_recommendations.some((item) => item.pattern === 'outputs/'), true);
  assert.equal(report.ignore_recommendations.some((item) => item.pattern === '**/chrome-profile/'), true);
  assert.equal(report.relocation_recommendations.some((item) => item.path === 'outputs/p1/image.png'), true);

  const markdown = fs.readFileSync(reportPath, 'utf8');
  assert.match(markdown, /# Workspace Hygiene Report/);
  assert.match(markdown, /Secret And Sign-In State Risks/);
  assert.match(markdown, /Gitignore Recommendations/);
});

test('workspace hygiene classifies cloudcontrol-style packages and generated service output', () => {
  const project = tempGitProject('gstack-hygiene-cloudcontrol-');
  fs.mkdirSync(path.join(project, 'cloudcontrolprojects', 'apk-download-service', 'public-files'), { recursive: true });
  fs.mkdirSync(path.join(project, 'cloudcontrolprojects', 'apk-download-service', 'dist'), { recursive: true });
  fs.mkdirSync(path.join(project, 'cloudcontrolprojects', 'apk'), { recursive: true });
  fs.mkdirSync(path.join(project, 'cloudctl', 'artifacts', 'device-1'), { recursive: true });
  fs.mkdirSync(path.join(project, 'dashboard-runs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'cloudcontrolprojects', 'apk-download-service', 'public-files', 'release.apk'), Buffer.alloc(12 * 1024 * 1024));
  fs.writeFileSync(path.join(project, 'cloudcontrolprojects', 'apk-download-service', 'dist', 'bundle.zip'), Buffer.alloc(1024));
  fs.writeFileSync(path.join(project, 'cloudcontrolprojects', 'apk', 'firmware.img'), Buffer.alloc(1024));
  fs.writeFileSync(path.join(project, 'cloudctl', 'artifacts', 'device-1', 'tree.json'), '{}\n');
  fs.writeFileSync(path.join(project, 'dashboard-runs', 'qa.log'), 'dashboard run\n');
  fs.writeFileSync(path.join(project, '.env.local.txt'), 'TOKEN=secret\n');

  const result = runHygiene(project);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'workspace-hygiene.json'), 'utf8'));
  assert.equal(report.secret_risks.some((item) => item.path === '.env.local.txt'), true);
  assert.equal(report.large_assets.some((item) => item.path.endsWith('release.apk')), true);
  assert.equal(report.large_assets.some((item) => item.path.endsWith('bundle.zip')), true);
  assert.equal(report.large_assets.some((item) => item.path.endsWith('firmware.img')), true);
  assert.equal(report.runtime_artifacts.some((item) => item.path.includes('/dist/')), true);
  assert.equal(report.runtime_artifacts.some((item) => item.path.startsWith('cloudctl/artifacts/')), true);
  assert.equal(report.runtime_artifacts.some((item) => item.path.endsWith('qa.log')), true);
  assert.equal(report.ignore_recommendations.some((item) => item.pattern === '**/dist/'), true);
  assert.equal(report.ignore_recommendations.some((item) => item.pattern === '**/artifacts/'), true);
  assert.equal(report.ignore_recommendations.some((item) => item.pattern === '*.apk'), true);
  assert.equal(report.relocation_recommendations.some((item) => item.path.endsWith('release.apk') && item.target === 'artifacts/'), true);
});

test('workspace hygiene baseline and delta report QA growth', () => {
  const project = tempGitProject('gstack-hygiene-delta-');
  const baseline = runHygiene(project, ['baseline']);
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);
  assert.equal(fs.existsSync(path.join(project, '.gstack', 'workspace-hygiene-baseline.json')), true);

  fs.mkdirSync(path.join(project, 'output', 'playwright'), { recursive: true });
  fs.writeFileSync(path.join(project, 'output', 'playwright', 'page.png'), Buffer.alloc(2 * 1024 * 1024));
  fs.writeFileSync(path.join(project, '.env.local'), 'TOKEN=secret\n');

  const delta = runHygiene(project, ['delta']);
  assert.equal(delta.status, 0, delta.stderr || delta.stdout);

  const report = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'workspace-hygiene.json'), 'utf8'));
  assert.equal(report.delta.added_files >= 2, true);
  assert.equal(report.delta.added_size_bytes >= 2 * 1024 * 1024, true);
  assert.equal(report.delta.new_secret_risks.some((item) => item.path === '.env.local'), true);
  assert.equal(report.delta.new_runtime_artifacts.some((item) => item.path === 'output/playwright/page.png'), true);
});

test('workspace hygiene commit gate blocks staged secrets and runtime artifacts', () => {
  const project = tempGitProject('gstack-hygiene-gate-');
  fs.mkdirSync(path.join(project, 'chrome-cdp-profile', 'Default', 'Network'), { recursive: true });
  fs.writeFileSync(path.join(project, '.env'), 'TOKEN=secret\n');
  fs.writeFileSync(path.join(project, 'chrome-cdp-profile', 'Default', 'Network', 'Cookies'), 'cookie\n');
  fs.writeFileSync(path.join(project, 'release.apk'), 'apk\n');
  spawnSync('git', ['add', '.env', 'chrome-cdp-profile/Default/Network/Cookies', 'release.apk'], { cwd: project, encoding: 'utf8' });

  const result = runHygiene(project, ['gate']);
  assert.equal(result.status, 1, result.stderr || result.stdout);

  const report = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'workspace-hygiene.json'), 'utf8'));
  assert.equal(report.commit_gate, 'blocked');
  assert.equal(report.blockers.includes('secret_risk_staged'), true);
  assert.equal(report.blockers.includes('browser_profile_staged'), true);
  assert.equal(report.warnings.includes('large_asset_staged'), true);
  assert.equal(report.staged_risks.some((item) => item.path === '.env'), true);
  assert.equal(report.staged_risks.some((item) => item.path.endsWith('Cookies')), true);
});
