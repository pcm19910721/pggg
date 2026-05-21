import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineBin = path.join(root, 'bin', 'gstack-harness-repository-baseline');
const testPath = `${path.dirname(process.execPath)}:/usr/bin:/bin`;

function nonGitProject(prefix = 'gstack-repository-baseline-') {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(project, '.gstack'), { recursive: true });
  fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'README.md'), '# test project\n');
  fs.writeFileSync(path.join(project, 'app.js'), 'console.log("ready");\n');
  fs.writeFileSync(path.join(project, '.gstack', 'project-state.json'), JSON.stringify({
    schema: 'gstack-harness.project_state.v1',
    project_id: 'repository-baseline-test',
    repository: {
      status: 'needs_git_baseline',
      git: 'missing',
      baseline_required: true,
      next_action: 'initialize git baseline after user confirmation',
    },
    long_term_readiness: {
      status: 'blocked_until_git',
      blockers: ['needs_git_baseline'],
    },
    quality_gates: {
      foundation_readiness: 'partial',
      code_context: 'blocked_until_git',
    },
    next_recommended_agent: 'Foundation Remediation Agent',
    next_recommended_recipe: 'Repository Baseline Gate',
  }, null, 2));
  return project;
}

function runBaseline(project, args = [], env = process.env) {
  return spawnSync(baselineBin, ['--target', project, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...env,
      PATH: env.PATH || testPath,
    },
  });
}

test('repository baseline requires explicit confirmation before git init', () => {
  const project = nonGitProject('gstack-repository-baseline-confirm-');

  const result = runBaseline(project, ['--json']);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(project, '.git')), false);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.status, 'requires_confirmation');
  assert.equal(summary.repository.status, 'needs_git_baseline');
  assert.equal(fs.existsSync(path.join(project, '.gstack', 'repository-baseline.json')), true);
  assert.equal(fs.existsSync(path.join(project, 'docs', 'REPOSITORY_BASELINE_REPORT.md')), true);
});

test('repository baseline initializes git and unlocks long-term readiness after confirmation', () => {
  const project = nonGitProject('gstack-repository-baseline-init-');
  fs.mkdirSync(path.join(project, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(project, '.ai-context'), { recursive: true });
  fs.writeFileSync(path.join(project, '.ai-context', 'project.json'), JSON.stringify({
    project_id: 'repository-baseline-test',
    repo_path: '/stale/source/copy',
    gitnexus: { repo: 'stale-source-copy' },
  }, null, 2));
  fs.writeFileSync(path.join(project, 'scripts', 'ai-context-bridge.mjs'), `#!/usr/bin/env node
import fs from 'node:fs';
const command = process.argv[2];
if (command === 'baseline') {
  const config = JSON.parse(fs.readFileSync('.ai-context/project.json', 'utf8'));
  fs.writeFileSync('.ai-context/change-baseline.json', JSON.stringify({
    status: 'ready',
    repo_path: config.repo_path,
    gitnexus_repo: config.gitnexus.repo
  }) + '\\n');
  process.exit(0);
}
process.exit(2);
`);
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-repository-baseline-bin-'));
  const gitnexusArgsLog = path.join(fakeBin, 'gitnexus-args.log');
  const gitnexus = path.join(fakeBin, 'gitnexus');
  fs.writeFileSync(gitnexus, `#!/usr/bin/env bash
if [ "$1" = "analyze" ]; then
  printf '%s\\n' "$*" >> "${gitnexusArgsLog}"
  [[ "$*" == *"--skip-agents-md"* ]] || { echo "missing --skip-agents-md" >&2; exit 3; }
  [[ "$*" == *"--no-stats"* ]] || { echo "missing --no-stats" >&2; exit 3; }
  mkdir -p .gitnexus
  head=$(git rev-parse HEAD 2>/dev/null || true)
  printf '{"indexed":true,"lastCommit":"%s"}\\n' "$head" > .gitnexus/meta.json
  exit 0
fi
exit 2
`);
  fs.chmodSync(gitnexus, 0o755);

  const result = runBaseline(project, ['--yes', '--json'], {
    ...process.env,
    PATH: `${fakeBin}:${testPath}`,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.status, 'ready');
  assert.equal(summary.repository.status, 'ready');
  assert.equal(summary.git.initialized, true);
  assert.equal(summary.gitnexus.status, 'ready');
  assert.equal(summary.ai_context_baseline.status, 'ready');

  const commitCount = spawnSync('git', ['rev-list', '--count', 'HEAD'], {
    cwd: project,
    encoding: 'utf8',
  }).stdout.trim();
  assert.equal(commitCount, '2');
  const gitStatus = spawnSync('git', ['status', '--short'], {
    cwd: project,
    encoding: 'utf8',
  }).stdout.trim();
  assert.equal(gitStatus, '');
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim();
  const meta = JSON.parse(fs.readFileSync(path.join(project, '.gitnexus', 'meta.json'), 'utf8'));
  assert.equal(meta.lastCommit, head);
  const gitignore = fs.readFileSync(path.join(project, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.gitnexus\/$/m);
  const analyzeArgs = fs.readFileSync(gitnexusArgsLog, 'utf8');
  assert.match(analyzeArgs, /--skip-agents-md/);
  assert.match(analyzeArgs, /--no-stats/);

  const state = JSON.parse(fs.readFileSync(path.join(project, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.repository.status, 'ready');
  assert.equal(state.long_term_readiness.status, 'ready');
  assert.equal(state.quality_gates.code_context, 'ready');
  assert.equal(state.next_recommended_agent, 'Orchestrator');
  const aiProject = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'project.json'), 'utf8'));
  assert.equal(aiProject.repo_path, project);
  assert.equal(aiProject.gitnexus.repo, path.basename(project).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+$/g, ''));
  const baseline = JSON.parse(fs.readFileSync(path.join(project, '.ai-context', 'change-baseline.json'), 'utf8'));
  assert.equal(baseline.repo_path, project);
  assert.equal(baseline.gitnexus_repo, aiProject.gitnexus.repo);
});

test('repository baseline blocks when sensitive paths would enter initial commit', () => {
  const project = nonGitProject('gstack-repository-baseline-sensitive-');
  fs.writeFileSync(path.join(project, '.env'), 'SECRET=value\n');

  const result = runBaseline(project, ['--yes', '--json']);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.status, 'blocked_sensitive_paths');
  assert.equal(summary.sensitive_paths.some((item) => item.path === '.env'), true);
  assert.equal(fs.existsSync(path.join(project, '.git')), false);
});
