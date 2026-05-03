# GitNexus to gbrain Field Contract

This bridge keeps code facts and durable memory separate.

- GitNexus stores detailed code facts in `.gitnexus/`.
- gbrain stores durable memory and concise summaries.
- Understand Anything is optional for dashboards, onboarding, domain graphs, and fallback only.
- `.ai-context/project.json` maps the project to these systems.

## GitNexus Outputs

| Source | Keep Local | Send to gbrain |
|---|---:|---:|
| `.gitnexus/` | yes | no |
| `.gitnexus/meta.json` | yes | selected fields |
| `~/.gitnexus/registry.json` | yes | repo alias only |
| `gitnexus query` | optional raw run file | concise architecture summary |
| `gitnexus context` | optional raw run file | only if relevant to a decision/change |
| `gitnexus impact` | raw run file | impact summary |
| `gitnexus detect-changes` | raw run file | run/change summary |

## Optional UA Outputs

| Source | Keep Local | Send to gbrain |
|---|---:|---:|
| `.understand-anything/knowledge-graph.json` | yes | artifact pointer or stable summary only |
| `.understand-anything/domain-graph.json` | yes | concise domain summary only |
| `.understand-anything/diff-overlay.json` | yes | only if it supports a review/release decision |

## gbrain Pages

- `project/<id>/gitnexus-index`: GitNexus index status summary.
- `project/<id>/state`: concise current project state from `.gstack/project-state.json`.
- `project/<id>/foundation-readiness`: readiness status from `docs/FOUNDATION_READINESS_REPORT.md`.
- `project/<id>/architecture`: concise architecture summary from GitNexus, optionally enriched by UA.
- `project/<id>/hotspots`: risk areas with evidence and required action.
- `project/<id>/code-context`: current Code Context summary and artifact pointers.
- `project/<id>/quality-gates`: current quality gate state.
- `project/<id>/handoff`: next-agent and next-recipe handoff summary.
- `artifact/<id>/impact-analysis/<run-id>`: GitNexus detect-changes and impact summary.

Use `node scripts/ai-context-bridge.mjs sync-gbrain --dry-run` to preview writes, then `node scripts/ai-context-bridge.mjs sync-gbrain` to write project summaries. Raw indexes stay local. gbrain receives summaries, decisions, gates, and handoff notes.
