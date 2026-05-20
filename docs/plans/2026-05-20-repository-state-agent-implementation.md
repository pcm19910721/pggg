# Repository State Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a required core Repository State Agent that makes Git repository state an explicit gate before Code Context, Review, and Release workflows.

**Architecture:** Foundation Readiness performs a light Git probe, while Repository State Agent owns detailed Git state artifacts and remediation decisions. Code Context, Review, and Release consume `.gstack/repository-state.json` instead of rediscovering Git prerequisites independently.

**Tech Stack:** Bash harness scripts, Node.js bridge/report helpers, Markdown protocol docs, Node test runner, shell self-test.

---

### Task 1: Add Repository State Agent To Protocol Docs

**Files:**
- Modify: `.gstack/harness/agents/TEAM.md`
- Modify: `docs/AGENT_WORKFLOWS.md`
- Modify: `docs/AGENT_ORCHESTRATOR.md`
- Modify: `docs/AGENT_RUN_CONTRACT.md`

**Step 1: Write the doc expectation test**

Add a shell self-test assertion in `bin/gstack-harness-self-test` that installed team docs include `Repository State Agent`.

Expected failing assertion:

```bash
assert_contains "$INSTALL_DIR/.gstack/harness/agents/TEAM.md" "Repository State Agent"
```

**Step 2: Run the failing test**

Run:

```bash
bin/gstack-harness-self-test
```

Expected: FAIL because generated docs do not mention Repository State Agent.

**Step 3: Update docs and generated templates**

Add Repository State Agent as a required core agent with responsibility:

```text
Owns Git repository facts, session baseline, dirty/staged scope, and remote readiness gates.
```

**Step 4: Run the test**

Run:

```bash
bin/gstack-harness-self-test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add .gstack/harness/agents/TEAM.md docs/AGENT_WORKFLOWS.md docs/AGENT_ORCHESTRATOR.md docs/AGENT_RUN_CONTRACT.md bin/gstack-harness-self-test
git commit -m "Document repository state agent"
```

### Task 2: Add Repository State Probe To Readiness

**Files:**
- Modify: `bin/gstack-harness-readiness`
- Modify: `tests/gstack-harness-readiness.test.mjs`

**Step 1: Write failing tests**

Add tests for:

- no `.git` produces `repository_state.status === "partial"` in docs-only mode;
- no `.git` produces a `not_git_repo` warning in app mode;
- initialized repo with HEAD produces `repository_state.status === "ready"`.

Expected JSON field:

```js
assert.equal(output.repository_state.status, 'ready');
assert.equal(output.repository_state.has_initial_commit, true);
```

**Step 2: Run the failing tests**

Run:

```bash
node --test tests/gstack-harness-readiness.test.mjs
```

Expected: FAIL because `repository_state` is missing.

**Step 3: Implement minimal probe**

In `gstack-harness-readiness`, collect:

```text
repo_root
target_inside_repo
branch
head
has_initial_commit
dirty
dirty_files
staged_files
untracked_files
remote_status
warnings
blockers
```

Write the object into readiness output and `.gstack/project-state.json`.

**Step 4: Run tests**

Run:

```bash
node --test tests/gstack-harness-readiness.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add bin/gstack-harness-readiness tests/gstack-harness-readiness.test.mjs
git commit -m "Add repository state readiness probe"
```

### Task 3: Add Repository State Report Artifacts

**Files:**
- Modify: `bin/gstack-harness-readiness`
- Modify: `bin/gstack-harness-remediate`
- Test: `bin/gstack-harness-self-test`

**Step 1: Write failing self-test assertions**

Assert installed/remediated targets include:

```text
docs/REPOSITORY_STATE_REPORT.md
.gstack/repository-state.json
docs/agents/repository-state.json
```

**Step 2: Run failing self-test**

Run:

```bash
bin/gstack-harness-self-test
```

Expected: FAIL because artifacts are missing.

**Step 3: Implement report generation**

Readiness writes the current repository state report. Remediation ensures placeholder artifacts exist when readiness has not run.

**Step 4: Run self-test**

Run:

```bash
bin/gstack-harness-self-test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add bin/gstack-harness-readiness bin/gstack-harness-remediate bin/gstack-harness-self-test
git commit -m "Write repository state artifacts"
```

### Task 4: Gate Code Context On Repository State

**Files:**
- Modify: `scripts/ai-context-bridge.mjs`
- Modify: `tests/ai-context-bridge.test.mjs`

**Step 1: Write failing tests**

Add tests showing:

- `baseline` in non-git repo exits with a structured repository-state error;
- `postchange` in non-git repo writes a run artifact with `repository_state.status === "blocked"` when possible;
- `status` can still run in non-git repo and reports branch as `not-a-git-repo`.

**Step 2: Run failing tests**

Run:

```bash
node --test tests/ai-context-bridge.test.mjs
```

Expected: FAIL because errors are not tied to repository-state artifacts.

**Step 3: Implement early gate helper**

Add a helper in `ai-context-bridge.mjs`:

```js
function repositoryState(config) { ... }
function requireGitRepository(config, commandName) { ... }
```

Use it before `refresh`, `baseline`, and `postchange`.

**Step 4: Run tests**

Run:

```bash
node --test tests/ai-context-bridge.test.mjs
```

Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/ai-context-bridge.mjs tests/ai-context-bridge.test.mjs
git commit -m "Gate bridge commands on repository state"
```

### Task 5: Add Policy And User Guidance

**Files:**
- Modify: `bin/gstack-harness-init`
- Modify: `WORKFLOW_RECIPES.md`
- Modify: `PROJECT_STATE.md`
- Modify: `docs/USAGE_FEEDBACK_REPORT.md` only if regenerated by existing tooling

**Step 1: Write failing self-test assertion**

Assert generated `PROJECT_STATE.md` includes a Repository State section and next action for `not_git_repo`.

**Step 2: Run failing self-test**

Run:

```bash
bin/gstack-harness-self-test
```

Expected: FAIL because generated state lacks the section.

**Step 3: Add policy defaults**

Generated project state should include:

```yaml
repository_policy:
  auto_init_empty_repo: true
  auto_init_existing_files: ask
  auto_initial_commit: ask
  require_git_for_code_context: true
  require_baseline_for_review: true
  require_remote_for_release: true
```

**Step 4: Run full verification**

Run:

```bash
npm run verify
```

Expected: PASS.

**Step 5: Run GitNexus detect changes**

Run:

```bash
npx gitnexus detect-changes --scope all --repo gstack-multiagent
```

Expected: LOW or explain any higher risk before committing.

**Step 6: Commit**

```bash
git add bin/gstack-harness-init WORKFLOW_RECIPES.md PROJECT_STATE.md bin/gstack-harness-self-test
git commit -m "Add repository state policy guidance"
```
