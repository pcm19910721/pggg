# Harness Product Usage

这份文档定义 GStack Harness 的产品用法。

## Product Definition

```text
GStack Harness installs a mostly self-running project operating layer.
Required foundation agents keep the system ready.
Replaceable capability agents compose existing gstack skills.
Project agents specialize the workflow without modifying gstack.
```

中文定义：

```text
GStack Harness 是一个项目级操作层安装器。
它把 gbrain + gstack + 项目协议 + Agent 分工装进目标项目。
它尽量自动推断、自动补齐、自动运行；只在高风险或不可推断处问用户。
```

## Intended Use

真实使用方式不是在这个目录里手工编辑每个项目。

真实使用方式是：

```bash
cd /path/to/target-project
pcm-harness
```

然后 harness 在目标项目里自动安装基础盘子：

```text
PROJECT_STATE.md
.gstack/project-state.json
CLAUDE.md 或 AGENTS.md
GSTACK_SKILL_REGISTRY.md
WORKFLOW_RECIPES.md
ORCHESTRATOR_RUNBOOK.md
SYSTEM_TUNING_LOOP.md
MEMORY_ARCHITECTURE.md
GBRAIN_SCHEMA.md
docs/AGENT_ORCHESTRATOR.md
docs/AGENT_WORKFLOWS.md
docs/CODEX_START_PROMPT.md
docs/CODE_CONTEXT_REPORT.md
docs/CODEBASE_MAP_REPORT.md
.ai-context/project.json
.ai-context/FIELD_CONTRACT.md
scripts/ai-context-bridge.mjs
docs/PROBLEM_HANDLING_REPORT.md
docs/SYSTEM_TUNING_REPORT.md
.gstack/harness/agents/TEAM.md
.gstack/harness/agents/problem-handling.md
```

并初始化：

```text
gbrain project pages
project state
runtime commands
quality gates
agent overrides
foundation readiness report
next recommended recipe
```

## Template Source vs Target Project

有两种 workspace：

| Mode | Meaning | Git Required |
|---|---|---|
| `template_source` | 维护基础盘子、协议、模板和安装逻辑 | recommended |
| `target_project` | 真实业务项目，安装 harness 后运行 workflow | required for review/release gates |

当前 `gstack-multiagent` 目录是 `template_source`。

所以：

```text
not_git_repo 对 template_source 是 warning。
not_git_repo 对 target_project 的 review/release flow 是 blocker。
```

## Standard Flow

产品入口只有一条标准流程：

```bash
cd /path/to/target-project
pcm-harness
```

它不是一个让用户选择参数的工具。它应该自动完成检测、升级、自检、状态渲染和 Codex 接管。

当前本机建议把这个命令放进 PATH：

```bash
mkdir -p ~/.local/bin
ln -sf /home/adminpcm/gstack-multiagent/bin/pcm-harness ~/.local/bin/pcm-harness
```

Windows PowerShell 也可以使用同一个命令，但实际执行仍走 WSL。安装的 Windows shim 位于：

```text
C:\Users\Admin\AppData\Roaming\npm\pcm-harness.cmd
C:\Users\Admin\AppData\Roaming\npm\pcm-harness.ps1
```

PowerShell 用法：

```powershell
cd E:\2026workspace\gpt2img
pcm-harness
```

它会自动把 Windows 当前目录转换为 WSL 路径，例如：

```text
E:\2026workspace\gpt2img -> /mnt/e/2026workspace/gpt2img
```

阶段 1 不修改 gstack 本体，不要求把命令接入 gstack 分发。长期产品命令可以是：

```bash
pcm-harness
```

标准流程：

```text
1. 检查 gbrain / gstack foundation readiness
2. 自动检测项目类型、git、runtime、package manager、test/lint/typecheck 命令
3. 安装基础协议文件
4. 生成 PROJECT_STATE.md
5. 生成 .gstack/project-state.json 机器可读状态
6. 直接安装标准 Agent 团队 charters
7. 安装 project-defined starter Code Context Agent
8. 生成 CLAUDE.md 或 AGENTS.md
9. seed gbrain project pages
10. 跑 Foundation Readiness
11. 如果 partial/blocked，跑 Foundation Remediation
12. 如果出现 warning/timeout/failure，派发 Problem Handling Agent
13. 输出 next recommended recipe / agent
14. 自动记录 `.gstack/usage-runs/<run_id>.json`
15. 把目标项目登记到本机 harness registry，供模板源聚合真实使用反馈
16. 默认打开 Codex 并发送第一条 Orchestrator 接管提示
```

内部维护/调试开关可以存在于实现里，但它们不作为用户产品路径，不出现在正常 onboarding 指引里。

标准入口会先完成安装/升级、生成 `PROJECT_STATE.md`、`.gstack/project-state.json`、`.gstack/harness/agents/TEAM.md`、`.gstack/harness/bin/gstack-harness-readiness`、`.gstack/harness/bin/gstack-harness-remediate`、`.ai-context/project.json`、`scripts/ai-context-bridge.mjs`、`docs/FOUNDATION_READINESS_REPORT.md`、`docs/FOUNDATION_REMEDIATION_REPORT.md`、`docs/CODE_CONTEXT_REPORT.md`、`docs/CODEBASE_MAP_REPORT.md` 兼容指针、`docs/PROBLEM_HANDLING_REPORT.md`、`docs/SYSTEM_TUNING_REPORT.md`、`.gstack/usage-runs/` 和 `docs/CODEX_START_PROMPT.md`，然后在目标项目目录启动交互式 Codex，并把接管项目的第一条消息作为初始 prompt 发出。

如果标准流程没有走到 Codex 接管，视为 harness init 体验问题，应修 installer 或 readiness/remediation 规则，而不是让用户临时拼命令。

## Template Source Self-Test

这是模板源维护动作，不是目标项目用户路径。

```bash
cd /home/adminpcm/gstack-multiagent
bin/gstack-harness-self-test
```

自测覆盖：

```text
fresh install 文件齐全
CLAUDE.md managed block
.gstack/project-state.json JSON parse
Harness Agent Team 自动安装
Problem Handling / System Tuning report 模板
Usage run 自动记录
Usage feedback report 聚合
Usage report timer unit 生成
re-init 保留运行报告和运行态
```

## Template Source Health Gate

目标项目接入后，也要把 `template_source` 本身作为固定检查项。原因是目标项目运行的 installer、readiness、remediation 和 agent/team 模板都来自模板源；如果模板源没有 Git baseline、自测失败或 GitNexus stale，目标项目重跑 `pcm-harness` 只会继续复制有问题的流程。

模板源健康检查：

```bash
cd /home/adminpcm/gstack-multiagent
git status --short
bin/gstack-harness-self-test
npx gitnexus status
```

目标项目健康检查：

```bash
cd /path/to/target-project
pcm-harness --no-start-codex
.gstack/harness/bin/gstack-harness-readiness --target .
```

建议顺序：

```text
1. 先修模板源：self-test 通过，GitNexus up-to-date，harness 逻辑已提交。
2. 再回目标项目重跑 pcm-harness，让目标项目拿到最新 installer/readiness/remediation。
3. 目标项目自己的 runtime 依赖、业务测试失败、真实凭证和部署问题，仍在目标项目处理。
```

## Usage Feedback Automation

真实使用反馈默认自动落在目标项目：

```text
.gstack/usage-runs/<run_id>.json
.gstack/usage-runs/index.jsonl
```

`pcm-harness` 每次运行都会自动记录一次 `harness_init` event，并把目标项目追加到本机 registry。标准入口启动 Codex 时，还会围绕 Codex 子进程自动记录 `codex_session_start` 和 `codex_session_end`：

```text
~/.gstack-harness/projects.jsonl
```

Agent 在真实 session 结束时应调用目标项目里的 recorder：

```bash
.gstack/harness/bin/gstack-harness-record-run \
  --event session_end \
  --status completed \
  --recipe "R5 User-Visible Feature Verification" \
  --where-stalled "browser runner unavailable" \
  --capability-gap "windows-reality-test-agent"
```

模板源维护者聚合真实使用反馈：

```bash
cd /home/adminpcm/gstack-multiagent
bin/gstack-harness-usage-report
```

启用重启后自动聚合：

```bash
cd /home/adminpcm/gstack-multiagent
bin/gstack-harness-enable-report-timer
```

这个命令会写入：

```text
~/.config/systemd/user/gstack-harness-usage-report.service
~/.config/systemd/user/gstack-harness-usage-report.timer
~/.config/gstack-harness/gstack-harness-usage-report.sh
```

默认行为：

```text
用户登录后 timer 自动启动
开机 5 分钟后先跑一次
之后每 1 小时聚合一次
错过的 timer 用 Persistent=true 补跑
```

如果需要电脑开机后、用户未登录也运行：

```bash
bin/gstack-harness-enable-report-timer --enable-linger
```

默认输出：

```text
docs/USAGE_FEEDBACK_REPORT.md
```

这一步不是让人翻日志，而是自动统计：

```text
warning / blocker 频次
recipe 频次
卡点位置
用户纠正
capability gaps
最近运行记录
推荐模板源改动方向
```

## Existing File Strategy

`pcm-harness` 默认会统一已有 harness 文档，而不是散落 `.new` 文件。

规则：

```text
Harness 协议文件存在时：原文件备份成 .bak-<timestamp>，然后升级为 template source 的当前版本。
PROJECT_STATE.md 存在时：原文件备份，重新渲染当前 readiness/runtime/gate 状态。
.gstack/project-state.json 存在时：原文件备份，刷新 readiness/runtime/protocol 状态，同时保留 phase、next recommendation、warnings、problem_handling、system_tuning 等运行态。
CLAUDE.md 存在时：保留用户原内容，在 GSTACK_HARNESS managed block 内插入或更新 harness 规则。
docs/FOUNDATION_READINESS_REPORT.md 存在时：原文件备份，写入最新自检报告。
docs/FOUNDATION_REMEDIATION_REPORT.md 缺失时：写入 remediation 报告模板；runner 执行时更新真实动作和剩余 blocker。
docs/CODEX_START_PROMPT.md 存在时：原文件备份，写入最新 Codex 初始接管 prompt。
docs/CODE_CONTEXT_REPORT.md 缺失时：写入 Code Context 报告模板；已存在时保留运行 artifact。
docs/CODEBASE_MAP_REPORT.md 缺失时：写入旧名兼容指针。
docs/PROBLEM_HANDLING_REPORT.md 缺失时：写入问题处理报告模板；已存在时保留运行 artifact。
docs/SYSTEM_TUNING_REPORT.md 缺失时：写入系统调优报告模板；已存在时保留运行 artifact。
```

managed block：

```markdown
<!-- GSTACK_HARNESS_START -->
...
<!-- GSTACK_HARNESS_END -->
```

预览、冲突保留和 install-only 只是维护场景，不是标准用户流程。

## Low-Human-Input Policy

Harness 默认少问用户。

优先级：

```text
能检测就检测
能推断就推断
能默认就默认
能记录 warning 就先记录
能后续 remediation 就后续补齐
只有高风险、不可逆、凭证、部署、破坏性操作才问用户
```

必须问用户的情况：

```text
真实部署或合并
需要生产凭证或登录 cookies
会覆盖现有项目规则
会删除、迁移、重写大量文件
gbrain 与本地文档冲突且会改变下一步
项目类型无法可靠判断且会影响执行命令
```

gbrain 可用但查询遇到 PGLite lock / timeout 时，不默认打断低风险接管流程：

```text
1. 重试一次。
2. 仍失败时记录 warning：gbrain_query_timeout 或 gbrain_query_failed。
3. 本轮降级使用 PROJECT_STATE.md、.gstack/project-state.json 和本地 docs。
4. 如果后续 recipe 依赖长期记忆冲突判断、review、release 或生产动作，再把它提升为 blocker。
```

## Agent Layers

基础盘子里的 Agent 分四层。

### 1. Required Core Agents

这些 Agent 必须存在，不能删除。

```text
Foundation Readiness Agent
Foundation Remediation Agent
Problem Handling Agent
Orchestrator Agent
System Tuning Agent
Memory / GBrain Agent
```

规则：

```text
required agents 不能被项目移除。
required agents 可以被项目配置。
required agents 不能改 gstack skill 本体。
required agents 的职责边界由 harness 维护。
required agents 初始化时直接安装，不需要询问用户。
```

Problem Handling Agent 专门处理运行链路中的问题：

```text
gbrain query timeout / PGLite lock
gstack skill 调用失败
runtime command missing / failing
runner unavailable
同类 warning 反复出现
handoff 缺 evidence
workflow 卡在同一阶段
```

规则：

```text
Orchestrator 发现问题后必须派发给 Problem Handling Agent。
低风险问题可以边降级边记录；高风险问题必须转 blocker。
Problem Handling Agent 先调查根因和影响范围，再决定调用 Foundation Remediation、Maintenance、System Tuning 或具体 gstack skill。
```

### 2. Default Replaceable Capability Agents

这些 Agent 默认提供，但目标项目可以替换职责、handoff、gate 或 naming。

```text
Product Agent
Planning Agent
Design Agent
Architecture Agent
Build Agent
Reality Test Agent
Review Agent
Security/Perf Agent
Release Agent
Maintenance Agent
```

默认实现调用 gstack 已有 skills：

```text
/office-hours
/plan-ceo-review
/autoplan
/plan-eng-review
/design-*
/health
/browse
/qa
/review
/cso
/benchmark
/ship
/land-and-deploy
/canary
/investigate
/learn
/context-save
/context-restore
```

替换规则：

```text
可以覆盖 charter。
可以覆盖 handoff inputs/outputs。
可以覆盖 gate requirements。
可以新增项目专属 trigger。
不可以重写底层 gstack skill。
不可以绕过 required core agents。
```

### 3. Project-Defined Agents

目标项目可以新增自己的 Agent。Harness 默认安装一个 starter project-defined agent：

```text
Code Context Agent
```

Code Context Agent 负责维护 GitNexus 当前代码事实，并把项目概览、架构、阅读路径、业务域、风险热点和 diff 影响面交给 Product / Architecture / Build / Review / Maintenance Agent 复用。Understand Anything 只作为 dashboard、onboarding、domain graph 或 fallback 增强。

默认实现调用：

```text
node scripts/ai-context-bridge.mjs status
node scripts/ai-context-bridge.mjs refresh
gitnexus query
gitnexus context
node scripts/ai-context-bridge.mjs postchange
gitnexus impact
可选 /understand-dashboard
可选 /understand-onboard
可选 /understand-domain
可选 /understand-knowledge
```

标准顺序：

```text
已有代码项目：Code Context Agent 先查 GitNexus 代码事实，再 Product Agent 跑 /office-hours。
具体任务：Code Context Agent 先定位模块和调用链，再 Build Agent 改代码。
提交前：Code Context Agent 跑 bridge postchange / GitNexus impact，再 Review / Release。
事故：Maintenance Agent 跑 /investigate，Code Context Agent 辅助定位根因模块和影响面。
```

目标项目还可以新增更多自己的 Agent。

例子：

```text
Code Context Agent
Data Migration Agent
Windows Test Coordinator
Browser Extension QA Agent
Billing Compliance Agent
Customer Import Agent
Docs Publishing Agent
```

新增 Agent 必须声明：

```yaml
agent_id:
layer: project_defined
responsibility:
non_goals:
gstack_skills_used:
inputs:
outputs:
quality_gates:
handoff_from:
handoff_to:
success_metric:
```

### 4. Improvement Agents

这些 Agent 负责让系统越跑越顺。

```text
System Tuning Agent
Capability Gap Agent
Agent Evaluation Agent
Model Benchmark Agent
```

它们输出系统改进，不直接修业务功能：

```text
routing update
handoff update
gate update
new agent proposal
agent optimization
model/task fit recommendation
```

## Override Mechanism

目标项目覆盖 harness 默认 Agent 的建议位置：

```text
.gstack/harness/agents/TEAM.md
.gstack/harness/agents/problem-handling.md
.gstack/harness/agents/*.md
.gstack/harness/overrides.yaml
.gstack/harness/runtime.yaml
.gstack/harness/gates.yaml
```

gbrain 中对应页面：

```text
project/<project-id>/agent-overrides
project/<project-id>/workflow-overrides
project/<project-id>/quality-gates
agent/<agent-id>/charter
agent/<agent-id>/handoff
```

优先级：

```text
1. 用户本轮明确指令
2. 项目 override
3. gbrain 中 active/high-confidence memory
4. harness 默认模板
5. 模型推断
```

## Installation Output

`pcm-harness` 完成后应该输出：

```yaml
status: ready | partial | blocked
project_id:
workspace_mode: template_source | target_project
project_state_json:
agent_team:
code_context_agent:
usage_run:
usage_runs:
usage_report_timer:
files_written:
gbrain_pages_seeded:
gbrain_query: ready | timeout | failed | not_run
problem_handling_required:
agents:
  required:
  replaceable:
  project_defined:
code_context:
  status: missing | ready | stale | skipped
  provider: gitnexus
  config:
  gitnexus_status:
  gitnexus_index:
  runs:
  optional_ua_artifacts:
gates:
  foundation_readiness:
  health:
  browser_qa:
  review:
  release:
blockers:
warnings:
next_recommended_recipe:
```

## Non-Goals

```text
不复制 gstack skill。
不修改 gstack skill。
不发明第三套长期记忆库。
不要求用户手动填完整个系统。
不默认自动部署、合并、删除或迁移。
```

## V0 Success Criteria

```text
在任意目标项目里运行 `pcm-harness`，就能安装 harness 基础盘子。
安装后 Orchestrator 能知道项目在哪、下一步该做什么、缺什么证据。
gbrain 有项目记忆。
gstack skills 仍是唯一能力源。
用户只在高风险或不可推断处参与。
```
