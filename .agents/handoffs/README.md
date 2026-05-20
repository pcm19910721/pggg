# Handoff File Protocol

Use this directory for project-local handoffs between Codex sessions. Handoffs are temporary execution context, not durable project memory.

## Paths

- Current handoff: `.agents/handoffs/current.md`
- Archived handoffs: `.agents/handoffs/archive/YYYY-MM-DD-topic.md`
- Protocol: `.agents/handoffs/README.md`

## When To Handoff

Create or suggest a handoff when any of these are true:

- A long discussion is moving into implementation.
- The user says to implement a prior plan or continue from an earlier decision.
- The conversation contains multiple discarded approaches or stale assumptions.
- The agent needs to rely on distant chat history to act correctly.
- One independent task is complete and a new independent task is starting.

Continue in the current window for short answers, lightweight discussion, and work that is already near completion.

## Handoff Template

Keep the handoff short. Prefer deleting context over preserving weakly relevant history.

```md
# Handoff

Goal:

Current decision:

Relevant files:

Do not carry over:

Next action:

Verification:

Open questions:
```

## New Session Protocol

When a handoff starts a new Codex session, use this instruction:

```text
Read .agents/handoffs/current.md.
Treat it as the only task context.
Do not infer requirements from previous chat.
Execute the Next action.
```

Prefer a new Codex session for independent implementation work. Use subagents only for temporary expert discussion, parallel investigation, local execution, or review inside the current task.

## Lifecycle

- Handoffs are local working context by default.
- Commit this protocol and directory scaffolding, but do not commit `current.md` or archived handoff files by default.
- Replace `current.md` when a new handoff becomes active.
- Move stale handoffs into `archive/` only when they are still useful for short-term traceability.
- Delete obsolete handoffs instead of promoting them into docs, rules, or skills.
- Promote a handoff only when its content has a clear scope, lifetime, and consumer.
