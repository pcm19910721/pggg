# Orchestrator Runbook

这份 runbook 定义项目总控每一轮如何启动、如何查 gbrain/gstack、何时进入 Foundation Readiness / Remediation，以及何时允许进入业务 recipe。

## Core Rule

```text
不要从用户输入直接跳到业务 Agent。
先确认基础就位状态，再选择 workflow recipe。
```

基础能力来源：

```text
gstack = 已验证 skill 能力源
gbrain = 长期事实源
本地 Markdown = 可读协议和 artifact 快照
```

## Startup Sequence

每一轮总控启动时按这个顺序：

```text
1. 读取 PROJECT_STATE.md 和 .gstack/project-state.json 如果存在
2. 读取 .gstack/harness/agents/TEAM.md 和 problem-handling.md 如果存在
3. 读取 GSTACK_SKILL_REGISTRY.md
4. 读取 WORKFLOW_RECIPES.md
5. 读取 SYSTEM_TUNING_LOOP.md
6. 读取 MEMORY_ARCHITECTURE.md
7. 读取 GBRAIN_SCHEMA.md
8. 查询 gbrain 相关记忆
9. 读取 gstack native logs
10. 检查 git status / diff / branch / commit
11. 检查 .ai-context/project.json 和 GitNexus status；如需可视化/onboarding/domain/fallback，再检查 .understand-anything artifacts
12. 判断 Foundation Readiness 是否 known + ready
```

推荐 gbrain 查询：

```bash
PROJECT_ID="$(node -e 'const fs=require("fs"); for (const f of [".gstack/project-state.json",".ai-context/project.json"]) { try { const s=JSON.parse(fs.readFileSync(f,"utf8")); if (s.project_id) { process.stdout.write(s.project_id); process.exit(0); } } catch {} } process.stdout.write("project");')"
gbrain query "project $PROJECT_ID orchestration current decisions"
gbrain query "project $PROJECT_ID code context gitnexus reading path hotspots"
gbrain query "agent capability gaps active"
gbrain query "memory policy gbrain local docs conflict"
gbrain query "foundation readiness active blockers"
```

如果 gbrain query 遇到 PGLite lock、timeout 或临时失败：

```text
1. 重试一次。
2. 仍失败时派发 Problem Handling Agent，记录 warning 和 system_tuning_notes。
3. 本轮可以降级使用 PROJECT_STATE.md、.gstack/project-state.json 和本地 docs。
4. 如果当前动作需要解决 gbrain/local 冲突、review/release/ship 或生产决策，则停止并把 gbrain_query_timeout 提升为 blocker。
```

推荐 gstack 状态来源：

```text
gstack-learnings-search
gstack-timeline-read
gstack-review-read
gstack-question-preference
gstack-builder-profile
```

## Foundation Gate

如果 Foundation Readiness 是：

```text
ready   → 可以进入 R0 或业务 recipe
partial → 先进入 R-0.5 Foundation Remediation，除非用户明确接受风险
blocked → 不允许进入业务 recipe
unknown → 先进入 R-1 Foundation Readiness Check
```

Foundation Readiness 检查范围：

```text
gbrain: CLI/MCP/query/seed/sync mode
gstack: skills/bin/logs/browse/host support
project protocol: PROJECT_STATE、registry、recipes、memory、tuning、schema、CLAUDE/AGENTS
runtime: install/dev/test/lint/typecheck/local URL/production URL, or explicit not_required for docs-only workspaces
runners: browser、cookies/login、Windows Test Host、deploy config
memory policy: gbrain vs local docs conflict status
structured state: .gstack/project-state.json 是否存在且与 PROJECT_STATE.md 一致
```

## Remediation Gate

Foundation Remediation 只能补 harness 基础：

```text
可以：seed gbrain、补 PROJECT_STATE、补协议文件、推断 runtime、配置 browse/cookies/deploy handoff
不可以：修业务代码、改 gstack skill、伪造 QA passing、绕过真实凭证确认
```

Remediation 完成后必须回到 R-1 复检，除非明确记录 remaining blocker 和 skip risk。

## Recipe Selection

Foundation ready 后再选择业务 recipe：

```text
继续上次工作      → R0 Restore / Resume Context
新想法/方向不清   → R1 New Idea / Product Direction
先看懂项目/查代码事实 → R0.5 Code Context / Project Understanding
已有高风险计划    → R2 Full Plan Review
新设计/视觉方向   → R3 Design From Scratch
方案已定开始写    → R4 Build After Plan
用户可见功能测试  → R5 User-Visible Feature Verification
只要测试报告      → R6 Report-Only QA
报错/回归/坏了    → R7 Bug / Regression / Broken Behavior
准备 PR/merge     → R8 Pre-Landing Review
安全/性能硬化     → R9 Security / Performance Hardening
ship/deploy       → R10 Ship / PR / Deploy
上线后观察        → R11 Post-Deploy Canary / Incident
文档/DX           → R12 Docs / DX Release
长期维护/学习     → R13 Long-Term Maintenance / Learning
系统不顺/能力缺口 → R14 System / Agent Capability Tuning
浏览器/远程协作   → R15 Multi-Agent / Browser Collaboration
Windows 实测      → R16 Cross-OS / Windows Reality Testing
```

已有代码项目的产品判断默认先走 R0.5，再进入 R1。R0.5 默认用 GitNexus 获取当前代码事实；UA 只在需要可视化、onboarding、domain graph 或 fallback 时使用。这样 `/office-hours` 基于当前能力、核心流程和风险热点判断方向，而不是从空白假设开始。

## Template Source Gate

如果目标项目的 `.gstack/project-state.json` 里存在 `template_source`，总控还要把模板源健康作为流程检查项。这个检查不替代目标项目 readiness，而是防止目标项目反复接入旧 installer 或坏模板。

推荐检查：

```bash
TEMPLATE_SOURCE="$(node -e 'const fs=require("fs"); try { const s=JSON.parse(fs.readFileSync(".gstack/project-state.json","utf8")); process.stdout.write(s.template_source || ""); } catch {}')"
if [ -n "$TEMPLATE_SOURCE" ]; then
  (cd "$TEMPLATE_SOURCE" && bin/gstack-harness-self-test)
  (cd "$TEMPLATE_SOURCE" && npx gitnexus status)
fi
```

如果模板源自测失败、GitNexus stale，或模板源有未提交 harness 逻辑变更，应先处理模板源，再让目标项目重跑：

```bash
pcm-harness --no-start-codex
```

模板源问题归 System Tuning / harness maintenance，不应通过修改目标项目业务代码绕过。

运行中问题默认路由：

```text
timeout / warning / runner failure / repeated friction → Problem Handling Agent
Problem Handling Agent 判断：自动补救、低风险降级、升级 blocker、或进入 R14 System Tuning
```

## Handoff Requirements

每个 Agent 结束后必须给总控：

```yaml
agent_id:
run_id:
summary:
artifacts:
quality_gate_updates:
decisions:
blockers:
capability_gaps:
system_tuning_notes:
gbrain_write_candidates:
```

总控只基于 artifact/evidence 更新状态，不基于口头结论。

## State Update

每轮结束必须更新：

```text
PROJECT_STATE.md
gate evidence
artifact paths
blockers
next recommended action
system tuning notes
```

然后记录结构化 usage run：

```bash
.gstack/harness/bin/gstack-harness-record-run \
  --event session_end \
  --status completed \
  --recipe "<chosen recipe>"
```

如果本轮出现卡点、用户纠正、能力缺口、warning 或 blocker，必须用对应参数写入 usage run。模板源通过 `bin/gstack-harness-usage-report` 聚合这些真实运行数据。

长期有价值的结论按 `GBRAIN_SCHEMA.md` 写入 gbrain：

```text
用户长期偏好
系统原则
Agent 能力缺口
workflow 调整原因
质量门禁关键结论
发布/事故复盘结论
```

## Stop Conditions

必须停止并要求用户确认：

```text
Foundation Readiness blocked
需要真实凭证或生产配置
将触发部署、合并、发布、删除、迁移
gbrain 与本地文档冲突且会影响下一步
Windows-only 结论缺真实 Windows evidence
质量门禁缺证据但用户要求继续 ship
```
