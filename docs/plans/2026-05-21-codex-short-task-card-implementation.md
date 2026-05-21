# Intent-to-TaskCard Capability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an experimental Orchestrator-adjacent capability that converts casual user intent into concise, dispatchable Codex task cards.

**Architecture:** The first implementation should be declarative and low-risk: update orchestration docs, add a project-local capability/agent manifest if the repo already has the manifest location, and add examples or verification notes. Do not create a global skill or executable prompt optimizer yet.

**Tech Stack:** Markdown documentation, YAML agent manifest if `.gstack/agents/` exists, existing harness docs and state files.

---

### Task 1: Confirm Local Manifest Surface

**Files:**
- Read: `docs/AGENT_MANIFEST_SCHEMA.md`
- Read: `.gstack/agents/` if present
- Read: `docs/AGENT_ORCHESTRATOR.md`
- Read: `docs/AGENT_WORKFLOWS.md`

**Step 1: Check whether manifests exist**

Run:

```bash
find .gstack/agents -maxdepth 1 -type f -print 2>/dev/null | sort
```

Expected:

- If manifests exist, add `intent-to-task-card.yaml` in the same style.
- If they do not exist, keep this implementation as docs-only and do not invent a new manifest directory.

**Step 2: Identify the Orchestrator insertion point**

Find the current input handling flow:

```bash
rg -n "判断用户输入|用户当前输入|选择 workflow|生成明确交接任务|Capability-First" docs/AGENT_ORCHESTRATOR.md docs/AGENT_WORKFLOWS.md
```

Expected: identify the exact section where Intent-to-TaskCard belongs between intent classification and dispatch.

### Task 2: Add Orchestrator Routing Rule

**Files:**
- Modify: `docs/AGENT_ORCHESTRATOR.md`

**Step 1: Update the per-input flow**

Add Intent-to-TaskCard after user input classification and before recipe/skill selection:

```text
classify current user input
-> normalize casual intent into task card or one clarification question
-> choose workflow recipe / agent
-> dispatch with task card
```

**Step 2: Update routing principles**

Add a principle:

```text
模糊的编码执行请求在派发前先经 Intent-to-TaskCard 能力规范化；高风险歧义只问一个澄清问题，不让执行 Agent 自行猜范围。
```

**Step 3: Verify wording**

Run:

```bash
rg -n "Intent-to-TaskCard|短任务卡|澄清问题|执行 Agent" docs/AGENT_ORCHESTRATOR.md
```

Expected: new rule appears once in the flow and once in the principles, without replacing existing safety gates.

### Task 3: Add Capability Manifest When Supported

**Files:**
- Create if supported: `.gstack/agents/intent-to-task-card.yaml`

**Step 1: Create manifest only if `.gstack/agents/` exists**

If supported, use:

```yaml
schema: gstack-harness.agent_manifest.v1
id: intent-to-task-card
name: Intent to Task Card
group: core-control
description: Normalize casual user intent into a concise Codex-ready task card before Orchestrator dispatch.
triggers:
  user_intents:
    - "帮我改一下"
    - "测一下"
    - "优化下"
    - "别影响别的"
  state:
    - dispatch_intent: ambiguous_or_casual
requires:
  foundation_readiness: ready_or_remediable
  code_context: optional
  git_worktree: clean_or_dirty_allowed
reads:
  local:
    - PROJECT_STATE.md
    - .gstack/project-state.json
    - docs/AGENT_ORCHESTRATOR.md
    - docs/AGENT_WORKFLOWS.md
    - docs/CAPABILITY_FIRST_WORKFLOW.md
tools:
  gstack_skills: []
  gitnexus: []
  shell: []
writes:
  reports: []
  artifacts: []
quality_gates:
  supports:
    - dispatch_readiness
  evidence_required:
    - task_card_or_clarification_question
permissions:
  can_edit_code: false
  can_update_project_state: false
  can_write_gbrain: false
  can_deploy: false
handoff:
  required_fields:
    - status
    - task_card_or_question
    - recommended_agent_or_recipe
    - ambiguity_flags
  next_if_pass: orchestrator_dispatch
  next_if_fail: orchestrator_clarify
failure_routes:
  ambiguity_high: problem-handling
  missing_foundation: foundation-readiness
usage_recording:
  record_task_card: true
  record_recommended_route: true
```

**Step 2: Do not add executable tooling**

Expected: no new script, package dependency, scheduler, or global skill.

### Task 4: Add Examples and Verification Notes

**Files:**
- Modify: `docs/plans/2026-05-21-codex-short-task-card-design.md`
- Optional create: `docs/examples/intent-to-task-card.example.md`

**Step 1: Add three examples**

Cover:

- vague code modification;
- testing request;
- error-handling cleanup.

**Step 2: Add verification checklist**

Each example should state whether the correct output is:

```text
task_card
clarification_question
```

**Step 3: Verify examples are short**

Run:

```bash
wc -l docs/examples/intent-to-task-card.example.md 2>/dev/null || true
```

Expected: examples are readable and not a new prompt bible.

### Task 5: Review Scope Before Commit

**Files:**
- Review: all changed files

**Step 1: Check worktree**

Run:

```bash
git status --short
```

Expected: changes are limited to docs and optional manifest/example files. Existing unrelated dirty files should remain untouched.

**Step 2: Check diff**

Run:

```bash
git diff -- docs/AGENT_ORCHESTRATOR.md docs/plans/2026-05-21-codex-short-task-card-design.md docs/plans/2026-05-21-codex-short-task-card-implementation.md .gstack/agents/intent-to-task-card.yaml docs/examples/intent-to-task-card.example.md
```

Expected: no edits to gstack skill internals, no executable code, no AGENTS or CLAUDE rule pollution unless separately approved.

**Step 3: Run GitNexus detect changes before commit if available**

Per project instructions, run detect changes before committing. If the MCP index is unavailable, record the exact failure and do not pretend impact evidence exists.
