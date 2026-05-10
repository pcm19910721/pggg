# Project State

## Current

- Phase: foundation
- Goal: Project-level gstack harness installed by local template source.
- Branch: main
- Last updated: 2026-05-10
- Last completed agent: Foundation Remediation Agent
- Next recommended agent: Orchestrator
- Next recommended recipe: R0 Restore / Resume Context
- Workspace mode: target_project

## Foundation

- Readiness: ready
- Last readiness check: docs/FOUNDATION_READINESS_REPORT.md
- Remediation: fixed
- Remediation report: docs/FOUNDATION_REMEDIATION_REPORT.md
- gbrain: ready
- gbrain query: ready
- gstack: ready
- Project protocol: ready
- Structured state: .gstack/project-state.json
- Agent team: .gstack/harness/agents/TEAM.md
- Problem handling: required
- Runtime: not_required
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
- Code Context: ready
- Health: unknown
- Browser QA: not_run
- Windows QA: skipped
- Review: not_run
- Security: not_run
- Performance: not_run
- Deployment: not_started

## Gate Evidence

- Foundation Readiness:
  - Report: docs/FOUNDATION_READINESS_REPORT.md
  - Checked at: 2026-05-03
  - Blockers: none
- Code Context:
  - Provider: GitNexus
  - Config: .ai-context/project.json
  - Status: .ai-context/gitnexus-status.json
  - Index summary: .ai-context/gitnexus-index.md
  - Run files: .ai-context/runs/
  - Optional UA knowledge graph: .understand-anything/knowledge-graph.json
  - Optional UA domain graph: .understand-anything/domain-graph.json
  - Optional UA diff overlay: .understand-anything/diff-overlay.json
  - Last updated: 2026-05-10T08:48:59.607Z
  - Skip reason:
- Health:
  - Command: not_required
  - Exit code:
  - Artifact:
- Browser QA:
  - URL: not_required
  - Artifact:
  - Skip reason:
- Windows QA:
  - Target OS: windows
  - Runner: not_required
  - Artifact:
  - Skip reason: no Windows-only claims during harness init
- Review:
  - Base:
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
- Agent team: .gstack/harness/agents/TEAM.md
- Problem handling agent: .gstack/harness/agents/problem-handling.md
- Problem handling report: docs/PROBLEM_HANDLING_REPORT.md
- System tuning report: docs/SYSTEM_TUNING_REPORT.md
- Code context report: docs/CODE_CONTEXT_REPORT.md
- Code context config: .ai-context/project.json
- GitNexus status: .ai-context/gitnexus-status.json
- GitNexus index summary: .ai-context/gitnexus-index.md
- GitNexus run files: .ai-context/runs/
- Optional UA knowledge graph: .understand-anything/knowledge-graph.json
- Optional UA domain graph: .understand-anything/domain-graph.json
- Optional UA diff overlay: .understand-anything/diff-overlay.json
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

None

## Warnings

- gbrain_query_timeout
- gbrain_sync_off

## Recent Agent Runs

- 2026-05-03: pcm-harness installed harness protocol. Verdict: ready.

## Notes

- Installed from template source: /home/adminpcm/gstack-multiagent
- This target project can override default replaceable agents in .gstack/harness/.
- Do not modify gstack skill internals from this project.
