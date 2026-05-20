# Agent-Led Atomic Auto Commit Design

## Goal

Reduce human involvement in commit cleanup by making the harness own standard atomic commits after verified work.

## Baseline

The repo already has two commit-safety capabilities:

- `gstack-harness-workspace-hygiene gate` blocks staged secrets, browser profile state, runtime artifacts, and risky large assets.
- `node scripts/ai-context-bridge.mjs postchange --scope staged` turns staged GitNexus and hygiene evidence into a commit gate.

The missing capability is orchestration: group changed files into commit-sized topics, stage one group at a time, run the existing staged gate, commit passing groups, and maintain a fresh session baseline.

## Design

Add `gstack-harness-atomic-commit` as an explicit harness command. By default it is allowed to commit safe groups. It is not a background scheduler and does not silently run on a timer.

The command runs:

```text
scan git status
-> classify files into atomic groups
-> refresh .ai-context change baseline when available
-> stage one group
-> run workspace hygiene gate
-> run ai-context staged postchange
-> commit if the staged gate passes
-> unstage and stop on blocked or needs_review
-> refresh baseline after successful commits
```

Groups use conservative path contracts:

- `docs`: Markdown docs and plans.
- `tests`: test files.
- `harness`: harness scripts, agent manifests, scheduler scripts, and package metadata.
- `protocol`: root protocol files such as `AGENTS.md`, `CLAUDE.md`, templates, recipes, and runbooks.
- `mixed`: fallback group when files do not fit a known contract.

Each commit message is generated from the group:

```text
docs: update harness documentation
test: update harness tests
feat: update harness automation
docs: update project protocol
chore: update workspace changes
```

## Safety Rules

- Default mode commits safe groups automatically.
- `--dry-run` shows grouping and messages without staging or committing.
- `--no-commit` runs gates but leaves committing to a human.
- A staged gate of `blocked` or `needs_review` stops the run and leaves the worktree unstaged.
- The command never adds ignored files through `git add -A`.
- The command only stages explicit file paths from its current group.
- Baseline refresh is automatic when `scripts/ai-context-bridge.mjs` exists.

## Integration

`gstack-harness-init` installs the command into target projects under `.gstack/harness/bin/`.

`WORKFLOW_RECIPES.md` gains a standard commit recipe: Agent-led work should finish by running the atomic commit command. Humans handle only exceptions.

## Verification

Tests cover:

- dry-run grouping without commits;
- automatic safe commit creation;
- blocked gates stop commits;
- init installs the command;
- workflow docs advertise the default.
