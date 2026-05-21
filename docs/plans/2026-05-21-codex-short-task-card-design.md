# Intent-to-TaskCard Capability Design

## Context

The user clarified that "casual language to Codex short task card" is not a one-project convenience workflow. It should improve the battle capability of `gstack-multiagent`: the harness should become better at turning ambiguous human intent into dispatchable, verifiable, handoff-ready work for coding agents.

This capability belongs before execution. It helps the Orchestrator understand user intent, decide whether more context is needed, select the right recipe or agent, and produce a compact task card that a Codex-like execution agent can act on safely.

## Problem

Current user input often arrives as casual language:

```text
帮我把登录那里改一下，别影响别的。
测一下这个功能。
这个报错处理优化下。
```

Those inputs hide important operational details:

- the exact target and intended outcome;
- the code context that must be inspected first;
- what must stay out of scope;
- which quality gates should run;
- what evidence the execution agent must return;
- when ambiguity is risky enough to ask the user instead of guessing.

If the Orchestrator forwards casual language directly to an execution agent, the system risks misrouting, over-editing, weak verification, and poor handoff evidence.

## Decision

Create an **Intent-to-TaskCard Capability** as an Orchestrator-adjacent agent capability.

It is not a global skill yet, not a scheduler, and not a standalone prompt-optimizer product. It is a project-level capability that normalizes user intent into a short, executable task card before dispatch.

Recommended classification:

```text
agent capability first
workflow recipe later if repeated across routes
project-local skill only after stable repeated use
global skill only after cross-project proof
```

## References Reviewed

- `docs/CAPABILITY_FIRST_WORKFLOW.md`: capability modules should declare purpose, inputs, outputs, permissions, tests, and examples before reuse.
- `docs/AGENT_ORCHESTRATOR.md`: Orchestrator must read state, classify user input, choose recipes/skills, and generate clear handoff tasks.
- `docs/AGENT_WORKFLOWS.md`: stage agents require traceable outputs and clear boundaries.
- `docs/AGENT_MANIFEST_SCHEMA.md`: agent manifests define triggers, reads, writes, tools, permissions, handoff, and evidence.
- `github/awesome-copilot`: useful taxonomy for agents, instructions, skills, workflows, and plugins.
- `langgptai/LangGPT`: useful structured prompt fields such as role, goal, rules, workflow, and acceptance criteria.
- `linshenkx/prompt-optimizer`: useful later for prompt assets, evaluation, and iterative optimization.
- `repowise-dev/claude-code-prompts`: relevant to coding-agent safety rules, context management, and verification.
- `addyosmani/agent-skills`: useful engineering lifecycle framing: specify, plan, build, test, review, ship.

## Capability Contract

```yaml
id: intent-to-task-card
purpose: Convert casual user intent into a concise, executable Codex task card before agent dispatch.
owner: orchestrator
version: 0.1
status: experimental
ui_entry: orchestrator pre-dispatch turn
actions:
  - classify_intent
  - identify_missing_context
  - decide_clarify_or_dispatch
  - generate_task_card
  - recommend_agent_or_recipe
inputs:
  - user_message
  - recent_session_context
  - project_state
  - available_agents
  - available_workflow_recipes
  - known_quality_gates
outputs:
  - task_card
  - clarification_question
  - recommended_agent
  - recommended_recipe
  - ambiguity_flags
permissions:
  can_edit_code: false
  can_update_project_state: false
  can_write_gbrain: false
  can_deploy: false
data_dependencies:
  - PROJECT_STATE.md
  - .gstack/project-state.json
  - docs/AGENT_ORCHESTRATOR.md
  - docs/AGENT_WORKFLOWS.md
  - docs/CAPABILITY_FIRST_WORKFLOW.md
runtime_dependencies:
  - none for v0.1
hot_update_scope:
  - task card template
  - routing heuristics
  - ambiguity rules
rollback:
  - fall back to normal Orchestrator clarification and dispatch
observability:
  - record whether output was task_card or clarification_question
  - record selected agent or recipe when used
tests:
  - vague request becomes actionable task card
  - risky ambiguity triggers one question
  - simple request stays short
  - generated card includes verification
examples:
  - login change request
  - test-this-feature request
  - error-handling cleanup request
```

## Task Card Format

The card should be short enough to hand directly to Codex, but explicit enough to constrain execution:

```text
请在当前仓库中完成：<一句话目标>。

上下文：
<已知背景、应先读取的状态/文件/模块、为什么要做>

执行边界：
<必须复用的模式、禁止改动范围、需要保护的用户改动或行为>

作战路径：
<先探索什么、再修改什么、何时停下确认、需要调用的 agent/recipe/skill>

验收标准：
<用户可观察结果、测试/检查命令、质量门禁、边界情况>

交付：
<说明改了什么、验证结果、影响面、剩余风险>
```

## Conversion Rules

When casual user intent arrives, the capability should:

1. Preserve the user's actual goal instead of rewriting it into a bigger project.
2. Infer only operationally safe details: inspect existing patterns first, avoid unrelated refactors, protect user changes, and verify with appropriate gates.
3. Identify target area, desired outcome, scope boundary, risk level, and verification needs.
4. Recommend a recipe or agent when the route is clear.
5. Ask one concise clarification question when target, desired outcome, or risk boundary is too ambiguous.
6. Keep simple tasks short; do not inflate them into full specs.
7. Avoid creating scripts, scheduled jobs, global skills, or durable rules until repeated use proves the capability.

## Clarification Gate

Ask the user before dispatch when any of these are true:

- target subsystem is unknown and multiple high-risk interpretations exist;
- requested outcome conflicts with existing quality gates or safety rules;
- the task could affect auth, permissions, data deletion, payment, deployment, secrets, or production behavior;
- the user says "别影响别的" but the impact boundary cannot be inferred;
- the requested operation requires credentials, deployment, destructive actions, or external accounts.

Do not ask when the missing detail can be safely discovered from local context during exploration.

## Orchestrator Integration

Place this capability between intent classification and dispatch:

```text
user message
-> Orchestrator reads current state
-> classify current input and recent session context
-> Intent-to-TaskCard capability
-> either ask one clarification question
-> or emit task card + recommended recipe/agent
-> dispatch execution agent or workflow
-> collect evidence and update state as usual
```

This should improve the existing Orchestrator behavior without replacing Code Context, Planning, Review, QA, or Problem Handling agents.

## Quality Checks

A generated task card is acceptable when:

- the goal is one sentence and action-oriented;
- the execution boundary is explicit;
- the first exploration step is clear;
- verification is scaled to risk;
- the delivery format requires evidence;
- the card is short enough to paste into Codex;
- ambiguity is either resolved by the card or escalated into one question.

## Example

Input:

```text
帮我把登录那里改一下，别影响别的。
```

Output:

```text
请在当前仓库中完成：按用户确认后的要求调整登录流程，并把改动限制在登录相关代码内。

上下文：
先读取项目状态、登录入口、认证状态处理、相关测试和调用方，确认登录逻辑的实际边界。不要假设登录只在一个文件里。

执行边界：
复用项目现有认证模式，避免无关重构、全仓格式化或改动注册、权限、会话刷新等非目标路径。保护用户已有未提交改动。

作战路径：
先定位登录流程和影响面；如果发现会影响注册、会话刷新、权限检查或生产配置，停下确认；否则做最小修改并补充必要验证。

验收标准：
目标登录路径行为符合要求；相关认证测试通过，若没有测试则提供最小手动验证步骤和风险说明。

交付：
说明改动文件、影响面、验证命令和结果，以及仍需人工确认的边界。
```

## Promotion Path

Start as an experimental agent capability documented here.

Promote only with evidence:

```text
handoff rule
-> workflow recipe
-> project-local agent capability manifest
-> project-local skill
-> global skill
```

Promotion criteria:

- used repeatedly across different user intents;
- reduces clarification churn or misrouting;
- generated cards lead to better verification evidence;
- stable enough to express as templates and tests;
- has clear consumers inside Orchestrator or stage agents.
