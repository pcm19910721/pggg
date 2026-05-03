## Project Orchestrator

This project uses a project-level gstack orchestration layer.

Do not recreate gstack skills locally. Use the project docs to select and compose existing gstack skills.

Continuous tuning means improving the project-level multi-agent system: which agents exist, what capabilities they need, how they hand off, and how workflows should change. It does not mean rewriting gstack skill internals.

gbrain is the canonical long-term memory source. If gbrain conflicts with local memory docs, prefer gbrain and update the stale docs.
When writing durable memory, follow `GBRAIN_SCHEMA.md`.

Before doing substantial work:

1. Read `PROJECT_STATE.md`.
2. Read `.ai-context/project.json` and `docs/CODE_CONTEXT_REPORT.md` if present.
3. Read `HARNESS_PRODUCT_USAGE.md`.
4. Read `GSTACK_SKILL_REGISTRY.md`.
5. Read `WORKFLOW_RECIPES.md`.
6. Read `ORCHESTRATOR_RUNBOOK.md`.
7. Read `SYSTEM_TUNING_LOOP.md`.
8. Read `MEMORY_ARCHITECTURE.md`.
9. Read `GBRAIN_SCHEMA.md`.
10. For existing-code product, build, review, or incident work, run `node scripts/ai-context-bridge.mjs status` when `.ai-context/project.json` exists; refresh GitNexus only when stale and graph accuracy matters.
11. Query relevant gbrain memory if available.
12. Read `AGENT_ORCHESTRATOR.md`.
13. Read `AGENT_WORKFLOWS.md`.
14. Check Foundation Readiness. If readiness is unknown, partial, or blocked, run the Foundation Readiness / Remediation workflow before business work.
15. Classify the user's request.
16. Choose the appropriate workflow recipe and gstack skills.
17. After completing work, update `PROJECT_STATE.md` with artifact/evidence references and system tuning notes.
18. Write durable project/agent/system learnings to gbrain using `GBRAIN_SCHEMA.md`.

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
