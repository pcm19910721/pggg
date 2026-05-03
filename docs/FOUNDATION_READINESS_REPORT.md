# Foundation Readiness Report

Generated: 2026-04-28
Project: gstack-multiagent
Run type: dry run
Verdict: partial

## Summary

The foundation is good enough to continue planning and documentation work, but it is not ready for full Orchestrator takeover.

The strongest ready area is gstack: skills, bin tools, browse, and design are present. The main blockers are missing project state, empty gbrain, no git repository, and no runtime metadata.

## Capability Sources

| Area | Status | Evidence |
|---|---|---|
| gbrain | partial | `gbrain 0.19.0` is installed; `gbrain doctor --fast --json` returned warnings; `gbrain list` returned no pages |
| gstack | ready | `/home/adminpcm/.claude/skills/gstack` has 43 `SKILL.md` files and required bin tools |
| gstack browse | ready | `/home/adminpcm/.claude/skills/gstack/browse/dist/browse` responds to `--help` |
| gstack design | ready | `/home/adminpcm/.claude/skills/gstack/design/dist/design` responds to `--help` |
| gstack memory sync | partial | `gbrain_sync_mode=off`; OK for single-machine work, not ready for cross-machine memory sync |
| project protocol | partial | Core protocol docs exist, but `PROJECT_STATE.md` is missing |
| local agent instructions | partial | `CLAUDE.md` and `AGENTS.md` are missing; template exists as `CLAUDE_MD_TEMPLATE.md` |
| git state | blocked for release flows | Current directory is not a git repository; branch and commit are unknown |
| runtime | partial | No `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Makefile`, or `.env.example` found |
| browser runner | ready | browse CLI is installed; no live app URL exists for this docs-only project |
| Windows runner | not required for current dry run | Running under WSL2; `cmd.exe` is visible, but no Windows Test Host handoff is configured |

## Blockers

- `project_state_missing`: `PROJECT_STATE.md` does not exist, so the Orchestrator has no local state snapshot.
- `gbrain_unseeded`: gbrain is installed but has no pages, so long-term project/system memory is not available yet.
- `not_git_repo`: the directory is not a git repository, so branch, commit, diff, review, and release evidence cannot bind to source control.

## Warnings

- `local_instructions_missing`: neither `CLAUDE.md` nor `AGENTS.md` exists. The reusable template exists, but this project has not installed it.
- `runtime_missing`: no executable project entrypoint was detected. This is acceptable for documentation-only work, but blocks `/health`, `/qa`, and release-style recipes until clarified.
- `gbrain_sync_off`: acceptable for local experimentation, but cross-machine memory reuse will need `artifacts-only` or another explicit mode.
- `windows_host_unconfigured`: not needed for this dry run, but Windows-bound claims should remain blocked until a Windows Test Host handoff exists.

## Next Recommended Action

Recipe: `R-0.5 Foundation Remediation`

Reason:

```text
Readiness is partial. Before business recipes, seed gbrain and create PROJECT_STATE.md.
```

Recommended remediation order:

1. Create `PROJECT_STATE.md` from `PROJECT_STATE_TEMPLATE.md`.
2. Seed gbrain pages for orchestration principles, project overview, decisions, and memory policy.
3. Decide whether this directory should become a git repository or remain a docs-only workspace.
4. Create `CLAUDE.md` or `AGENTS.md` from the template if this directory should self-host the harness protocol.
5. Mark runtime as docs-only/not required, or add runtime commands if this becomes an executable harness project.

## System Tuning Notes

- `PROJECT_STATE_TEMPLATE.md` may need a `Runtime: not_required` state for docs-only or protocol-only projects.
- The gstack root detection in older preamble snippets can point at `.agents/skills/gstack`, but this machine's actual root is `/home/adminpcm/.claude/skills/gstack`.
- Foundation Readiness should record both `gstack_root_detected` and `gstack_root_expected` to avoid false negatives.
