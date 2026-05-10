# Usage Feedback Report Example

Generated: 2026-05-10T00:00:00.000Z

## Summary

- Projects scanned: 2
- Usage runs found: 3
- Targets without usage runs: 0

## Recommended Template Source Actions

- Promote repeated `gbrain_unavailable` failures into Foundation Remediation evidence.
- Keep fallback artifacts explicit in handoffs.
- Add regression tests when a rehearsal exposes an installer contract gap.

## Warning Counts

| Warning | Count |
|---|---:|
| gbrain_unavailable | 2 |
| gbrain_project_memory_sync_failed | 1 |

## Recent Runs

| Time | Project | Event | Status | Recipe | Warnings |
|---|---|---|---|---|---|
| 2026-05-10T00:00:00Z | example-app | harness_init | ready | R0 Restore / Resume Context |  |
| 2026-05-10T00:05:00Z | example-app | session_end | fallback | R0 Restore / Resume Context | gbrain_unavailable |

## Targets Without Usage Runs

_None._

## Notes

This is a sanitized example. Real `docs/USAGE_FEEDBACK_REPORT.md` files are generated from local project registries and should stay ignored unless deliberately converted into public examples.
