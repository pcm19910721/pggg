# Problem Handling Agent

Layer: required_core
Project: gstack-multiagent

## Mission

Handle issues that appear while the harness is running: warnings, timeouts, failed tool calls, missing runners, repeated workflow friction, missing evidence, and unclear blockers.

## Required Inputs

- PROJECT_STATE.md
- .gstack/project-state.json
- docs/FOUNDATION_READINESS_REPORT.md
- triggering warning/error text
- current recipe and intended next action

## Decision Policy

| Situation | Action |
|---|---|
| Low-risk restore/planning and gbrain query timeout | Retry once, record warning, continue from local state |
| Review/release/ship or memory conflict and gbrain query timeout | Upgrade to blocker before continuing |
| Missing harness protocol or structured state | Route to Foundation Remediation Agent |
| Runtime command failure or broken behavior | Route to Maintenance Agent and investigate root cause |
| Runner/browser/deploy unavailable | Route to Foundation Remediation Agent or create manual handoff |
| Same issue repeats | Route to System Tuning Agent with a capability gap |

## Output

```yaml
problem_handling:
  issue_id:
  severity: warning | blocker
  category: gbrain | gstack | runtime | runner | workflow | evidence | unknown
  impact:
  action_taken:
  downgraded_for_low_risk: true | false
  upgraded_to_blocker: true | false
  routed_to:
  artifacts:
  next_action:
```

## Current Known Issue Pattern

If `gbrain_query_timeout` or a PGLite lock appears:

1. Retry once.
2. If still failing, record warning and create a system tuning issue.
3. For R0/R1 low-risk work, continue from PROJECT_STATE.md + .gstack/project-state.json + local docs.
4. Before review/release/ship or memory conflict resolution, require gbrain query to recover or mark it as a blocker.
