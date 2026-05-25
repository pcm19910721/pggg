# Repository Sync Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a target-project repository sync gate that commits eligible changes, pushes them to the remote, confirms local and remote HEAD match, and records the result.

**Architecture:** Add a new harness command, `bin/gstack-harness-sync-repository`, that wraps existing repository state, workspace hygiene, GitNexus postchange, and atomic commit behavior. Install it into target projects via init/remediation, render its state in readiness, and require it in workflow recipes as the standard end-of-task Git consistency gate.

**Tech Stack:** Bash entrypoint with embedded Node.js, existing `git`, optional `gh`, existing harness JSON/report conventions, Node test runner.

---

### Task 1: Add Failing Tests For Sync Command Installation

**Files:**
- Modify: `tests/gstack-harness-init.test.mjs`
- Modify: `tests/gstack-harness-readiness.test.mjs`

**Step 1: Write failing install assertions**

Add assertions that `gstack-harness-init` installs:

```text
.gstack/harness/bin/gstack-harness-sync-repository
```

and that remediation restores it if missing.

**Step 2: Run tests to verify failure**

Run:

```bash
node --test tests/gstack-harness-init.test.mjs tests/gstack-harness-readiness.test.mjs
```

Expected: fail because the sync command does not exist yet.

### Task 2: Create The Sync Command Skeleton

**Files:**
- Create: `bin/gstack-harness-sync-repository`
- Modify: `bin/gstack-harness-init`
- Modify: `bin/gstack-harness-remediate`

**Step 1: Implement CLI arguments**

Support:

```text
--target DIR
--dry-run
--json
--script-only
--no-push
```

Reject invalid combinations early.

**Step 2: Install the command**

Update init/remediation copy lists so target projects receive the command under:

```text
.gstack/harness/bin/gstack-harness-sync-repository
```

**Step 3: Run tests**

Run:

```bash
node --test tests/gstack-harness-init.test.mjs
```

Expected: install and remediation assertions pass.

### Task 3: Add Repository State Detection Tests

**Files:**
- Create or modify: `tests/gstack-harness-sync-repository.test.mjs`

**Step 1: Write tests for blocked prerequisites**

Cover:

```text
not a git repo -> blocked
detached HEAD -> blocked
missing origin -> local_only or blocked, depending on --no-push
```

**Step 2: Run tests to verify failure**

Run:

```bash
node --test tests/gstack-harness-sync-repository.test.mjs
```

Expected: fail until command implements state detection.

### Task 4: Implement State Detection And Reports

**Files:**
- Modify: `bin/gstack-harness-sync-repository`

**Step 1: Detect local Git state**

Use non-destructive commands:

```bash
git rev-parse --is-inside-work-tree
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git config --get remote.origin.url
```

**Step 2: Write artifacts**

Write:

```text
.gstack/repository-sync.json
docs/REPOSITORY_SYNC_REPORT.md
```

Update:

```text
.gstack/project-state.json.repository_sync
```

**Step 3: Run tests**

Run:

```bash
node --test tests/gstack-harness-sync-repository.test.mjs
```

Expected: prerequisite tests pass.

### Task 5: Add Commit And Push Tests

**Files:**
- Modify: `tests/gstack-harness-sync-repository.test.mjs`

**Step 1: Test no-change state**

Create a repo with `origin` and no changes. Assert:

```text
status = no_changes
unpushed_commits = 0
```

**Step 2: Test push existing local commits**

Create a bare remote, make a local commit, run sync. Assert:

```text
status = synced
HEAD == origin/<branch>
```

**Step 3: Test commit changed script files**

Create an uncommitted script file, run:

```bash
bin/gstack-harness-sync-repository --script-only --json
```

Assert the script file is committed and pushed.

**Step 4: Run tests to verify failure**

Expected: fail until command wraps atomic commit and push confirmation.

### Task 6: Implement Atomic Commit Integration

**Files:**
- Modify: `bin/gstack-harness-sync-repository`

**Step 1: Call atomic commit**

If there are eligible dirty files, call:

```bash
.gstack/harness/bin/gstack-harness-atomic-commit --push --json
```

or in template source/local development:

```bash
bin/gstack-harness-atomic-commit --push --json
```

Pass `--script-only` through when requested.

**Step 2: Handle no dirty files but unpushed commits**

If no eligible dirty files exist but `HEAD` differs from `origin/<branch>`, push directly.

**Step 3: Confirm remote**

Run:

```bash
git fetch origin <branch>
git rev-parse HEAD
git rev-parse origin/<branch>
```

Set `status = synced` only when the SHAs match.

**Step 4: Run tests**

Run:

```bash
node --test tests/gstack-harness-sync-repository.test.mjs
```

Expected: commit and push tests pass.

### Task 7: Add Push Failure And Fallback Tests

**Files:**
- Modify: `tests/gstack-harness-sync-repository.test.mjs`

**Step 1: Test push failure**

Configure an invalid `origin`. Assert:

```text
status = push_failed
last_push_status = failed
```

**Step 2: Test GitHub SSH 443 fallback parsing**

Use a fake `git` wrapper or isolated helper to verify a GitHub SSH remote can be transformed into:

```text
ssh://git@ssh.github.com:443/<owner>/<repo>.git
```

**Step 3: Implement fallback**

Try fallback only for GitHub SSH remotes and only after normal push fails.

### Task 8: Render Readiness And Workflow Recipe

**Files:**
- Modify: `bin/gstack-harness-readiness`
- Modify: `WORKFLOW_RECIPES.md`
- Modify: `docs/AGENT_RUN_CONTRACT.md`

**Step 1: Read repository sync state**

Render latest `.gstack/repository-sync.json` into readiness and project state.

**Step 2: Update recipes**

Add a repository sync completion step:

```text
agent task complete
-> run repository sync gate
-> only then mark handoff completed
```

**Step 3: Run targeted tests**

Run:

```bash
node --test tests/gstack-harness-readiness.test.mjs
```

Expected: readiness includes repository sync state.

### Task 9: Full Verification

**Files:**
- All touched files

**Step 1: Run full test gate**

Run:

```bash
npm run verify
```

Expected:

```text
all node tests pass
shell syntax check passes
self-test passes
```

**Step 2: Run GitNexus change detection**

Run GitNexus `detect_changes` with `scope: all`.

Expected: affected scope matches harness sync command, init/remediation, readiness, and docs.

**Step 3: Commit**

Commit in focused groups:

```bash
git add bin/gstack-harness-sync-repository tests/gstack-harness-sync-repository.test.mjs
git commit -m "feat: add repository sync gate"

git add bin/gstack-harness-init bin/gstack-harness-remediate bin/gstack-harness-readiness tests/*.mjs
git commit -m "feat: install repository sync gate"

git add WORKFLOW_RECIPES.md docs/AGENT_RUN_CONTRACT.md docs/plans/2026-05-25-repository-sync-gate-design.md docs/plans/2026-05-25-repository-sync-gate-implementation.md
git commit -m "docs: define repository sync workflow"
```

Push only after verification is green.
