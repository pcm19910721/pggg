# Memory Architecture

这份文档定义项目级多 Agent 系统如何使用 gbrain 和本地记忆文档。

结论：

```text
gbrain 是长期记忆事实源。
项目内 Markdown 文档是可读快照、交接产物和本地运行协议。
如果两者冲突，以 gbrain 为准，并更新过期文档。
```

## 核心判断

不要给每个 Agent 做完全隔离的记忆库。

正确结构是：

```text
一个共享 gbrain
→ 多个 namespace / tag / view
→ 每个 Agent 读取自己的相关记忆
→ 总控 Agent 负责冲突判断和状态合并
```

原因：

1. 多 Agent 系统需要共享事实，否则每个 Agent 会形成自己的世界观。
2. Agent 可以有角色视图，但不能有互相冲突的长期事实。
3. 产品、架构、用户偏好、发布状态、失败案例都需要跨 Agent 复用。
4. 本地文档容易过期，gbrain 更适合作为长期、跨会话、跨项目的记忆源。

## gbrain 可以承担的记忆类型

按当前 gbrain CLI 能力，它可以承担这些记忆形态：

| gbrain 能力 | 适合存什么 | 在本系统里的用途 |
|---|---|---|
| pages | 结构化 Markdown 记忆页 | 架构决策、Agent 能力定义、长期偏好、项目原则 |
| tags | 记忆分类和过滤 | `agent:review`、`project:gstack-multiagent`、`type:capability-gap` |
| links / backlinks / graph | 记忆之间的关系 | capability gap 关联到 workflow、Agent、artifact |
| timeline | 随时间演进的事件 | 发布历史、事故、调教决策、Agent 能力升级 |
| files | 大文件或 artifact 附件 | 截图、报告、PDF、导出文件 |
| reports | 时间戳报告 | QA 摘要、review 摘要、retro 摘要、system tuning report |
| search / query / ask | 检索和问答 | 总控 Agent 启动时查相关长期记忆 |
| import / sync / export | 与 Markdown 目录同步 | 把本地 docs 摘要同步进 gbrain，或导出审计 |
| history / revert | 版本追踪和回滚 | 追踪关键记忆变更，必要时回退 |

所以 gbrain 不只是“聊天记忆”。它可以作为：

```text
长期知识库
Agent 能力档案
能力缺口 backlog
决策记录
artifact 索引
事件时间线
跨 Agent 共享上下文
```

## 应该进入 gbrain 的内容

| 内容 | 是否进 gbrain | 原因 |
|---|---|---|
| 用户长期偏好 | 是 | 会影响所有 Agent 的交互方式 |
| 系统级原则 | 是 | 例如“调教系统，不调教 gstack skill 本体” |
| Agent 职责边界 | 是 | 多 Agent 协作必须共享同一套边界 |
| Agent 能力缺口 | 是 | 后续新增/优化 Agent 的依据 |
| workflow 调整原因 | 是 | 否则只看到结果，看不到为什么改 |
| handoff 失败模式 | 是 | 跨 Agent 调教的核心素材 |
| 架构决策 | 是 | 长期影响实现和评审 |
| 质量门禁结论摘要 | 是 | 发布/回归判断需要跨会话复用 |
| QA/Review/Canary 报告全文 | 摘要进 gbrain，全文留 artifact | 全文太重，摘要和路径更有用 |
| 当前 session 临时上下文 | 通常不进 | 用 `PROJECT_STATE.md` 或 `/context-save` 更合适 |
| 一次性命令输出 | 不进 | 噪音大，复用价值低 |
| 未验证猜测 | 不进，或低置信度标记 | 避免污染长期记忆 |

## 与本地文档的冲突面

会冲突的主要是“事实”和“决策”，不是所有内容都会冲突。

| 本地文档 | 可能和 gbrain 冲突的内容 | 冲突时谁优先 |
|---|---|---|
| `PROJECT_STATE.md` / `.gstack/project-state.json` | phase、gate 状态、blockers、next action | gbrain 优先，除非用户本轮明确覆盖；gbrain query timeout 时临时使用本地状态 |
| `GSTACK_SKILL_REGISTRY.md` | skill 触发条件、Agent 能力映射、known failure modes | gbrain 中更新的系统调教决策优先 |
| `WORKFLOW_RECIPES.md` | recipe 顺序、阻断条件、handoff 要求 | gbrain 中高置信度 tuning decision 优先 |
| `SYSTEM_TUNING_LOOP.md` | capability gap、Agent 优化原则 | gbrain 中最新 tuning report 优先 |
| `AGENT_ORCHESTRATOR.md` | 路由优先级、冲突处理规则 | gbrain 中已批准的 orchestration decision 优先 |
| `docs/*REPORT.md` | 报告状态、结论是否过期 | 最新 artifact + gbrain 摘要优先 |

不太会冲突的内容：

```text
本地文档里的模板结构
历史报告全文
示例说明
命令说明
人类阅读顺序
```

这些更像说明书或 artifact，不是长期事实源。

## 记忆分层

### 1. Global Memory

范围：

```text
用户长期偏好
跨项目工作方式
gstack 编排原则
系统调教经验
常见失败模式
Agent 能力演化决策
```

存放：

```text
gbrain
```

使用者：

```text
Orchestrator
System Tuning Agent
所有阶段 Agent 的只读上下文
```

### 2. Project Memory

范围：

```text
项目目标
Code Context 稳定结论：overview、architecture、reading path、hotspots、GitNexus index summary；UA artifact index 只在可选增强被使用时记录
当前架构决策
质量门禁历史
发布历史
项目级 workflow recipes
项目级 capability gaps
```

存放：

```text
gbrain: canonical
PROJECT_STATE.md / docs: readable snapshot
.gstack/project-state.json: machine-readable snapshot
```

规则：

```text
如果 PROJECT_STATE.md 与 gbrain 冲突，以 gbrain 为准。
总控 Agent 应更新 PROJECT_STATE.md，让本地快照追上 gbrain。
如果 gbrain query 因 PGLite lock / timeout 暂时不可用，总控 Agent 可以用 PROJECT_STATE.md 和 .gstack/project-state.json 继续低风险恢复流程，但必须记录 warning；涉及 memory conflict、review、release 或生产动作时必须先恢复 gbrain 或明确 blocker。
```

### 3. Agent Role Memory

范围：

```text
某个 Agent 的职责边界
常用 handoff
该 Agent 常见失败模式
该 Agent 的能力缺口
该 Agent 与其他 Agent 的协作规则
```

存放：

```text
gbrain with agent_id / capability tags
```

例子：

```yaml
agent_id: reality-test-agent
capability: browser-qa
memory_type: failure_mode
content: QA 经常缺 critical paths，需要 Build Agent handoff 明确核心用户流。
confidence: 8
source: observed
```

### 4. Run / Session Memory

范围：

```text
这一次任务的上下文
当前 diff
刚做出的临时决策
尚未完成事项
```

存放：

```text
PROJECT_STATE.md
/context-save artifact
gbrain 如果值得长期沉淀
```

规则：

```text
不是所有 session 信息都进 gbrain。
只有可复用、会影响未来判断的信息才沉淀到 gbrain。
```

### 5. Artifact Memory

范围：

```text
设计文档
QA 报告
Review 报告
Release 状态
Canary 证据
Retro 报告
```

存放：

```text
repo docs / ~/.gstack/projects / PR artifacts
gbrain 记录摘要、路径和关键结论
```

规则：

```text
大文档不一定全文进入 gbrain。
gbrain 至少保存 artifact path、结论、状态、适用范围和过期条件。
```

## 命名空间建议

gbrain 里的记忆至少应能按这些维度过滤：

```yaml
scope: global | project | agent | run | artifact
project:
agent_id:
capability:
memory_type: preference | decision | failure_mode | capability_gap | handoff | gate | artifact_summary
source: user-stated | observed | inferred | review | retro
confidence:
created_at:
expires_at:
supersedes:
artifact_path:
```

具体页面命名、标签和模板见 `GBRAIN_SCHEMA.md`。

## Agent 记忆模型

系统不是每个 Agent 一个独立 brain，而是：

```text
gbrain
├─ global memory
├─ project memory
├─ agent: foundation-readiness
├─ agent: foundation-remediation
├─ agent: problem-handling
├─ agent: codebase-map
├─ agent: product
├─ agent: planning
├─ agent: architecture
├─ agent: design
├─ agent: build
├─ agent: reality-test
├─ agent: review
├─ agent: security-perf
├─ agent: release
├─ agent: maintenance
└─ agent: system-tuning
```

每个 Agent：

```text
读取 shared global/project memory
读取自己的 agent role memory
写入自己的 run findings
把长期有价值的结论交给 System Tuning Agent / Orchestrator 沉淀
```

总控 Agent：

```text
负责读全局和项目记忆
负责决定哪些记忆进入当前上下文
负责解决 gbrain 与本地文档冲突
负责把阶段 Agent 的结论合并进长期记忆
```

System Tuning Agent：

```text
负责分析跨 Agent 失败模式
维护 capability gaps
建议新增 Agent 或优化 Agent
维护协作关系和 workflow recipes
```

## 冲突处理

优先级：

```text
1. 用户本轮明确指令
2. gbrain 中高置信度、未过期记忆
3. PROJECT_STATE.md 当前状态
4. repo docs / historical artifacts
5. 模型推断
```

如果冲突：

```text
先指出冲突
默认采用 gbrain
必要时询问用户
更新过期 Markdown 文档
记录冲突解决结果到 gbrain
```

示例：

```text
PROJECT_STATE.md 写着 Browser QA passing。
gbrain 记录当前 commit 的 Browser QA failing，且有最新 QA report。
结论：以 gbrain 为准，Browser QA = failing，并更新 PROJECT_STATE.md。
```

## 写入规则

应该写入 gbrain：

```text
用户明确偏好
架构决策
Agent 能力缺口
重复出现的失败模式
workflow 调整原因
质量门禁关键结论
发布/事故复盘结论
```

不必写入 gbrain：

```text
一次性命令输出
临时 shell 路径
未验证猜测
大型日志全文
已在 artifact 中保存且没有长期复用价值的细节
```

## Agent Handoff Memory Contract

每个 Agent 完成后，给总控的 handoff 里应包含：

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

总控决定哪些 `gbrain_write_candidates` 真正写入 gbrain。

## 与本地文档的关系

本地文档仍然重要，但角色不同：

| 文档 | 角色 |
|---|---|
| `PROJECT_STATE.md` | 当前项目状态的人类可读快照 |
| `GSTACK_SKILL_REGISTRY.md` | 可用 gstack skills 的本地编排登记 |
| `WORKFLOW_RECIPES.md` | 项目运行配方 |
| `SYSTEM_TUNING_LOOP.md` | 系统调教原则 |
| `MEMORY_ARCHITECTURE.md` | gbrain 与本地记忆的优先级和分层 |
| `docs/*REPORT.md` | artifact 和证据 |

冲突时：

```text
gbrain wins.
docs get updated.
```
