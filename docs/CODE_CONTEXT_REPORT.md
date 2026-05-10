# Code Context Report

Generated: 2026-05-10T09:04:24.360Z
Project: gstack-multiagent
Status: stale

## Latest Code Context

```yaml
code_context:
  status: stale
  provider: gitnexus
  operation: sync-gbrain
  generated_at: 2026-05-10T09:04:24.360Z
  repo: gstack-multiagent
  repo_path: /home/adminpcm/gstack-multiagent
  branch: main
  git_head: 98e0fefd637185056a755a6aa0378c8f3cb7f3ae
  indexed: true
  stale: true
  indexed_at: 2026-05-10T08:42:03.137Z
  indexed_commit: ebc651774158058aa072cd39fac572eded9e7adc
  files: 38
  nodes: 838
  edges: 1362
  run_id: ""
  risk: ""
  detect_risk: ""
  impact_risks: []
  detect_changes_ok: ""
  impact_targets: []
  test_evidence: []
  artifacts:
    config: .ai-context/project.json
    gitnexus_status: .ai-context/gitnexus-status.json
    gitnexus_index: .ai-context/gitnexus-index.md
    runs: .ai-context/runs/
    optional_ua_knowledge_graph: .understand-anything/knowledge-graph.json
    optional_ua_domain_graph: .understand-anything/domain-graph.json
    optional_ua_diff_overlay: .understand-anything/diff-overlay.json
  gbrain_write_candidates:
    - project/gstack-multiagent/overview
    - project/gstack-multiagent/architecture
    - project/gstack-multiagent/reading-path
    - project/gstack-multiagent/hotspots
    - project/gstack-multiagent/gitnexus-index
    - project/gstack-multiagent/code-context
```

## Summary

- Provider: GitNexus
- Status: stale
- Operation: sync-gbrain
- Repo: gstack-multiagent
- Branch: main
- Indexed: yes
- Stale: yes
- Indexed commit: ebc651774158058aa072cd39fac572eded9e7adc
- Git HEAD: 98e0fefd637185056a755a6aa0378c8f3cb7f3ae

## Write Policy

- Keep raw GitNexus indexes in `.gitnexus/` and bridge run files in `.ai-context/runs/`.
- Keep optional UA artifacts in `.understand-anything/` and reference their paths only when used.
- Write only stable summaries, decisions, gates, and handoff notes to gbrain.
