# Project State

## Current

- Phase: foundation
- Goal: Turn the gstack multi-agent workflow documents into a usable project-level harness protocol.
- Branch: none
- Last updated: 2026-04-30
- Last completed agent: Orchestrator
- Next recommended agent: Orchestrator
- Workspace mode: template_source

## Foundation

- Readiness: ready
- Last readiness check: docs/FOUNDATION_READINESS_RECHECK.md
- Remediation: partial
- gbrain: ready
- gstack: ready
- Project protocol: ready
- Runtime: ready
- Runners: ready
- Memory policy: ready

## Runtime

- Install command: not_required
- Dev command: not_required
- Test command: not_required
- Lint command: not_required
- Typecheck command: not_required
- Local URL: not_required
- Production URL: not_required

## Quality Gates

- Foundation Readiness: ready
- Code Context: missing
- Health: unknown
- Browser QA: not_run
- Windows QA: skipped
- Review: not_run
- Security: not_run
- Performance: not_run
- Deployment: not_started

## Gate Evidence

- Foundation Readiness:
  - Report: docs/FOUNDATION_READINESS_RECHECK.md
  - Checked at: 2026-04-28
  - Blockers: none
- Code Context:
  - Provider: GitNexus
  - Config: target projects get .ai-context/project.json
  - Status:
  - Index summary:
  - Skip reason:
- Health:
  - Command: not_required
  - Exit code:
  - Artifact:
- Browser QA:
  - URL: not_required
  - Artifact:
  - Skip reason: docs-only protocol workspace, no runtime surface
- Windows QA:
  - Target OS: windows
  - Runner: not_required
  - Artifact:
  - Skip reason: current dry run does not make Windows-only behavior claims
- Review:
  - Base: none
  - Artifact:
- Security:
  - Artifact:
  - Skip reason:
- Performance:
  - Artifact:
  - Skip reason:

## Artifacts

- Foundation readiness report: docs/FOUNDATION_READINESS_REPORT.md
- Foundation remediation report: docs/FOUNDATION_REMEDIATION_REPORT.md
- Code context report: docs/CODE_CONTEXT_REPORT.md
- Code context bridge: scripts/ai-context-bridge.mjs
- Code context config: target projects get .ai-context/project.json
- GitNexus index/status: generated in target projects under .ai-context/
- Optional UA artifacts: .understand-anything/* only when dashboard/onboarding/domain/fallback is used
- Product brief:
- Design system:
- Implementation plan:
- QA report:
- Review report:
- Security report:
- Performance report:
- Release status:
- Retro:

## Blockers

- None

## Recent Agent Runs

- 2026-04-28: Foundation Readiness dry run completed. Verdict: partial.
- 2026-04-28: Foundation Remediation created PROJECT_STATE.md, CLAUDE.md, seeded gbrain core pages. Verdict: partial.
- 2026-04-28: Foundation Readiness recheck completed. Cleared project_state_missing, gbrain_unseeded, and local_instructions_missing. Verdict: ready for template_source mode.
- 2026-04-28: Implemented local stage-1 `bin/gstack-harness-init`; verified docs-only install in `/tmp/gstack-harness-test2`.
- 2026-04-28: Upgraded `bin/gstack-harness-init` to reconcile existing files: harness docs get `.bak-<timestamp>` backups and `CLAUDE.md` uses a managed block.
- 2026-04-28: Added Codex handoff path: init writes `docs/CODEX_START_PROMPT.md` and can open interactive Codex in the target project with the first Orchestrator prompt.
- 2026-04-28: Captured first real target handoff feedback from `.codex-tools`: Codex correctly chose R0, but gbrain query hit a PGLite lock timeout. Added query-timeout fallback policy and `.gstack/project-state.json` generation to the harness.
- 2026-04-28: Changed product default: `gstack-harness-init` is the single standard onboarding flow and opens Codex after install/upgrade by default.
- 2026-04-28: Tightened product framing: the normal user path is one standard flow, `cd target-project && gstack-harness-init`; flags are maintainer/debug controls, not onboarding choices.
- 2026-04-28: Added required-core Problem Handling Agent and standard agent team installation under `.gstack/harness/agents/`; warnings/timeouts now route to Problem Handling instead of staying as loose Orchestrator narration.
- 2026-04-28: Absorbed `.codex-tools` R14 feedback into the template source: init now seeds missing `docs/PROBLEM_HANDLING_REPORT.md` and `docs/SYSTEM_TUNING_REPORT.md` templates, preserves existing report artifacts, and links them in `.gstack/project-state.json`.
- 2026-04-28: Hardened re-init behavior: installer now preserves existing project operating state fields like phase, next recommendation, warnings, problem_handling, and system_tuning while refreshing foundation/runtime/protocol readiness.
- 2026-04-28: Added `bin/gstack-harness-self-test` for template-source maintenance; it verifies fresh install, managed block, JSON parse, agent team files, report templates, and re-init state preservation.
- 2026-04-29: Added automated usage feedback loop: target installs now include `gstack-harness-record-run`, write `.gstack/usage-runs/*.json`, register projects for aggregation, record standard Codex session start/end around `gstack-harness-init`, and `gstack-harness-usage-report` generates usage feedback summaries. Self-test now verifies recording and aggregation.
- 2026-04-29: Added `gstack-harness-enable-report-timer` to write a systemd user service/timer for reboot-resilient usage feedback aggregation. The command supports no-enable/dry-run testing and optional linger for pre-login boot execution.
- 2026-04-29: Added `pcm-harness` as the single user-facing command. `gstack-harness-init` remains the internal implementation, while normal target-project usage is now `cd target-project && pcm-harness`. Target-installed `pcm-harness` resolves back to the template source through `.gstack/project-state.json`.
- 2026-04-30: Added Windows PowerShell shim files `pcm-harness.cmd` and `pcm-harness.ps1`. Windows `pcm-harness` now bridges into WSL, converts the current Windows directory to `/mnt/<drive>/...`, and calls the WSL template-source implementation.
- 2026-04-30: Added Codebase Map Agent as a project-defined starter role. Existing-code workflows now run Understand Anything mapping before `/office-hours`, task implementation, pre-landing review, and incident triage when codebase context or impact evidence is needed.
- 2026-05-03: Converted Codebase Map into GitNexus-first Code Context. Target installs now generate `.ai-context/project.json`, install `scripts/ai-context-bridge.mjs`, use GitNexus status/query/context/impact/detect-changes as the default code facts source, and keep UA optional for dashboard/onboarding/domain/fallback.

## Notes

- This is currently a docs-only protocol workspace. Runtime commands are intentionally marked `not_required`.
- Workspace mode is `template_source`; `not_git_repo` is a warning for template maintenance, not a blocker for docs/protocol work.
- If this workspace becomes the source-of-truth repo for the harness product, initialize git before review/release workflows.
- Stage 1 usage: expose `/home/adminpcm/gstack-multiagent/bin/pcm-harness` on PATH, then run `pcm-harness` inside a target project.
- Do not modify gstack skill internals from this project.
