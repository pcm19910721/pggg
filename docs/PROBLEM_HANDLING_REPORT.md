# Problem Handling Report

Generated: 2026-05-03
Project: gstack-multiagent
Status: no_active_issue

## Latest Problem Handling

    problem_handling:
      issue_id:
      severity:
      category:
      impact:
      action_taken:
      downgraded_for_low_risk:
      upgraded_to_blocker:
      routed_to:
      artifacts:
      next_action:

## Default Policy

- gbrain query timeout during R0/R1: retry once, record warning, continue from local state.
- gbrain query timeout during review/release/ship or memory conflict resolution: upgrade to blocker.
- Repeated issue: create a System Tuning issue and link docs/SYSTEM_TUNING_REPORT.md.
