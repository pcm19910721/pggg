# Foundation Capability Audit

这份文档回答一个前置问题：

```text
在决定项目级多 Agent 系统下一步前，我们是否研究了 gbrain 和 gstack 已有能力？
```

结论：

```text
gbrain 和 gstack 已经覆盖了大量底层能力。
当前系统不应该先造新格式、新同步、新执行器。
当前系统应该先把这些能力接起来，并把现有项目协议 seed 到 gbrain。
```

## gbrain 实际状态

本机检测结果：

```text
gbrain path: ~/.bun/bin/gbrain
version: 0.19.0
engine: pglite
database_path: ~/.gbrain/brain.pglite
pages: 0
chunks: 0
links: 0
tags: 0
timeline: 0
gstack gbrain_sync_mode: off
gstack brain sync queue: 0
```

含义：

```text
gbrain 已安装、可用，但当前是空脑。
gstack memory sync 没开。
项目级多 Agent 系统的长期记忆还没有 seed 进去。
```

## gbrain 已有能力

gbrain CLI / MCP 已提供：

| 能力 | 用途 |
|---|---|
| `pages` | 写入结构化 Markdown 记忆 |
| `tags` | 给记忆打 scope/project/agent/type 标签 |
| `links/backlinks/graph` | 建立决策、Agent、artifact、capability gap 之间的关系 |
| `timeline` | 记录事件演进 |
| `files` | 存大文件或 artifact 附件 |
| `reports` | 保存时间戳报告 |
| `search/query/ask` | 检索和问答 |
| `import/export` | 与 Markdown 目录互转 |
| `sync` | Git-to-brain 增量同步 |
| `history/revert` | 页面版本历史和回滚 |
| `jobs` | 后台任务队列 |
| MCP tools | `put_page`、`get_page`、`query`、`add_tag`、`add_link`、`sync_brain` 等 |

系统设计影响：

```text
不需要自己发明记忆数据库。
不需要自己发明 page/tag/link/timeline 模型。
不需要先做 JSON 事实库替代 gbrain。
应该直接使用 gbrain 的 pages/tags/links/timeline 作为长期知识结构。
```

## gstack 已有能力

本地 gstack 提供：

```text
43 个 SKILL.md
bin 工具集
browser daemon
Chrome extension
model overlays
gbrain setup / sync helpers
learn/timeline/question/review logs
skill template/generator/eval/test 体系
多 host 支持：Claude、Codex、Cursor、OpenClaw、Hermes、GBrain 等
```

关键现有机制：

| 能力 | 已有实现 |
|---|---|
| 多阶段专家技能 | `/office-hours`、`/plan-ceo-review`、`/plan-eng-review`、`/qa`、`/ship` 等 |
| 真实浏览器测试 | browse daemon，持久 Chromium，约 100-200ms 命令 |
| 安全浏览器配对 | `/pair-agent`，双 listener，scoped tokens |
| gbrain 安装 | `/setup-gbrain` |
| gbrain trust policy | per-remote read-write / read-only / deny |
| gstack memory sync | `gstack-brain-init`、`gstack-brain-sync` |
| 本地 learnings | `gstack-learnings-log/search` |
| timeline | `gstack-timeline-log/read` |
| review readiness | `gstack-review-log/read` |
| question tuning | `gstack-question-preference/log` |
| model benchmarking | `gstack-model-benchmark` |
| host support | `hosts/*.ts` |

系统设计影响：

```text
不应该重写 skill 能力。
不应该重写 gstack memory sync。
不应该重写 browse/QA/ship/review 流程。
应该把项目级 Orchestrator 建在 gstack 已有 skill 和 bin 之上。
```

## gstack 与 gbrain 的关系

需要区分两件事：

### 1. gbrain 本体

```text
长期知识库。
存 pages/tags/links/timeline/files/reports。
支持 query/search/ask。
```

### 2. gstack memory sync

```text
把 ~/.gstack/ 中 allowlisted 的 learnings、plans、reviews、retros、timeline 等同步到 private git repo。
如果使用 gbrain，这些同步内容可以被 gbrain 索引。
```

因此项目级系统应该：

```text
用 gbrain 存长期事实和系统知识。
用 gstack memory sync 同步 gstack 自己产生的 artifacts/learnings。
不要自己做第三套 memory sync。
```

## 对现有文档的修正

已有文档方向大体正确，但下一步优先级需要修正。

之前容易走偏的路线：

```text
先把 Markdown 转成 JSON
先做 .gstack/skills.json
先做 .gstack/workflows.json
```

更正确的路线：

```text
先 seed gbrain
再定义 Orchestrator 如何 query gbrain
再接入 gstack 原生 learn/timeline/review/question logs
最后才考虑是否需要 JSON cache
```

原因：

```text
gbrain 已经有 page/tag/link/query/version。
JSON 可以作为 cache 或导出格式，但不应成为新的长期事实源。
```

## 现在真正该做什么

### Step 0: Run Foundation Readiness

先由 Foundation Readiness Agent 检查：

```text
gbrain 是否可用、是否为空、是否能 query
gstack skills/bin/logs/browse/host 支持是否可用
项目协议文件是否齐全且不过期
PROJECT_STATE 是否包含 runtime、gate、artifact 字段
Windows Test Host、browser runner、deploy config 是否需要且可用
```

输出：

```text
ready | partial | blocked
blockers / warnings
next recommended action
```

如果是 `partial` 或 `blocked`，不要直接进入业务 recipe。

### Step 0.5: Run Foundation Remediation

Foundation Remediation Agent 根据 readiness report 补齐基础：

```text
调用 /setup-gbrain 或 seed gbrain 核心 pages
调用 /gstack-upgrade 或记录 tooling blocker
生成/修补 PROJECT_STATE、registry、recipes、CLAUDE/AGENTS
推断或标记 runtime commands
设置 browse/cookies/deploy 或生成对应 handoff
为 Windows-only 能力生成 Windows Test Host handoff
```

它只补 harness 基础，不修业务代码，不改 gstack skill。

### Step 1: Seed gbrain

把当前系统的核心原则写入 gbrain：

```text
system/orchestration-principles
system/agent-capability-model
system/tuning-decisions
system/capability-gap-backlog
project/gstack-multiagent/overview
project/gstack-multiagent/decisions
project/gstack-multiagent/memory-policy
```

并给页面打 tags：

```text
scope:system
scope:project
project:gstack-multiagent
type:decision
type:capability-gap
type:memory-policy
status:active
```

### Step 2: Connect Orchestrator to gbrain lookup

总控每轮启动先查：

```text
gbrain query "project gstack-multiagent orchestration current decisions"
gbrain query "agent capability gaps active"
gbrain query "memory policy gbrain local docs conflict"
```

### Step 3: Use gstack native logs instead of duplicating them

项目级系统应该读取或引用：

```text
gstack-learnings-search
gstack-timeline-read
gstack-review-read
gstack-question-preference
gstack-builder-profile
```

这些是现成状态来源。

### Step 4: Decide whether to enable gstack memory sync

当前：

```text
gbrain_sync_mode: off
```

选择：

```text
off: 本机单人试验，简单
artifacts-only: 推荐，先同步 plans/designs/reviews/retros/learnings
full: 后续多机/团队再考虑
```

### Step 5: Only then consider JSON cache

`.gstack/skills.json` 和 `.gstack/workflows.json` 可以做，但角色应该是：

```text
cache / export / validation input
```

而不是：

```text
canonical memory source
```

## Revised next action

下一步不应该是继续写更多静态协议文档。

下一步应该是：

```text
0. 跑 Foundation Readiness，拿到基础就位报告。
0.5. 如果 partial/blocked，跑 Foundation Remediation 补齐基础。
1. 将当前核心协议 seed 到 gbrain。
2. 按 ORCHESTRATOR_RUNBOOK.md 跑一轮，验证每轮如何查 gbrain + gstack logs。
3. 用 PROJECT_STATE_TEMPLATE.md 的 evidence 字段跑一次真实状态更新。
4. 做一次实际 dry run，验证 readiness → remediation → gbrain → recipe → skill → artifact → memory 回路。
```

## Non-goals

现在不要做：

```text
不要重写 gstack skill。
不要重写 gbrain 存储模型。
不要发明第三套同步机制。
不要把所有 Markdown 直接全文塞进 gbrain。
不要把 JSON 当长期事实源。
```
