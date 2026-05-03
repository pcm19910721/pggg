# 项目级配置方式

## 结论

不需要在每个项目里安装一套 gstack。

项目层不是新的 gstack skill 实现层。项目层负责把全局 gstack skills 登记、路由、串联和沉淀证据，并持续调教多 Agent 系统的运行方式。

推荐结构：

```text
全局 gstack 能力：继续放在 ~/.claude/skills/gstack 和 ~/.codex-gstack
项目级 gstack 编排层：放少量说明文件到具体项目根目录
```

目标产品用法：

```bash
cd your-project
pcm-harness
```

这个命令应尽量自动完成：

```text
检测 gbrain / gstack readiness
识别项目类型、runtime、git、测试命令和部署线索
安装基础协议文件
生成 PROJECT_STATE.md
生成 CLAUDE.md 或 AGENTS.md
seed gbrain project pages
安装 GitNexus bridge: .ai-context/project.json + scripts/ai-context-bridge.mjs
生成默认 Agent charters / handoff
跑 Foundation Readiness 和必要的 Remediation
输出 next recommended recipe
```

到某个项目里实战时，只需要给那个项目加这几份“项目协议文件”：

```text
PROJECT_STATE.md
HARNESS_PRODUCT_USAGE.md
GSTACK_SKILL_REGISTRY.md
WORKFLOW_RECIPES.md
ORCHESTRATOR_RUNBOOK.md
SYSTEM_TUNING_LOOP.md
MEMORY_ARCHITECTURE.md
GBRAIN_SCHEMA.md
docs/AGENT_ORCHESTRATOR.md
docs/AGENT_WORKFLOWS.md
docs/CODE_CONTEXT_REPORT.md
.ai-context/project.json
scripts/ai-context-bridge.mjs
```

可选再加：

```text
CLAUDE.md 或 AGENTS.md
```

这些文件的作用不是安装 gstack，而是告诉 agent：

```text
这个项目当前状态是什么
这个项目可以调用哪些 gstack skills
不同场景怎么串联 skills
系统运行卡点怎么反馈成 Agent 能力优化
gbrain 和本地文档冲突时谁优先
gbrain 记忆页面怎么命名和打标签
做完后怎么更新状态
```

## 推荐目录结构

```text
your-project/
├─ CLAUDE.md
├─ PROJECT_STATE.md
├─ .ai-context/
│  ├─ project.json
│  └─ FIELD_CONTRACT.md
├─ scripts/
│  └─ ai-context-bridge.mjs
├─ HARNESS_PRODUCT_USAGE.md
├─ GSTACK_SKILL_REGISTRY.md
├─ WORKFLOW_RECIPES.md
├─ ORCHESTRATOR_RUNBOOK.md
├─ SYSTEM_TUNING_LOOP.md
├─ MEMORY_ARCHITECTURE.md
├─ GBRAIN_SCHEMA.md
└─ docs/
   ├─ AGENT_ORCHESTRATOR.md
   ├─ AGENT_WORKFLOWS.md
   ├─ FOUNDATION_REMEDIATION_REPORT.md
   ├─ CODE_CONTEXT_REPORT.md
   ├─ QA_REPORT.md
   ├─ REVIEW_REPORT.md
   └─ RELEASE_STATUS.md
```

## 第一次实战最小闭环

```text
进入项目根目录
→ 跑 .gstack/harness/bin/gstack-harness-readiness，确认 gbrain/gstack/项目协议/runtime/runner 是否就位
→ 如果 partial/blocked，跑 .gstack/harness/bin/gstack-harness-remediate 补齐 harness 基础
→ 回到 .gstack/harness/bin/gstack-harness-readiness 复检
→ 新建/更新 PROJECT_STATE.md
→ 读取 GSTACK_SKILL_REGISTRY.md、WORKFLOW_RECIPES.md、ORCHESTRATOR_RUNBOOK.md、SYSTEM_TUNING_LOOP.md、MEMORY_ARCHITECTURE.md、GBRAIN_SCHEMA.md
→ 已有代码项目先跑 Code Context：bridge status，必要时 GitNexus refresh
→ 让项目总控 Agent 判断当前阶段和 recipe
→ 选一个小功能或小 bug
→ /plan-eng-review
→ 实现
→ /health
→ 启动本地服务
→ /qa http://localhost:端口
→ /review
→ 更新 PROJECT_STATE.md
```

## 实战时需要准备的信息

```text
项目代码仓库
README
package.json / pyproject / go.mod 等项目入口文件
.env.example
本地启动命令
测试命令
lint 命令
typecheck 命令
本地 URL
测试账号或登录方式
部署平台信息
```

不要把真实密钥、真实密码写进这些文档。只写获取方式或测试环境说明。

## 适合第一个试点的任务

选“小而完整”的任务：

```text
新增一个设置页
修复登录 bug
给表单加校验
优化一个列表页
完成一个 API + 前端调用
修复一个线上报错
```

目标是验证：

```text
状态识别 → recipe 选择 → skill 调用 → 实测 → 证据沉淀 → 更新状态
```
