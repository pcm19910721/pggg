<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **gstack-multiagent** (977 symbols, 1581 relationships, 85 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
| `gitnexus://repo/gstack-multiagent/context` | Codebase overview, check index freshness |
| `gitnexus://repo/gstack-multiagent/clusters` | All functional areas |
| `gitnexus://repo/gstack-multiagent/processes` | All execution flows |
| `gitnexus://repo/gstack-multiagent/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Scripts area (135 symbols) | `.claude/skills/generated/scripts/SKILL.md` |

<!-- gitnexus:end -->

## Repeat Work Promotion

- Treat repeated user instructions as system evidence, not chat trivia.
- First occurrence is discovery; second occurrence must reuse known preferences before asking again.
- If the user has to repeat the same format, field list, workflow, or schedule twice, record it as a system tuning failure.
- Promote stable repeated work in this order: handoff rule, workflow recipe, agent capability, scheduled candidate, capability gap, possible new skill.
- Do not silently enable recurring work. Create a scheduled candidate until cadence, permissions, outputs, failure handling, monitoring, and user approval are explicit.

## Context Boundary And Handoff Rules

- Treat the active chat as a temporary workbench, not a durable memory system.
- Before continuing a long or shifting conversation, check whether the current window still fits the task. Continue in-place for short discussion, quick answers, and work that is near completion.
- Proactively suggest a handoff when the conversation moves from discussion to implementation, the goal changes, old assumptions may pollute the next step, multiple plans are open, or the agent must rely on distant chat history.
- Use `.agents/handoffs/README.md` as the project-local handoff protocol. Keep `AGENTS.md` limited to stable, executable, cross-task project rules and pointers.
- Prefer a new Codex session for independent implementation work after handoff. Use subagents for temporary expert discussion, parallel investigation, review, or local execution inside the current task, not as the main context-cleaning boundary.
- Do not default to creating skills for reusable context. One-off context stays in the chat; cross-window continuation uses handoff; project facts go in project docs; stable project rules go in this file.
- Skills are project-local by default. Create a project skill only for a repeated, executable workflow inside this repo. Create or modify global skills only when a workflow is proven across multiple projects and is independent of this repo's business or architecture.
- Every durable note or rule must have a clear scope, lifetime, and consumer. If those are unclear, keep it temporary or put it in a handoff instead.
- Durable context must be able to expire: archive or remove stale handoffs, docs, rules, and project skills instead of only promoting them upward.
