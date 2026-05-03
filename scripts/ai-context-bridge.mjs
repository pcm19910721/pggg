#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, '.ai-context', 'project.json');
const START = '<!-- project-context-bridge:start -->';
const END = '<!-- project-context-bridge:end -->';

function slugify(value) {
  return String(value || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      out._.push(arg);
      continue;
    }

    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else if (out[key] === undefined) {
      out[key] = next;
      i += 1;
    } else if (Array.isArray(out[key])) {
      out[key].push(next);
      i += 1;
    } else {
      out[key] = [out[key], next];
      i += 1;
    }
  }
  return out;
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd || ROOT,
    encoding: 'utf-8',
    input: opts.input,
    maxBuffer: 256 * 1024 * 1024,
    shell: false,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
  };
}

function git(args, cwd = ROOT) {
  return run('git', args, { cwd });
}

function gitOutput(args, cwd = ROOT) {
  const result = git(args, cwd);
  return result.ok ? result.stdout.trim() : null;
}

function isGitRepo(repoPath) {
  return git(['rev-parse', '--is-inside-work-tree'], repoPath).ok;
}

function getHead(repoPath) {
  return gitOutput(['rev-parse', 'HEAD'], repoPath);
}

function getBranch(repoPath) {
  return gitOutput(['branch', '--show-current'], repoPath) || 'unknown';
}

function getRemote(repoPath) {
  return gitOutput(['config', '--get', 'remote.origin.url'], repoPath);
}

function getStatus(repoPath) {
  const result = git(['status', '--short'], repoPath);
  return result.ok ? result.stdout.trim() : '';
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function defaultConfig(repoPath, projectId) {
  const id = slugify(projectId || path.basename(repoPath));
  return {
    schema_version: '0.1.0',
    project_id: id,
    repo_path: repoPath,
    base_branch: 'main',
    code_context_provider: 'gitnexus',
    gitnexus: {
      repo: id,
      command: ['gitnexus'],
      fallback_command: ['npx', '-y', 'gitnexus@latest'],
      prefer_local: true,
      owns: ['source_code', 'symbols', 'imports', 'calls', 'execution_flows', 'impact', 'diff_analysis'],
      embeddings: true,
      skip_agents_md: true,
    },
    gbrain: {
      owns: ['memory', 'decisions', 'state', 'summaries', 'reports', 'handoffs'],
      store_gitnexus_outputs: 'summaries_only',
      never_import_paths: ['src/', 'app/', 'lib/', 'packages/', 'tests/', '.gitnexus/', '.understand-anything/'],
      pages: {
        overview: `project/${id}/overview`,
        state: `project/${id}/state`,
        architecture: `project/${id}/architecture`,
        decisions: `project/${id}/decisions`,
        assumptions: `project/${id}/assumptions`,
        hotspots: `project/${id}/hotspots`,
        quality_gates: `project/${id}/quality-gates`,
        handoff: `project/${id}/handoff`,
        gitnexus_index: `project/${id}/gitnexus-index`,
      },
    },
    optional_providers: {
      understand_anything: {
        use_for: ['visual_dashboard', 'onboarding', 'domain_graph', 'fallback'],
        artifacts: {
          knowledge_graph: '.understand-anything/knowledge-graph.json',
          domain_graph: '.understand-anything/domain-graph.json',
          diff_overlay: '.understand-anything/diff-overlay.json',
        },
      },
    },
    quality_gates: {
      test_commands: [],
      dev_commands: [],
      must_run_before_finish: [],
      impact_required_for: ['api', 'schema', 'auth', 'shared', 'billing', 'permissions', 'core-flow'],
    },
    automation: {
      auto_refresh_gitnexus: true,
      write_gbrain_change_notes: false,
      write_gbrain_index_status: false,
    },
  };
}

async function loadConfig() {
  const config = await readJson(CONFIG_PATH);
  if (!config) {
    throw new Error('Missing .ai-context/project.json. Run: node scripts/ai-context-bridge.mjs init');
  }
  return config;
}

async function upsertAgentsBlock(config) {
  const filePath = path.join(ROOT, 'AGENTS.md');
  const block = `${START}
## GitNexus and gbrain Bridge Rules

Project id: \`${config.project_id}\`
GitNexus repo: \`${config.gitnexus.repo}\`

Before code work:
1. Read \`.ai-context/project.json\`.
2. Read the gbrain pages listed under \`gbrain.pages\` when available.
3. Run \`node scripts/ai-context-bridge.mjs status\`.
4. Refresh GitNexus when stale and graph accuracy matters: \`node scripts/ai-context-bridge.mjs refresh\`.

Use GitNexus for current code facts: source symbols, calls, imports, execution flows, context, impact, and detect-changes.
Use gbrain for durable memory: decisions, state, assumptions, quality gates, hotspots, and handoff notes.
Use Understand Anything only as an optional visual/onboarding/domain-graph provider or fallback.

Never import the full source tree, \`.gitnexus/\`, or \`.understand-anything/\` into gbrain. Store concise summaries and pointers only.

Before finishing code work, run:

\`\`\`bash
node scripts/ai-context-bridge.mjs postchange --scope all
\`\`\`

For high-risk edits, add explicit impact targets:

\`\`\`bash
node scripts/ai-context-bridge.mjs postchange --scope all --impact SymbolName
\`\`\`
${END}`;

  let existing = '';
  if (await exists(filePath)) existing = await fs.readFile(filePath, 'utf-8');
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  let next;
  if (start !== -1 && end !== -1 && end > start) {
    next = existing.slice(0, start) + block + existing.slice(end + END.length);
  } else if (existing.trim()) {
    next = `${existing.trimEnd()}\n\n${block}\n`;
  } else {
    next = `${block}\n`;
  }
  await fs.writeFile(filePath, `${next.trimEnd()}\n`, 'utf-8');
}

async function ensureGitNexusIgnore() {
  const filePath = path.join(ROOT, '.gitnexusignore');
  const lines = [
    '# Generated by Project Context Bridge.',
    '# Keep bridge artifacts out of the code graph.',
    '.gitnexus/',
    '.ai-context/',
    '.understand-anything/',
    '',
  ];
  if (!(await exists(filePath))) {
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    return;
  }

  const existing = await fs.readFile(filePath, 'utf-8');
  const existingLines = existing.split(/\r?\n/);
  const additions = lines.filter((line) => line && !existingLines.includes(line));
  if (additions.length) {
    await fs.writeFile(filePath, `${existing.trimEnd()}\n${additions.join('\n')}\n`, 'utf-8');
  }
}

async function commandInit(args) {
  const repoPath = path.resolve(args.repo || ROOT);
  const projectId = slugify(args.projectId || path.basename(repoPath));
  const config = defaultConfig(repoPath, projectId);
  if (args.gitnexusRepo) config.gitnexus.repo = slugify(args.gitnexusRepo);
  if (args.baseBranch) config.base_branch = args.baseBranch;

  await writeJson(CONFIG_PATH, config);
  await fs.mkdir(path.join(ROOT, '.ai-context', 'runs'), { recursive: true });
  await upsertAgentsBlock(config);
  await ensureGitNexusIgnore();

  console.log(`Initialized GitNexus bridge for project "${config.project_id}".`);
  if (!isGitRepo(repoPath)) {
    console.log('Note: repo_path is not a git repository yet. GitNexus refresh will work after git init/clone.');
  }
}

async function readGitNexusMeta(config) {
  const metaPath = path.join(config.repo_path, '.gitnexus', 'meta.json');
  const meta = await readJson(metaPath);
  return { metaPath, meta };
}

function summarizeMeta(config, meta, metaPath) {
  const head = isGitRepo(config.repo_path) ? getHead(config.repo_path) : null;
  const branch = isGitRepo(config.repo_path) ? getBranch(config.repo_path) : 'not-a-git-repo';
  const remote = isGitRepo(config.repo_path) ? getRemote(config.repo_path) : null;
  const stale = !!(head && meta?.lastCommit && head !== meta.lastCommit);
  return {
    project_id: config.project_id,
    repo_path: config.repo_path,
    branch,
    remote_url: meta?.remoteUrl || remote || null,
    git_head: head,
    gitnexus_repo: config.gitnexus.repo,
    gitnexus_meta_path: metaPath,
    indexed: !!meta,
    stale,
    last_commit: meta?.lastCommit || null,
    indexed_at: meta?.indexedAt || null,
    stats: meta?.stats || null,
    capabilities: meta?.capabilities || null,
  };
}

function markdownIndexPage(config, summary) {
  const stats = summary.stats || {};
  const vector = summary.capabilities?.vectorSearch || {};
  return `---
type: gitnexus_index
project: ${config.project_id}
repo_path: ${summary.repo_path}
gitnexus_repo: ${summary.gitnexus_repo}
remote_url: ${summary.remote_url || ''}
last_commit: ${summary.last_commit || ''}
indexed_at: ${summary.indexed_at || ''}
files: ${stats.files ?? ''}
nodes: ${stats.nodes ?? ''}
edges: ${stats.edges ?? ''}
communities: ${stats.communities ?? ''}
processes: ${stats.processes ?? ''}
embeddings: ${stats.embeddings ?? ''}
vector_status: ${vector.status || 'unknown'}
source: .gitnexus/meta.json
---

# GitNexus Index

## Summary

- Project: ${config.project_id}
- GitNexus repo: ${summary.gitnexus_repo}
- Repo path: ${summary.repo_path}
- Branch: ${summary.branch}
- Git HEAD: ${summary.git_head || 'unknown'}
- Indexed commit: ${summary.last_commit || 'not indexed'}
- Indexed at: ${summary.indexed_at || 'not indexed'}
- Stale: ${summary.stale ? 'yes' : 'no'}

## Stats

- Files: ${stats.files ?? 'unknown'}
- Symbols/nodes: ${stats.nodes ?? 'unknown'}
- Edges: ${stats.edges ?? 'unknown'}
- Communities: ${stats.communities ?? 'unknown'}
- Processes: ${stats.processes ?? 'unknown'}
- Embeddings: ${stats.embeddings ?? 'unknown'}

## Notes

The detailed GitNexus index remains local in \`.gitnexus/\`. gbrain stores only this summary.
Understand Anything artifacts are optional and should stay local unless summarized.
`;
}

function writeGbrain(slug, markdown) {
  return run('gbrain', ['put', slug], { input: markdown });
}

function commandExists(command) {
  const result = process.platform === 'win32'
    ? spawnSync('where.exe', [command], { cwd: ROOT, shell: false, stdio: 'ignore' })
    : spawnSync('sh', ['-c', 'command -v "$1" >/dev/null 2>&1', 'sh', command], {
      cwd: ROOT,
      shell: false,
      stdio: 'ignore',
    });
  return result.status === 0;
}

function sameCommand(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

function gitNexusCommands(config) {
  const configured = config.gitnexus?.command || ['gitnexus'];
  const fallback = config.gitnexus?.fallback_command || ['npx', '-y', 'gitnexus@latest'];
  const commands = [];
  if (config.gitnexus?.prefer_local !== false && commandExists('gitnexus')) commands.push(['gitnexus']);
  commands.push(configured);
  commands.push(fallback);
  return commands.filter((command, index, all) =>
    command?.length && all.findIndex((candidate) => sameCommand(candidate, command)) === index);
}

function codeContextStatus(summary) {
  if (summary.stale) return 'stale';
  if (summary.indexed) return 'ready';
  return 'missing';
}

function yamlValue(value) {
  return String(value ?? '').replace(/\n/g, ' ');
}

function markdownCodeContextReport(config, summary, status, operation, details = {}) {
  const generatedAt = new Date().toISOString();
  const stats = summary.stats || {};
  const runFiles = details.run_id ? `.ai-context/runs/${details.run_id}/` : '.ai-context/runs/';
  return `# Code Context Report

Generated: ${generatedAt}
Project: ${config.project_id}
Status: ${status}

## Latest Code Context

\`\`\`yaml
code_context:
  status: ${status}
  provider: gitnexus
  operation: ${operation}
  generated_at: ${generatedAt}
  repo: ${yamlValue(config.gitnexus.repo)}
  repo_path: ${yamlValue(summary.repo_path)}
  branch: ${yamlValue(summary.branch)}
  git_head: ${yamlValue(summary.git_head || 'unknown')}
  indexed: ${summary.indexed ? 'true' : 'false'}
  stale: ${summary.stale ? 'true' : 'false'}
  indexed_at: ${yamlValue(summary.indexed_at || '')}
  indexed_commit: ${yamlValue(summary.last_commit || '')}
  files: ${stats.files ?? ''}
  nodes: ${stats.nodes ?? ''}
  edges: ${stats.edges ?? ''}
  run_id: ${yamlValue(details.run_id || '')}
  risk: ${yamlValue(details.risk || '')}
  detect_changes_ok: ${details.detect_changes_ok === undefined ? '' : String(details.detect_changes_ok)}
  impact_targets: ${JSON.stringify(details.impact_targets || [])}
  artifacts:
    config: .ai-context/project.json
    gitnexus_status: .ai-context/gitnexus-status.json
    gitnexus_index: .ai-context/gitnexus-index.md
    runs: ${runFiles}
    optional_ua_knowledge_graph: .understand-anything/knowledge-graph.json
    optional_ua_domain_graph: .understand-anything/domain-graph.json
    optional_ua_diff_overlay: .understand-anything/diff-overlay.json
  gbrain_write_candidates:
    - project/${config.project_id}/overview
    - project/${config.project_id}/architecture
    - project/${config.project_id}/reading-path
    - project/${config.project_id}/hotspots
    - project/${config.project_id}/gitnexus-index
    - project/${config.project_id}/code-context
\`\`\`

## Summary

- Provider: GitNexus
- Status: ${status}
- Operation: ${operation}
- Repo: ${config.gitnexus.repo}
- Branch: ${summary.branch}
- Indexed: ${summary.indexed ? 'yes' : 'no'}
- Stale: ${summary.stale ? 'yes' : 'no'}
- Indexed commit: ${summary.last_commit || 'not indexed'}
- Git HEAD: ${summary.git_head || 'unknown'}

## Write Policy

- Keep raw GitNexus indexes in \`.gitnexus/\` and bridge run files in \`.ai-context/runs/\`.
- Keep optional UA artifacts in \`.understand-anything/\` and reference their paths only when used.
- Write only stable summaries, decisions, gates, and handoff notes to gbrain.
`;
}

async function updateProjectStateJson(config, summary, status, operation, details = {}) {
  const statePath = path.join(ROOT, '.gstack', 'project-state.json');
  const state = await readJson(statePath);
  if (!state) return;

  state.quality_gates = {
    ...(state.quality_gates || {}),
    code_context: status,
  };
  state.artifacts = {
    ...(state.artifacts || {}),
    code_context_report: 'docs/CODE_CONTEXT_REPORT.md',
    ai_context_project: '.ai-context/project.json',
    gitnexus_status: '.ai-context/gitnexus-status.json',
    gitnexus_index: '.ai-context/gitnexus-index.md',
    gitnexus_runs: '.ai-context/runs',
  };
  state.code_context = {
    ...(state.code_context || {}),
    provider: 'gitnexus',
    status,
    operation,
    repo: config.gitnexus.repo,
    branch: summary.branch,
    indexed: summary.indexed,
    stale: summary.stale,
    git_head: summary.git_head,
    indexed_commit: summary.last_commit,
    indexed_at: summary.indexed_at,
    latest_run: details.run_id ? `.ai-context/runs/${details.run_id}` : state.code_context?.latest_run || null,
    latest_risk: details.risk || state.code_context?.latest_risk || null,
    updated_at: new Date().toISOString(),
  };
  await writeJson(statePath, state);
}

async function updateProjectStateMarkdown(status) {
  const filePath = path.join(ROOT, 'PROJECT_STATE.md');
  if (!(await exists(filePath))) return;
  let content = await fs.readFile(filePath, 'utf-8');
  content = content.replace(/^- Code Context: .*$/m, `- Code Context: ${status}`);
  content = content.replace(
    /(- Code Context:\n(?:  .*\n){0,16}?  - Last updated:).*/m,
    `$1 ${new Date().toISOString()}`,
  );
  await fs.writeFile(filePath, content, 'utf-8');
}

async function updateCodeContextArtifacts(config, summary, operation, details = {}) {
  const status = details.status || codeContextStatus(summary);
  await fs.mkdir(path.join(ROOT, 'docs'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'docs', 'CODE_CONTEXT_REPORT.md'),
    markdownCodeContextReport(config, summary, status, operation, details),
    'utf-8',
  );
  await updateProjectStateJson(config, summary, status, operation, details);
  await updateProjectStateMarkdown(status);
}

async function commandStatus() {
  const config = await loadConfig();
  const { metaPath, meta } = await readGitNexusMeta(config);
  const summary = summarizeMeta(config, meta, metaPath);
  await writeJson(path.join(ROOT, '.ai-context', 'gitnexus-status.json'), summary);
  await updateCodeContextArtifacts(config, summary, 'status');
  console.log(JSON.stringify(summary, null, 2));
}

async function runGitNexus(config, args, cwd = config.repo_path) {
  let lastResult = null;
  for (const command of gitNexusCommands(config)) {
    const [bin, ...prefix] = command;
    const result = run(bin, [...prefix, ...args], { cwd });
    lastResult = result;
    if (result.ok || result.error?.code !== 'ENOENT') return result;
  }
  return lastResult || { ok: false, status: 127, stdout: '', stderr: 'GitNexus command not found' };
}

async function commandRefresh(args) {
  const config = await loadConfig();
  if (!isGitRepo(config.repo_path)) {
    throw new Error(`repo_path is not a git repository: ${config.repo_path}`);
  }

  if (!args.skipAnalyze) {
    const analyzeArgs = ['analyze', config.repo_path, '--name', config.gitnexus.repo];
    if (config.gitnexus.embeddings && !args.noEmbeddings) analyzeArgs.push('--embeddings');
    analyzeArgs.push('--skills');
    if (config.gitnexus.skip_agents_md !== false) analyzeArgs.push('--skip-agents-md');

    console.log(`Running GitNexus: ${gitNexusCommands(config)[0].join(' ')} ${analyzeArgs.join(' ')}`);
    const result = await runGitNexus(config, analyzeArgs);
    if (!result.ok) {
      process.stderr.write(result.stdout);
      process.stderr.write(result.stderr);
      throw new Error(`GitNexus analyze failed with exit code ${result.status}`);
    }
  }

  const { metaPath, meta } = await readGitNexusMeta(config);
  const summary = summarizeMeta(config, meta, metaPath);
  const markdown = markdownIndexPage(config, summary);

  await writeJson(path.join(ROOT, '.ai-context', 'gitnexus-index.json'), summary);
  await fs.writeFile(path.join(ROOT, '.ai-context', 'gitnexus-index.md'), markdown, 'utf-8');
  await updateCodeContextArtifacts(config, summary, 'refresh');

  if (args.writeGbrain || config.automation?.write_gbrain_index_status) {
    const slug = config.gbrain.pages.gitnexus_index;
    const result = writeGbrain(slug, markdown);
    if (!result.ok) {
      process.stderr.write(result.stderr);
      throw new Error(`gbrain put failed for ${slug}`);
    }
    console.log(`Wrote gbrain page: ${slug}`);
  }

  console.log(JSON.stringify(summary, null, 2));
}

function runId() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
}

function safeFileName(value) {
  return slugify(value).slice(0, 80) || 'target';
}

function extractRisk(text) {
  const match = text.match(/risk[_ ]level["':\s]+([a-zA-Z]+)/i) || text.match(/\brisk["':\s]+([a-zA-Z]+)/i);
  return match ? match[1].toLowerCase() : 'unknown';
}

async function commandPostchange(args) {
  const config = await loadConfig();
  if (!isGitRepo(config.repo_path)) {
    throw new Error(`repo_path is not a git repository: ${config.repo_path}`);
  }

  const id = args.runId || runId();
  const dir = path.join(ROOT, '.ai-context', 'runs', id);
  await fs.mkdir(dir, { recursive: true });

  const scope = args.scope || 'unstaged';
  const before = getHead(config.repo_path);
  const branch = getBranch(config.repo_path);
  const status = getStatus(config.repo_path);

  const detectArgs = ['detect-changes', '--scope', scope, '--repo', config.gitnexus.repo];
  if (scope === 'compare' && args.baseRef) detectArgs.push('--base-ref', args.baseRef);

  const detect = await runGitNexus(config, detectArgs);
  const detectText = (detect.stdout || '') + (detect.stderr ? `\nSTDERR:\n${detect.stderr}` : '');
  await fs.writeFile(path.join(dir, 'detect-changes.txt'), detectText || '(no output)\n', 'utf-8');

  const impactTargets = args.impact ? (Array.isArray(args.impact) ? args.impact : [args.impact]) : [];
  const impacts = [];
  for (const target of impactTargets) {
    const impact = await runGitNexus(config, [
      'impact',
      target,
      '--direction',
      'upstream',
      '--repo',
      config.gitnexus.repo,
    ]);
    const text = (impact.stdout || '') + (impact.stderr ? `\nSTDERR:\n${impact.stderr}` : '');
    const file = `impact-${safeFileName(target)}.txt`;
    await fs.writeFile(path.join(dir, file), text || '(no output)\n', 'utf-8');
    impacts.push({ target, file, ok: impact.ok, risk: extractRisk(text) });
  }

  const risk = impacts.find((impact) => ['critical', 'high'].includes(impact.risk))?.risk || extractRisk(detectText);
  const note = `---
type: impact_analysis
project: ${config.project_id}
run_id: ${id}
source: gitnexus
repo_path: ${config.repo_path}
branch: ${branch}
base_branch: ${args.baseRef || config.base_branch || ''}
commit_before: ${before || ''}
commit_after: working-tree
scope: ${scope}
risk_level: ${risk}
changed_files:
changed_symbols:
affected_processes:
generated_at: ${new Date().toISOString()}
---

# Impact Analysis ${id}

## Summary

- Project: ${config.project_id}
- Branch: ${branch}
- Scope: ${scope}
- Risk: ${risk}
- Working tree: ${status ? 'dirty' : 'clean'}

## GitNexus detect-changes

\`\`\`text
${(detectText || '(no output)').trim()}
\`\`\`

${impacts.map((impact) => `## GitNexus impact: ${impact.target}

- Output file: \`.ai-context/runs/${id}/${impact.file}\`
- Risk: ${impact.risk}

`).join('')}
## Tests

- Not recorded by bridge. Add commands and results here before final handoff.

## Risks

- Review GitNexus output above.

## Next Steps

- Add any follow-up work here.
`;

  await fs.writeFile(path.join(dir, 'gbrain-note.md'), note, 'utf-8');
  await writeJson(path.join(dir, 'run.json'), {
    project_id: config.project_id,
    run_id: id,
    repo_path: config.repo_path,
    branch,
    scope,
    commit_before: before,
    commit_after: 'working-tree',
    working_tree_status: status ? 'dirty' : 'clean',
    detect_changes_ok: detect.ok,
    impact_targets: impacts,
    gbrain_slug: `artifact/${config.project_id}/impact-analysis/${id}`,
    generated_at: new Date().toISOString(),
  });

  const { metaPath, meta } = await readGitNexusMeta(config);
  const summary = summarizeMeta(config, meta, metaPath);
  await writeJson(path.join(ROOT, '.ai-context', 'gitnexus-status.json'), summary);
  await updateCodeContextArtifacts(config, summary, 'postchange', {
    run_id: id,
    detect_changes_ok: detect.ok,
    impact_targets: impacts.map((impact) => impact.target),
    risk,
    status: detect.ok ? (summary.stale ? 'stale' : 'ready') : 'stale',
  });

  if (args.writeGbrain || config.automation?.write_gbrain_change_notes) {
    const slug = `artifact/${config.project_id}/impact-analysis/${id}`;
    const result = writeGbrain(slug, note);
    if (!result.ok) {
      process.stderr.write(result.stderr);
      throw new Error(`gbrain put failed for ${slug}`);
    }
    console.log(`Wrote gbrain page: ${slug}`);
  }

  console.log(`Wrote run files: ${path.relative(ROOT, dir)}`);
  console.log(`Gbrain note: ${path.relative(ROOT, path.join(dir, 'gbrain-note.md'))}`);
}

function usage() {
  console.log(`Usage:
  node scripts/ai-context-bridge.mjs init [--project-id id] [--repo path] [--gitnexus-repo name] [--base-branch main]
  node scripts/ai-context-bridge.mjs status
  node scripts/ai-context-bridge.mjs refresh [--skip-analyze] [--no-embeddings] [--write-gbrain]
  node scripts/ai-context-bridge.mjs postchange [--scope all|staged|unstaged|compare] [--base-ref main] [--impact Symbol] [--write-gbrain]
`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  try {
    switch (command) {
      case 'init':
        await commandInit(args);
        break;
      case 'status':
        await commandStatus(args);
        break;
      case 'refresh':
        await commandRefresh(args);
        break;
      case 'postchange':
        await commandPostchange(args);
        break;
      case undefined:
      case '-h':
      case '--help':
      case 'help':
        usage();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

main();
