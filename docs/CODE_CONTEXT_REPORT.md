# Code Context Report

Generated: 2026-05-10T09:17:26.885Z
Project: gstack-multiagent
Status: ready

## Latest Code Context

```yaml
code_context:
  status: ready
  provider: gitnexus
  operation: sync-gbrain
  generated_at: 2026-05-10T09:17:26.885Z
  repo: gstack-multiagent
  repo_path: /home/adminpcm/gstack-multiagent
  branch: main
  git_head: 7984f1849f17799d345d67c2119c815ca6fef9f3
  indexed: true
  stale: false
  indexed_at: 2026-05-10T09:17:09.566Z
  indexed_commit: 7984f1849f17799d345d67c2119c815ca6fef9f3
  files: 40
  nodes: 863
  edges: 1397
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
- Status: ready
- Operation: sync-gbrain
- Repo: gstack-multiagent
- Branch: main
- Indexed: yes
- Stale: no
- Indexed commit: 7984f1849f17799d345d67c2119c815ca6fef9f3
- Git HEAD: 7984f1849f17799d345d67c2119c815ca6fef9f3

## Write Policy

- Keep raw GitNexus indexes in `.gitnexus/` and bridge run files in `.ai-context/runs/`.
- Keep optional UA artifacts in `.understand-anything/` and reference their paths only when used.
- Write only stable summaries, decisions, gates, and handoff notes to gbrain.
