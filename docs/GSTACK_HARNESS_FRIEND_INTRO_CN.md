# 给朋友看的 GStack Harness 图文介绍

> 配图说明：本文预留了 3 张 gpt-image-2 配图位。当前环境调用 gpt-image-2 时返回“额度不足”，所以图片文件尚未生成；配图提示词和重跑方式见文末。额度恢复后，生成图片会落到 `output/imagegen/`，本文图片链接会自动生效。

![GStack Harness 封面概念图](../output/imagegen/gstack-harness-cover.png)

## 一句话

GStack Harness 是给代码项目装上的一层“AI 项目操作系统”：它把项目状态、长期记忆、代码上下文、多 Agent 分工、测试评审和发布门禁串起来，让 AI 不只是临时聊天，而是能按项目流程持续接管工作。

## 它解决什么问题

平时用 AI 写代码，最烦的不是某一次回答不够聪明，而是系统性掉链子：

- 换一轮会话后，AI 忘了项目现在做到哪。
- 代码事实、长期决策、质量门禁散在不同地方。
- 产品、设计、架构、开发、测试、评审、发布各阶段靠人手动提醒。
- AI 经常跳过真实验证，直接给一个“看起来完成了”的答案。
- 项目越复杂，越需要一个能恢复上下文、能分工、能留证据的工作层。

GStack Harness 做的就是把这些散乱环节装成一套可复用的项目级流程。

## 这个仓库是什么

`gstack-multiagent` 不是一个业务应用，也不是新的 gstack skill 实现层。它是 **Harness Template Source**：维护基础盘子、协议、模板和安装逻辑。

真实使用时，在任意目标项目目录运行：

```bash
pcm-harness
```

它会把项目需要的协议文件、状态文件、Agent 团队说明、GitNexus 代码上下文桥、gbrain 项目记忆页和 readiness 检查装进目标项目，然后把项目交给 Orchestrator 接管。

## 用起来是什么感觉

你可以把它理解成：

1. 你打开一个项目。
2. 运行 `pcm-harness`。
3. Harness 自动检查 gbrain、gstack、GitNexus、项目协议和运行命令是否就位。
4. 如果缺东西，Foundation Remediation Agent 只补 harness 基础，不乱改业务代码。
5. 项目总控 Agent 读取 `PROJECT_STATE.md`、`.gstack/project-state.json`、gbrain 记忆和 workflow recipes。
6. 总控根据你的话决定该派哪个 Agent：产品、设计、架构、开发、QA、Review、安全性能、发布或维护。
7. 每个阶段都留下报告、状态、证据和下一步建议。

它的重点不是“多几个 Agent 名字”，而是每一轮工作都有状态、有门禁、有交接、有记忆。

![GStack Harness 工作流概念图](../output/imagegen/gstack-harness-flow.png)

## 核心部件

| 部件 | 作用 |
|---|---|
| `pcm-harness` | 用户入口，一条命令安装、升级、自检并交给 Orchestrator |
| Foundation Readiness | 检查 gbrain、gstack、项目协议、runtime、runner 是否可用 |
| Foundation Remediation | 基础不完整时自动补齐 harness 文件和项目记忆 |
| Orchestrator | 项目总控，读取状态和 recipe，决定下一步派谁 |
| GitNexus | 当前代码事实层，负责符号、调用链、执行流、影响面和 diff 分析 |
| gbrain | 长期记忆事实源，存项目状态、决策、门禁、交接和系统调教经验 |
| Workflow Recipes | 把 gstack skills 串成可执行流程 |
| Quality Gates | 让开发、QA、Review、安全、性能、发布都有证据再继续 |

## 多 Agent 分工

这套系统里，Agent 不是随便堆出来的。它们围绕项目生命周期分工：

- 产品 Agent：判断想法值不值得做，提炼需求。
- 设计 Agent：处理页面、交互、视觉方向。
- 架构 Agent：把实现方案、数据流、边界和测试策略想清楚。
- 开发 Agent：按现有代码风格实现功能。
- 真实测试 Agent：跑本地服务、浏览器 QA、截图、控制台和网络检查。
- Review Agent：做合并前代码审查。
- 安全/性能 Agent：做安全审计和性能回归检查。
- 发布 Agent：负责 PR、合并、部署和 canary。
- 维护 Agent：遇到 bug 先根因调查，再修复。
- Code Context Agent：用 GitNexus 给所有阶段提供代码事实和影响面。

Orchestrator 的价值在于：它知道什么时候该叫谁，什么时候不能跳过门禁。

## 记忆怎么处理

这套设计里，gbrain 是长期记忆事实源，本地 Markdown 是可读快照和交接产物。

它不会把整个源码树塞进 gbrain。源码事实交给 GitNexus，gbrain 只存长期有用的摘要、决策、状态、门禁和交接。

这样做的好处是：

- 当前代码事实不会被旧记忆污染。
- 长期决策不会随着会话丢失。
- 多个 Agent 共享同一套事实，不会各讲各的。
- 下次接手项目时，可以从项目记忆和状态文件恢复，而不是重新问一遍。

![代码上下文与长期记忆概念图](../output/imagegen/gstack-harness-memory-code.png)

## 最适合什么场景

它适合这些项目：

- 你想让 AI 长期参与，而不是只做一次性代码补丁。
- 项目需要产品、设计、工程、QA、Review、发布连续推进。
- 你经常跨会话、跨机器、跨 Agent 继续同一个项目。
- 你希望 AI 做事前知道项目状态，做事后留下证据。
- 你不想每次都重新解释“这个项目怎么工作、现在卡在哪、上线前要跑什么”。

## 它不是什么

- 它不是替代 gstack skills 的新 skill 层。
- 它不是业务框架，也不规定你用 React、Python 还是别的栈。
- 它不是把代码全量同步到长期记忆。
- 它不是跳过人类判断的自动发布机器人。
- 它更像项目级操作协议：让 AI 先读状态、按流程分工、真实验证、再更新记忆。

## 给朋友的直白版

如果用一句更生活化的话讲：

> 这个项目是在给 AI 装“项目管理脑子”。以前 AI 像一个临时外包，来了就问你项目是什么、改完也不一定测。现在它进项目先自检，知道该找哪个专业 Agent，知道代码事实从哪查，知道长期记忆存哪，做完还要留报告和下一步。

## 当前仓库的关键文件

| 文件 | 你可以怎么看 |
|---|---|
| `README.md` | 项目总览和推荐阅读顺序 |
| `HARNESS_PRODUCT_USAGE.md` | 产品用法和标准入口 |
| `WORKFLOW_RECIPES.md` | 不同用户意图如何变成 Agent 工作流 |
| `AGENT_ORCHESTRATOR.md` | 项目总控 Agent 的职责和路由规则 |
| `MEMORY_ARCHITECTURE.md` | gbrain 和本地文档怎么分工 |
| `ARCHITECTURE_ASCII.md` | 整体架构图 |
| `scripts/ai-context-bridge.mjs` | GitNexus 与 gbrain 的项目上下文桥 |
| `bin/pcm-harness` | 最外层一条命令入口 |
| `bin/gstack-harness-init` | 安装、自检、记录使用反馈和接管 Codex 的主流程 |

## 配图生成记录

本次使用 `imagegen` 的 CLI fallback 路径，模型指定为 `gpt-image-2`。实际 API 调用失败，错误为额度不足；没有生成任何图片文件。

额度恢复后，按 `output/imagegen/GSTACK_HARNESS_GPTIMAGE2_PROMPTS_CN.md` 里的命令重跑即可。
