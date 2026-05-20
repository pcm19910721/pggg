# Agent-Led Atomic Auto Commit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a harness command that lets agents automatically create safe atomic commits and refresh the code-context baseline.

**Architecture:** Add a standalone harness bin command that groups git changes, stages one group at a time, delegates safety to existing staged gates, commits passing groups, and refreshes the session baseline before and after the run. Install it through `gstack-harness-init` and document it as the default post-work commit path.

**Tech Stack:** Bash wrapper, inline Node.js, Git CLI, existing `gstack-harness-workspace-hygiene`, existing `scripts/ai-context-bridge.mjs`, Node test runner.

---

### Task 1: Add Failing Tests

**Files:**
- Create: `tests/gstack-harness-atomic-commit.test.mjs`
- Modify: `tests/gstack-harness-init.test.mjs`

**Steps:**

1. Write a test that creates a temp Git repo with docs and test changes, runs `gstack-harness-atomic-commit --dry-run`, and expects grouped output with no commits.
2. Write a test that creates a fake passing `scripts/ai-context-bridge.mjs`, runs `gstack-harness-atomic-commit`, and expects two commits for docs and tests plus a refreshed baseline call.
3. Write a test that creates a fake blocked staged gate and expects no commit.
4. Add an init test assertion that `.gstack/harness/bin/gstack-harness-atomic-commit` is installed.
5. Run `node --test tests/gstack-harness-atomic-commit.test.mjs tests/gstack-harness-init.test.mjs` and confirm the new tests fail because the command does not exist.

### Task 2: Implement Atomic Commit Runner

**Files:**
- Create: `bin/gstack-harness-atomic-commit`

**Steps:**

1. Add CLI parsing for `--target`, `--dry-run`, `--no-commit`, and `--json`.
2. Read `git status --short --untracked-files=all`.
3. Group files into `docs`, `tests`, `harness`, `protocol`, and `mixed`.
4. Refresh baseline with `node scripts/ai-context-bridge.mjs baseline` when available.
5. For each group, stage explicit paths with `git add -- <paths>`.
6. Run workspace hygiene gate if available.
7. Run staged postchange with a stable run id and read `.ai-context/runs/<run-id>/run.json`.
8. Commit only when the effective commit gate is `pass`.
9. Unstage and stop on blocked or review-required gates.
10. Refresh baseline after successful commits.

### Task 3: Install And Document

**Files:**
- Modify: `bin/gstack-harness-init`
- Modify: `WORKFLOW_RECIPES.md`

**Steps:**

1. Copy the new bin command during init.
2. Add it to chmod setup.
3. Add a workflow recipe for Agent-led atomic auto commit.
4. Mention that baseline refresh is part of the commit closeout.

### Task 4: Verify And Commit

**Steps:**

1. Run `node --test tests/gstack-harness-atomic-commit.test.mjs tests/gstack-harness-init.test.mjs`.
2. Run `npm test`.
3. Run `npm run check:shell`.
4. Run GitNexus detect changes for all changes.
5. Run `gstack-harness-atomic-commit --dry-run`.
6. Run `gstack-harness-atomic-commit` to let the new command commit the safe groups.
