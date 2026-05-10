# CLAUDE.md 模板

把下面内容加入具体项目根目录的 `CLAUDE.md`。

```markdown
## Project Orchestrator

This project uses a project-level gstack orchestration layer.

Do not recreate gstack skills locally. Use the project docs to select and compose existing gstack skills.

Continuous tuning means improving the project-level multi-agent system: which agents exist, what capabilities they need, how they hand off, and how workflows should change. It does not mean rewriting gstack skill internals.

gbrain is the canonical long-term memory source. If gbrain conflicts with local memory docs, prefer gbrain and update the stale docs.
When writing durable memory, follow `GBRAIN_SCHEMA.md`.

## Lightweight Handoff Rule

When the user only says "接管", "继续", "恢复现场", or "继续项目", perform lightweight handoff only:

- Read minimal state: `PROJECT_STATE.md`, `.gstack/project-state.json`, and project handoff/state pages if available.
- Check whether GitNexus or gbrain memory is stale, but do not expand full code graphs, reports, or long history.
- Output only current phase, readiness, blockers/warnings, recommended next recipe/agent, and whether memory/code context refresh is needed.
- Do not modify files or start business work unless the user explicitly asks.

Principle: handoff restores navigation state, not the full project context. Expand details only for the next concrete task.

Before doing substantial work:

1. Read `PROJECT_STATE.md`.
2. Read `.gstack/project-state.json` if present.
3. Read `.gstack/harness/agents/TEAM.md` and `.gstack/harness/agents/problem-handling.md` if present.
4. Read `docs/PROBLEM_HANDLING_REPORT.md` and `docs/SYSTEM_TUNING_REPORT.md` if present.
5. Read `.ai-context/project.json` and `docs/CODE_CONTEXT_REPORT.md` if present.
6. Read `HARNESS_PRODUCT_USAGE.md`.
7. Read `GSTACK_SKILL_REGISTRY.md`.
8. Read `WORKFLOW_RECIPES.md`.
9. Read `ORCHESTRATOR_RUNBOOK.md`.
10. Read `SYSTEM_TUNING_LOOP.md`.
11. Read `MEMORY_ARCHITECTURE.md`.
12. Read `GBRAIN_SCHEMA.md`.
13. For existing-code product, build, review, or incident work, run `node scripts/ai-context-bridge.mjs status` when `.ai-context/project.json` exists; refresh GitNexus only when stale and graph accuracy matters.
14. Query relevant gbrain memory if available. If gbrain query hits PGLite lock or timeout, retry once, then route the issue to Problem Handling Agent. Continue from local state only for low-risk recipes.
15. Read `docs/AGENT_ORCHESTRATOR.md`.
16. Read `docs/AGENT_WORKFLOWS.md`.
17. Check Foundation Readiness. If readiness is unknown, partial, or blocked, run the Foundation Readiness / Remediation workflow before business work.
18. Classify the user's request.
19. Choose the appropriate workflow recipe and gstack skills.
20. After completing work, update `PROJECT_STATE.md` and `.gstack/project-state.json` with artifact/evidence references and system tuning notes.
21. Write durable project/agent/system learnings to gbrain using `GBRAIN_SCHEMA.md`.

Usage feedback automation:

- At the start of a real work session, record a snapshot with `.gstack/harness/bin/gstack-harness-record-run --event session_start --status in_progress`.
- After updating project state at the end of the session, record the outcome with `.gstack/harness/bin/gstack-harness-record-run --event session_end --status completed` or the actual status.
- Include `--where-stalled`, `--user-correction`, `--capability-gap`, `--warning`, and `--blocker` whenever those signals occurred.

Prefer real verification:

- Run project tests when relevant.
- Start the app when needed.
- Use `/browse`, `/qa`, or `/qa-only` for real browser testing.
- Use `/review` before shipping.
- Use `/ship` only after quality gates are satisfied.

Routing rules:

- System readiness / can the harness take over → Foundation Readiness Agent.
- Missing gbrain/gstack/project protocol/runtime/runner setup → Foundation Remediation Agent.
- Runtime warning / timeout / repeated failure / unclear blocker → Problem Handling Agent.
- Need to understand an existing codebase, task impact, call chain, or diff blast radius → Code Context Agent.
- New idea / unclear product direction → existing code first Code Context Agent, then Product Agent.
- Need full plan → Planning Agent.
- UI/UX/design work → Design Agent.
- Architecture / implementation plan → Architecture Agent.
- Code implementation → Build Agent.
- "Test it", "does it work", "run it" → Reality Test Agent.
- Code review / merge readiness → Review Agent.
- Security / performance concern → Security/Perf Agent.
- Ship / PR / deploy → Release Agent.
- Bug / regression / broken behavior → Maintenance Agent.

Quality gate before shipping:

- `Health` should be passing.
- `Browser QA` should be passing for user-visible features, or skipped with a clear reason.
- `Windows QA` should be passing for Windows-bound features, or skipped with a clear reason.
- `Review` should be passing.
- `Blockers` should be empty.

Problem handling rule:

- Do not leave warnings as loose narration.
- Route timeout, runner failure, repeated friction, and missing evidence to Problem Handling Agent.
- Problem Handling Agent decides whether to auto-remediate, downgrade for low-risk work, upgrade to blocker, or create a System Tuning issue.
```

## Codex 中可直接使用的提示词

```text
读取 PROJECT_STATE.md、.gstack/project-state.json、.gstack/harness/agents/TEAM.md、.gstack/harness/agents/problem-handling.md、docs/PROBLEM_HANDLING_REPORT.md、docs/SYSTEM_TUNING_REPORT.md、docs/CODE_CONTEXT_REPORT.md、.ai-context/project.json、HARNESS_PRODUCT_USAGE.md、GSTACK_SKILL_REGISTRY.md、WORKFLOW_RECIPES.md、ORCHESTRATOR_RUNBOOK.md、SYSTEM_TUNING_LOOP.md、MEMORY_ARCHITECTURE.md、GBRAIN_SCHEMA.md、docs/AGENT_ORCHESTRATOR.md、docs/AGENT_WORKFLOWS.md。已有代码项目在 /office-hours、实现、review 或事故定位前优先走 Code Context Agent：先 `node scripts/ai-context-bridge.mjs status`，图谱 stale 且需要准确影响面时再 refresh；UA 只作为 dashboard/onboarding/domain/fallback 增强。
以后在这个项目中按项目总控 Agent 的方式工作：
先查询相关 gbrain 记忆，再判断项目状态。如果 gbrain query 遇到 PGLite lock / timeout，重试一次，仍失败就派发 Problem Handling Agent，记录 warning，并只在低风险流程里用本地状态继续。如果 gbrain 和本地文档冲突，以 gbrain 为准。然后选择 workflow recipe 和 gstack skills，完成后用 evidence 更新 PROJECT_STATE.md 和 .gstack/project-state.json，并运行 .gstack/harness/bin/gstack-harness-record-run 记录 usage run，带上系统运行卡点、用户纠正和 Agent 能力缺口。
```

功能实战：

```text
用项目总控 Agent 跑一轮：
先判断当前阶段，再决定使用哪个 WORKFLOW_RECIPES 条目和哪些 gstack skills。
这次目标是实现 XXX 功能。
完成后更新 PROJECT_STATE.md。
```

测试实战：

```text
用真实测试 Agent：
先跑 /health，再启动本地服务，然后用 /qa 实测核心流程。
发现问题就修复并复测，最后更新 PROJECT_STATE.md。
```
