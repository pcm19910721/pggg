# gstack 项目级多智能体工作流

这份目录整理的是一次关于“如何把 gstack 全量 skill 能力编排成项目级多阶段工作流”的方案。

核心定位：

```text
这不是新的 gstack skill 实现层。
这是项目级 Agent 编排与能力演化层。
```

也就是说：gstack 已经提供经过验证的 skill 能力，项目层要做的是登记、路由、串联、交接、沉淀证据，并持续调教这套多 Agent 系统的运行方式。

产品用法：

```text
这个目录是 harness template source。
真实使用时，在目标项目目录运行 `pcm-harness`，把基础盘子安装进去并交给 Orchestrator。
安装过程应尽量少问用户：能检测就检测，能推断就推断，只有高风险或不可逆操作才问。
```

核心判断：

```text
gstack skill = 已验证能力源
Harness Template Source = 维护基础盘子、协议、模板和安装逻辑
Target Project Installation = 在真实项目中安装 harness 并生成项目专属状态和 Agent 覆盖
Foundation Readiness Agent = 检查 gbrain、gstack、项目协议、runtime、runner 是否就位
Foundation Remediation Agent = 根据自检报告补齐 harness 基础，不修业务代码
Code Context Agent = 用 GitNexus 建立当前代码事实、阅读路径、调用链和 diff 影响面；UA 只作可视化/onboarding/domain/fallback 增强
Skill Registry = 能力登记和触发策略
Workflow Recipes = 把 skills 串成项目流程
项目总控 Agent = 读取项目状态，理解用户输入，决定调用哪些 skills
Tuning Loop = 记录误路由、卡点、能力缺口和用户纠偏，持续优化 Agent 能力体系
gbrain = 长期记忆事实源；本地文档 = 可读快照和交接产物
```

它不是要在每个项目里复制一份 gstack。gstack 继续作为全局能力存在：

```text
~/.claude/skills/gstack
~/.codex-gstack
```

每个具体项目只需要放少量“项目级配置文件”，让 Codex/Claude 知道这个项目如何按多智能体流程工作。

## 推荐项目文件

放到每个要实战的项目根目录：

```text
CLAUDE.md
PROJECT_STATE.md
.gstack/project-state.json
.gstack/usage-runs/
HARNESS_PRODUCT_USAGE.md
GSTACK_SKILL_REGISTRY.md
WORKFLOW_RECIPES.md
ORCHESTRATOR_RUNBOOK.md
SYSTEM_TUNING_LOOP.md
MEMORY_ARCHITECTURE.md
GBRAIN_SCHEMA.md
docs/AGENT_ORCHESTRATOR.md
docs/AGENT_WORKFLOWS.md
docs/CODEX_START_PROMPT.md
docs/FOUNDATION_REMEDIATION_REPORT.md
docs/CODE_CONTEXT_REPORT.md
docs/CODEBASE_MAP_REPORT.md
.ai-context/project.json
.ai-context/FIELD_CONTRACT.md
scripts/ai-context-bridge.mjs
docs/PROBLEM_HANDLING_REPORT.md
docs/SYSTEM_TUNING_REPORT.md
.gstack/harness/bin/pcm-harness
.gstack/harness/bin/pcm-harness.ps1
.gstack/harness/bin/pcm-harness.cmd
.gstack/harness/bin/gstack-harness-record-run
.gstack/harness/bin/gstack-harness-usage-report
.gstack/harness/bin/gstack-harness-enable-report-timer
.gstack/harness/bin/gstack-harness-readiness
.gstack/harness/bin/gstack-harness-remediate
.gstack/harness/agents/TEAM.md
.gstack/harness/agents/problem-handling.md
```

可选增强：

```text
.gstack/project-state.json
docs/QUALITY_GATES.md
docs/RUNBOOK.md
docs/AGENT_DECISIONS.md
docs/QA_REPORT.md
docs/REVIEW_REPORT.md
docs/RELEASE_STATUS.md
docs/RETRO.md
.understand-anything/knowledge-graph.json
.understand-anything/domain-graph.json
.understand-anything/diff-overlay.json
```

## 总体链路

```text
想法
→ 已有代码项目先查 Code Context
→ 需求澄清
→ 产品/商业判断
→ 设计方向
→ 架构方案
→ 开发实现
→ 单测/lint/typecheck
→ 浏览器实测
→ Bug 修复
→ 代码评审
→ 安全审计
→ 性能检查
→ 文档同步
→ 发 PR
→ 合并部署
→ 线上 canary
→ 复盘
→ 后续维护
```

对应 gstack：

```text
node scripts/ai-context-bridge.mjs status
→ node scripts/ai-context-bridge.mjs refresh 如果 GitNexus stale 且需要准确图谱
→ GitNexus query/context/impact/detect-changes
→ 可选 /understand-dashboard / /understand-domain / /understand-onboard
→ /office-hours
→ /plan-ceo-review 或 /autoplan
→ /design-consultation / design-shotgun / plan-design-review
→ /plan-eng-review
→ 实现
→ /health
→ /browse 或 /qa
→ Windows-bound 功能派发到 Windows Test Host 取证
→ /review
→ /cso
→ /benchmark
→ /document-release
→ /ship
→ /land-and-deploy
→ /canary
→ /retro
→ /learn / context-save / context-restore
```

项目级编排层：

```text
pcm-harness
→ Foundation Readiness Check
→ Foundation Remediation
→ Code Context / GitNexus bridge artifacts
→ GStack Skill Registry
→ Orchestrator
→ Workflow Recipes
→ Project State / Evidence Gates
→ Machine-Readable State
→ Handoff Artifacts
→ System Tuning Loop
→ gbrain Long-Term Memory
→ GBrain Schema
→ Codex Start Prompt
```

## 建议阅读顺序

1. `HARNESS_PRODUCT_USAGE.md`：产品用法、安装命令、Agent 分层和覆盖策略。
2. `GSTACK_SKILL_REGISTRY.md`：全量 gstack skill 能力登记。
3. `WORKFLOW_RECIPES.md`：不同项目场景下如何串联 skills。
4. `ORCHESTRATOR_RUNBOOK.md`：每轮如何启动、自检、补齐、恢复和选择 recipe。
5. `SYSTEM_TUNING_LOOP.md`：如何持续优化系统运行和 Agent 能力体系。
6. `MEMORY_ARCHITECTURE.md`：gbrain 与项目文档的记忆分层和优先级。
7. `GBRAIN_SCHEMA.md`：gbrain 页面命名、标签和写入模板。
8. `FOUNDATION_CAPABILITY_AUDIT.md`：gbrain/gstack 已有能力审计和下一步优先级。
9. `ARCHITECTURE_ASCII.md`：整体架构图。
10. `PROJECT_LEVEL_SETUP.md`：在具体项目里要放什么。
11. `AGENT_ORCHESTRATOR.md`：项目总控 Agent 的职责和路由。
12. `AGENT_WORKFLOWS.md`：每个阶段 Agent 的组合方式。
13. `PROJECT_STATE_TEMPLATE.md`：项目状态文件模板。
14. `CLAUDE_MD_TEMPLATE.md`：项目级 CLAUDE.md 模板。

## 标准入口

目标项目里的用户路径只有一条：

```bash
cd /path/to/target-project
pcm-harness
```

它会先安装/升级 harness 基础盘子，再在目标项目目录打开 Codex，并把第一条 Orchestrator 接管提示作为初始 prompt 发出。安装、自检、状态渲染和 Codex 接管应当是一条标准流程。

标准流程会直接安装 required core + default capability agent team；遇到 warning、timeout、runner failure 或反复卡点时，必须派发 Problem Handling Agent，不需要先问用户要不要安排这个 agent。

维护/调试参数可以存在，但不是产品用法，不应出现在正常 onboarding 流程里。

## 模板源自测

维护 `gstack-multiagent` template source 后，运行：

```bash
bin/gstack-harness-self-test
```

它会在临时目录验证 fresh install、managed block、JSON parse、Agent team、Problem Handling/System Tuning report 模板、usage run 自动记录、usage feedback report 聚合、timer unit 生成，以及 re-init 不覆盖运行态。

真实使用反馈现在也有自动化落点：目标项目会写 `.gstack/usage-runs/*.json`，标准入口会自动记录 init 和 Codex session 生命周期，模板源可以用 `bin/gstack-harness-usage-report` 聚合所有已注册目标项目并生成 `docs/USAGE_FEEDBACK_REPORT.md`。需要重启后自动聚合时，运行一次 `bin/gstack-harness-enable-report-timer` 写入并启用 systemd user timer。

## 当前优先级

基于 `FOUNDATION_CAPABILITY_AUDIT.md`，下一步优先级是：

```text
0. 先跑 Foundation Readiness：确认 gbrain、gstack、项目协议、runtime、runner 的就位状态。
1. 如果 readiness 是 partial/blocked，先跑 Foundation Remediation 补齐基础。
2. 把核心协议 seed 到 gbrain。
3. 按 ORCHESTRATOR_RUNBOOK.md 跑一轮：每轮如何查 gbrain + gstack logs。
4. 用 PROJECT_STATE_TEMPLATE.md 的 gate evidence 跑一次真实状态更新。
5. 做一次 dry run，验证 readiness → remediation → gbrain → recipe → skill → artifact → memory 回路。
6. 最后再考虑 JSON/YAML cache。
```
