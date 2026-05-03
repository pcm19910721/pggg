# Code Context Report

Generated: 2026-05-03T05:31:41.730Z
Project: gstack-multiagent
Status: ready

## Latest Code Context

```yaml
code_context:
  status: ready
  provider: gitnexus
  operation: status
  generated_at: 2026-05-03T05:31:41.730Z
  repo: gstack-multiagent
  repo_path: /home/adminpcm/gstack-multiagent
  branch: main
  git_head: baa054a87030618e947220dc3711fc976bc641fd
  indexed: true
  stale: false
  indexed_at: 2026-05-03T05:28:15.500Z
  indexed_commit: baa054a87030618e947220dc3711fc976bc641fd
  files: 23
  nodes: 465
  edges: 598
  run_id: 
  risk: 
  detect_changes_ok: 
  impact_targets: []
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
- Operation: status
- Repo: gstack-multiagent
- Branch: main
- Indexed: yes
- Stale: no
- Indexed commit: baa054a87030618e947220dc3711fc976bc641fd
- Git HEAD: baa054a87030618e947220dc3711fc976bc641fd

## Write Policy

- Keep raw GitNexus indexes in `.gitnexus/` and bridge run files in `.ai-context/runs/`.
- Keep optional UA artifacts in `.understand-anything/` and reference their paths only when used.
- Write only stable summaries, decisions, gates, and handoff notes to gbrain.
