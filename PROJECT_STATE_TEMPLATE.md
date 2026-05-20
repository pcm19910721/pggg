# Project State 模板

把下面内容复制到具体项目根目录的 `PROJECT_STATE.md`。

```markdown
# Project State

## Current

- Phase: foundation | planning | design | build | test | review | release | maintenance
- Goal:
- Branch:
- Last updated:
- Last completed agent:
- Next recommended agent:
- Workspace mode: template_source | target_project

## Foundation

- Readiness: unknown | ready | partial | blocked
- Last readiness check:
- Remediation: not_needed | needed | in_progress | fixed | partial | blocked
- gbrain: unknown | ready | empty | unavailable | conflict
- gstack: unknown | ready | degraded | unavailable
- Project protocol: unknown | ready | missing_docs | stale
- Runtime: unknown | ready | missing_commands | cannot_start | not_required
- Runners: unknown | ready | missing_browser | missing_windows_host | not_required
- Memory policy: unknown | ready | conflict | unseeded

## Runtime

- Install command:
- Dev command:
- Test command:
- Lint command:
- Typecheck command:
- Local URL:
- Production URL:

## Quality Gates

- Foundation Readiness: unknown | ready | partial | blocked
- Code Context: missing | ready | stale | skipped
- Health: unknown | passing | failing
- Browser QA: not_run | passing | failing
- Windows QA: not_run | passing | failing | skipped
- Review: not_run | passing | failing
- Security: not_run | passing | failing
- Performance: not_run | passing | failing
- Deployment: not_started | deployed | failed

## Gate Evidence

- Foundation Readiness:
  - Report:
  - Checked at:
  - Blockers:
- Code Context:
  - Provider: GitNexus
  - Config: .ai-context/project.json
  - Status: .ai-context/gitnexus-status.json
  - Index summary: .ai-context/gitnexus-index.md
  - Run files: .ai-context/runs/
  - Optional UA artifacts:
  - Last updated:
  - Skip reason:
- Health:
  - Command:
  - Exit code:
  - Artifact:
- Browser QA:
  - URL:
  - Artifact:
  - Skip reason:
- Windows QA:
  - Target OS:
  - Runner:
  - Artifact:
  - Skip reason:
- Review:
  - Base:
  - Artifact:
- Security:
  - Artifact:
  - Skip reason:
- Performance:
  - Artifact:
  - Skip reason:

## Artifacts

- Foundation readiness report:
- Foundation remediation report:
- Code context report:
- Code context config:
- GitNexus status:
- GitNexus index summary:
- GitNexus run files:
- Optional UA artifacts:
- Impact analysis:
- Product brief:
- Design system:
- Implementation plan:
- QA report:
- Review report:
- Security report:
- Performance report:
- Release status:
- Retro:

## Blockers

- None

## Recent Agent Runs

- YYYY-MM-DD: ...

## Repeat Work Promotion

- Known patterns:
- Promotion backlog:
- Scheduled candidates:
- Recent memory misses:

## Session Interaction Context

- Recent interaction evidence:
- Current user message summary:
- Previous Codex output summary:
- Previous two Codex output summary:
- Inferred delta:

## Notes

- ...
```

## 机器可读版本可选

如果后续想更自动化，可以再加 `.gstack/project-state.json`：

```json
{
  "project": {
    "name": "",
    "phase": "foundation",
    "workspace_mode": "target_project",
    "current_goal": "",
    "branch": ""
  },
  "status": {
    "foundation_readiness": "unknown",
    "code_context": "missing",
    "health": "unknown",
    "browser_qa": "not_run",
    "windows_qa": "not_run",
    "review": "not_run",
    "security": "not_run",
    "performance": "not_run",
    "deployed": false
  },
  "foundation": {
    "last_readiness_check": "",
    "remediation": "not_needed",
    "gbrain": "unknown",
    "gstack": "unknown",
    "project_protocol": "unknown",
    "runtime": "unknown",
    "runners": "unknown",
    "memory_policy": "unknown"
  },
  "artifacts": {
    "foundation_readiness_report": "",
    "foundation_remediation_report": "",
    "code_context_report": "",
    "ai_context_project": "",
    "gitnexus_status": "",
    "gitnexus_index": "",
    "gitnexus_runs": "",
    "optional_ua_knowledge_graph": "",
    "optional_ua_domain_graph": "",
    "optional_ua_diff_overlay": "",
    "impact_analysis": "",
    "product_brief": "",
    "design_system": "",
    "implementation_plan": "",
    "qa_report": "",
    "review_report": "",
    "release_status": ""
  },
  "gate_evidence": {
    "foundation_readiness": {
      "report": "",
      "checked_at": "",
      "blockers": []
    },
    "code_context": {
      "provider": "gitnexus",
      "config": ".ai-context/project.json",
      "status": ".ai-context/gitnexus-status.json",
      "index": ".ai-context/gitnexus-index.md",
      "runs": ".ai-context/runs/",
      "optional_ua_artifacts": [],
      "last_updated": "",
      "skip_reason": ""
    },
    "health": {
      "command": "",
      "exit_code": null,
      "artifact": ""
    },
    "browser_qa": {
      "url": "",
      "artifact": "",
      "skip_reason": ""
    },
    "windows_qa": {
      "target_os": "",
      "runner": "",
      "artifact": "",
      "skip_reason": ""
    },
    "review": {
      "base": "",
      "artifact": ""
    },
    "security": {
      "artifact": "",
      "skip_reason": ""
    },
    "performance": {
      "artifact": "",
      "skip_reason": ""
    }
  },
  "repeat_work": {
    "known_patterns": [],
    "promotion_backlog": [],
    "scheduled_candidates": [],
    "recent_memory_misses": [],
    "interaction_context": {
      "recent_evidence": []
    }
  },
  "blockers": [],
  "next_recommended_action": {
    "agent": "",
    "command": ""
  }
}
```
