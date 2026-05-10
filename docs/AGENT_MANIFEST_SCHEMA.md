# Agent Manifest Schema

Agent manifests declare how an agent is routed, what it can read, what it may write, which tools it may use, and what evidence it must leave.

Manifests are policy. They are not run logs.

## Location

Project manifests live in:

```text
.gstack/agents/<agent-id>.yaml
```

Generated status snapshots live in:

```text
docs/agents/<agent-id>.json
```

Do not confuse the two:

- manifest: what the agent is allowed and expected to do;
- status: what happened in the latest observed run.

## Required Fields

```yaml
schema: gstack-harness.agent_manifest.v1
id:
name:
group:
description:
triggers:
requires:
reads:
tools:
writes:
quality_gates:
permissions:
handoff:
failure_routes:
usage_recording:
```

## Field Contract

### `schema`

Must be `gstack-harness.agent_manifest.v1`.

### `id`

Stable kebab-case id. It must match the filename.

Example:

```yaml
id: code-context
```

### `group`

One of:

```text
core-control
foundation
delivery
maintenance
project-defined
```

### `triggers`

Human intent patterns and machine state triggers.

```yaml
triggers:
  user_intents:
    - "先看懂这个项目"
    - "这次 diff 影响什么"
  state:
    - code_context: missing
    - code_context: stale
```

### `requires`

Preconditions before the agent can run.

```yaml
requires:
  foundation_readiness: ready_or_remediable
  code_context: ready
  git_worktree: clean_or_dirty_allowed
```

Use `none` only when the agent is explicitly allowed to run in broken states, such as Problem Handling.

### `reads`

Files, directories, resources, or memory pages read during preflight.

```yaml
reads:
  local:
    - PROJECT_STATE.md
    - .gstack/project-state.json
  gbrain:
    - project/<id>/state
```

### `tools`

Allowed skills, commands, and MCP tools.

```yaml
tools:
  gstack_skills:
    - review
  gitnexus:
    - detect_changes
    - impact
  shell:
    - npm test
```

### `writes`

Allowed output paths. Agents should not write outside these paths without Orchestrator scope expansion.

```yaml
writes:
  reports:
    - docs/REVIEW_REPORT.md
  artifacts:
    - .ai-context/runs/
```

### `quality_gates`

Gates this agent may support. This does not mean the agent may directly mark the gate passing.

```yaml
quality_gates:
  supports:
    - review
  evidence_required:
    - command
    - exit_code
    - artifact
```

### `permissions`

```yaml
permissions:
  can_edit_code: false
  can_update_project_state: false
  can_write_gbrain: false
  can_deploy: false
```

Default should be `false`.

### `handoff`

Required handoff fields and default routing.

```yaml
handoff:
  required_fields:
    - status
    - artifacts
    - quality_gate_updates
    - warnings
    - blockers
  next_if_pass: release
  next_if_fail: build
  next_if_blocked: problem-handling
```

### `failure_routes`

Explicit routing for known failures.

```yaml
failure_routes:
  gbrain_unavailable: foundation-remediation
  gitnexus_stale: code-context
  tests_failed: build
```

## Validation Rules

1. `id` must match filename.
2. Every agent must declare `permissions`.
3. Every writable path must be under the project directory or a declared artifact directory.
4. Every supported gate must name evidence requirements.
5. Every known fallback mode must have a failure route.
6. Any manifest using GitNexus must require bridge status refresh when local Code Context reports are stale.
7. Any manifest using gbrain must declare fallback artifact handling.

## Minimal Example

```yaml
schema: gstack-harness.agent_manifest.v1
id: review
name: Review Agent
group: delivery
description: Pre-landing risk review.
triggers:
  user_intents:
    - "review this"
requires:
  foundation_readiness: ready
  code_context: ready
reads:
  local:
    - PROJECT_STATE.md
    - .ai-context/runs/
tools:
  gstack_skills:
    - review
  gitnexus:
    - detect_changes
writes:
  reports:
    - docs/REVIEW_REPORT.md
quality_gates:
  supports:
    - review
  evidence_required:
    - findings
    - artifact
permissions:
  can_edit_code: false
  can_update_project_state: false
  can_write_gbrain: false
  can_deploy: false
handoff:
  next_if_pass: release
  next_if_fail: build
  next_if_blocked: problem-handling
failure_routes:
  missing_diff_evidence: code-context
usage_recording:
  required: true
```
