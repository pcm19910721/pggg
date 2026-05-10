# Code Context Report

Generated: 2026-05-10T08:38:48.196Z
Project: gstack-multiagent
Status: stale

## Latest Code Context

```yaml
code_context:
  status: stale
  provider: gitnexus
  operation: sync-gbrain
  generated_at: 2026-05-10T08:38:48.196Z
  repo: gstack-multiagent
  repo_path: /home/adminpcm/gstack-multiagent
  branch: main
  git_head: 211a7648265a0a48eeab09a99cea8482c3cfb198
  indexed: true
  stale: true
  indexed_at: 2026-05-10T08:10:24.015Z
  indexed_commit: c291739b273c260dc6ab7a7e5a75fdea34a3a6a5
  files: 38
  nodes: 839
  edges: 1360
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
- Indexed commit: c291739b273c260dc6ab7a7e5a75fdea34a3a6a5
- Git HEAD: 211a7648265a0a48eeab09a99cea8482c3cfb198

## Write Policy

- Keep raw GitNexus indexes in `.gitnexus/` and bridge run files in `.ai-context/runs/`.
- Keep optional UA artifacts in `.understand-anything/` and reference their paths only when used.
- Write only stable summaries, decisions, gates, and handoff notes to gbrain.
