# GBrain Schema

这份文档定义项目级多 Agent 系统写入 gbrain 的页面命名、标签和内容模板。

目标：

```text
让多个 Agent 共享一个 gbrain，但不会各写各的。
```

## 页面命名规则

使用 slash-style slug：

```text
scope/name/type
```

推荐命名空间：

```text
system/*
project/<project-id>/*
agent/<agent-id>/*
artifact/<project-id>/*
run/<project-id>/*
```

## Core Pages

### System Pages

| Page | 用途 |
|---|---|
| `system/orchestration-principles` | 项目级编排原则 |
| `system/user-preferences` | 用户长期偏好 |
| `system/agent-capability-model` | Agent 能力模型 |
| `system/harness-product-usage` | harness 安装方式、低人工参与策略、Agent 分层 |
| `system/tuning-decisions` | 系统调教决策 |
| `system/capability-gap-backlog` | 跨项目能力缺口 |

### Project Pages

| Page | 用途 |
|---|---|
| `project/<project-id>/overview` | 项目目标和当前定位 |
| `project/<project-id>/architecture` | Code Context Agent 提炼的核心架构、入口和关键模块 |
| `project/<project-id>/reading-path` | 新 agent 理解项目的推荐阅读路径 |
| `project/<project-id>/hotspots` | 高复杂度、高风险或高变更影响面的模块 |
| `project/<project-id>/gitnexus-index` | GitNexus index 状态、commit、staleness 和统计摘要 |
| `project/<project-id>/code-context` | GitNexus-first 代码上下文摘要，可包含可选 UA artifact 指针 |
| `project/<project-id>/ua-artifacts` | 可选 `.understand-anything` 图谱、domain graph、diff overlay 等产物索引，仅在使用 UA 时写 |
| `project/<project-id>/state` | 项目状态摘要 |
| `project/<project-id>/decisions` | 架构和流程决策 |
| `project/<project-id>/quality-gates` | 质量门禁历史 |
| `project/<project-id>/foundation-readiness` | gbrain/gstack/harness/runner 就位状态 |
| `project/<project-id>/workflow-overrides` | 项目特定 workflow 调整 |
| `project/<project-id>/agent-overrides` | 项目特定 Agent 覆盖 |
| `project/<project-id>/capability-gaps` | 项目内能力缺口 |
| `project/<project-id>/release-history` | 发布历史 |
| `project/<project-id>/incident-history` | 事故历史 |

### Agent Pages

| Page | 用途 |
|---|---|
| `agent/<agent-id>/charter` | Agent 职责边界 |
| `agent/<agent-id>/handoff` | 输入输出和交接规范 |
| `agent/<agent-id>/failure-modes` | 常见失败模式 |
| `agent/<agent-id>/capability-gaps` | 该 Agent 的能力缺口 |
| `agent/<agent-id>/collaboration` | 与其他 Agent 的协作关系 |
| `agent/<agent-id>/evaluation` | 成功指标和评估方式 |

建议的 Agent ID：

```text
product
foundation-readiness
foundation-remediation
architecture
design
build
reality-test
review
security-perf
release
maintenance
system-tuning
orchestrator
memory-gbrain
capability-gap
agent-evaluation
model-benchmark
codebase-map
```

## Agent Layers

每个 Agent 应标记 layer：

```text
required_core
default_replaceable
project_defined
improvement
```

### Required Core

```text
foundation-readiness
foundation-remediation
problem-handling
orchestrator
system-tuning
memory-gbrain
```

规则：

```text
不能删除。
可以配置。
不能修改 gstack skill 本体。
```

### Default Replaceable

```text
product
planning
architecture
design
build
reality-test
review
security-perf
release
maintenance
```

规则：

```text
可以覆盖 charter / handoff / gate / trigger。
仍然调用 gstack 已有 skills。
不能绕过 required core。
```

### Project Defined

项目新增 Agent 使用自己的 `agent/<agent-id>/*` 页面，并打：

```text
layer:project_defined
project:<project-id>
```

Starter project-defined agent:

```text
codebase-map
```

### Improvement

```text
system-tuning
capability-gap
agent-evaluation
model-benchmark
```

规则：

```text
输出系统改进建议，不直接替代业务 Agent 修功能。
```

### Artifact Pages

| Page | 用途 |
|---|---|
| `artifact/<project-id>/qa/<date-or-run-id>` | QA 报告摘要 |
| `artifact/<project-id>/foundation-readiness/<date-or-run-id>` | 基础就位检查摘要 |
| `artifact/<project-id>/foundation-remediation/<date-or-run-id>` | 基础补齐动作摘要 |
| `artifact/<project-id>/code-context/<date-or-run-id>` | GitNexus context/query/refresh 摘要 |
| `artifact/<project-id>/codebase-map/<date-or-run-id>` | 兼容旧名；仅在使用 Understand Anything 建图或刷新时写 |
| `artifact/<project-id>/impact-analysis/<date-or-run-id>` | GitNexus detect-changes / impact 影响面摘要 |
| `artifact/<project-id>/review/<date-or-run-id>` | Review 报告摘要 |
| `artifact/<project-id>/release/<date-or-run-id>` | Release 摘要 |
| `artifact/<project-id>/canary/<date-or-run-id>` | Canary 摘要 |
| `artifact/<project-id>/retro/<date-or-run-id>` | Retro 摘要 |

Artifact page 不一定保存全文，优先保存：

```text
结论
状态
路径
commit
适用范围
过期条件
```

### Run Pages

| Page | 用途 |
|---|---|
| `run/<project-id>/<run-id>` | 单次运行摘要 |
| `run/<project-id>/<run-id>/handoff` | Agent handoff 汇总 |
| `run/<project-id>/<run-id>/tuning` | system tuning notes |

## Tags

每个页面至少打 3 类 tag：

```text
scope:<global|project|agent|artifact|run>
project:<project-id>
type:<memory-type>
```

可选 tag：

```text
agent:<agent-id>
layer:<required_core|default_replaceable|project_defined|improvement>
capability:<capability-name>
gate:<health|browser-qa|review|security|performance|deployment>
status:<active|superseded|stale|resolved>
source:<user-stated|observed|review|retro|artifact|inferred>
confidence:<1-10>
```

示例：

```text
scope:agent
agent:release
type:handoff
capability:deploy
status:active
confidence:8
```

## Page Templates

### Decision

```markdown
# Decision: <title>

## Status

active | superseded | stale

## Scope

- Project:
- Agent:
- Capability:

## Decision

<what was decided>

## Reason

<why>

## Evidence

- Artifact:
- Run:
- User statement:

## Impact

- Affected agents:
- Affected workflows:
- Affected gates:

## Supersedes

- <page slug>

## Review Date

<date or condition>
```

### Capability Gap

```markdown
# Capability Gap: <title>

## Status

open | planned | resolved | rejected

## Observed In

- Project:
- Run:
- Agent:

## Symptom

<what keeps failing or slowing down>

## Current Workaround

<how we handle it today>

## Why Current Agents Are Not Enough

<boundary or capability issue>

## Proposed Agent / Optimization

<new agent or existing agent change>

## Required GStack Skills

- <skill>

## Handoff Inputs

- <input>

## Handoff Outputs

- <artifact/evidence>

## Success Metric

<how we know it worked>

## Priority

low | medium | high
```

### Agent Charter

```markdown
# Agent Charter: <agent-id>

## Layer

required_core | default_replaceable | project_defined | improvement

## Responsibility

<what this agent owns>

## Non-Goals

<what this agent must not own>

## Inputs

- <input>

## Outputs

- <artifact>
- <evidence>

## GStack Skills Used

- <skill>

## Handoff To

- <agent>: <condition>

## Handoff From

- <agent>: <condition>

## Quality Gates

- <gate>

## Failure Modes

- <known issue>

## Evaluation

<success/failure metric>
```

### Artifact Summary

```markdown
# Artifact Summary: <type> <run-id>

## Source

- Path:
- Commit:
- Branch:
- Date:

## Verdict

passing | failing | partial | skipped

## Key Findings

- <finding>

## Gates Updated

- <gate>: <status>

## Blockers

- <blocker or none>

## Expires When

- commit changes
- route changes
- dependency changes
- date
```

### Foundation Readiness Report

```markdown
# Foundation Readiness: <project-id> <run-id>

## Verdict

ready | partial | blocked

## Scope

- Project:
- Branch:
- Commit:
- Checked at:

## Capability Sources

- gbrain: ready | empty | unavailable | conflict
- gstack: ready | degraded | unavailable
- project protocol: ready | missing_docs | stale
- runtime: ready | missing_commands | cannot_start
- runners: ready | missing_browser | missing_windows_host | not_required
- memory policy: ready | conflict | unseeded

## Blockers

- <id>: <reason, required_for, owner>

## Warnings

- <id>: <risk>

## Evidence

- gbrain query:
- gstack command:
- project file:
- runner check:

## Next Action

- Recipe:
- Agent:
- Reason:
```

### Foundation Remediation Report

```markdown
# Foundation Remediation: <project-id> <run-id>

## Status

fixed | partial | blocked

## Source Readiness Report

- <artifact or run page>

## Actions Taken

- <action>: <target, evidence>

## Files Changed

- <path>: <reason>

## GBrain Pages Seeded

- <page>: <tags>

## Remaining Blockers

- <id>: <owner, handoff>

## Next Recommended Recipe

- <recipe>: <reason>
```

### Run Summary

```markdown
# Run Summary: <run-id>

## User Intent

<request>

## Recipe

<workflow recipe used>

## Agents / Skills

- Agent:
- Skills:

## Artifacts

- <path>

## Decisions

- <decision>

## Gate Changes

- <gate>: <status>

## System Tuning Notes

- Misroute:
- Capability gap:
- Bad handoff:
- Agent optimization:

## Write Candidates

- <what should become durable memory>
```

## Link Rules

Use gbrain links to connect:

```text
capability gap -> affected agent
capability gap -> workflow recipe
decision -> superseded decision
artifact summary -> run summary
run summary -> project state
agent charter -> handoff page
incident -> release
```

Suggested link types:

```text
affects
supersedes
evidences
produced-by
requires
blocked-by
resolved-by
```

## Write Policy

Write immediately:

```text
user-stated long-term preference
approved system tuning decision
new capability gap
release/incident conclusion
Agent charter change
```

Write after validation:

```text
inferred pattern
suspected failure mode
model comparison result
workflow optimization
```

Do not write:

```text
unverified guesses
single-run noise
raw logs
private secrets
temporary command output
```

## Conflict Policy

When gbrain conflicts with local docs:

```text
1. Check confidence, status, and recency.
2. If gbrain memory is active, high-confidence, and not expired, use gbrain.
3. Update stale local docs or mark them stale.
4. Record the conflict resolution as a decision if it affects future runs.
```

## Example gbrain Commands

Create or update a page:

```bash
gbrain put project/gstack-multiagent/decisions < decisions.md
```

Tag a page:

```bash
gbrain tag project/gstack-multiagent/decisions scope:project
gbrain tag project/gstack-multiagent/decisions project:gstack-multiagent
gbrain tag project/gstack-multiagent/decisions type:decision
```

Search memory:

```bash
gbrain query "release readiness agent capability gap"
```

Link pages:

```bash
gbrain link project/gstack-multiagent/capability-gaps agent/release/charter --type affects
```
