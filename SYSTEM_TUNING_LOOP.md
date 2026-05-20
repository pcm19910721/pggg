# System Tuning Loop

这份文档定义“持续调教”到底调什么。

结论：

```text
不调教 gstack skill 本体。
调教项目级多 Agent 系统的运行方式。
```

gstack skills 是底层已验证能力。系统调教层要解决的是：

```text
现在缺什么 Agent 能力？
现有 Agent 能力哪里不够？
哪些能力应该组合？
哪些能力边界应该拆开？
什么时候该自动跑？
什么时候该问用户？
哪些证据证明系统变好了？
```

## 调教对象

### 1. Agent 能力规划

判断是否需要新增 Agent：

```text
现有 skills 能力足够，但缺少稳定组合方式
某类任务反复出现，需要专门 Agent 承担
某个阶段交接反复失败，需要一个协调/验收 Agent
现有 Agent 责任太宽，导致输出不稳定
```

新增 Agent 前必须回答：

```text
这个 Agent 属于哪一层：required_core、default_replaceable、project_defined、还是 improvement？
这个 Agent 负责什么能力？
它调用哪些 gstack skills？
它不负责什么？
它输入是什么？
它输出什么 artifact？
它影响哪些 quality gates？
它和哪些 Agent 前后衔接？
成功和失败如何评估？
```

### 2. Agent 能力优化

优化已有 Agent 时，优先看这些问题：

```text
是否经常误判用户意图？
是否经常缺上下文？
是否输出不能被下一个 Agent 使用？
是否跳过真实验证？
是否把不该自己做的事做了？
是否重复调用无效 skill？
是否没有记录 evidence？
```

优化方式：

```text
调整 handoff contract
调整 workflow recipe
调整路由优先级
增加前置检查
增加后置验收
拆分 Agent 职责
合并重复 Agent
新增专门 Agent
```

### 3. Agent 协作关系

调教重点不是单个 skill，而是能力之间怎么配合：

```text
Product Agent 什么时候交给 Architecture Agent
Design Agent 什么时候必须接 Reality Test Agent
Build Agent 输出怎样才能让 QA Agent 接上
Review Agent 发现问题后回到哪个 Agent
Release Agent 如何阻断未过 gate 的部署
Maintenance Agent 什么时候沉淀 learnings
```

每条协作关系都应该定义：

```yaml
from_agent:
to_agent:
handoff_artifact:
required_evidence:
blocking_conditions:
fallback_agent:
tuning_signal:
```

### 4. 系统运行策略

系统调教还包括：

```text
什么时候自动推进
什么时候停下来问用户
什么时候强制阻断
什么时候允许 explicit skip
什么时候需要第二视角
什么时候进入 full workflow
什么时候只跑 report-only
```

这些策略应该写进：

```text
AGENT_ORCHESTRATOR.md
WORKFLOW_RECIPES.md
PROJECT_STATE_TEMPLATE.md
```

### 5. 能力缺口发现

如果一个问题反复出现，但现有 gstack skills 只能零散解决，就记录为 capability gap。

Capability gap 模板：

```yaml
gap_id:
observed_in:
symptom:
current_workaround:
why_current_agents_fail:
proposed_agent:
required_skills:
handoff_inputs:
handoff_outputs:
quality_gates:
success_metric:
priority:
```

示例：

```yaml
gap_id: foundation-readiness-agent
symptom: Orchestrator 在 gbrain/gstack/项目协议/runtime/runner 未就位时直接进入业务 recipe
current_workaround: 人工检查环境和文档是否齐全
why_current_agents_fail: Product/Build/QA/Release Agent 都默认基础能力已存在，没有统一开机自检职责
proposed_agent: Foundation Readiness Agent
required_skills:
  - setup-gbrain
  - gstack-upgrade
  - open-gstack-browser
  - setup-browser-cookies
  - setup-deploy
handoff_outputs:
  - readiness verdict
  - blockers
  - warnings
  - next recommended recipe
success_metric: zero business recipes start with foundation_readiness unknown or blocked
priority: high
```

基础补齐示例：

```yaml
gap_id: foundation-remediation-agent
symptom: 自检发现缺 gbrain seed、项目协议、runtime 命令或 runner 后，只报告问题但没有闭环补齐
current_workaround: 用户手动创建文档、查命令、配置浏览器或测试主机
why_current_agents_fail: Readiness 只诊断，Orchestrator 不应该亲自修环境，业务 Agent 不应该承担 harness 初始化
proposed_agent: Foundation Remediation Agent
required_skills:
  - setup-gbrain
  - gstack-upgrade
  - open-gstack-browser
  - setup-browser-cookies
  - setup-deploy
handoff_inputs:
  - readiness report
  - blocker list
  - project root
  - allowed remediation scope
handoff_outputs:
  - remediation report
  - files changed
  - seeded gbrain pages
  - remaining blockers
quality_gates:
  - Foundation Readiness
success_metric: every partial/blocked readiness report gets a fixed/partial/blocked remediation outcome
priority: high
```

发布准备示例：

```yaml
gap_id: release-readiness-agent
symptom: 用户说“合并并部署”时可能绕过 QA/review/security gates
current_workaround: Orchestrator 手动检查 gate
why_current_agents_fail: release flow 和 readiness check 没有独立成稳定能力
proposed_agent: Release Readiness Agent
required_skills:
  - health
  - qa-only
  - review
  - cso
  - benchmark
handoff_outputs:
  - readiness verdict
  - missing gates
  - explicit skips
success_metric: zero deploys without required evidence
priority: high
```

Windows 真实环境测试示例：

```yaml
gap_id: windows-reality-test-agent
observed_in:
  - Linux / WSL 开发环境
  - Windows 浏览器脚本、扩展、EXE、安装器、CLI 脚本验证
symptom: Linux Agent 无法真实验证 Windows-only 行为，却容易把通用检查误当作 Windows 通过
current_workaround: 手动在 Windows 机器运行脚本，或通过临时桥接让另一个 Agent 代测
why_current_agents_fail: Reality Test Agent 偏浏览器 QA，缺少 target OS、runner 类型和证据格式的稳定契约
proposed_agent: Windows Reality Test Agent
required_skills:
  - health
  - browse
  - qa
  - qa-only
  - pair-agent
handoff_inputs:
  - task_type: browser_qa | extension_qa | native_exe | cli_script | installer_qa
  - target_os: windows
  - artifact
  - runtime
  - steps
  - expected_result
  - evidence_required
handoff_outputs:
  - Windows QA verdict
  - runner assignment
  - screenshots
  - stdout / stderr / logs
  - exit codes
  - console / network status
  - process / window evidence
quality_gates:
  - Windows QA
  - Browser QA when user-visible browser surface exists
success_metric: every Windows-only release claim has Windows Test Host evidence
priority: high
```

## 重复工作升级协议

重复工作不是聊天偏好。它是系统证据。

状态：

```text
discovery -> reuse_required -> promotion_candidate -> approved_protocol
```

判定：

- 第一次出现：完成任务，记录样本、格式、字段、artifact、用户纠正。
- 第二次出现：必须先复用已知偏好，再询问缺失信息。
- 第三到第十次稳定出现：生成 promotion candidate。
- 第二次仍要求用户重复同一偏好：记为 system tuning failure。
- 判断用户当前话语时，必须先结合同一 session 最近 1-2 次 Codex 输出；如果用户是在纠正上一次输出却被当成独立新需求，记为 system tuning failure。

常见触发信号：

```text
按上次
还是那个格式
以后都这样
每天 / 每周 / 每月
别再问这个
同样流程再跑一遍
```

升级顺序：

```text
handoff rule -> workflow recipe -> agent capability -> scheduled candidate -> capability gap -> possible new skill
```

promotion candidate 模板：

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

system tuning failure 包括：

```text
第二次仍要求用户重复同一格式、字段、流程或周期
忽略上一轮用户纠正
完成重复任务但没有记录可复用 pattern
未获批准就启用周期性执行
能用 recipe / handoff rule 解决却直接新建 skill
```

定时约束：

只有 cadence、permissions、input source、output artifact、failure handling、monitoring path 和 user approval 都明确时，scheduled candidate 才能升级为 active recurrence。

## 调教 Agent 的职责

调教 Agent 不是“改 gstack skill 的 Agent”。它是系统教练和能力架构师。

职责：

```text
收集运行失败案例
归因是路由、交接、能力缺口、状态缺失还是用户偏好问题
提出新增 Agent 或优化 Agent 的建议
维护 capability gap backlog
维护 Agent 协作关系
维护 workflow recipes
维护 evidence/gate 规范
把高频失败转成系统规则
维护 Agent 分层：required core、default replaceable、project defined、improvement
```

不负责：

```text
不重写 gstack skill 内部逻辑
不直接替代 Product/Build/QA/Release Agent
不绕过用户批准做高风险策略变更
不把一次性偏好升级成全局规则
```

## 调教输入

每次运行后，总控应留下 tuning notes：

```yaml
run_id:
user_intent:
chosen_recipe:
agents_used:
skills_used:
where_it_stalled:
user_correction:
session_interaction_context:
  current_user_message_summary:
  previous_codex_output_summary:
  previous_2_codex_output_summary:
  user_message_role:
  inferred_delta:
  durable_candidate:
missing_context:
bad_handoff:
gate_issue:
capability_gap:
recommended_system_change:
```

这些 notes 不应该只靠口头记忆。目标项目里的自动化落点是：

```text
.gstack/usage-runs/<run_id>.json
.gstack/usage-runs/index.jsonl
```

模板源聚合命令：

```bash
bin/gstack-harness-usage-report
```

聚合报告默认输出到：

```text
docs/USAGE_FEEDBACK_REPORT.md
```

## 调教输出

调教 Agent 输出的不是“修复代码”，而是系统改进建议：

```yaml
change_type: routing | recipe | handoff | gate | new_agent | agent_optimization | user_question_policy
problem:
evidence:
recommendation:
files_to_update:
risk:
validation_plan:
rollback_plan:
```

## 决策原则

1. 反复出现的问题，优先系统化。
2. 一次性问题，先记录，不急着改规则。
3. 能通过 handoff contract 解决的，不新增 Agent。
4. 一个 Agent 责任过宽时，拆分。
5. 两个 Agent 总是连续出现且边界不清时，定义 recipe，不急着合并。
6. 高风险变更需要用户批准。
7. 调教结果必须可验证。
8. required core Agent 不能被项目删除，只能配置。
9. default replaceable Agent 可以被项目覆盖，但不能绕过 required core。
10. project defined Agent 必须声明 handoff、gate 和成功指标。

## 和 gstack skills 的关系

正确关系：

```text
gstack skill = 可调用能力
Agent = 负责某类目标的角色
Workflow recipe = 多个 Agent/skills 的运行顺序
Tuning loop = 优化 Agent 能力体系和运行方式
```

所以调教层会问：

```text
我们是否需要一个新的 Agent 来组织已有 skills？
某个 Agent 是否需要调用更多/更少 skills？
两个 Agent 的交接是否需要新 artifact？
某个 gate 是否需要更强 evidence？
某个 recipe 是否应该拆成两条？
```

不会默认问：

```text
这个 gstack skill 内部要不要重写？
```

## 周期节奏

每次运行：

```text
记录 tuning notes
```

每 5-10 次运行：

```text
归纳高频失败
更新 workflow recipes
更新 handoff contract
提出 capability gaps
```

每个阶段结束：

```text
跑 /retro
跑 /learn
审查 capability gap backlog
决定新增或优化哪些 Agent
```

重大系统改动前：

```text
写清 before/after
说明验证方式
保留回滚路径
让用户批准
```
