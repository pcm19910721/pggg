# Contributing

This repository is the template source for the GStack project harness. Keep the source portable: do not commit local runtime state, generated code-context reports, personal paths, or gbrain fallback artifacts.

## Development Loop

```bash
npm test
npm run check:shell
bin/gstack-harness-self-test
```

Run `npm run verify` before opening a pull request when gbrain and the harness self-test dependencies are available locally.

## Source Boundaries

- `bin/` is the canonical source for harness executables.
- `.gstack/harness/bin/` and `.gstack/harness/agents/` are installed target layouts and should not be used as second sources in new changes.
- `scripts/` contains reusable Node.js helpers.
- `tests/` contains Node test runner suites.
- `docs/*REPORT.md`, `PROJECT_STATE.md`, `.ai-context/gitnexus-*.json`, `.gitnexus/`, and `.gstack/usage-runs/*.json` are generated runtime evidence unless explicitly marked as examples.

## Pull Request Rules

- Do not commit secrets, local absolute paths, or personal project names.
- Do not commit `.gitnexus/`, `.ai-context/gbrain-fallback/`, `.ai-context/runs/`, `PROJECT_STATE.md`, or generated agent status files.
- If you change an installer contract, update the matching docs and self-test assertions.
- If you change memory semantics, update `MEMORY_ARCHITECTURE.md`, `GBRAIN_SCHEMA.md`, and `.ai-context/FIELD_CONTRACT.md`.
- If you change orchestration or routing semantics, update `WORKFLOW_RECIPES.md`, `ORCHESTRATOR_RUNBOOK.md`, and `docs/AGENT_RUN_CONTRACT.md`.
