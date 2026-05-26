# Huanzhuang Harness Rehearsal

Date: 2026-05-21

Source project: `E:\DONE\huanzhuang_clean_bundle`

Experiment copy: `E:\DONE\huanzhuang_harness_rehearsal`

Objective: validate whether the current `pggg` harness lowers real continuation cost on an old project bundle, and identify what to simplify.

## Safety Boundary

- The original bundle was kept read-only during the rehearsal.
- The experiment copy was created on the E drive, not WSL `/tmp`, to avoid consuming the Windows system drive.
- The copy excluded `server_materials/10-access/`, `app/mima.txt`, `__pycache__/`, `*.pyc`, and `app/.tmp/`.
- Original bundle check after rehearsal found no harness files such as `.gstack`, `.ai-context`, `PROJECT_STATE.md`, `CLAUDE.md`, or `AGENTS.md`.

## Round Evidence

### R0: Manual Intake

Intent: understand the old project without installing harness.

Evidence:

- Original project size: `608K`.
- Project is not a git repository.
- Bundle shape: Python zero-dependency web app plus deployment and migration materials.
- Runtime entry is documented as `app/web_app.py`; modular entry exists under `app/apps/server`.
- Sensitive material was present in the source bundle paths: `server_materials/10-access/`, `app/mima.txt`.

Assessment:

- A human can quickly identify the project, runtime, and security concerns from `README.md` and `architecture/current.md`.
- The first high-value harness behavior should be risk triage: non-git bundle, sensitive material, runtime command, and deploy material boundaries.

### R1: Harness Install

Intent: install current `pggg` into a sanitized copy.

Command:

```bash
GSTACK_GBRAIN_GET_TIMEOUT=5s GSTACK_GBRAIN_QUERY_TIMEOUT=5s \
  /home/adminpcm/gstack-multiagent/bin/pggg \
  --target /mnt/e/DONE/huanzhuang_harness_rehearsal \
  --mode docs-only \
  --no-start-codex
```

Evidence:

- Sanitized copy before install: `420K`.
- Copy after install: `1.3M`.
- Install duration: `144` seconds.
- Generated harness files include `.gstack`, `.ai-context`, `CLAUDE.md`, `PROJECT_STATE.md`, `GSTACK_SKILL_REGISTRY.md`, and `WORKFLOW_RECIPES.md`.
- Installer reported `status: ready`.
- Installer also reported `code_context.status: missing`.
- Initial `next_recommended_agent` was `Problem Handling Agent`, while `problem_handling_required` was `false`.

Assessment:

- Installation completes and produces a coherent harness surface.
- The result has contradictory guidance: ready foundation, missing code context, no active problem, but recommends Problem Handling.
- For this old project, install cost is not huge by disk size, but 144 seconds feels too slow for a lightweight rehearsal.

### R2: Newcomer Recovery

Intent: simulate a new agent reading generated state before touching code.

Evidence:

- `PROJECT_STATE.md` reports `Readiness: ready`.
- `PROJECT_STATE.md` reports `Code Context: missing`.
- Runtime is marked as `not_required` for install/dev/test/lint/typecheck/local URL.
- `docs/FOUNDATION_READINESS_REPORT.md` reports:
  - `git state: missing`
  - `runtime: not_required`
  - `code context: missing`
  - warning: `gbrain_project_memory_timeout`
- `docs/CODEX_START_PROMPT.md` asks the agent to run baseline and postchange commands even though the project is not a git repository.

Assessment:

- The generated state is useful for understanding the harness itself.
- It is weak at describing the actual business project: Python app, run command, security-sensitive bundle, deployment scripts, and module map are not promoted into the main state.
- `docs-only` mode caused the harness to hide real runtime work even though this is a runnable Python app.

### R3: Small Task Simulation

Intent: simulate a realistic task: identify where to change login/permission or queue behavior and how to verify safely.

Harness path evidence:

- `node scripts/ai-context-bridge.mjs status` reported GitNexus missing because the target is not a git repository.
- `node scripts/ai-context-bridge.mjs memory-check` reported partial memory because `gitnexus-index`, `architecture`, and `hotspots` pages were missing.

Manual code evidence:

- `python` was not available in the environment.
- `python3` was available: `Python 3.12.3`.
- `python3 -m py_compile app/web_app.py app/test.py app/apps/server/main.py app/apps/server/wsgi.py app/modules/*/service.py` passed.
- Login/auth/permissions are mainly in `app/web_app.py` and `app/modules/auth/service.py`.
- Queue behavior is mainly in `app/web_app.py`; `app/modules/jobs/service.py` is a compatibility adapter.

Assessment:

- The harness did not provide the useful business reading path by itself because code context was missing.
- Simple command and file inspection found the right task map quickly.
- Runtime detection should have inferred `python3 -m py_compile` as a cheap health check and `cd app && python3 web_app.py` as a likely dev command.

### R4: Handoff And Failure Recovery

Intent: simulate returning later and following generated handoff instructions.

Evidence:

- `node scripts/ai-context-bridge.mjs baseline` failed with `repo_path is not a git repository`.
- `node scripts/ai-context-bridge.mjs postchange --scope all` failed with the same non-git error.
- `.gstack/harness/bin/gstack-harness-readiness --target . --mode docs-only --json` returned `status: ready`, `git: missing`, `runtime: not_required`, `code_context: missing`, and `next_recommended_agent: Orchestrator`.
- After install and one recorded usage run, experiment copy size was `1.6M`.
- The rehearsal usage run was recorded at `.gstack/usage-runs/20260521T134722Z-session_end-66128.json`.

Assessment:

- The generated handoff path is not executable for non-git bundles.
- Readiness currently treats non-git as acceptable in docs-only mode, but the start prompt still mandates git-dependent commands.
- This creates a sharp failure for exactly the type of old project bundle this rehearsal is meant to validate.

## Scores

Scale: 0-5, where 5 means the harness clearly reduced work with low friction.

| Dimension | Score | Reason |
|---|---:|---|
| Understanding efficiency | 2 | Harness state explains itself, but misses the Python app runtime and module reading path. Manual inspection was faster. |
| Task routing | 2 | It produced useful agent concepts but contradictory next-agent guidance and no clear non-git path. |
| Context quality | 2 | Good foundation state; weak business context. Code context stayed missing. |
| Execution friction | 2 | Install worked but took 144 seconds, generated many files, and handoff commands failed on non-git. |
| Verification value | 2 | Harness did not infer `python3 -m py_compile`; manual verification was more direct. |
| Complexity cost | 1 | For a 420K old bundle, adding about 900K of harness surface and many concepts feels heavy. |

Overall: `11 / 30`.

## Optimization Backlog

### P0: Add Non-Git Bundle Mode

Problem: old project bundles are often not git repositories. Current baseline/postchange commands fail hard, while readiness can still report ready.

Expected behavior:

- Detect `git: missing`.
- Render start prompt without mandatory git baseline/postchange.
- Use file manifest checks and workspace hygiene as fallback.
- Explain that GitNexus impact and detect-changes are unavailable until the project is initialized as a git repo.

### P0: Fix Ready/Missing Contradictions

Problem: install can report `status: ready` while code context is missing and next agent points to Problem Handling with no active issue.

Expected behavior:

- Separate `foundation_ready` from `project_ready`.
- If code context is missing, say what is still missing and what is optional.
- Recommend Orchestrator only when the next instruction is actionable.
- Recommend Problem Handling only when there is an actual issue to handle.

### P0: Runtime Detection For Small Python Apps

Problem: docs-only mode hid a runnable Python app.

Expected behavior:

- Detect `*.py` app entrypoints and Windows launch scripts.
- Infer likely commands:
  - health check: `python3 -m py_compile ...`
  - dev command: `cd app && python3 web_app.py`
- If no dependency manifest exists, report `zero/unknown dependency Python app` instead of `not_required`.

### P1: Security Hygiene Before Install

Problem: source bundle contained sensitive file paths. The copy was manually sanitized before harness install.

Expected behavior:

- Preflight detects likely secrets and server access files before copying or installing.
- Default policy: warn and exclude or require explicit confirmation.
- Record excluded sensitive paths in the rehearsal report without reading contents.

### P1: Lightweight Rehearsal Mode

Problem: a 420K old project copy grew to 1.3M after install and 1.6M after one run.

Expected behavior:

- Add a `rehearsal` or `probe` mode that writes fewer files.
- Generate one compact report first.
- Install the full harness only if the user chooses to continue.

### P1: Business Context Snapshot

Problem: generated state focused on harness foundation, not the actual project.

Expected behavior:

- Promote a short business/project snapshot into `PROJECT_STATE.md`:
  - runtime type
  - entrypoints
  - major modules
  - deploy scripts
  - known sensitive boundaries
  - recommended first verification command

### P2: Time Budget And Progress Output

Problem: install took 144 seconds, which feels too long without clear phase timing.

Expected behavior:

- Emit phase durations.
- Bound gbrain sync and readiness steps.
- Show which steps are optional and can be skipped in rehearsal mode.

## Decision

The old-project rehearsal approach is better than further abstract protocol design. The current harness has a useful foundation, but for real historical bundles it needs a lighter preflight, non-git fallback, runtime detection, and clearer state semantics before adding more Agent concepts.

Recommended next work:

1. Implement non-git bundle fallback in `ai-context-bridge` and rendered start prompts.
2. Add a lightweight rehearsal/probe command path.
3. Add Python runtime detection and a business context snapshot to install output.

## P0 Retest

Follow-up date: 2026-05-21

Retest copy: `E:\DONE\huanzhuang_harness_retest_p0`

Implemented P0 changes:

- `ai-context-bridge baseline` now writes a structured `not_git_repo` baseline instead of failing.
- `ai-context-bridge postchange` now writes a structured fallback run for non-git bundles with `risk: unknown` and `commit_gate: blocked`.
- Installed `CODEX_START_PROMPT.md` now renders non-git handoff instructions instead of forcing git baseline/postchange.
- `pggg` and readiness detection now recognize lightweight Python bundles such as `app/web_app.py`, `run_web.ps1`, and `run_web.bat`.
- `PROJECT_STATE.md` and `.gstack/project-state.json` now include a business context snapshot with runtime type, entrypoint, modules, deploy materials, sensitive boundary summary, and first verification command.
- `not_git_repo` remains a warning, but no longer makes Foundation Readiness partial by itself.

Retest evidence:

- Original bundle remained `608K`.
- Retest install copy size after harness install: `1.3M`.
- Readiness after default recheck:
  - `status: ready`
  - `git: missing`
  - `runtime: ready`
  - `code_context: missing`
  - `warnings: ["not_git_repo"]`
  - `next_recommended_agent: Orchestrator`
- Runtime detected:
  - dev: `cd app && python3 web_app.py`
  - test: `cd app && python3 -m py_compile *.py modules/*/service.py apps/server/*.py`
  - local URL: `http://127.0.0.1:8787`
- Business context detected:
  - type: `Python app`
  - entrypoint: `app/web_app.py`
  - modules: `app/modules`
  - deploy materials: `deploy/`
- Non-git fallback evidence:
  - baseline wrote `repository_state.status: not_git_repo`
  - postchange wrote `repository_state.status: not_git_repo`
  - postchange wrote `risk: unknown`
  - postchange wrote `commit_gate: blocked`
- Python verification passed:
  - `cd app && python3 -m py_compile *.py modules/*/service.py apps/server/*.py`

Updated score estimate after P0:

| Dimension | Before | After P0 | Reason |
|---|---:|---:|---|
| Understanding efficiency | 2 | 4 | Runtime and business context are now visible in generated state. |
| Task routing | 2 | 4 | Non-git projects now route to Orchestrator with a warning, not contradictory Problem Handling. |
| Context quality | 2 | 3 | Business snapshot improved; Code Context still needs git or a deeper non-git index fallback. |
| Execution friction | 2 | 3 | Handoff no longer fails on non-git baseline/postchange; install is still slow. |
| Verification value | 2 | 4 | First Python verification command is inferred and passes. |
| Complexity cost | 1 | 2 | Still a large harness surface for a small bundle, but the generated content is more useful. |

Updated total: `20 / 30`.

Remaining high-value work:

1. Add lightweight rehearsal/probe mode to reduce installed surface and runtime.
2. Add security preflight before install so sensitive file paths are detected before manual copying.
3. Add a non-git code map fallback so Code Context is not simply `missing` for old bundles.

## Install Governance Retest

Follow-up date: 2026-05-21

Retest copy: `E:\DONE\huanzhuang_harness_governance_retest`

Implemented governance changes:

- Full install now writes detailed copy/write output to `.gstack/install-log.txt`.
- Stdout now emits a short `Install summary` instead of a long copied/wrote stream.
- Full summary JSON is written to `.gstack/install-summary.json`.
- Install preflight is written to `.gstack/install-preflight.json`.
- `.gstack/project-state.json` now records install artifacts and file ownership:
  - `editable`
  - `harness_managed`
  - `runtime_generated`
  - `do_not_commit_candidates`
- `PROJECT_STATE.md` now includes a `File Ownership` section.

Retest evidence:

```text
Install summary
- Status: ready
- Project: huanzhuang_harness_governance_retest
- Mode: app
- Git: missing
- Runtime: ready
- Next: Problem Handling Agent
- Preflight: .gstack/install-preflight.json
- Details: .gstack/install-log.txt
```

The `Next: Problem Handling Agent` value in this retest was caused by deliberately low `GSTACK_GBRAIN_GET_TIMEOUT=5s` during the install rehearsal, which produced a `gbrain_project_memory_timeout` warning. A default readiness recheck in the P0 retest routed to `Orchestrator` with only `not_git_repo` warning.

Preflight evidence from the sanitized copy:

- git: `missing`
- pre-install size: `323708` bytes
- sensitive paths: none, because this retest copy excluded access credentials and password files before install
- planned write groups: `7`

State evidence:

- install preflight path: `.gstack/install-preflight.json`
- install log path: `.gstack/install-log.txt`
- business context still identifies:
  - `Python app`
  - `app/web_app.py`
  - `app/modules`
  - `deploy/`
- runtime still identifies:
  - `cd app && python3 web_app.py`
  - `cd app && python3 -m py_compile *.py modules/*/service.py apps/server/*.py`

Updated conclusion:

The harness should keep full long-term installation, but install governance now makes the file surface more explainable. The remaining problem is not file count by itself; it is reducing root-level protocol clutter and adding a non-git code map fallback.

## Repository Baseline Gate Retest

Follow-up date: 2026-05-22

Retest copy: `E:\DONE\huanzhuang_harness_repository_gate_retest_20260522-002037`

Decision update:

- Non-git fallback is not an acceptable substitute for long-term multi-agent takeover.
- Non-git projects may install harness files and run basic detection, but normal business workflows must stay blocked until a git baseline exists.
- Standard project takeover should use one route: initialize git, create a clean baseline commit, then run GitNexus baseline/status before impact, review, ship, or release workflows.

Implemented repository baseline gate:

- `pggg` now marks non-git app installs as `partial`, not long-term ready.
- `.gstack/project-state.json` records:
  - `repository.status: needs_git_baseline`
  - `repository.baseline_required: true`
  - `long_term_readiness.status: blocked_until_git`
  - `long_term_readiness.blockers: ["needs_git_baseline"]`
  - `quality_gates.code_context: blocked_until_git`
- `PROJECT_STATE.md` includes a `Repository Baseline` section.
- `CODEX_START_PROMPT.md` blocks business implementation, review, ship, and release until git baseline is initialized with user confirmation.
- Init skips automatic remediation and `sync-gbrain` for `needs_git_baseline` so later steps do not downgrade the gate back to generic `missing`.

Retest evidence:

```text
Install summary
- Status: partial
- Project: huanzhuang_harness_repository_gate_retest_20260522-002037
- Mode: app
- Git: missing
- Runtime: ready
- Next: Foundation Remediation Agent
- Preflight: .gstack/install-preflight.json
- Details: .gstack/install-log.txt
```

Final state evidence:

- Foundation readiness: `partial`
- Repository: `needs_git_baseline`
- Long-term readiness: `blocked_until_git`
- Code Context gate: `blocked_until_git`
- Runtime dev command: `cd app && python3 web_app.py`
- Runtime test command: `cd app && python3 -m py_compile *.py modules/*/service.py apps/server/*.py`
- Next recipe: `Repository Baseline Gate`

Original bundle check:

- Original `E:\DONE\huanzhuang_clean_bundle` still had no `.gstack`, `.ai-context`, `PROJECT_STATE.md`, or `CLAUDE.md` files written by the rehearsal.

Updated conclusion:

The correct long-term harness behavior is not a non-git code map fallback. The fallback can only support preflight and recommendation. Long-term multi-agent takeover requires a git baseline first, then the standard GitNexus-backed workflow.

## Repository Baseline Runner E2E

Follow-up date: 2026-05-22

Verified clean baseline copy: `E:\DONE\huanzhuang_harness_git_baseline_verified_20260522-020048`

Flow:

1. Create a sanitized E-drive copy from the installed non-git rehearsal target.
2. Exclude `app/mima.txt` and `server_materials/10-access/`.
3. Run `gstack-harness-repository-baseline --json` precheck.
4. After explicit user confirmation, run `gstack-harness-repository-baseline --yes --json`.

Precheck evidence:

- Status: `requires_confirmation`
- Sensitive paths: `[]`
- Git before: `missing`
- No `.git` directory was created during precheck.

Confirmed baseline evidence:

```text
status: ready
git.initialized: true
git.branch: master
git.head: f7ea2eeb804677523600f326aeead2d7c3127ee8
gitnexus.status: ready
ai_context_baseline.status: ready
```

Git evidence:

```text
5c45841 chore: record repository baseline evidence
f7ea2ee chore: establish repository baseline
```

- Commit count: `2`
- Final `git status --short`: empty
- `.gitnexus/meta.json lastCommit`: `5c45841b175e4da92a6de0b4b5adb3e103955395`
- Final `HEAD`: `5c45841b175e4da92a6de0b4b5adb3e103955395`

State evidence:

- `repository.status: ready`
- `repository.baseline_required: false`
- `long_term_readiness.status: ready`
- `quality_gates.code_context: ready`
- `next_recommended_agent: Orchestrator`
- `next_recommended_recipe: R0 Restore / Resume Context`

Path repair evidence:

- `.ai-context/project.json project_id`: `huanzhuang_harness_git_baseline_verified_20260522-020048`
- `.ai-context/project.json repo_path`: `E:\DONE\huanzhuang_harness_git_baseline_verified_20260522-020048`
- `.ai-context/project.json gitnexus.repo`: `huanzhuang_harness_git_baseline_verified_20260522-020048`

Important fix found during E2E:

- Running GitNexus after the evidence commit can dirty `AGENTS.md` and `CLAUDE.md` unless `--skip-agents-md --no-stats` is used.
- The runner now calls `gitnexus analyze --skip-agents-md --no-stats` and ignores `.gitnexus/` in baseline git state.
- The runner also repairs `.ai-context/project.json` for copied projects before running baseline, so copied targets do not keep stale source paths.

Original bundle check:

- Original `E:\DONE\huanzhuang_clean_bundle` still had no `.git`, `.gstack`, `.ai-context`, `PROJECT_STATE.md`, or `CLAUDE.md` files written by the rehearsal.

Updated conclusion:

The full path now works: old non-git bundle -> sensitive path block -> sanitized copy -> explicit user confirmation -> git baseline -> GitNexus index -> ai-context baseline -> clean ready repository state. This is the standard long-term multi-agent intake path.

## Install Preflight And Gitignore Boundary Rehearsal

Follow-up date: 2026-05-26

Source copy:

- `/home/adminpcm/projects/huanzhuang/huanzhuang_clean_bundle`

Isolated rehearsal copies:

- `/home/adminpcm/projects/huanzhuang_pggg_install_rehearsal_20260526-112142`
- `/home/adminpcm/projects/huanzhuang_pggg_install_rehearsal_fixed_20260526-113304`
- `/home/adminpcm/projects/huanzhuang_pggg_install_rehearsal_baselinefixed_20260526-113618`

Flow:

1. Copy the clean bundle outside the parent `huanzhuang` Git repository.
2. Run `/home/adminpcm/gstack-multiagent/bin/pggg --target <copy> --no-start-codex`.
3. Inspect `.gstack/install-summary.json`, `.gstack/repository-state.json`, `.gstack/workspace-hygiene.json`, `.gstack/readiness-last.json`, and `.gitignore`.
4. Run `.gstack/harness/bin/gstack-harness-repository-baseline --target . --json`.
5. After confirming the ignore boundary, run `.gstack/harness/bin/gstack-harness-repository-baseline --target . --yes --json`.

Install evidence:

```text
Install summary
- Status: partial
- Mode: app
- Git: missing
- Runtime: ready
- Next: Foundation Remediation Agent
```

Automatic preflight evidence:

- Repository State ran automatically and wrote `.gstack/repository-state.json`.
- Workspace Hygiene ran automatically and wrote `.gstack/workspace-hygiene.json`.
- Foundation Readiness ran automatically and wrote `.gstack/readiness-last.json`.
- Runtime detection found the Python bundle and set the repository path to `needs_git_baseline`.

Problem found:

- Non-Git target installs generated local runtime files but did not create `.gitignore`.
- That left `.gstack/*-last.*`, `.gstack/repository-state.json`, `.gstack/workspace-hygiene.json`, `docs/agents/*.json`, and sensitive bundle paths without an automatic ignore boundary.

Fix verified:

- `pggg` now writes `.gitignore` even when the target is not yet a Git repository.
- Install preflight sensitive paths are added to `.gitignore`.

Installed `.gitignore` evidence:

```text
.gstack/backups/
.gstack/*-last.*
.gstack/project-state.json
.gstack/repository-state.json
.gstack/workspace-hygiene.json
.gstack/workspace-hygiene-baseline.json
.gstack/usage-runs/*.json
.gstack/usage-runs/index.jsonl
.ai-context/runs/
.ai-context/gbrain-fallback/
.ai-context/gitnexus-*
.gitnexus/
PROJECT_STATE.md
docs/AGENTS_STATUS.md
docs/CODE_CONTEXT_REPORT.md
docs/FOUNDATION_READINESS_REPORT.md
docs/REPOSITORY_STATE_REPORT.md
docs/WORKSPACE_HYGIENE_REPORT.md
docs/agents/*.json
app/mima.txt
server_materials/10-access
server_materials/10-access/PCM.pem
```

Second problem found:

- Repository Baseline still treated files under an ignored sensitive directory as blocking sensitive paths.
- Example: `server_materials/10-access/fuwuqi.txt` was blocked even though `server_materials/10-access` was already ignored.

Fix verified:

- Repository Baseline now filters sensitive findings through `.gitignore` coverage before blocking.
- Ignored sensitive files do not enter the baseline commit and do not block initialization.

Baseline precheck evidence after fix:

```text
status: requires_confirmation
git.before: missing
sensitive_paths: []
```

Confirmed baseline evidence:

```text
status: ready
git.initialized: true
git.branch: master
git.head: 4721454d9a9bf90567f8bb9c32c3f6f265bb1882
gitnexus.status: ready
ai_context_baseline.status: ready
```

Git evidence:

- Final `git status --short`: empty
- `git ls-files` did not include `app/mima.txt`.
- `git ls-files` did not include `server_materials/10-access/PCM.pem`.
- `git ls-files` did not include `server_materials/10-access/fuwuqi.txt`.

State evidence:

- `repository.status: ready`
- `repository.baseline_required: false`
- `long_term_readiness.status: ready`
- `quality_gates.code_context: ready`
- `next_recommended_recipe: R0 Restore / Resume Context`

Updated conclusion:

Fresh installs no longer require users to remember repository-state, workspace-hygiene, readiness, or local runtime `.gitignore` commands. For old non-Git bundles, the install path is now: install -> automatic preflight -> automatic ignore boundary -> Repository Baseline precheck -> explicit confirmation -> clean Git baseline without sensitive ignored paths.
