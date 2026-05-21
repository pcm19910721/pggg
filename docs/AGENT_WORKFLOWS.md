# 阶段 Agent 工作流

本文件描述阶段视角的工作流。实际执行时，总控 Agent 应先读：

```text
GSTACK_SKILL_REGISTRY.md
WORKFLOW_RECIPES.md
PROJECT_STATE.md
```

然后再把这里的阶段 Agent 当作人类可读的分组。项目层不重写 gstack skill，只编排已有 skill。

## Foundation Readiness Agent

Layer: required_core

负责：开机自检，判断当前项目是否已经具备让 Orchestrator 接管的基础条件。

组合：

```text
检查 gbrain CLI / MCP / pages / tags / sync mode
→ 检查 gstack skills / bin / browse daemon / logs / host 支持
→ 检查项目协议文件和 PROJECT_STATE
→ 检查 runtime commands、quality gates、artifact paths
→ 检查浏览器、Windows Test Host、deploy 等外部 runner 是否需要且可用
```

产出：

```text
foundation readiness report
verdict: ready | partial | blocked
blockers / warnings
缺失的 gbrain pages、gstack 能力、项目协议、runtime 命令、runner
下一步建议：进入 Remediation Agent、Restore Context，还是直接选择业务 recipe
```

适用：

```text
新项目第一次接入 harness
gstack / gbrain 升级或跨机器迁移后
PROJECT_STATE 缺失或看起来过期
Orchestrator 不确定当前系统是否能安全接管
用户问“系统现在准备好了吗”
```

边界：

```text
Readiness Agent 只诊断，不补齐。
不修改 gstack skill。
不修业务代码。
不把缺证据的能力判定为 ready。
```

## Foundation Remediation Agent

Layer: required_core

负责：根据 Foundation Readiness Agent 的报告补齐基础环境、项目协议和交接材料。

组合：

```text
/setup-gbrain 如果 gbrain 缺失或未配置
→ seed gbrain 核心 pages / tags / links
→ /gstack-upgrade 如果 gstack 缺失或版本阻断
→ 生成或修补 PROJECT_STATE、registry、recipes、CLAUDE.md
→ 从项目入口文件推断 install/dev/test/lint/typecheck 命令
→ /open-gstack-browser 或 browse setup 检查浏览器能力
→ /setup-browser-cookies 如果 QA 需要登录态
→ /setup-deploy 如果 release 需要部署配置
→ 生成 Windows Test Host handoff 如果需要跨系统实测
```

产出：

```text
foundation remediation report
actions taken
fixed / partial / blocked verdict
remaining blockers
更新后的 PROJECT_STATE 和 artifact links
下一步建议：R0 restore、R5 verification、R10 release readiness 等
```

适用：

```text
Readiness verdict 是 partial 或 blocked
缺 gbrain seed、项目协议、runtime 命令、browser setup、runner handoff
用户希望“把系统补到能跑”
```

边界：

```text
Remediation Agent 可以修 harness 环境。
Remediation Agent 不修业务功能。
Remediation Agent 不改 gstack skill 本体。
高风险配置、真实凭证、部署动作必须停下来让用户批准。
```

## Problem Handling Agent

Layer: required_core

负责：处理运行链路中出现的问题、warning、timeout、反复失败和阻塞项，并决定是补救、降级、升级为 blocker，还是交给 System Tuning。

典型输入：

```text
gbrain_query_timeout / PGLite lock
gstack skill 调用失败或超时
runtime command missing / failing
browser / Windows / deploy runner 不可用
同类 warning 连续出现
handoff 缺 artifact 或 evidence
Orchestrator 不确定问题是否阻塞当前 recipe
```

处理流程：

```text
读取 PROJECT_STATE.md、.gstack/project-state.json、最近 report 和 triggering warning
→ 判断问题类别：foundation / runtime / runner / memory / workflow / skill invocation
→ 判断影响范围：低风险可降级、当前 recipe blocker、release blocker、system tuning issue
→ 能自动补的交给 Foundation Remediation Agent
→ 涉及 bug/root cause 的交给 Maintenance Agent 和 /investigate
→ 涉及系统反复卡点的交给 System Tuning Agent
→ 输出 problem handling report
→ 更新 PROJECT_STATE.md、.gstack/project-state.json 的 warnings/blockers/next action
```

gbrain timeout 的固定处理：

```text
重试一次
→ 仍 timeout：R0/R1 等低风险流程降级使用本地状态，同时记录 warning 和 tuning issue
→ review/release/ship/memory conflict 判断前仍 timeout：升级为 blocker，先处理 gbrain readiness
```

边界：

```text
Problem Handling Agent 可以修 harness 运行链路。
Problem Handling Agent 不直接修业务功能，除非 Maintenance Agent 已确认根因和修复范围。
Problem Handling Agent 不改 gstack skill 本体。
```

## Workspace Hygiene Agent

Layer: required_core

负责：把安装项目里的源文件、harness 本地产物、QA/runtime 产物、大文件资产、备份噪音和危险提交风险分清楚。

组合：

```text
读取 git status --short --ignored --untracked-files=all
→ 扫描目标项目文件大小和目录增长
→ 按 source_candidate / harness_owned / runtime_artifact / large_asset / secret_risk / backup_noise / unknown_review 分桶
→ 生成 docs/WORKSPACE_HYGIENE_REPORT.md 和 .gstack/workspace-hygiene.json
→ baseline 模式记录 QA 前状态到 .gstack/workspace-hygiene-baseline.json
→ delta 模式报告 QA 后新增文件和增长大小
→ gate 模式检查 staged 文件，阻断 secret/browser/runtime/harness 本地产物
```

产出：

```text
docs/WORKSPACE_HYGIENE_REPORT.md
.gstack/workspace-hygiene.json
.gstack/workspace-hygiene-baseline.json
docs/agents/workspace-hygiene.json
commit_gate: pass | warning | blocked
.gitignore recommendations
relocation recommendations
```

适用：

```text
QA / browse / Playwright / device test 后目录明显变大
git status 被缓存、截图、下载包、备份淹没
提交前需要确认 staged scope 是否包含 .env、cookie、数据库、浏览器 profile、大文件包
安装项目需要建立工作区卫生策略
```

边界：

```text
Workspace Hygiene Agent 不删除用户文件。
Workspace Hygiene Agent 不自动修改 .gitignore。
Workspace Hygiene Agent 不自动移动业务资产。
Workspace Hygiene Agent 不判断 APK/固件/图片是否一定该删除，只标记为 large_asset 并要求项目策略确认。
```

## Code Context Agent

Layer: project_defined

负责：维护当前代码事实，把代码结构、业务流程、阅读路径、风险热点和 diff 影响面变成所有后续 Agent 可复用的上下文。GitNexus 是默认事实源；Understand Anything 只作为 dashboard、onboarding、domain graph 或 fallback 增强。

组合一，项目第一次建立上下文：

```text
读取 .ai-context/project.json
→ node scripts/ai-context-bridge.mjs status
→ 如果未索引或 stale 且需要准确图谱：node scripts/ai-context-bridge.mjs refresh
→ GitNexus query/context 核心架构、入口、关键模块、业务流程和风险点是什么？
→ GitNexus query/context 新 agent 应该按什么顺序理解这个项目？
→ node scripts/ai-context-bridge.mjs sync-gbrain --dry-run
→ node scripts/ai-context-bridge.mjs sync-gbrain
→ 可选 /understand-dashboard、/understand-onboard、/understand-domain
```

组合二，任务开始前定位：

```text
node scripts/ai-context-bridge.mjs status
→ 如果 stale 且任务依赖调用链/影响面准确：node scripts/ai-context-bridge.mjs refresh
→ GitNexus query/context <任务相关问题>
→ GitNexus context <关键文件/符号>
```

组合三，提交前影响面：

```text
node scripts/ai-context-bridge.mjs postchange --scope all
→ 高风险符号：node scripts/ai-context-bridge.mjs postchange --scope all --impact SymbolName
→ GitNexus query/context 这次改动影响哪些组件、层、业务流程？
→ GitNexus query/context 这次最应该补哪些测试？
→ node scripts/ai-context-bridge.mjs sync-gbrain --dry-run
→ node scripts/ai-context-bridge.mjs sync-gbrain
→ 可选 /understand-dashboard，用可视化复核
```

产出：

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
任务上下游和建议测试
```

写入 GBrain：

```text
project/<project-id>/overview
project/<project-id>/state
project/<project-id>/foundation-readiness
project/<project-id>/architecture
project/<project-id>/reading-path
project/<project-id>/hotspots
project/<project-id>/quality-gates
project/<project-id>/handoff
project/<project-id>/gitnexus-index
project/<project-id>/code-context
artifact/<project-id>/impact-analysis/<date-or-run-id>
learnings / checks / anti-patterns 只写可复用结论
```

适用：

```text
第一次接手已有代码项目
Product Agent 跑 /office-hours 前需要基于真实代码判断方向
Build Agent 动手改代码前需要定位模块和调用链
Review / Release 前需要知道 diff 影响面
Maintenance Agent 处理 bug / incident 前需要从现象追模块
重大重构、业务域变化、交接前需要刷新代码上下文
```

边界：

```text
Code Context Agent 不直接修业务代码。
Code Context Agent 不把临时定位细节全部写进 GBrain；只沉淀稳定结论。
小改默认轻量查 GitNexus context，不默认 refresh。
提交前如果索引过期，先 refresh，再 postchange / impact。
```

## Product Agent

Layer: default_replaceable

负责：想法、需求、产品范围、MVP。

组合：

```text
Code Context Agent 查询当前项目已经支持什么、核心流程和风险热点是什么？如果是已有代码项目
→ /office-hours
→ /plan-ceo-review
```

产出：

```text
docs/PRODUCT_BRIEF.md
MVP 范围
Non-goals
关键假设
下一步建议
```

适用：

```text
新产品
新功能
用户需求不清楚
是否值得做
范围太大或太小
```

## Planning Agent

Layer: default_replaceable

负责：一次性把计划跑完整评审。

组合：

```text
/autoplan
```

产出：

```text
已审过的完整执行计划
需要用户拍板的 taste decisions
下一阶段建议
```

适用：

```text
已有粗略计划
想减少中间问答
想一次跑 CEO/设计/工程/DX 评审
```

## Design Agent

Layer: default_replaceable

负责：视觉方向、设计系统、UI/UX、页面落地。

组合一，从零设计：

```text
/design-consultation
→ /design-shotgun
→ /plan-design-review
→ /design-html
```

组合二，已有页面修复：

```text
/browse 或 /open-gstack-browser
→ /design-review
→ /qa
```

产出：

```text
DESIGN.md
设计方向
页面原型
视觉 QA 结论
修复后的页面
```

## Architecture Agent

Layer: default_replaceable

负责：架构、数据流、边界情况、测试矩阵。

组合：

```text
/plan-eng-review
```

产出：

```text
docs/IMPLEMENTATION_PLAN.md
架构图
数据流
边界情况
测试矩阵
风险清单
```

适用：

```text
开始写代码前
跨模块功能
涉及数据库、权限、队列、外部 API
有性能或稳定性风险
```

## Build Agent

Layer: default_replaceable

负责：实现代码。

组合：

```text
正常 Codex/Claude 编码
→ /health
```

产出：

```text
可运行代码
基础测试结果
实现说明
未完成事项
```

注意：

```text
Build Agent 不能替代 Reality Test Agent。
写完代码不等于功能真的可用。
```

## Reality Test Agent

Layer: default_replaceable

负责：真实运行和真实浏览器实测。

推荐完整流：

```text
/health
→ 跑单测 / 类型检查 / lint
→ 启动 dev server
→ /browse 打开页面做 smoke test
→ /qa 走核心用户流程
→ 修 bug
→ /qa 复测
→ 更新 PROJECT_STATE.md
```

只报告不修：

```text
/setup-browser-cookies 可选
→ /qa-only
```

产出：

```text
docs/QA_REPORT.md
截图证据
复现步骤
修复清单
复测结果
```

适用：

```text
功能写完了，确认真的能用
页面按钮、表单、跳转、登录态需要验证
需要捕获 console error / network error
需要像真人一样点一遍
```

### 跨系统实测原则

Linux / WSL 环境不能把 Windows-only 行为判定为已通过。只要功能依赖 Windows
本机能力，就必须派发到 Windows Test Host 做真实运行。

需要 Windows Test Host 的典型信号：

```text
EXE / MSI / 安装器
浏览器扩展、native messaging、协议唤起
系统文件选择器、下载目录、证书、代理、注册表
Windows Chrome / Edge 差异
PowerShell / cmd / Git Bash / Python 版本差异
桌面窗口、托盘、快捷键、进程、服务
```

分工：

```text
Linux Orchestrator Agent：拆任务、写 handoff、收 evidence、更新状态
Windows Test Coordinator：读取 inbox / shared doc，按 task_type 派发 runner
browser-runner：Windows Chrome / Edge 页面实测
extension-runner：扩展安装、权限、内容脚本、native messaging 实测
native-exe-runner：EXE / 安装器 / 桌面窗口 / 进程日志实测
cli-script-runner：PowerShell / cmd / Git Bash / Python 版本矩阵实测
```

交接必须结构化，至少包含：

```yaml
task_type: browser_qa | extension_qa | native_exe | cli_script | installer_qa
target_os: windows
artifact:
runtime:
steps:
expected_result:
evidence_required:
```

## Review Agent

Layer: default_replaceable

负责：合并前代码质量和生产风险。

组合：

```text
/health
→ /review
```

产出：

```text
docs/REVIEW_REPORT.md
风险清单
阻塞项
是否可合并
```

适用：

```text
准备提交 PR
准备 merge
想检查当前 diff
担心有隐藏生产风险
```

## Security/Perf Agent

Layer: default_replaceable

负责：安全和性能硬化。

组合：

```text
/cso
→ /benchmark
```

产出：

```text
docs/SECURITY_REPORT.md
docs/PERFORMANCE_REPORT.md
安全阻塞项
性能基准
回归风险
```

适用：

```text
重要上线
权限、支付、登录、数据安全相关功能
性能敏感页面
生产发布前硬化
```

## Release Agent

Layer: default_replaceable

负责：发版、PR、部署、线上验证。Release Agent 必须使用 `gh` CLI 处理 GitHub remote、CI、PR 和 workflow run；本地 repo 状态、diff、add、commit 仍使用 `git`。

组合：

```text
GitHub Workflow / Release Gate：gh auth status、gh repo view、gh pr status/view/create、gh run list/view/watch/log-failed
→ /setup-deploy 如果未配置
→ /ship
→ /land-and-deploy
→ /canary
→ /document-release
```

产出：

```text
PR
版本号
CHANGELOG
部署状态
docs/RELEASE_STATUS.md
GitHub Actions run URL 和当前 HEAD 绑定的 CI 结论
上线后 canary 结果
```

适用：

```text
准备发 PR
准备合并
准备部署
部署后确认线上健康
```

## Maintenance Agent

Layer: default_replaceable

负责：日常维护、线上问题、上下文恢复和复盘。

组合：

```text
/investigate
/context-save
/context-restore
/learn
/retro
```

产出：

```text
根因分析
修复记录
项目 learnings
复盘报告
可恢复上下文
```

适用：

```text
线上 bug
回归问题
隔天继续开发
跨分支或跨 workspace 交接
周期复盘
```

## 三档实用编排

新项目接入：

```text
Foundation Readiness Agent
→ Foundation Remediation Agent 如果 blocked/partial
→ Code Context Agent 建立项目上下文
→ Maintenance Agent / Restore Context
→ Product Agent 基于代码上下文跑 /office-hours，或 Architecture Agent
```

小改动：

```text
Foundation Readiness Agent 如果状态未知
→ Code Context Agent 轻量查文件/模块影响面
→ Build Agent
→ Review Agent
→ Release Agent
```

用户可见功能：

```text
Foundation Readiness Agent
→ Foundation Remediation Agent 如果需要
→ Code Context Agent 建立或刷新代码上下文
→ Product Agent
→ Architecture Agent
→ Build Agent
→ Reality Test Agent
→ Review Agent
→ Release Agent
```

重要上线：

```text
Foundation Readiness Agent
→ Foundation Remediation Agent 如果需要
→ Code Context Agent 建立或刷新代码上下文
→ Product Agent
→ Planning Agent
→ Design Agent
→ Architecture Agent
→ Build Agent
→ Reality Test Agent
→ Review Agent
→ Security/Perf Agent
→ Release Agent
→ Maintenance Agent
```
