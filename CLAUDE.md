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
2. Read `docs/AGENT_RUN_CONTRACT.md`, `docs/AGENT_MANIFEST_SCHEMA.md`, and `.gstack/agents/*.yaml` if present.
3. Read `.ai-context/project.json` and `docs/CODE_CONTEXT_REPORT.md` if present.
4. Read `HARNESS_PRODUCT_USAGE.md`.
5. Read `GSTACK_SKILL_REGISTRY.md`.
6. Read `WORKFLOW_RECIPES.md`.
7. Read `ORCHESTRATOR_RUNBOOK.md`.
8. Read `SYSTEM_TUNING_LOOP.md`.
9. Read `MEMORY_ARCHITECTURE.md`.
10. Read `GBRAIN_SCHEMA.md`.
11. For existing-code product, build, review, or incident work, run `node scripts/ai-context-bridge.mjs status` when `.ai-context/project.json` exists; refresh GitNexus only when stale and graph accuracy matters.
12. Query relevant gbrain memory if available.
13. Read `AGENT_ORCHESTRATOR.md`.
14. Read `AGENT_WORKFLOWS.md`.
15. Check Foundation Readiness. If readiness is unknown, partial, or blocked, run the Foundation Readiness / Remediation workflow before business work.
16. Classify the user's request.
17. Choose the appropriate workflow recipe and gstack skills.
18. After completing work, update `PROJECT_STATE.md` with artifact/evidence references and system tuning notes.
19. Write durable project/agent/system learnings to gbrain using `GBRAIN_SCHEMA.md`.

Prefer real verification:

- Run project tests when relevant.
- Start the app when needed.
- Use `/browse`, `/qa`, or `/qa-only` for real browser testing.
- Use `/review` before shipping.
- Use `/ship` only after quality gates are satisfied.

Routing rules:

- System readiness / can the harness take over -> Foundation Readiness Agent.
- Missing gbrain/gstack/project protocol/runtime/runner setup -> Foundation Remediation Agent.
- Need to understand an existing codebase, task impact, call chain, or diff blast radius -> Code Context Agent.
- New idea / unclear product direction -> existing code first Code Context Agent, then Product Agent.
- Need full plan -> Planning Agent.
- UI/UX/design work -> Design Agent.
- Architecture / implementation plan -> Architecture Agent.
- Code implementation -> Build Agent.
- "Test it", "does it work", "run it" -> Reality Test Agent.
- Code review / merge readiness -> Review Agent.
- Security / performance concern -> Security/Perf Agent.
- Ship / PR / deploy -> Release Agent.
- Bug / regression / broken behavior -> Maintenance Agent.

Quality gate before shipping:

- `Foundation Readiness` should be ready.
- `Health` should be passing.
- `Browser QA` should be passing for user-visible features, or skipped with a clear reason.
- `Windows QA` should be passing for Windows-bound features, or skipped with a clear reason.
- `Review` should be passing.
- `Blockers` should be empty.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **pggg** (1160 symbols, 1863 relationships, 101 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/pggg/context` | Codebase overview, check index freshness |
| `gitnexus://repo/pggg/clusters` | All functional areas |
| `gitnexus://repo/pggg/processes` | All execution flows |
| `gitnexus://repo/pggg/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- GSTACK_HARNESS_START -->
## Project Orchestrator

This project uses a project-level gstack orchestration layer.

Do not recreate gstack skills locally. Use the project docs to select and compose existing gstack skills.

Continuous tuning means improving the project-level multi-agent system: which agents exist, what capabilities they need, how they hand off, and how workflows should change. It does not mean rewriting gstack skill internals.

gbrain is the canonical long-term memory source. If gbrain conflicts with local memory docs, prefer gbrain and update the stale docs.
When writing durable memory, follow `GBRAIN_SCHEMA.md`.

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

Git and CI workflow:

- Before committing, run the relevant local checks plus `npm run verify` unless the change is documentation-only and the reason for skipping is explicit.
- Before committing, also run GitNexus `detect_changes` for the staged or all-scope diff and confirm the affected scope is expected.
- Commit in focused groups, then push to `origin/main` only after the local full verification gate is green.
- After pushing, check the GitHub Actions run and continue fixing until the latest `main` run is green.
- CI has one canonical verification path: `.github/workflows/test.yml` runs `npm run verify`. Do not add separate duplicate half-gates like `npm test` plus `npm run check:shell` in the workflow.
- If `npm run verify` changes, update the workflow expectation test so CI and local verification stay aligned.

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
<!-- GSTACK_HARNESS_END -->
