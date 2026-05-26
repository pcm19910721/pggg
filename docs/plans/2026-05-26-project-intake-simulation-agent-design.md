# Project Intake Simulation Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a cross-project Project Intake Simulation & Rehearsal Agent that predicts and verifies whether a target project is ready for `pggg` installation and Codex takeover.

**Architecture:** Treat intake as a harness-level capability that coordinates existing Repository State, Workspace Hygiene, Foundation Readiness, Repository Baseline, and Repository Sync gates. The first implementation should be safe by default: simulation is read-only, rehearsal happens in a copy, and original targets are never initialized, committed, pushed, or modified unless the user explicitly runs a separate approved gate.

**Tech Stack:** Bash entrypoints, Node.js JSON/report generation, existing harness runners, Git/GitHub CLI, GitNexus for source-project impact checks.

---

## Why This Agent Exists

`pggg` is now usable as a cross-project harness, but every target project starts in a different state:

- some are not Git repositories;
- some are nested inside a parent repository;
- some have no GitHub remote;
- some contain secrets, server access material, browser profiles, or runtime artifacts;
- some are pure script bundles where only source scripts should be committed;
- some already contain `.gstack`, `CLAUDE.md`, `PROJECT_STATE.md`, or generated docs;
- some have unclear runtime/test commands;
- some can install the harness but should not be handed to Codex for business work yet.

Today these risks are discovered by ad hoc reasoning plus manual rehearsal. That worked for the `huanzhuang` rehearsal, but it should become a repeatable agent.

The agent's job is to turn unknown project-intake risk into a concrete verdict before formal takeover.

## Name

Canonical name:

```text
Project Intake Simulation & Rehearsal Agent
```

Short names:

```text
Project Intake Agent
Intake Simulation Agent
项目准入推演与演练 Agent
```

## Scope

This agent serves two use cases.

### 1. Harness Source Validation

When `gstack-multiagent` changes installation, Git, `.gitignore`, baseline, sync, or readiness behavior, this agent rehearses against known target projects such as `huanzhuang` copies.

### 2. Target Project Intake

When a user wants to use `pggg` in another project, this agent performs simulation and rehearsal before formal Codex takeover.

This second use case is the primary product path.

## Non-Goals

The agent must not:

- modify the original target project during simulation;
- run `git init` in the original target;
- stage, commit, push, stash, reset, or rebase the original target;
- read secret file contents;
- copy source-only rehearsal docs into normal target projects;
- hide push failures or CI failures;
- replace Repository State, Workspace Hygiene, Foundation Readiness, Repository Baseline, or Repository Sync gates.

It coordinates existing gates and records evidence.

## Trigger Points

The Orchestrator should recommend this agent when:

- the user asks whether `pggg` can be used in another project;
- the target project is unknown or old;
- the target is not a Git repository;
- the target has sensitive path candidates;
- the target has no remote GitHub repository;
- the user asks for "推演", "演练", "准入", "先看看能不能用", or similar language;
- `pggg` install/baseline/sync logic changed and needs source validation.

## Agent Contract

### Inputs

```yaml
target:
  path:
  expected_mode: auto | app | docs-only | script-only
  allow_copy: true | false
  copy_root:
  allow_baseline_yes_in_copy: true | false
  desired_remote_sync: true | false
  user_goal:
```

### Outputs

```yaml
project_intake:
  status: ready | needs_baseline | blocked | unsafe | rehearsal_failed
  target:
  rehearsal_copy:
  project_type:
  git:
  runtime:
  sensitive_paths:
  ignore_boundary:
  generated_files:
  commit_policy:
  remote_sync:
  recommended_next_step:
  recommended_codex_prompt:
  artifacts:
```

### Required Artifacts

Simulation artifacts:

```text
.gstack/intake-last.json
docs/PROJECT_INTAKE_REPORT.md
.gstack/intake/<run-id>/simulation.json
.gstack/intake/<run-id>/recommended-codex-prompt.md
```

Rehearsal artifacts:

```text
.gstack/intake/<run-id>/rehearsal.json
.gstack/intake/<run-id>/install-summary.json
.gstack/intake/<run-id>/repository-state.json
.gstack/intake/<run-id>/workspace-hygiene.json
.gstack/intake/<run-id>/readiness-last.json
.gstack/intake/<run-id>/baseline-precheck.json
.gstack/intake/<run-id>/baseline-confirmed.json
.gstack/intake/<run-id>/git-ls-files.txt
.gstack/intake/<run-id>/score.json
```

These are runtime evidence and should default to `.gitignore`.

## Status Model

```text
ready
  Target is already safe for Codex takeover under the requested mode.

needs_baseline
  Target can be used, but must first pass Repository Baseline with user confirmation.

blocked
  A required capability is unavailable or the target state is inconsistent.

unsafe
  Sensitive files, generated artifacts, or unknown file ownership make takeover unsafe.

rehearsal_failed
  Simulation looked acceptable, but the copy rehearsal did not match expectations.
```

## Phase 1: Simulation

Simulation is read-only. It should never write into the target unless the target already has installed harness runtime and the user explicitly asked to refresh intake evidence.

Simulation checks:

- target exists and is readable;
- target is inside a Git repository or not;
- Git root equals target or target is nested;
- branch, HEAD, dirty files, staged files, untracked files;
- remote origin presence and URL;
- GitHub CLI availability and auth status;
- runtime manifest or known script bundle entrypoints;
- existing `.gitignore`;
- sensitive path candidates by path/name only;
- existing `.gstack`, `.ai-context`, `.gitnexus`, `PROJECT_STATE.md`, `CLAUDE.md`;
- likely generated/runtime artifacts;
- likely commit policy: app, docs-only, script-only, or blocked.

Simulation output must answer:

```text
Can pggg be installed?
Can Codex be allowed to take over?
Does Repository Baseline need user confirmation?
Which files should enter Git?
Which files must be ignored?
What prompt should the user give Codex next?
```

## Phase 2: Rehearsal

Rehearsal copies the target and runs commands only in the copy.

Default copy root:

```text
/tmp/pggg-rehearsals/<target-name>-<timestamp>
```

The runner should support an explicit copy root:

```bash
gstack-harness-intake rehearse --target /path/to/project --copy-to /path/to/rehearsal-root
```

Rehearsal command sequence:

```text
copy target
-> pggg --target <copy> --no-start-codex
-> read .gstack/install-summary.json
-> read .gstack/repository-state.json
-> read .gstack/workspace-hygiene.json
-> read .gstack/readiness-last.json
-> inspect .gitignore
-> run .gstack/harness/bin/gstack-harness-repository-baseline --target <copy> --json
-> if allowed and precheck is safe, run --yes in the copy
-> check git status --short
-> check git ls-files for sensitive/runtime paths
-> optionally run repository sync gate in no-push mode
-> write score and report
```

Rehearsal must preserve the original target untouched.

## Scoring

Score out of 100.

| Area | Points | Good Evidence |
|---|---:|---|
| Install safety | 15 | `pggg` runs in copy, no source target writes, install summary exists |
| Preflight completeness | 15 | repository-state, workspace-hygiene, readiness all generated |
| Git boundary | 20 | non-Git/baseline/remote state correctly classified |
| Ignore boundary | 15 | runtime evidence and sensitive paths are ignored |
| Sensitive-file safety | 15 | `git ls-files` excludes detected sensitive paths |
| Runtime detection | 10 | app/script/docs-only mode matches project facts |
| Handoff quality | 10 | recommended prompt and next recipe are unambiguous |

Verdicts:

```text
90-100 ready
75-89 needs_baseline or ready_with_warnings
60-74 blocked_until_fix
<60 unsafe
```

## Recommended Prompts

The agent must generate prompts. Users should not have to remember the correct handoff wording.

### Takeover Prompt

```text
You are taking over this project through pggg.

Do not modify business code, commit, or push yet.

Read:
- PROJECT_STATE.md
- .gstack/project-state.json
- .gstack/install-summary.json
- .gstack/repository-state.json
- .gstack/workspace-hygiene.json
- .gstack/readiness-last.json
- docs/FOUNDATION_READINESS_REPORT.md
- docs/REPOSITORY_STATE_REPORT.md
- docs/WORKSPACE_HYGIENE_REPORT.md
- docs/CODEX_START_PROMPT.md

First output only an intake report:
- current readiness verdict
- Git and remote state
- whether Repository Baseline is required
- runtime/test command detection
- files that may enter Git
- files that must remain ignored
- sensitive path candidates by path only
- one recommended next step

If the target is not a Git repository, only run Repository Baseline precheck.
Do not run repository-baseline --yes until I explicitly confirm.
Do not use git add -A.
```

### Task Prompt

```text
Now begin this task: <task>

Before editing:
- refresh repository-state and workspace-hygiene;
- state allowed writes;
- explain which generated harness evidence will not be committed.

During the task:
- change only required source/script/test/config files;
- do not stage secrets, runtime evidence, usage runs, agent JSON, readiness reports, or local index files.

Before finishing:
- run relevant project tests;
- run GitNexus detect_changes if the target is indexed;
- run workspace hygiene gate;
- run repository sync gate;
- report whether local and remote are consistent.
```

## File Ownership Policy

Versioned source candidates:

```text
source files
scripts
tests
package/runtime config
explicit user-approved docs
stable project docs
```

Runtime/local evidence:

```text
.gstack/intake/**
.gstack/*-last.*
.gstack/project-state.json
.gstack/repository-state.json
.gstack/workspace-hygiene.json
.gstack/repository-sync.json
.gstack/usage-runs/**
.ai-context/runs/**
.ai-context/gitnexus-*
.gitnexus/**
docs/agents/*.json
docs/FOUNDATION_READINESS_REPORT.md
docs/REPOSITORY_STATE_REPORT.md
docs/WORKSPACE_HYGIENE_REPORT.md
docs/PROJECT_INTAKE_REPORT.md
```

Blocked unless explicitly approved:

```text
.env
.env.*
*.pem
*.key
*.p12
*.pfx
password/token/secret/credential-like files
server access directories
browser profiles/cookies
large generated binaries
screenshots/captures unless product-approved
```

## Runner Design

Install into target projects:

```bash
.gstack/harness/bin/gstack-harness-intake
```

Source alias:

```bash
bin/gstack-harness-intake
```

Commands:

```bash
gstack-harness-intake simulate --target .
gstack-harness-intake rehearse --target . --copy-to /tmp/pggg-rehearsals
gstack-harness-intake report --target .
```

Flags:

```text
--json
--mode auto|app|docs-only|script-only
--copy-to DIR
--allow-baseline-yes-in-copy
--no-baseline-yes
--keep-copy
--cleanup-copy
```

Safety defaults:

```text
simulate: read-only
rehearse: copy-only
baseline --yes: copy-only and only after safe precheck
original target: never git init, never commit, never push
```

## Integration Points

Modify installer/remediation later to install:

```text
bin/gstack-harness-intake -> .gstack/harness/bin/gstack-harness-intake
```

Modify agent team docs later to include:

```text
Project Intake Simulation & Rehearsal Agent
```

Modify readiness later to summarize:

```json
{
  "project_intake": {
    "status": "needs_baseline",
    "last_run": ".gstack/intake-last.json",
    "report": "docs/PROJECT_INTAKE_REPORT.md"
  }
}
```

Modify `.gitignore` templates later to include:

```text
.gstack/intake/**
docs/PROJECT_INTAKE_REPORT.md
```

## Implementation Tasks

### Task 1: Add Intake Runner Skeleton

**Files:**

- Create: `bin/gstack-harness-intake`
- Modify: `bin/gstack-harness-init`
- Modify: `bin/gstack-harness-remediate`
- Modify: `bin/gstack-harness-self-test`
- Test: `tests/gstack-harness-intake.test.mjs`
- Test: `tests/gstack-harness-init.test.mjs`

**Step 1: Write failing test**

Add a test that invokes:

```bash
bin/gstack-harness-intake simulate --target <temp-project> --json
```

Expected failure before implementation: runner missing or command exits non-zero.

**Step 2: Implement minimal runner**

Support only:

```bash
simulate --target DIR --json
```

Return JSON with:

```json
{
  "schema": "gstack-harness.project_intake.v1",
  "status": "needs_baseline",
  "target": "...",
  "git": {"status": "missing"},
  "recommended_next_step": "Repository Baseline precheck"
}
```

**Step 3: Install runner**

Copy it through `gstack-harness-init` and remediation.

**Step 4: Verify**

Run:

```bash
node --test tests/gstack-harness-intake.test.mjs tests/gstack-harness-init.test.mjs
bash -n bin/gstack-harness-intake bin/gstack-harness-init bin/gstack-harness-remediate
```

### Task 2: Implement Simulation Checks

**Files:**

- Modify: `bin/gstack-harness-intake`
- Test: `tests/gstack-harness-intake.test.mjs`

**Step 1: Add tests**

Cover:

- non-Git target;
- Git target with no remote;
- target nested inside another Git repo;
- target with `.env`, `*.pem`, or `mima.txt`;
- Python bundle with `web_app.py`;
- docs-only target.

**Step 2: Implement checks**

Use Node.js inside the shell runner for filesystem and JSON handling.

**Step 3: Verify**

Run:

```bash
node --test tests/gstack-harness-intake.test.mjs
```

### Task 3: Implement Copy Rehearsal

**Files:**

- Modify: `bin/gstack-harness-intake`
- Test: `tests/gstack-harness-intake.test.mjs`

**Step 1: Add failing test**

Create a temp target with sensitive files. Run:

```bash
bin/gstack-harness-intake rehearse --target <target> --copy-to <tmp-root> --json
```

Expected:

- original target unchanged;
- rehearsal copy exists;
- install summary captured;
- baseline precheck captured.

**Step 2: Implement copy rehearsal**

Copy with `cp -a` or Node recursive copy. Exclude `.git` only when the mode explicitly requests a clean bundle copy; default should preserve target shape.

**Step 3: Verify**

Run:

```bash
node --test tests/gstack-harness-intake.test.mjs
```

### Task 4: Add Scoring And Prompt Generation

**Files:**

- Modify: `bin/gstack-harness-intake`
- Test: `tests/gstack-harness-intake.test.mjs`
- Modify: `docs/AGENT_RUN_CONTRACT.md`
- Modify: `WORKFLOW_RECIPES.md`

**Step 1: Add tests**

Assert generated report includes:

- verdict;
- next recipe;
- ignored paths;
- sensitive path summary;
- recommended takeover prompt.

**Step 2: Implement scoring**

Use the scorecard in this document.

**Step 3: Verify**

Run:

```bash
node --test tests/gstack-harness-intake.test.mjs
```

### Task 5: Source Rehearsal

**Files:**

- Modify: `docs/rehearsals/2026-05-21-huanzhuang-harness-rehearsal.md`

**Step 1: Run source rehearsal**

Use a copy of:

```text
/home/adminpcm/projects/huanzhuang/huanzhuang_clean_bundle
```

**Step 2: Record evidence**

Append:

- simulation verdict;
- rehearsal verdict;
- copied target path;
- install summary;
- baseline precheck;
- baseline confirmed result if used;
- final lessons.

**Step 3: Verify source**

Run:

```bash
npm run verify
```

Then:

```bash
npx gitnexus detect-changes
```

## Acceptance Criteria

- A user can run one command to simulate target project intake.
- A user can run one command to rehearse in a copy without touching the original.
- The runner writes machine-readable JSON and a human-readable report.
- The runner generates a recommended Codex takeover prompt.
- Non-Git targets are classified as `needs_baseline`, not ready.
- Sensitive paths are identified by path/name without reading contents.
- Ignored sensitive paths are not treated as commit candidates.
- Source self-test verifies the runner is installed into target projects.
- Full `npm run verify` passes before merge.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Rehearsal accidentally modifies original target | Rehearsal must operate only on copy paths and assert original mtime/file count where practical |
| Runner becomes a second installer | Keep install delegated to `pggg`; intake only orchestrates and records |
| Sensitive contents leak into reports | Report paths and reasons only, never file contents |
| Copying huge projects is slow | Add size estimate and require explicit `--copy-to` or confirmation for large targets |
| Nested Git repos are misclassified | Record both target path and Git root; warn when they differ |
| Reports get committed accidentally | Add `.gstack/intake/**` and `docs/PROJECT_INTAKE_REPORT.md` to ignore policy |

## Open Questions

- Should the first runner be installed into every target by default, or remain source-only until proven?
- Should rehearsal copies preserve `.git` by default, or create clean non-Git copies by default?
- Should script-only policy be a mode on intake or only a mode on repository sync?

Initial recommendation:

- install the runner by default;
- preserve `.git` by default because that reflects the target's real shape;
- support `--mode script-only` for simulation/reporting, but keep actual commit behavior inside Repository Sync Gate.
