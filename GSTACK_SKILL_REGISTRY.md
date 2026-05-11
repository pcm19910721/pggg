# GStack Skill Registry

这份文档是项目级编排层的能力登记表。

它不重新定义 gstack skill 的内部行为，也不复制 gstack。它只回答五个问题：

```text
这个项目可以调用哪些 gstack skills？
每个 skill 适合解决什么问题？
调用前需要哪些上下文？
调用后应该产出什么证据或交接物？
它会影响哪些项目状态和质量门禁？
```

## 核心原则

1. gstack skill 是能力源，项目层只做编排。
2. `PROJECT_STATE.md` / `.gstack/project-state.json` 是项目事实源。
3. skill 负责执行和产出 artifact，总控 Agent 负责合并状态。
4. 所有 passing/failing/skipped 都要有证据，不能只写结论。
5. 调教 Agent 优化的是项目级多 Agent 系统：Agent 能力规划、协作关系、路由、交接和评估，不重写已验证 skill。

## Repeat Work Boundary

重复工作不自动等于新建 gstack skill。

优先升级顺序：

```text
handoff rule -> workflow recipe -> agent capability -> scheduled candidate -> capability gap -> possible new skill
```

只有当重复 pattern 稳定、跨项目可复用、边界清晰，并且不能通过项目级 recipe、handoff 或 Agent 能力表达时，才建议创建或修改 skill。

## Foundation Agents

Foundation agents 不是新的 gstack skill。它们是项目级 harness agent，用来检查和补齐 gbrain/gstack/项目协议/runtime/runner 的基础状态。

| Agent | Intent | Trigger | Uses Existing GStack / GBrain Capabilities | Outputs | Gates / State |
|---|---|---|---|---|---|
| Foundation Readiness Agent | 判断系统是否就位，能否让 Orchestrator 接管 | 新项目、跨机器、状态 unknown、用户问系统是否准备好 | gbrain query、gstack bin/logs、skill registry、workflow recipes、PROJECT_STATE、runner checks | readiness report、blockers、warnings、next action | Foundation Readiness |
| Foundation Remediation Agent | 根据自检报告补齐 harness 基础 | readiness partial/blocked、协议缺失、gbrain 空脑、runtime/runner 缺失 | `/setup-gbrain`、`/gstack-upgrade`、`/open-gstack-browser`、`/setup-browser-cookies`、`/setup-deploy`、gbrain pages/tags/links | remediation report、files changed、seeded pages、remaining blockers | Foundation Readiness / Project State |

边界：

```text
Foundation agents 可以修 harness 环境和项目协议。
Foundation agents 不修业务代码。
Foundation agents 不修改 gstack skill 本体。
```

## Code Context / GitNexus

Code Context Agent 是项目级 `project_defined` starter agent。它把 GitNexus 的当前代码事实转成后续 Product、Architecture、Build、Review、Maintenance Agent 都能复用的上下文。Understand Anything 保留为可选增强，只用于 dashboard、onboarding、domain graph 或 fallback。

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `node scripts/ai-context-bridge.mjs status` | 读取 GitNexus 索引状态并判断 stale | 任何已有代码任务开始前 | `.ai-context/project.json`、git repo | `.ai-context/gitnexus-status.json`、index summary fields | Code Context |
| `node scripts/ai-context-bridge.mjs refresh` | 建立或刷新 GitNexus 索引 | 未索引、stale 且任务依赖准确调用链/影响面 | git repo、GitNexus command、当前 HEAD | `.gitnexus/meta.json`、`.ai-context/gitnexus-index.md`、可选 gbrain index summary | Code Context |
| `gitnexus query` | 回答架构、入口、模块、业务流程、风险点 | 项目理解、产品判断、任务定位、review 前 | GitNexus repo alias、具体问题 | 相关模块、入口、调用链、风险点、建议测试 | Task Context |
| `gitnexus context` | 深入解释文件/函数/符号 | 小改、关键文件修改前、事故定位 | GitNexus repo alias、文件路径或符号名 | 上下游关系、内部结构、数据流、复杂度 | Task Context |
| `node scripts/ai-context-bridge.mjs postchange` | 分析当前 diff 和影响面，生成 handoff run note | PR 前、上线前、事故修复后 | GitNexus repo alias、git diff/base branch | `.ai-context/runs/<run-id>/detect-changes.txt`、`gbrain-note.md` | Review / Release |
| `gitnexus impact` | 查看高风险符号的上下游影响 | API/schema/auth/shared/billing/permissions/core-flow 改动 | GitNexus repo alias、符号名 | affected callers/processes、risk、suggested tests | Review / Release |
| `/understand-dashboard` | 可视化代码图谱或 diff overlay | 需要人工/agent 浏览架构图或影响面 | UA artifacts 或临时扫描上下文 | dashboard URL、可视化证据 | Optional Visual |
| `/understand-onboard` | 生成 onboarding guide | 新 agent 接手且需要长文导览 | UA knowledge graph 或 GitNexus 摘要 | reading path、architecture layers、hotspots | Optional Onboarding |
| `/understand-domain` | 提取业务域、业务流程和 domain graph | 业务系统、业务规则变化、事故涉及业务流程 | UA knowledge graph 或轻量扫描上下文 | `.understand-anything/domain-graph.json`、domain flow | Optional Domain |
| `/understand-knowledge` | 给项目知识库生成知识图谱 | 有 docs/knowledge 或 Karpathy-pattern wiki | wiki directory | knowledge graph、topic/entity relations | Optional Knowledge |

编排规则：

```text
已有代码项目：先 Code Context，再 Product Agent 的 /office-hours。
具体任务：先 GitNexus query/context 说清影响面，再 Build。
提交前：先 bridge postchange / GitNexus impact，再 Review / Security / Release。
事故复盘：Maintenance Agent 用 /investigate，Code Context Agent 用 GitNexus 定位模块和沉淀 checks/learnings。
GBrain 只保存稳定结论；临时细节留在 .gitnexus、.ai-context/runs、.understand-anything artifacts 或报告里。
```

## Registry 字段

后续如果转成 `.gstack/skills.json`，每个条目建议保留这些字段：

```yaml
id:
skill_command:
category:
intent:
primary_triggers:
required_context:
outputs:
quality_gates_touched:
permissions:
composes_with:
blocked_by:
handoff_summary:
known_failure_modes:
```

字段含义：

| 字段 | 说明 |
|---|---|
| `id` | 项目编排层内部稳定 ID |
| `skill_command` | 实际调用的 gstack skill |
| `category` | product / design / qa / release 等能力域 |
| `intent` | 这个 skill 解决的核心意图 |
| `primary_triggers` | 用户输入或项目状态触发条件 |
| `required_context` | 调用前必须准备的上下文 |
| `outputs` | 期望产物、报告、截图、PR、状态摘要 |
| `quality_gates_touched` | 可能更新或支撑的质量门禁 |
| `permissions` | 是否可改代码、是否可发版、是否只读 |
| `composes_with` | 常见前后衔接 skills |
| `blocked_by` | 不满足时不应调用的前置条件 |
| `handoff_summary` | skill 完成后必须交给总控的摘要 |
| `known_failure_modes` | 常见失败方式和系统调教素材 |

## Product / Planning

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/office-hours` | 澄清想法、需求、用户、问题价值 | 新想法、方向不清、是否值得做 | 项目背景、用户目标、已有方案 | design doc、问题定义、下一步任务 | phase: planning |
| `/plan-ceo-review` | CEO/创始人视角重审范围和战略 | 想做大、想挑战范围、产品决策 | 产品方案、目标用户、约束 | scope decision、战略判断、扩/缩范围建议 | phase: planning |
| `/autoplan` | 一次性跑 CEO、设计、工程、DX 评审 | 已有粗计划，想完整审一遍 | plan/design doc、项目背景 | reviewed plan、taste decisions、风险表 | phase: planning |
| `/plan-eng-review` | 锁定架构、数据流、边界、测试矩阵 | 开始编码前、跨模块/数据库/权限/API | 方案文档、代码结构、约束 | implementation plan、测试矩阵、风险清单 | phase: planning/build |
| `/plan-design-review` | 设计方案级审查 | UI/UX 方案确定前 | wireframe、DESIGN.md、页面目标 | 设计问题、修订建议、视觉风险 | phase: design |
| `/plan-devex-review` | 开发者体验方案审查 | API、SDK、CLI、文档体验相关 | 开发者流程、文档、安装路径 | DX score、摩擦点、改进计划 | phase: planning/design |

## Design / UX

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/design-consultation` | 建立设计系统和视觉方向 | 新产品、新品牌、新 UI 系统 | 产品定位、受众、竞品/参考 | `DESIGN.md`、字体/颜色预览 | phase: design |
| `/design-shotgun` | 多视觉方向探索和比较 | 想看多个设计方向 | brief、目标页面、设计约束 | variants、comparison board、选择记录 | phase: design |
| `/design-html` | 将已批准设计落成 HTML/CSS | 设计已定，需要生产级页面 | approved mockup、DESIGN.md、内容 | HTML/CSS artifact | phase: build/design |
| `/design-review` | 对已有页面做视觉 QA 并修复 | 页面不好看、AI 感强、视觉不一致 | 可运行页面、截图、源码 | 修复 diff、before/after 截图 | Browser QA / Design QA |

## Build / Guardrails / Meta Review

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/health` | 汇总测试、lint、typecheck、死代码等健康度 | 编码后、评审前、发布前 | 项目命令、包管理器、当前 diff | health score、失败项、趋势 | Health |
| `/careful` | 对破坏性命令加警戒 | 触生产、数据库、共享环境 | 操作范围、风险说明 | destructive command guard | Safety |
| `/freeze` | 限制可编辑目录 | 只允许改某个模块 | 允许目录、任务范围 | edit boundary | Safety |
| `/guard` | careful + freeze 组合 | 高风险环境、生产排障 | 操作目录、风险范围 | strict guard mode | Safety |
| `/unfreeze` | 解除编辑边界 | 需要扩大修改范围 | 当前 freeze 状态 | edit boundary cleared | Safety |
| `/claude` | 外部 Claude review/challenge/consult | 需要第二视角 | diff、问题、目标文件 | review/challenge/consult output | Review support |
| `/benchmark-models` | 跨模型对比任务效果、成本、速度 | 需要评估某类 Agent 任务该用哪个模型 | prompt、任务、评估规则 | latency/cost/quality comparison | System Tuning |
| `/gstack-upgrade` | 升级 gstack 工具链 | 需要更新 gstack | 当前安装模式 | upgrade result、版本信息 | Tooling |

## QA / Runtime Verification

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/browse` | 快速浏览器验证和截图 | 需要真实页面检查 | URL、目标操作、断言 | screenshots、DOM 状态、console/network 证据 | Browser QA |
| `/open-gstack-browser` | 打开可观看的真实浏览器 | 需要可视化接管浏览器 | URL、会话目标 | visible browser session | Browser QA |
| `/setup-browser-cookies` | 导入真实 Chromium cookies | 需要登录态 QA | 域名、cookie 选择 | authenticated browse session | Browser QA |
| `/qa` | 系统 QA、发现并修 bug、复测 | 功能完成、需要真实用户流验证 | dev server、核心路径、测试账号 | QA report、修复清单、复测证据 | Browser QA |
| `/qa-only` | 只产出 QA 报告，不修复 | 用户要求只报告 | URL、核心路径、账号 | health score、bug report、截图 | Browser QA |
| `/devex-review` | 实测开发者体验 | 文档、CLI、SDK、API onboarding | docs URL、安装命令、目标 persona | DX scorecard、截图、TTHW | DX |

### Cross-OS Runtime Hosts

这些不是 gstack skill，而是项目级 Reality Test Agent 可以调度的运行主机和
runner。它们用于补足 Linux / WSL 无法真实验证 Windows 行为的问题。

| Host / Runner | Responsibility | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| Windows Test Host | 在真实 Windows 环境运行测试任务 | 功能依赖 Windows、Edge、EXE、安装器、PowerShell/cmd 或系统 UI | artifact、target_os、runtime、steps、expected result | structured evidence bundle | Windows QA |
| Windows Test Coordinator | 读取 inbox / shared doc 并按 task_type 派发 runner | 多类 Windows 测试需要统一入口 | task_type、权限范围、超时、证据要求 | runner assignment、final verdict | Windows QA |
| browser-runner | Windows Chrome / Edge 页面实测 | 浏览器差异、下载、文件选择器、系统代理、证书 | URL、browser、profile、steps | screenshots、console/network status | Browser QA / Windows QA |
| extension-runner | 浏览器扩展和 native messaging 实测 | extension、content script、host permission、native app | extension package、browser、test page、steps | install result、screenshots、extension logs | Extension QA / Windows QA |
| native-exe-runner | EXE / 安装器 / 桌面窗口实测 | exe、msi、托盘、协议唤起、后台进程、服务 | binary path、install mode、steps、cleanup policy | exit code、process/window evidence、logs、screenshots | Native QA / Windows QA |
| cli-script-runner | Windows shell / runtime 版本矩阵实测 | PowerShell、cmd、Git Bash、Python/Node 版本差异 | commands、shell matrix、runtime versions | stdout/stderr、exit codes、version matrix | CLI QA / Windows QA |

原则：

```text
Linux / WSL Agent 可以开发、静态检查、跑通用浏览器 QA。
只要结论涉及 Windows-only 行为，必须有 Windows Test Host evidence。
不要把单个万能测试 Agent 作为所有测试入口；先按 task_type 路由到专用 runner。
```

## Review / Security / Performance

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/review` | 合并前代码质量和生产风险审查 | PR 前、merge 前、担心 diff 风险 | base branch、当前 diff、测试结果 | findings、blocking issues、merge verdict | Review |
| `/cso` | 安全审计 | 权限、登录、支付、数据、生产发布 | repo、diff、env docs、CI/CD | security report、blockers | Security |
| `/benchmark` | 性能基准和回归检测 | 性能敏感页面、PR 前后对比 | URL、baseline、页面路径 | perf report、Web Vitals、资源大小 | Performance |

## Release / Deploy / Operations

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/setup-deploy` | 配置部署平台和生产 URL | 第一次部署或部署信息缺失 | 平台、health endpoint、deploy commands | deploy config、CLAUDE.md 更新 | Deployment |
| `/landing-report` | 查看发布队列和版本 slot | 多 workspace、准备 ship 前 | git state、open PRs | queue report、version slot | Release readiness |
| `/ship` | bump 版本、CHANGELOG、commit、push、PR | 准备发 PR 或发布 | passing gates、diff、版本策略 | commit、PR、release notes | Release |
| `/land-and-deploy` | 合并 PR、等待 CI/部署、验证生产 | PR 已创建且 readiness 通过 | PR、CI、deploy config | merge result、deploy status | Deployment |
| `/canary` | 部署后线上监控 | 刚上线或需观察生产 | production URL、baseline | canary screenshots、errors、alerts | Deployment |
| `/document-release` | 发版后同步文档 | 代码已变更或发版后 | diff、README、ARCHITECTURE、CHANGELOG | updated docs | Docs |

## Maintenance / Memory / Continuous Improvement

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/investigate` | 根因调查，不猜修 | bug、报错、线上异常、回归 | logs、repro、diff、环境 | root cause、fix plan、verified fix | Maintenance |
| `/context-save` | 保存当前工作上下文 | 暂停、交接、长任务中断 | git state、当前决策、剩余工作 | checkpoint | State |
| `/context-restore` | 恢复上次上下文 | 继续上次工作 | saved checkpoint、branch | restored context summary | State |
| `/learn` | 管理项目 learnings | 查历史经验、沉淀模式 | project slug、query | learnings list/update/export | Memory |
| `/retro` | 工程复盘 | 周期结束、阶段结束、发布后 | commit history、质量结果 | retrospective、trend | Maintenance |
| `/plan-tune` | 调教提问敏感度和偏好 | 问题太多/太少、互动策略需优化 | AskUserQuestion logs、用户偏好 | tuning preferences、profile | System Tuning |
| `/setup-gbrain` | 设置跨机器记忆 | 需要长期记忆或多机同步 | remote policy、storage mode | gbrain setup result | Memory |

## Collaboration / Browser / Artifacts

| Skill | Intent | Trigger | Required Context | Outputs | Gates / State |
|---|---|---|---|---|---|
| `/pair-agent` | 远程 Agent 接入浏览器 | 多 Agent 协作或外部 Agent 需要浏览器 | access scope、browser session | pairing key、remote tab | Collaboration |
| `/make-pdf` | Markdown 输出高质量 PDF | 需要交付文档 | markdown file、format needs | PDF artifact | Docs |
| `/gstack` | 浏览器 QA 工具入口 | 需要直接使用 gstack browse 能力 | URL、操作、断言 | browser evidence | Browser QA |

## Gate Evidence Contract

每个影响质量门禁的 skill，完成后必须给总控 Agent 提供这类摘要：

```yaml
skill:
run_id:
status: passed | failed | partial | skipped
branch:
commit:
started_at:
finished_at:
artifacts:
quality_gates:
  health:
    status:
    command:
    exit_code:
    artifact:
    skip_reason:
blockers:
next_recommended_action:
system_tuning_notes:
```

总控 Agent 只能基于这个摘要更新 `PROJECT_STATE.md` 或 `.gstack/project-state.json`。

## Routing Priority

当用户输入命中多个 skill 时，按这个优先级处理：

0. Foundation readiness unknown/partial/blocked -> Foundation Readiness / Foundation Remediation
1. Code context missing/stale for an existing-code task -> bridge status；必要时 refresh
2. Production incident / bug / regression -> `/investigate` + relevant GitNexus query/context
3. Ship / deploy / merge -> bridge postchange / GitNexus impact + release readiness check，再决定 `/ship` 或 `/land-and-deploy`
4. User-visible feature verification -> `/health` + `/qa`
5. Pre-landing code risk -> GitNexus detect-changes / impact + `/health` + `/review`
6. Product / scope uncertainty -> existing code先查 Code Context，再 `/office-hours` 或 `/plan-ceo-review`
7. Architecture uncertainty -> relevant GitNexus query/context + `/plan-eng-review`
8. Design uncertainty -> design skills
9. System tuning / agent capability improvement -> context, learn, retro, plan-tune, benchmark-models

用户明确说“只报告不修”时，优先选择只读或 report-only skill。

用户明确说“不要联网/不要打开浏览器/不要修改代码”时，对应权限必须传递给 skill handoff。
