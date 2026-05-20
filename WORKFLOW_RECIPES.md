# Workflow Recipes

这份文档定义项目级总控 Agent 如何把 gstack skills 串成可执行流程。

它不是新的能力实现，也不是替代 gstack skill。它是编排协议：

```text
用户意图
→ 当前项目状态
→ readiness / gate 判断
→ 选择 workflow recipe
→ 调用 gstack skills
→ 收集 artifact 和 evidence
→ 总控更新项目状态
→ 调教 Agent 记录系统运行卡点和 Agent 能力缺口
```

## 通用运行规则

每次执行 recipe 前，总控 Agent 必须读取：

```text
PROJECT_STATE.md
.gstack/project-state.json 如果存在
.gstack/harness/agents/TEAM.md 如果存在
.gstack/harness/agents/problem-handling.md 如果存在
docs/AGENT_RUN_CONTRACT.md 如果存在
docs/AGENT_MANIFEST_SCHEMA.md 如果存在
.gstack/agents/*.yaml 如果存在
docs/PROBLEM_HANDLING_REPORT.md 如果存在
docs/SYSTEM_TUNING_REPORT.md 如果存在
docs/CODE_CONTEXT_REPORT.md 如果存在
.ai-context/project.json 如果存在
GSTACK_SKILL_REGISTRY.md
SYSTEM_TUNING_LOOP.md
MEMORY_ARCHITECTURE.md
GBRAIN_SCHEMA.md
ORCHESTRATOR_RUNBOOK.md
AGENT_ORCHESTRATOR.md
AGENT_WORKFLOWS.md
相关 gbrain global/project/agent memory
gstack native logs：learnings、timeline、review、question preferences
最近 git status / diff
最近 QA / review / release / canary artifact
.ai-context/gitnexus-status.json 如果存在
.understand-anything artifacts 只在 dashboard/onboarding/domain/fallback 相关时读取
```

每次执行 recipe 后，总控 Agent 必须更新：

```text
PROJECT_STATE.md
docs/CODE_CONTEXT_REPORT.md 如果 Code Context Agent 运行过
相关 artifact 路径
quality gate evidence
blockers
next recommended action
system tuning notes
```

阶段 skill 可以写自己的报告和修代码，但不直接写最终项目状态。最终状态由总控合并。

每次执行 recipe 后，总控还必须按 `docs/AGENT_RUN_CONTRACT.md` 检查 handoff：

```text
status 必须是 passed / failed / partial / blocked / skipped / fallback 之一
artifacts 必须存在，且 fallback artifact 不能只写成 warning
quality gate 更新必须包含 command / exit_code / artifact / checked_at
真实 session 必须写入 .gstack/usage-runs/
```

## Recipe 格式

```yaml
id:
intent:
when:
preconditions:
skills:
artifacts:
quality_gates:
handoff:
system_tuning_hooks:
```

## C-1: Capability-First Product Build

适用：

```text
用户提出新产品、新功能、新 agent、新自动化、新业务流程
用户说“以后这就是我的工作方式”
一个需求看起来可以由 UI 壳、热更新、权限、能力模块和流程编排组成
```

核心原则：

```text
先找模块，再写模块。
先定义能力契约，再实现能力。
先复用已有 recipe / skill / script / agent，再补缺口。
产品差异优先落在 workflow recipe、permission policy、module manifest 和 UI shell config。
```

流程：

```text
读取 docs/CAPABILITY_FIRST_WORKFLOW.md
→ 将用户需求拆成 required capabilities
→ 搜索 WORKFLOW_RECIPES、GSTACK_SKILL_REGISTRY、docs/agents、scripts、现有项目模块
→ 必要时用 GitNexus query/context 找已有实现路径
→ 为每个 capability 判定：reuse / adapt / missing
→ 对 missing capability 写 capability gap 和最小模块契约
→ 实现或派发实现前先确认影响面和测试策略
→ 将 capabilities 编排为 workflow recipe
→ 验证 permission、hot update、rollback、observability
→ 更新 PROJECT_STATE、相关 docs、system tuning notes
```

产物：

```text
capability inventory
reuse/adapt/missing 判定
missing capability contracts
workflow recipe
verification notes
capability gaps or registry updates
```

质量门禁：

```text
不能在未搜索已有能力时直接新写模块。
不能只有 UI 隐藏权限；运行时动作也必须声明权限。
热更新优先更新 manifest/config/recipe/policy；可执行代码热更新必须有版本、回滚和审计。
模块进入复用前至少要有输入、输出、权限和验证说明。
```

## C-2: Agent-Led Atomic Auto Commit

适用：

```text
Agent 完成实现、文档、测试、协议或 harness 调整
用户希望减少人工参与提交收尾
工作区需要按原子主题提交并刷新 code-context baseline
```

核心原则：

```text
标准提交由 Agent 主导完成。
人只处理例外：secret、浏览器 profile、大文件、测试失败、GitNexus high/critical、主题边界无法判断。
每个 commit 必须可独立解释、可独立验证、可独立 revert。
提交前 staged gate 是唯一 commit gate；whole-worktree 风险只作为原始证据。
```

默认命令：

```bash
.gstack/harness/bin/gstack-harness-atomic-commit
```

流程：

```text
读取 git status
→ 按主题分组 docs / tests / harness / protocol / mixed
→ 自动刷新 node scripts/ai-context-bridge.mjs baseline
→ 每次只 stage 一个主题组
→ 跑 .gstack/harness/bin/gstack-harness-workspace-hygiene gate
→ 跑 node scripts/ai-context-bridge.mjs postchange --scope staged
→ commit_gate=pass 时自动 git commit
→ commit_gate=blocked 或 needs_review 时 unstage 并停止
→ 成功提交后再次刷新 baseline
```

调试命令：

```bash
.gstack/harness/bin/gstack-harness-atomic-commit --dry-run
.gstack/harness/bin/gstack-harness-atomic-commit --no-commit
```

产物：

```text
按主题拆分的 git commits
.ai-context/change-baseline.json
.ai-context/runs/<run-id>/run.json
必要时 docs/WORKSPACE_HYGIENE_REPORT.md 和 .gstack/workspace-hygiene.json
```

质量门禁：

```text
不能 git add -A 后一次性提交整棵工作区。
不能提交 staged gate blocked 或 needs_review 的主题组。
不能自动提交 secret/sign-in state/browser profile/runtime artifact。
不能在风险组停止后继续提交后续组。
```

## Harness Init Preflow

目标项目里的产品入口：

```bash
gstack-harness-init
```

预期流程：

```text
检测 workspace_mode: template_source | target_project
→ 检查 gbrain / gstack 基础能力
→ 检测项目类型、git、runtime、package manager、test/lint/typecheck、deploy 线索
→ 安装基础协议文件
→ 生成 PROJECT_STATE.md
→ 生成 .gstack/project-state.json
→ 生成 CLAUDE.md 或 AGENTS.md
→ seed gbrain project pages
→ 安装 required core agent charters
→ 安装 default replaceable capability agents
→ 安装 project-defined starter Code Context Agent
→ 安装 Problem Handling Agent 问题处理职责
→ 安装 Code Context / Problem Handling / System Tuning 报告模板
→ 读取项目 overrides 或生成空 overrides
→ 跑 .gstack/harness/bin/gstack-harness-readiness
→ 必要时跑 R-0.5 Foundation Remediation
→ Remediation 后回到 .gstack/harness/bin/gstack-harness-readiness 复检
→ 输出 next recommended recipe
```

低人工参与策略：

```text
能检测就检测。
能推断就推断。
能默认就默认。
只有高风险、不可逆、凭证、部署、破坏性覆盖才问用户。
```

## R-1: Foundation Readiness Check

适用：

```text
新项目第一次接入 harness
用户说“系统准备好了吗”“先检查环境”“能不能接管这个项目”
PROJECT_STATE 缺失、过期或与 gbrain 冲突
gstack / gbrain 升级、跨机器迁移、runner 变化后
任何 recipe 运行前发现基础状态 unknown
```

核心原则：

```text
Foundation Readiness Agent 只诊断，不补齐。
就位状态必须以 gbrain + gstack 现有能力为准。
没有证据的 ready 不能放行；只能是 partial、blocked 或 explicit skipped。
```

流程：

```text
检查 gbrain：CLI/MCP 是否可用、是否有 seed pages、query 是否可用、sync mode 是否明确
→ 检查 gstack：skills/bin 是否存在、关键技能和日志工具是否可用、browse daemon 是否可用
→ 检查项目协议：PROJECT_STATE、.gstack/project-state.json、registry、recipes、memory/tuning/schema、CLAUDE/AGENTS 是否齐全
→ 检查 runtime：install/dev/test/lint/typecheck/local URL/production URL 是否已知，或是否明确 not_required
→ 检查 quality gates：Health、Browser QA、Windows QA、Review、Security、Performance、Deployment 是否有证据或明确 skip
→ 检查 runners：浏览器、cookies/login、Windows Test Host、deploy config 是否需要且可用
→ 输出 readiness verdict 和下一步 recipe
```

产物：

```text
foundation readiness report
gbrain readiness
machine-readable project state readiness
gstack readiness
project protocol readiness
runtime readiness
runner readiness
memory conflict list
blockers / warnings
next recommended action
```

readiness report schema：

```yaml
readiness:
  verdict: ready | partial | blocked
  gbrain: ready | empty | unavailable | conflict
  gbrain_query: ready | timeout | failed | not_run
  gstack: ready | degraded | unavailable
  project_protocol: ready | missing_docs | stale
  runtime: ready | missing_commands | cannot_start | not_required
  runners: ready | missing_browser | missing_windows_host | not_required
  memory_policy: ready | conflict | unseeded
blockers:
  - id:
    reason:
    required_for:
warnings:
  - id:
    risk:
next_action:
  recipe:
  agent:
  reason:
```

状态：

```text
Foundation Readiness: ready | partial | blocked
Phase: 不主动改变
Blockers: readiness blockers
Next recommended agent: Foundation Remediation Agent、State Agent 或业务 Agent
```

调教钩子：

```text
如果同类 readiness blocker 反复出现，记录 capability gap 或补 PROJECT_STATE / handoff schema。
如果 gbrain 与本地文档冲突频繁，补 conflict policy 或 seed 更新流程。
如果 gbrain query 因 PGLite lock / timeout 失败，派发 Problem Handling Agent；低风险流程先降级使用本地状态；review/release/ship 前必须恢复或明确 blocker。
```

## R-0.5: Foundation Remediation

适用：

```text
Foundation Readiness verdict 是 partial 或 blocked
项目协议缺失或 stale
gbrain 为空脑或缺核心 pages
gstack / browse / deploy / cookies / Windows runner 缺少基础配置
runtime 命令缺失，导致后续 recipe 无法稳定执行
```

核心原则：

```text
Remediation Agent 补齐 harness 基础，不修业务代码。
能调用 gstack 现有能力就调用现有能力，不重写 skill。
需要真实凭证、部署动作、破坏性配置时必须停下来让用户批准。
无法自动补齐的内容必须生成结构化 handoff。
```

流程：

```text
读取 R-1 readiness report
→ 按 blocker 类型分组：gbrain / gstack / project protocol / runtime / runners / deploy / memory conflict
→ gbrain 缺失：调用 /setup-gbrain 或生成 setup handoff
→ gbrain 为空：按 GBRAIN_SCHEMA seed 核心 pages、tags、links
→ gstack 缺失或版本阻断：调用 /gstack-upgrade 或记录 tooling blocker
→ 项目协议缺失：生成或修补 PROJECT_STATE、GSTACK_SKILL_REGISTRY、WORKFLOW_RECIPES、CLAUDE/AGENTS
→ 机器可读状态缺失：生成或修补 .gstack/project-state.json
→ runtime 缺失：从 package.json、pyproject、go.mod 等推断；推断不了则写待确认字段
→ browse/cookies 缺失：调用 /open-gstack-browser 或 /setup-browser-cookies
→ deploy 缺失：调用 /setup-deploy 或记录 release blocker
→ Windows runner 缺失：生成 Windows Test Host handoff，不允许伪造 Windows QA passing
→ 输出 remediation report
→ 回到 R-1 复检或进入 R0
```

产物：

```text
foundation remediation report
actions taken
files changed
gbrain pages seeded
remaining blockers
manual handoffs
post-remediation readiness verdict
```

remediation report schema：

```yaml
remediation:
  status: fixed | partial | blocked
  source_readiness_report:
  actions_taken:
    - action:
      target:
      evidence:
  files_changed:
    - path:
      reason:
  gbrain_pages_seeded:
    - page:
      tags:
  remaining_blockers:
    - id:
      owner:
      handoff:
  next_recommended_recipe:
    id:
    reason:
```

状态：

```text
Foundation Remediation: fixed | partial | blocked
Foundation Readiness: ready | partial | blocked
Blockers: remaining blockers
Next recommended agent: Foundation Readiness Agent 复检，或 State Agent / Orchestrator
```

调教钩子：

```text
如果 remediation 经常需要同一类手工补齐，把它提升为 init 模板、preflight check 或 capability gap。
如果自动推断 runtime 命令失败，记录项目类型和失败原因，优化 runtime discovery handoff。
```

## R0: Restore / Resume Context

适用：

```text
用户说“继续”“接着上次”“恢复上下文”
项目状态不清楚
长任务中断后回来
```

流程：

```text
/context-restore
→ 读取 PROJECT_STATE.md
→ 读取 .gstack/project-state.json
→ 读取最近 artifact
→ 判断当前 phase
→ 推荐下一个 recipe
```

产物：

```text
恢复摘要
当前 blockers
下一步建议
```

状态：

```text
Phase: 不主动改变
Next recommended agent: 根据恢复结果填写
```

调教钩子：

```text
如果恢复摘要不够用，记录缺失字段，回填到 PROJECT_STATE 模板或 handoff contract。
如果 gbrain query 暂时不可用，派发 Problem Handling Agent 记录 warning 和处理策略，并用本地 Markdown + .gstack/project-state.json 恢复；不要把低风险恢复流程卡死在 PGLite lock 上。
```

## R0.5: Code Context / Project Understanding

适用：

```text
第一次接手已有代码项目
用户说“先看懂这个项目”“查代码事实”“新 agent 怎么读这个项目”
Product Agent 要对已有代码项目跑 /office-hours
Build Agent 动手前需要定位模块、调用链和影响面
Review / Release 前需要知道 diff 影响哪些组件和测试
事故 / bug 需要从现象追到模块
重大重构、业务域变化、交接前需要刷新代码上下文
```

核心原则：

```text
Code Context Agent 负责当前代码事实，不直接修业务代码。
GitNexus 是默认事实源：status / query / context / impact / detect-changes。
UA 只作为 dashboard、onboarding、domain graph 或 GitNexus 不适用时的 fallback。
已有代码项目先拿到当前能力、核心流程和 hotspots，再让 /office-hours 做产品判断。
GBrain 只保存稳定结论；原始索引和临时定位细节保留在 .gitnexus、.ai-context/runs 或 task report。
```

流程 A：项目开始，建立 GitNexus 上下文：

```text
读取 .ai-context/project.json
→ node scripts/ai-context-bridge.mjs status
→ 如果未索引或 stale 且需要准确图谱：node scripts/ai-context-bridge.mjs refresh
→ GitNexus query/context：核心架构、入口、关键模块、业务流程和风险点是什么？
→ GitNexus query/context：新 agent 应该按什么顺序理解这个项目？
→ 可选 UA：/understand-dashboard、/understand-onboard、/understand-domain
→ Memory / GBrain Agent 写入稳定项目上下文摘要
```

流程 B：任务开始前，围绕任务查代码上下文：

```text
node scripts/ai-context-bridge.mjs status
→ 如果 stale 且任务依赖调用链/影响面准确：node scripts/ai-context-bridge.mjs refresh
→ GitNexus query/context <任务相关问题>
→ GitNexus context <关键文件/符号>
→ 输出任务相关模块、关键文件、调用链、修改入口、风险点、建议测试
```

流程 C：小改轻量查：

```text
GitNexus context <文件路径或符号>
→ 必要时 GitNexus query 这个文件/模块的职责是什么？
→ 如果索引 stale 但改动很小，可以记录 stale risk 后继续；不要强制刷新
```

流程 D：提交前 / 上线前看影响面：

```text
node scripts/ai-context-bridge.mjs status
→ 如果 stale：node scripts/ai-context-bridge.mjs refresh
→ node scripts/ai-context-bridge.mjs postchange --scope all --test-command "<test command>" --test-exit-code "<exit code>" --test-artifact "<artifact path>"
→ 高风险符号：node scripts/ai-context-bridge.mjs postchange --scope all --impact SymbolName --test-command "<test command>" --test-exit-code "<exit code>" --test-artifact "<artifact path>"
→ GitNexus query/context：这次改动影响哪些组件、层、业务流程？最该补哪些测试？
→ 可选 UA dashboard/diff overlay 只用于可视化复核
```

流程 E：上线后 / 持续维护：

```text
重要改动后刷新 GitNexus：node scripts/ai-context-bridge.mjs refresh
→ 重大重构后重新生成 GitNexus index summary 并更新 gbrain 摘要
→ 业务域明显变化后可选 /understand-domain
→ 项目知识库需要图谱时可选 /understand-knowledge docs/knowledge
```

流程 F：事故 / bug 复盘：

```text
Maintenance Agent: /investigate
→ GitNexus query/context <错误现象> 可能涉及哪些模块？
→ GitNexus context <可疑文件/符号>
→ node scripts/ai-context-bridge.mjs postchange --scope all
→ 写 learnings / anti-patterns / checks / playbooks 中可复用的部分
```

产物：

```text
.ai-context/project.json
.ai-context/gitnexus-status.json
.ai-context/gitnexus-index.md
.ai-context/runs/<run-id>/
.gitnexus/meta.json
docs/CODE_CONTEXT_REPORT.md
可选 .understand-anything/knowledge-graph.json
可选 .understand-anything/domain-graph.json
可选 .understand-anything/diff-overlay.json
项目阅读路径
核心架构理解
风险热点
任务影响面
建议测试
```

GBrain 写入：

```text
project/<project-id>/overview
project/<project-id>/architecture
project/<project-id>/reading-path
project/<project-id>/hotspots
project/<project-id>/gitnexus-index
project/<project-id>/code-context
project/<project-id>/domains/<domain>
artifact/<project-id>/impact-analysis/<date-or-run-id>
learnings/<lesson>
checks/<check>
anti-patterns/<failure-mode>
playbooks/<debug-playbook>
```

状态：

```text
Phase: 不主动改变，除非后续 Product / Build / Review recipe 改变 phase
Code Context: ready | stale | missing | skipped
Next recommended agent: Product Agent、Architecture Agent、Build Agent、Review Agent 或 Maintenance Agent
```

调教钩子：

```text
如果 agent 多次找错模块，把对应问题交给 System Tuning Agent 更新 reading path 或 handoff。
如果 GitNexus index 经常过期，把 bridge status/refresh 加入重要改动后的标准 checklist。
如果 GBrain 被临时细节污染，Memory / GBrain Agent 应收紧“只保存稳定结论”的写入规则。
```

## R1: New Idea / Product Direction

适用：

```text
新想法
用户需求不清楚
是否值得做
产品范围摇摆
```

流程：

```text
已有代码项目：先跑 R0.5 Code Context / Project Understanding，至少拿到 overview、核心流程、hotspots
→ /office-hours
→ /plan-ceo-review 如果方向有产品/商业/范围风险
→ /plan-eng-review 如果已经要进入实现方案
```

可选：

```text
/autoplan 如果已有粗计划并希望一次性跑全审查
/plan-devex-review 如果面向开发者
/plan-design-review 如果 UI/UX 是核心风险
```

产物：

```text
design doc / product brief
codebase-informed current capability map 如果是已有代码项目
scope decision
implementation plan
open questions
```

状态：

```text
Phase: planning
Product brief: path
Implementation plan: path 如果生成
Blockers: 未解决的产品或架构问题
```

调教钩子：

```text
如果用户反复纠正产品定位，记录误解来源，交给 System Tuning Agent 判断是 Product Agent 问题、handoff 问题，还是需要新增领域理解能力。
```

## R2: Full Plan Review / High-Stakes Feature

适用：

```text
已有计划
跨模块功能
重要用户可见功能
想尽量完整吸收 gstack review 能力
```

流程：

```text
已有代码项目：先跑 R0.5 任务查图，确认核心模块、业务流程、hotspots
→ /autoplan
→ /plan-eng-review
→ /plan-design-review 如果有 UI
→ /plan-devex-review 如果有开发者体验
→ 更新 implementation plan
```

产物：

```text
reviewed plan
engineering findings
design findings
DX findings
approved decisions
```

状态：

```text
Phase: planning
Quality Gates: planning_review = passing/failing
Next recommended agent: Build Agent 或 Design Agent
```

调教钩子：

```text
如果多个 review 结论冲突，记录 conflict，并要求总控生成 decision log。
```

## R3: Design From Scratch

适用：

```text
新页面
新产品视觉方向
品牌或设计系统未定
```

流程：

```text
/design-consultation
→ /design-shotgun
→ /plan-design-review
→ /design-html
→ /browse smoke test
→ /design-review 如果页面已经落地且需要视觉修复
```

产物：

```text
DESIGN.md
design variants
approved mockup
HTML/CSS artifact
screenshots
visual QA report
```

状态：

```text
Phase: design 或 build
Design system: path
Browser QA: passing/failing/skipped with evidence
```

调教钩子：

```text
如果设计输出和用户审美不符，记录用户偏好和被拒绝的视觉方向，判断是否需要优化 Design Agent 的输入契约或新增设计偏好记忆能力。
```

## R4: Build After Plan

适用：

```text
方案已定
开始实现代码
有明确文件范围
```

流程：

```text
可选 /freeze 或 /guard
→ R0.5 任务查代码上下文：GitNexus query/context <任务相关问题和关键文件>
→ 正常 Codex/Claude 编码
→ /health
→ /context-save 如果任务跨轮或较大
```

产物：

```text
代码 diff
任务上下游和影响面摘要
health report
实现摘要
未完成事项
```

状态：

```text
Phase: build
Health: passing/failing with evidence
Next recommended agent: Reality Test Agent 或 Review Agent
```

调教钩子：

```text
如果实现偏离 plan，记录偏离原因，是 plan 不完整、上下文缺失，还是路由错误。
```

## R5: User-Visible Feature Verification

适用：

```text
功能写完了，测一下
页面、表单、按钮、跳转、登录态、上传、支付等用户可见变化
```

流程：

```text
/health
→ 启动 dev server
→ /setup-browser-cookies 如果需要登录
→ /browse smoke test
→ /qa
→ /qa 复测 如果修了 bug
→ /review
```

产物：

```text
health report
screenshots
QA report
bug fix list
review report
```

状态：

```text
Phase: test 或 review
Health: passing/failing
Browser QA: passing/failing
Review: passing/failing
Blockers: QA 或 review 阻塞项
```

调教钩子：

```text
如果 QA 没覆盖真实关键路径，补 critical paths 到 PROJECT_STATE 或 QA handoff。
```

## R6: Report-Only QA

适用：

```text
只给测试报告，不要修
需要第三方视角
用户不希望当前轮改代码
```

流程：

```text
/setup-browser-cookies 如果需要登录
→ /qa-only
→ 总控汇总风险和下一步
```

产物：

```text
QA-only report
screenshots
repro steps
severity list
```

状态：

```text
Browser QA: passing/failing
Blockers: QA findings
Next recommended agent: Build Agent 或 Investigate Agent
```

调教钩子：

```text
如果用户要求只报告而系统修了代码，记录为权限传递失败，调整 routing policy。
```

## R7: Bug / Regression / Broken Behavior

适用：

```text
报错了
为什么坏了
线上异常
回归问题
用户能复现 bug
```

流程：

```text
/investigate
→ R0.5 事故查代码上下文：GitNexus query/context <错误现象和可疑文件>
→ 正常编码修复
→ /health
→ /qa 或 /browse 复测
→ /review
→ /learn 记录非显然根因
```

产物：

```text
root cause analysis
根因模块和影响面
fix diff
regression test 或复测证据
review report
learning entry
```

状态：

```text
Phase: maintenance 或 test
Health: passing/failing
Browser QA: passing/failing 如果用户可见
Review: passing/failing
```

调教钩子：

```text
如果没有根因就开始修，记录违反 investigate 铁律，调教 Maintenance Agent 的职责边界和 workflow 阻断规则。
```

## R8: Pre-Landing Review

适用：

```text
准备提交 PR
准备 merge
看看代码有没有问题
```

流程：

```text
R0.5 提交前影响面：bridge status → 必要时 refresh → postchange / GitNexus impact，带上测试 command / exit code / artifact
→ /health
→ /review
→ /cso 如果涉及权限/登录/支付/数据/LLM trust boundary
→ /benchmark 如果涉及性能敏感页面
```

产物：

```text
health report
impact analysis / diff overlay with test evidence
review report
security report 可选
performance report 可选
```

状态：

```text
Phase: review
Health: passing/failing
Review: passing/failing
Security: passing/failing/skipped
Performance: passing/failing/skipped
```

调教钩子：

```text
如果 review 发现本应在 plan 阶段发现的问题，记录为 plan-eng-review 漏洞。
```

## R9: Security / Performance Hardening

适用：

```text
重要上线
权限、支付、登录、数据安全、LLM 安全相关
性能敏感页面
```

流程：

```text
/cso
→ /benchmark
→ /review
→ 修复阻塞项
→ /cso 或 /benchmark 复测
```

产物：

```text
security report
performance report
blocking issues
fix evidence
```

状态：

```text
Security: passing/failing
Performance: passing/failing
Review: passing/failing
```

调教钩子：

```text
如果安全或性能检查触发太晚，补条件到 release readiness。
```

## R10: Ship / PR / Deploy

适用：

```text
准备上线
创建 PR
push / merge / deploy
```

Release readiness check 必须先跑：

```text
Foundation Readiness: ready
Code Context: ready 或 explicit skipped with reason；已有代码变更需有 GitNexus detect-changes / impact analysis
Health: passing 且绑定当前 branch/commit
Review: passing
Browser QA: passing 或 explicit skipped with reason
Windows QA: passing 或 explicit skipped with reason，如果功能 Windows-bound
Blockers: empty
Security: passing 或 explicit skipped with reason
Performance: passing 或 explicit skipped with reason
Deployment config: ready
```

流程：

```text
已有代码变更：R0.5 提交前影响面 bridge postchange / GitNexus impact
→ /landing-report
→ /setup-deploy 如果部署信息缺失
→ /ship
→ /land-and-deploy
→ /canary
→ /document-release
→ /context-save
```

产物：

```text
landing report
impact analysis
PR
version bump
CHANGELOG
deploy status
canary report
documentation updates
release status
```

状态：

```text
Phase: release
Deployment: deployed/failed
Release status: path
Next recommended agent: Maintenance Agent 或 Retro
```

调教钩子：

```text
如果用户说“合并并部署”但 gates 不满足，总控必须阻断并解释缺什么。
```

## R11: Post-Deploy Canary / Incident

适用：

```text
上线后观察一下
刚部署完需要确认线上健康
canary 发现异常
```

流程：

```text
/canary
→ /investigate 如果发现错误
→ 修复
→ /health
→ /qa 或 /browse
→ /ship
→ /land-and-deploy
→ /canary
```

产物：

```text
canary report
incident root cause
fix PR
post-fix canary evidence
```

状态：

```text
Phase: maintenance 或 release
Deployment: deployed/failed
Blockers: incident findings
```

调教钩子：

```text
如果 canary 未覆盖异常页面，把生产路径补到 canary config。
```

## R12: Docs / DX Release

适用：

```text
更新文档
同步 README / ARCHITECTURE / CONTRIBUTING
SDK/API/CLI 开发者体验变化
需要输出 PDF
```

流程：

```text
/plan-devex-review 如果是方案阶段
→ /devex-review 如果要实测 getting started
→ /document-release
→ /make-pdf 如果需要 PDF
→ /review
```

产物：

```text
DX scorecard
updated docs
PDF artifact 可选
review report
```

状态：

```text
Phase: review 或 release
Review: passing/failing
Docs: updated
```

调教钩子：

```text
如果文档和实际命令不一致，记录为 DX artifact drift。
```

## R13: Long-Term Maintenance / Learning

适用：

```text
周期复盘
沉淀经验
跨 session 维护
项目长期演进
```

流程：

```text
/retro
→ /learn
→ /context-save
→ /plan-tune 如果人机互动策略需要调整
→ /benchmark-models 如果需要评估模型/skill 性价比
```

产物：

```text
retro report
learning entries
checkpoint
system tuning notes
tuning preferences 如果涉及提问偏好
model benchmark report
```

状态：

```text
Phase: maintenance
Notes: updated
Next recommended agent: 根据 retro 输出
```

调教钩子：

```text
把反复出现的失败模式提升为 routing rule、quality gate 或 workflow recipe。
```

## R14: System / Agent Capability Tuning

适用：

```text
用户觉得系统运行不顺
用户纠正路由或 Agent 分工
Agent 反复误解意图
现有 Agent 能力不够
需要新增某类能力 Agent
能力之间配合不顺
需要让系统有序提升
```

流程：

```text
/learn 查询历史失败模式
→ /retro 汇总长期运行模式
→ /plan-tune 如果问题属于提问频率或用户偏好
→ 识别 capability gap
→ 决定新增 Agent、优化 Agent、调整 handoff、还是调整 recipe
→ 更新 SYSTEM_TUNING_LOOP.md 的能力缺口或决策
→ 更新 WORKFLOW_RECIPES.md 的 recipe / handoff
→ 必要时更新 GSTACK_SKILL_REGISTRY.md 的 skill 使用约束
→ /context-save
```

产物：

```text
system tuning report
capability gap backlog
new agent proposal 或 existing agent optimization
handoff / recipe / gate update
before/after examples
```

状态：

```text
Phase: maintenance
System tuning notes: path
```

调教钩子：

```text
任何系统运行策略变更都要记录：触发案例、问题归因、修改内容、期望改善、后续验证方式。新增或优化 Agent 必须说明能力边界、输入输出、协作对象和成功指标。
```

## R15: Multi-Agent / Browser Collaboration

适用：

```text
需要外部 Agent 共享浏览器
需要人工观看浏览器
需要真实页面协作调试
```

流程：

```text
/open-gstack-browser
→ /pair-agent 如果远程 Agent 需要接入
→ /browse 或 /qa 执行验证
→ /context-save 保存协作结果
```

产物：

```text
browser session
pairing key
screenshots
QA evidence
collaboration notes
```

状态：

```text
Browser QA: passing/failing
Notes: collaboration summary
```

调教钩子：

```text
如果远程 Agent 权限过大或输出不可复现，补 access scope 和 evidence 要求。
```

## R16: Cross-OS / Windows Reality Testing

适用：

```text
Linux / WSL 开发环境需要验证 Windows 行为
功能涉及 EXE、MSI、安装器、浏览器扩展、native messaging
功能涉及 Windows Chrome / Edge 差异
功能涉及 PowerShell、cmd、Git Bash、Python/Node 版本差异
功能涉及系统 UI、下载目录、文件选择器、注册表、协议唤起、进程、服务
```

核心原则：

```text
Linux Orchestrator Agent 不把 Windows-only 行为判定为已通过。
Windows-only 结论必须来自 Windows Test Host 的真实 evidence。
万能测试 Agent 只做入口协调，不直接承诺所有测试；按 task_type 派发专用 runner。
```

流程：

```text
/health 在开发机跑通基础检查
→ 判断功能是否 OS-bound
→ 如果不是 OS-bound：/browse 或 /qa 做通用浏览器实测，必要时补 Windows smoke test
→ 如果是 Windows-bound：生成结构化 Windows test handoff
→ Windows Test Coordinator 读取 inbox / shared doc
→ 按 task_type 派发 browser-runner / extension-runner / native-exe-runner / cli-script-runner
→ Windows runner 返回截图、日志、exit code、console/network/process evidence
→ Linux Orchestrator 汇总 verdict，更新 PROJECT_STATE.md 和 QA_REPORT
→ /context-save 保存跨机协作结果
```

handoff schema：

```yaml
task_type: browser_qa | extension_qa | native_exe | cli_script | installer_qa
target_os: windows
artifact:
runtime:
  browser:
  shell:
  language_runtime:
steps:
expected_result:
evidence_required:
  - screenshot
  - logs
  - exit_code
  - console_errors
  - network_errors
  - process_or_window_state
timeout:
cleanup_policy:
```

runner 路由：

```text
browser_qa -> Windows Chrome / Edge 页面实测
extension_qa -> 扩展安装、权限、内容脚本、native messaging 实测
native_exe -> EXE、窗口、托盘、协议唤起、进程、日志实测
cli_script -> PowerShell、cmd、Git Bash、Python/Node 版本矩阵实测
installer_qa -> Windows Sandbox / VM 快照环境安装和卸载实测
```

产物：

```text
Windows QA verdict
runner assignment
screenshots
stdout / stderr / logs
console / network status
process / window evidence
known skips with risk
```

状态：

```text
Windows QA: passing/failing/skipped
Browser QA: passing/failing/skipped
Notes: target OS, runner, evidence path
```

调教钩子：

```text
如果 Windows 测试经常卡在同一类任务，记录 capability gap。
如果 handoff 缺字段导致 runner 猜测，补 schema 或 recipe。
如果 runner 返回不可复现结论，补 evidence_required 和 artifact retention。
```

## R17: Repeat Work Promotion / Automation Candidate

适用：

```text
用户说“按上次”“还是那个格式”“以后都这样”
同类任务第二次或多次出现
用户重复纠正同一字段、格式、流程或交接偏好
用户当前话语需要结合同一 session 最近 1-2 次 Codex 输出才能判断是确认、纠正、补充需求还是改变方向
任务出现明确周期：每天、每周、每月、每个发布前
usage runs / tuning notes 显示同一 where_stalled、user_correction 或 capability_gap 反复出现
```

核心原则：

```text
先完成当前任务，再升级系统。
第二次必须复用已知偏好，不能默认重新问。
定时任务先成为 scheduled candidate，不自动启用。
能用 handoff rule / workflow recipe / agent capability 解决，就不新建 skill。
```

流程：

```text
按原本业务 recipe 完成当前任务
→ 对照同一 session 最近 1-2 次 Codex 输出，提取当前用户话语的 role 和 inferred delta
→ 检查 .gstack/usage-runs/index.jsonl 和相关 run JSON
→ 检查 docs/USAGE_FEEDBACK_REPORT.md、docs/SYSTEM_TUNING_REPORT.md
→ 查询 gbrain project / agent memory（可用时）
→ 判断重复阶段：discovery / reuse_required / promotion_candidate / approved_protocol
→ 复用已知格式、字段、路径、交接对象、skip policy 和质量门禁
→ 如果缺失历史 pattern，记录 memory miss
→ 如果重复已稳定，写 promotion candidate
→ 更新 PROJECT_STATE.md / .gstack/project-state.json 的 repeat_work 区域
→ 必要时更新 SYSTEM_TUNING_LOOP.md、WORKFLOW_RECIPES.md 或 handoff contract
→ 把长期稳定结论写入 gbrain
```

promotion candidate schema：

```yaml
pattern_id:
observed_in:
repeat_count:
known_inputs:
known_outputs:
user_preferences:
current_workaround:
promotion_type: handoff_rule | workflow_recipe | agent_capability | scheduled_candidate | capability_gap | possible_skill
recommended_change:
required_evidence:
risk:
approval_required:
```

scheduled candidate 必填：

```yaml
cadence:
permission_scope:
input_source:
output_artifact:
failure_handling:
monitoring_path:
approval_required: true
approved_by:
```

产物：

```text
当前任务 artifact
repeat work promotion note
session interaction context evidence
memory miss note（如有）
scheduled candidate（如适用）
system tuning failure（如适用）
updated project state repeat_work fields
```

状态：

```text
Phase: maintenance 或当前业务阶段
System Tuning: monitoring / promotion_candidate / blocked
Repeat Work: discovery / reuse_required / promotion_candidate / approved_protocol
```

调教钩子：

```text
如果第二次还要求用户重复同一偏好，记录 system tuning failure。
如果 scheduled candidate 缺 cadence、权限、输出、失败处理或监控路径，不能升级为 active recurrence。
如果 Agent 想新建 skill，先证明 recipe、handoff rule、agent capability 都不足。
```

## Quality Gate Matrix

| Gate | Required For | Supported By | Evidence Required |
|---|---|---|---|
| Foundation Readiness | first run, resume after migration, any run with unknown state | Foundation Readiness Agent, Foundation Remediation Agent | gbrain/gstack/project/runtime/runner verdict, blockers, remediation report |
| Code Context | existing-code product direction, build planning, review, incident triage | Code Context Agent, GitNexus bridge/query/context/impact/detect-changes; optional UA for dashboard/onboarding/domain/fallback | GitNexus status/index/run note, reading path, relevant nodes/call chain, impact analysis |
| Health | review, ship, deploy | `/health` | command, exit code, branch, commit, artifact |
| Browser QA | user-visible features, deploy | `/browse`, `/qa`, `/qa-only` | URL, screenshots, paths, console/network status |
| Windows QA | Windows-bound features, native apps, extensions, shell/runtime differences | Windows Test Host runners | target OS, runner, screenshots, logs, exit codes, process/window evidence |
| Review | PR, merge, ship | `/review`, `/claude` optional | diff base, findings, verdict |
| Security | auth, payment, data, LLM, production | `/cso` | report, blockers, accepted skips |
| Performance | perf-sensitive pages, major frontend changes | `/benchmark` | baseline, current result, regression verdict |
| Deployment | deploy, canary | `/setup-deploy`, `/land-and-deploy`, `/canary` | CI/deploy status, prod URL, canary evidence |
| Docs | release, DX changes | `/document-release`, `/devex-review` | changed docs, tested commands |
| System Tuning | recurring workflow friction, capability gaps | `/plan-tune`, `/learn`, `/retro`, `/benchmark-models` | failure case, capability decision, expected improvement |

## Explicit Skip Rules

允许跳过 gate，但必须写清楚：

```yaml
gate:
status: skipped
reason:
risk:
approved_by:
expires_at:
```

示例：

```text
Browser QA skipped: docs-only change, no runtime surface changed.
Security skipped: no auth/payment/data/LLM boundary touched.
Performance skipped: no frontend route, asset, query, or rendering path changed.
```

没有 skip reason 的 skipped 不能放行 `/ship`。

## Total System Loop

最终闭环不是某一条 recipe，而是持续循环：

```text
GStack Skill Registry
→ Workflow Recipe
→ Skill Execution
→ Artifact / Evidence
→ Project State Update
→ System Tuning Notes
→ Agent Capability / Recipe Improvement
```

这保证系统不是一次性写死，而是持续优化 Agent 能力体系、协作关系和 workflow，通过真实项目运行不断变顺。
