# Repository Sync Gate Design

## Goal

When GStack Harness is installed into a target project, every completed agent task should leave the target repository in a clear Git state:

```text
synced
no_changes
blocked
push_failed
```

The harness should not let useful work stay silently local. It should either commit and push the verified change, prove there is nothing to push, or record the exact blocker.

## Current State

The harness already has most of the safety pieces:

- Repository baseline detection blocks serious workflows when a target project has no usable Git baseline.
- Workspace hygiene blocks secrets, browser profiles, runtime artifacts, and risky generated files from staged commits.
- `gstack-harness-atomic-commit` creates gated local commits by explicit file groups.
- `gstack-harness-atomic-commit --push` can push successful commits to `origin` on the current branch.
- `gstack-harness-atomic-commit --script-only --push` can publish only reusable script/code files.

The gap is orchestration. Target projects do not yet have a standard end-of-task gate that proves local Git and remote GitHub are consistent.

## Decision

Add a required target-project **Repository Sync Gate**.

The gate is a task completion step, not a background timer. It runs when an agent finishes a work unit and before the orchestrator marks the task complete.

```text
agent completes work
-> repository sync gate
-> project state update
-> task completion handoff
```

## Responsibilities

Repository Sync Gate owns:

- detecting target repo, current branch, HEAD, dirty files, staged files, and unpushed commits;
- checking `origin` availability and remote branch state;
- deciding whether a sync attempt is allowed;
- running the existing staged commit gates before commit;
- pushing successful commits;
- confirming `HEAD == origin/<branch>` after push or fetch;
- recording blockers and last sync status in `.gstack/project-state.json`;
- producing machine-readable and human-readable evidence.

It does not own:

- force push;
- rebase;
- branch deletion;
- stash;
- automatic GitHub repository creation;
- automatic remote setup without user confirmation;
- committing runtime artifacts or secrets;
- deciding product semantics of unknown files.

## State Model

`.gstack/project-state.json` should gain:

```json
{
  "repository_sync": {
    "status": "synced",
    "branch": "main",
    "head": "abc123",
    "origin_head": "abc123",
    "dirty": false,
    "staged_files": [],
    "untracked_files": [],
    "unpushed_commits": 0,
    "last_commit_status": "committed",
    "last_push_status": "pushed",
    "last_remote_check": "matched",
    "last_ci_status": "unknown",
    "checked_at": "2026-05-25T00:00:00.000Z",
    "blockers": [],
    "warnings": []
  }
}
```

Statuses:

```text
synced
  Local HEAD and origin/<branch> match after a successful push or fetch.

no_changes
  There are no eligible changed files and no unpushed commits.

blocked
  The gate cannot safely commit or push because a prerequisite or safety gate failed.

push_failed
  Local commit succeeded, but remote push or remote confirmation failed.

local_only
  Local commit is possible, but remote sync is unavailable by policy or missing remote/auth.
```

## Default Workflow

The standard target-project task completion flow should be:

```text
read repository state
-> fail early if not a git repo or no baseline
-> classify changed files
-> run relevant local verification
-> run workspace hygiene gate
-> run GitNexus staged postchange gate
-> atomic commit allowed groups
-> push to origin current branch
-> fetch/confirm origin/<branch>
-> query GitHub Actions when gh is authenticated
-> update repository_sync state
```

If there are no eligible files but the branch has unpushed commits, the gate should push and confirm the existing commits.

If there are dirty files outside the allowed policy, the gate should leave them unstaged and record them as excluded or blocked.

## File Policy

The gate must never run `git add -A`.

It stages only explicit paths selected by policy.

Allowed by default:

```text
source code
scripts
tests
required runtime/package config
user-approved docs
```

Blocked by default:

```text
.gstack runtime state
.ai-context
.gitnexus
.understand-anything
.env and secret-like files
cookies and browser profiles
screenshots and browser/device captures
runtime reports
output/dist/cache
large generated binaries
```

Script-only mode remains available for GStack Market Agent and reusable harness bundles:

```bash
.gstack/harness/bin/gstack-harness-atomic-commit --script-only --push
```

General target-project mode should use the normal grouped policy, not script-only, because business projects need to commit source code as well as scripts.

## Remote Handling

The first implementation should support:

```text
git push origin HEAD:<branch>
git fetch origin <branch>
compare HEAD with origin/<branch>
```

When SSH port 22 fails, the gate may try GitHub SSH over port 443 for GitHub remotes:

```text
ssh://git@ssh.github.com:443/<owner>/<repo>.git
```

If both fail, status becomes `push_failed`; the task is not marked as fully complete.

GitHub Actions checks should use `gh` when authenticated. If `gh` is missing or times out, the sync gate can still mark Git sync as `synced`, but CI status should be `unknown` with a warning.

## Integration Points

Install a new command into target projects:

```bash
.gstack/harness/bin/gstack-harness-sync-repository
```

The command should:

- wrap existing `gstack-harness-atomic-commit`;
- support `--script-only`, `--no-push`, `--dry-run`, and `--json`;
- write `.gstack/repository-sync.json`;
- update `.gstack/project-state.json`;
- write `docs/REPOSITORY_SYNC_REPORT.md` when not in JSON-only mode.

Readiness should display:

```text
repository sync: synced | no_changes | blocked | push_failed | local_only
```

Workflow recipes should require the sync gate before an agent task is marked completed.

## Safety Rules

- Never force push.
- Never rebase.
- Never auto-create a remote repository.
- Never auto-stage all files.
- Never commit blocked workspace hygiene files.
- Never treat a push failure as task completion.
- Never hide excluded files. Report them with reasons.

## Success Criteria

A target project is repository-sync ready when:

```text
1. it has a Git baseline;
2. it has a current branch;
3. it has origin configured;
4. the harness can commit eligible files after gates pass;
5. the harness can push to origin;
6. the harness can prove local HEAD equals origin/<branch>;
7. project state records the latest sync result.
```

This turns "agent finished locally" into "the target project is safely represented on the remote."
