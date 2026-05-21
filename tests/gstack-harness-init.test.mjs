import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initBin = path.join(root, 'bin', 'gstack-harness-init');
const testPath = `${path.dirname(process.execPath)}:/usr/bin:/bin`;

function installFakeGstackHome(home) {
  fs.mkdirSync(path.join(home, '.codex', 'skills', 'gstack', 'browse', 'dist'), { recursive: true });
  fs.mkdirSync(path.join(home, '.codex', 'skills', 'gstack', 'design', 'dist'), { recursive: true });
  fs.mkdirSync(path.join(home, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(home, '.codex', 'skills', 'gstack', 'SKILL.md'), '# fake gstack root\n');
  for (const rel of [
    ['.codex', 'skills', 'gstack', 'browse', 'dist', 'browse'],
    ['.codex', 'skills', 'gstack', 'design', 'dist', 'design'],
  ]) {
    const file = path.join(home, ...rel);
    fs.writeFileSync(file, '#!/usr/bin/env bash\nexit 0\n');
    fs.chmodSync(file, 0o755);
  }
  const gstackConfig = path.join(home, '.codex', 'skills', 'gstack', 'bin');
  fs.mkdirSync(gstackConfig, { recursive: true });
  fs.writeFileSync(path.join(gstackConfig, 'gstack-config'), '#!/usr/bin/env bash\necho on\n');
  fs.chmodSync(path.join(gstackConfig, 'gstack-config'), 0o755);

  const gbrain = path.join(home, 'bin', 'gbrain');
  fs.writeFileSync(gbrain, `#!/usr/bin/env node
const [command, slug] = process.argv.slice(2);
if (command === '--version') {
  console.log('gbrain-test 0.0.0');
  process.exit(0);
}
if (command === 'list') {
  console.log('project/gstack-init-ready/overview');
  console.log('project/gstack-init-ready/state');
  console.log('project/gstack-init-ready/foundation-readiness');
  console.log('project/gstack-init-ready/code-context');
  console.log('project/gstack-init-ready/quality-gates');
  console.log('project/gstack-init-ready/handoff');
  process.exit(0);
}
if (command === 'get') {
  console.log('# page ' + slug);
  process.exit(0);
}
if (command === 'query') {
  console.log('ok');
  process.exit(0);
}
if (command === 'put') {
  process.exit(0);
}
process.exit(0);
`);
  fs.chmodSync(gbrain, 0o755);
}

function installFakeGh(bin, authExitCode = 0) {
  fs.mkdirSync(bin, { recursive: true });
  const gh = path.join(bin, 'gh');
  fs.writeFileSync(gh, `#!/usr/bin/env bash
if [ "$1" = "--version" ]; then
  echo "gh version 2.0.0"
  exit 0
fi
if [ "$1" = "auth" ] && [ "$2" = "status" ]; then
  exit ${authExitCode}
fi
exit 0
`);
  fs.chmodSync(gh, 0o755);
}

function listRelativeFiles(dir) {
  const files = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.push(rel);
      }
    }
  }
  walk(dir);
  return files;
}

test('init records GitHub CLI as the standard remote operations capability', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-gh-cli-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  installFakeGstackHome(home);
  installFakeGh(path.join(home, 'bin'));

  const result = spawnSync(initBin, [
    '--target', target,
    '--project-id', 'gstack-init-ready',
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${home}/bin:${testPath}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const state = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.deepEqual(state.github_cli, {
    status: 'ready',
    auth: 'authenticated',
    command: 'gh',
    owns: ['github_remote', 'ci_runs', 'pull_requests', 'workflow_runs'],
  });
  assert.equal(state.release.github_cli_required, true);
  assert.equal(state.release.github_cli_status, 'ready');

  const projectState = fs.readFileSync(path.join(target, 'PROJECT_STATE.md'), 'utf8');
  assert.match(projectState, /## GitHub CLI/);
  assert.match(projectState, /- GitHub CLI: ready/);
  assert.match(projectState, /- Auth: authenticated/);
  assert.match(projectState, /- Standard remote\/CI\/PR path: gh CLI/);

  const codexPrompt = fs.readFileSync(path.join(target, 'docs', 'CODEX_START_PROMPT.md'), 'utf8');
  assert.match(codexPrompt, /GitHub remote\/CI\/PR\/run 操作必须使用 `gh` CLI/);
  assert.match(codexPrompt, /本地 repo 状态、diff、add、commit 仍使用 `git`/);

  const workflowRecipes = fs.readFileSync(path.join(target, 'WORKFLOW_RECIPES.md'), 'utf8');
  assert.match(workflowRecipes, /## R10-GH: GitHub Workflow \/ Release Gate/);
  assert.match(workflowRecipes, /gh repo view/);
  assert.match(workflowRecipes, /gh run list/);
  assert.match(workflowRecipes, /gh run view/);
  assert.match(workflowRecipes, /gh run watch/);
  assert.match(workflowRecipes, /gh pr status/);
  assert.match(workflowRecipes, /gh pr view/);
  assert.match(workflowRecipes, /gh pr create/);
  assert.match(workflowRecipes, /github_cli_missing/);
  assert.match(workflowRecipes, /github_actions_failed/);

  const agentWorkflows = fs.readFileSync(path.join(target, 'docs', 'AGENT_WORKFLOWS.md'), 'utf8');
  assert.match(agentWorkflows, /GitHub Workflow \/ Release Gate/);
  assert.match(agentWorkflows, /Release Agent 必须使用 `gh` CLI/);

  const team = fs.readFileSync(path.join(target, '.gstack', 'harness', 'agents', 'TEAM.md'), 'utf8');
  assert.match(team, /Release Agent.*GitHub remote\/CI\/PR\/run via `gh` CLI/);
});

test('init centralizes reinstall backups under ignored harness backup directory', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-central-backups-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  installFakeGstackHome(home);
  spawnSync('git', ['init'], { cwd: target, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'init-backups@example.test'], { cwd: target, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.name', 'Init Backups Test'], { cwd: target, encoding: 'utf8' });
  fs.writeFileSync(path.join(target, '.gitignore'), 'node_modules/\n');

  const env = {
    ...process.env,
    HOME: home,
    PATH: `${home}/bin:${testPath}`,
  };
  for (let i = 0; i < 2; i += 1) {
    const result = spawnSync(initBin, [
      '--target', target,
      '--project-id', 'gstack-init-ready',
      '--mode', 'docs-only',
      '--no-start-codex',
    ], {
      cwd: root,
      encoding: 'utf8',
      timeout: 100_000,
      env,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }

  const allFiles = listRelativeFiles(target);
  assert.equal(allFiles.some((file) => /\.bak-\d{8}-\d{6}$/.test(file) && !file.startsWith('.gstack/backups/')), false);
  assert.equal(allFiles.some((file) => file.startsWith('.gstack/backups/')), true);
  const gitignore = fs.readFileSync(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.gstack\/backups\/$/m);
});

test('init renders repeat work promotion state into installed targets', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-repeat-work-'));
  const result = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-')),
      PATH: testPath,
    },
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);

  const projectState = fs.readFileSync(path.join(target, 'PROJECT_STATE.md'), 'utf8');
  assert.match(projectState, /## Repeat Work Promotion/);
  assert.match(projectState, /- Known patterns:/);
  assert.match(projectState, /- Promotion backlog:/);
  assert.match(projectState, /- Scheduled candidates:/);
  assert.match(projectState, /- Recent memory misses:/);
  assert.match(projectState, /## Session Interaction Context/);
  assert.match(projectState, /- Recent interaction evidence:/);
  assert.match(projectState, /- Current user message summary:/);
  assert.match(projectState, /- Previous Codex output summary:/);
  assert.match(projectState, /- Previous two Codex output summary:/);

  const claudeMd = fs.readFileSync(path.join(target, 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /Session interaction context:/);
  assert.match(claudeMd, /recent 1-2 Codex outputs in the same session/);

  const codexPrompt = fs.readFileSync(path.join(target, 'docs', 'CODEX_START_PROMPT.md'), 'utf8');
  assert.match(codexPrompt, /同一个 session 内最近 1-2 次 Codex 输出/);

  const stateJson = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.deepEqual(stateJson.repeat_work, {
    known_patterns: [],
    promotion_backlog: [],
    scheduled_candidates: [],
    recent_memory_misses: [],
    interaction_context: {
      recent_evidence: [],
    },
  });
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-workspace-hygiene')), true);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-evaluate')), true);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-atomic-commit')), true);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-repository-baseline')), true);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-init')), true);
  assert.equal(fs.statSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-init')).mode & 0o111, 0o111);
  assert.match(fs.readFileSync(path.join(target, '.gstack', 'harness', 'agents', 'TEAM.md'), 'utf8'), /Workspace Hygiene Agent/);
  assert.equal(stateJson.workspace_hygiene.status, 'unknown');
  assert.equal(stateJson.workspace_hygiene.policy.auto_delete_files, false);
  assert.equal(stateJson.artifacts.workspace_hygiene_report, 'docs/WORKSPACE_HYGIENE_REPORT.md');
  assert.match(result.stdout, /Install summary/);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'remediation-last.out')), false);
});

test('init preserves existing repeat work promotion state on reinstall', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-repeat-work-preserve-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  const env = {
    ...process.env,
    HOME: home,
    PATH: testPath,
  };

  const first = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(first.status, null, first.stderr || first.stdout);

  const statePath = path.join(target, '.gstack', 'project-state.json');
  const existing = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  existing.repeat_work = {
    known_patterns: [{ pattern_id: 'weekly-report' }],
    promotion_backlog: [{ pattern_id: 'weekly-report', promotion_type: 'scheduled_candidate' }],
    scheduled_candidates: [{ pattern_id: 'weekly-report', cadence: 'weekly' }],
    recent_memory_misses: [{ pattern_id: 'release-notes', observed_in: 'manual-test' }],
    interaction_context: {
      recent_evidence: [{
        current_user_message_summary: '用户要求按上次报告格式继续',
        previous_codex_output_summary: 'Codex 提供了报告格式',
        previous_2_codex_output_summary: '',
        user_message_role: 'confirmation',
        inferred_delta: '复用已有格式',
        durable_candidate: false,
      }],
    },
  };
  fs.writeFileSync(statePath, `${JSON.stringify(existing, null, 2)}\n`);

  const second = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(second.status, null, second.stderr || second.stdout);

  const updated = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.deepEqual(updated.repeat_work, existing.repeat_work);
});

test('installed remediation restores missing atomic commit runner', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-remediate-atomic-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  const env = {
    ...process.env,
    HOME: home,
    PATH: testPath,
  };

  const installed = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(installed.status, null, installed.stderr || installed.stdout);

  const atomicRunner = path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-atomic-commit');
  fs.rmSync(atomicRunner);

  const remediation = spawnSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-remediate'), [
    '--target', target,
    '--skip-code-context',
  ], {
    cwd: target,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });

  assert.equal(remediation.status, 0, remediation.stderr || remediation.stdout);
  assert.equal(fs.existsSync(atomicRunner), true);
  assert.equal(fs.statSync(atomicRunner).mode & 0o111, 0o111);
});

test('installed init can run without the original template source', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-self-contained-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  const env = {
    ...process.env,
    HOME: home,
    PATH: testPath,
  };

  const installed = spawnSync(initBin, [
    '--target', target,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });
  assert.notEqual(installed.status, null, installed.stderr || installed.stdout);
  assert.equal(fs.existsSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-init')), true);

  const statePath = path.join(target, '.gstack', 'project-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.template_source = path.join(target, 'missing-template-source');
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const nestedTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-self-contained-target-'));
  const result = spawnSync(path.join(target, '.gstack', 'harness', 'bin', 'gstack-harness-init'), [
    '--target', nestedTarget,
    '--mode', 'docs-only',
    '--no-start-codex',
  ], {
    cwd: target,
    encoding: 'utf8',
    timeout: 100_000,
    env,
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /template missing/);
  assert.equal(fs.existsSync(path.join(nestedTarget, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(nestedTarget, 'WORKFLOW_RECIPES.md')), true);
  assert.equal(fs.existsSync(path.join(nestedTarget, '.gstack', 'harness', 'bin', 'gstack-harness-init')), true);
  assert.equal(fs.existsSync(path.join(nestedTarget, 'scripts', 'ai-context-bridge.mjs')), true);
  assert.equal(fs.existsSync(path.join(nestedTarget, 'docs', 'SCHEDULER_MODEL.md')), true);
});

test('init detects non-git Python bundles without forcing git handoff commands', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-python-bundle-'));
  fs.mkdirSync(path.join(target, 'app'), { recursive: true });
  fs.writeFileSync(path.join(target, 'README.md'), '# Python bundle\n\nRun with `python web_app.py`.\n');
  fs.writeFileSync(path.join(target, 'app', 'web_app.py'), 'print("ready")\n');
  fs.writeFileSync(path.join(target, 'app', 'test.py'), 'print("test helper")\n');
  fs.writeFileSync(path.join(target, 'app', 'run_web.ps1'), 'python web_app.py\n');

  const result = spawnSync(initBin, [
    '--target', target,
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-')),
      PATH: testPath,
    },
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);
  const state = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.git?.status || state.code_context?.branch, 'not-a-git-repo');
  assert.equal(state.foundation.runtime, 'ready');
  assert.equal(state.repository.status, 'needs_git_baseline');
  assert.equal(state.repository.next_action, 'initialize git baseline after user confirmation');
  assert.equal(state.long_term_readiness.status, 'blocked_until_git');
  assert.deepEqual(state.long_term_readiness.blockers, ['needs_git_baseline']);
  assert.equal(state.quality_gates.code_context, 'blocked_until_git');
  assert.equal(state.runtime.dev, 'cd app && python3 web_app.py');
  assert.match(state.runtime.test, /python3 -m py_compile/);
  assert.equal(state.runtime.install, 'not_required');
  assert.equal(state.next_recommended_agent, 'Foundation Remediation Agent');
  assert.equal(state.next_recommended_recipe, 'Repository Baseline Gate');

  const projectState = fs.readFileSync(path.join(target, 'PROJECT_STATE.md'), 'utf8');
  assert.match(projectState, /Python app/);
  assert.match(projectState, /cd app && python3 web_app.py/);
  assert.match(projectState, /## Repository Baseline/);
  assert.match(projectState, /needs_git_baseline/);
  assert.match(projectState, /blocked_until_git/);

  const codexPrompt = fs.readFileSync(path.join(target, 'docs', 'CODEX_START_PROMPT.md'), 'utf8');
  assert.doesNotMatch(codexPrompt, /本轮开始时先跑 node scripts\/ai-context-bridge\.mjs baseline/);
  assert.match(codexPrompt, /非 git 项目/);
  assert.match(codexPrompt, /不要开始业务实现、review、ship 或 release/);
  assert.match(codexPrompt, /先建立 git baseline/);
});

test('init writes install governance preflight, ownership manifest, and concise stdout', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-governance-'));
  fs.mkdirSync(path.join(target, 'app'), { recursive: true });
  fs.mkdirSync(path.join(target, 'server_materials', '10-access'), { recursive: true });
  fs.writeFileSync(path.join(target, 'app', 'web_app.py'), 'print("ready")\n');
  fs.writeFileSync(path.join(target, 'app', 'mima.txt'), 'fake password placeholder\n');
  fs.writeFileSync(path.join(target, 'server_materials', '10-access', 'PCM.pem'), 'fake key placeholder\n');

  const result = spawnSync(initBin, [
    '--target', target,
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-')),
      PATH: testPath,
    },
  });

  assert.notEqual(result.status, null, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /^copied /m);
  assert.doesNotMatch(result.stdout, /^wrote /m);
  assert.match(result.stdout, /Install summary/);
  assert.match(result.stdout, /Details: \.gstack\/install-log\.txt/);
  assert.doesNotMatch(result.stdout, /"agents":/);

  const summaryPath = path.join(target, '.gstack', 'install-summary.json');
  assert.equal(fs.existsSync(summaryPath), true);
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  assert.equal(summary.project_state_json, '.gstack/project-state.json');

  const installLogPath = path.join(target, '.gstack', 'install-log.txt');
  assert.equal(fs.existsSync(installLogPath), true);
  const installLog = fs.readFileSync(installLogPath, 'utf8');
  assert.match(installLog, /copied HARNESS_PRODUCT_USAGE\.md/);
  assert.match(installLog, /wrote PROJECT_STATE\.md/);

  const preflightPath = path.join(target, '.gstack', 'install-preflight.json');
  assert.equal(fs.existsSync(preflightPath), true);
  const preflight = JSON.parse(fs.readFileSync(preflightPath, 'utf8'));
  assert.equal(preflight.git.status, 'missing');
  assert.equal(preflight.project.size_bytes > 0, true);
  assert.equal(preflight.sensitive_paths.some((item) => item.path === 'app/mima.txt'), true);
  assert.equal(preflight.sensitive_paths.some((item) => item.path === 'server_materials/10-access/PCM.pem'), true);

  const state = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.install.preflight, '.gstack/install-preflight.json');
  assert.equal(state.install.log, '.gstack/install-log.txt');
  assert.equal(state.file_ownership.editable.includes('PROJECT_STATE.md'), true);
  assert.equal(state.file_ownership.harness_managed.includes('.gstack/harness/**'), true);
  assert.equal(state.file_ownership.runtime_generated.includes('.gstack/usage-runs/**'), true);
  assert.equal(state.file_ownership.do_not_commit_candidates.includes('app/mima.txt'), true);

  const projectState = fs.readFileSync(path.join(target, 'PROJECT_STATE.md'), 'utf8');
  assert.match(projectState, /## File Ownership/);
  assert.match(projectState, /Editable:/);
  assert.match(projectState, /Harness-managed:/);
  assert.match(projectState, /Runtime-generated:/);
  assert.match(projectState, /Do-not-commit candidates:/);
});

test('init keeps non-git repository baseline gate after readiness rerun', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-repository-gate-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-init-home-'));
  installFakeGstackHome(home);
  fs.mkdirSync(path.join(target, 'app'), { recursive: true });
  fs.writeFileSync(path.join(target, 'app', 'web_app.py'), 'print("ready")\n');

  const result = spawnSync(initBin, [
    '--target', target,
    '--project-id', 'gstack-init-ready',
    '--no-start-codex',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 100_000,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${home}/bin:${testPath}`,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const state = JSON.parse(fs.readFileSync(path.join(target, '.gstack', 'project-state.json'), 'utf8'));
  assert.equal(state.foundation.readiness, 'partial');
  assert.equal(state.repository.status, 'needs_git_baseline');
  assert.equal(state.long_term_readiness.status, 'blocked_until_git');
  assert.equal(state.quality_gates.code_context, 'blocked_until_git');
  assert.equal(state.next_recommended_recipe, 'Repository Baseline Gate');
  assert.equal(
    fs.readFileSync(path.join(target, '.gstack', 'remediation-last.out'), 'utf8').trim(),
    'Foundation remediation not run: repository baseline requires user-confirmed git initialization.',
  );
});
