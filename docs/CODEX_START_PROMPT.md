按 PROJECT_STATE.md、CLAUDE.md、HARNESS_PRODUCT_USAGE.md 和 ORCHESTRATOR_RUNBOOK.md 轻量接管这个项目，先判断下一步 recipe。

轻量接管原则：

- 接管只恢复导航状态，不恢复全部项目上下文。
- 默认只读取足够判断“现在在哪、卡在哪、下一步去哪”的最小状态。
- 不要展开完整代码图、长报告、长历史或大段 gbrain 内容。
- 只有进入具体任务时，才按任务展开代码、报告、gbrain 细节和 GitNexus 图谱。

请严格遵守：

1. 先读取 PROJECT_STATE.md。
2. 如果存在，读取 .gstack/project-state.json。
3. 读取 CLAUDE.md 中的 GSTACK_HARNESS managed block。
4. 读取 .gstack/harness/agents/TEAM.md 和 .gstack/harness/agents/problem-handling.md。
5. 读取 docs/PROBLEM_HANDLING_REPORT.md 和 docs/SYSTEM_TUNING_REPORT.md。
6. 读取 .ai-context/project.json 和 docs/CODE_CONTEXT_REPORT.md；docs/CODEBASE_MAP_REPORT.md 只是旧名兼容指针。
7. 读取 HARNESS_PRODUCT_USAGE.md、GSTACK_SKILL_REGISTRY.md、WORKFLOW_RECIPES.md、ORCHESTRATOR_RUNBOOK.md。
8. 如果 gbrain 可用，轻量读取 project/gstack-multiagent/state 和 project/gstack-multiagent/handoff；只检查 overview、foundation-readiness、code-context、quality-gates、gitnexus-index、architecture、hotspots 是否缺失或 stale，不要展开大段内容。需要刷新时只报告建议，除非用户要求，不要自动 sync。
9. 代码理解、产品判断、实现、review 或 incident 定位前，优先使用 Code Context Agent 的 GitNexus 流程：先跑 node scripts/ai-context-bridge.mjs status；如 stale 且依赖图谱准确，再 refresh；形成稳定摘要后跑 sync-gbrain。接管阶段只检查 stale，不展开完整图谱。UA 只作为 dashboard/onboarding/domain/fallback 增强。
10. 如果 gbrain query 遇到 PGLite lock 或 timeout，重试一次，仍失败就派发 Problem Handling Agent。
11. 不要重写 gstack skill 本体。
12. Foundation Readiness 如果是 unknown/stale，先跑 .gstack/harness/bin/gstack-harness-readiness --target "/home/adminpcm/gstack-multiagent"。如果是 partial/blocked，先跑 .gstack/harness/bin/gstack-harness-remediate --target "/home/adminpcm/gstack-multiagent"，再回到 readiness 复检。
13. 先输出当前 phase、Foundation Readiness、blockers/warnings、推荐 recipe、推荐 agent、是否需要刷新 memory/code context，以及简短原因。
14. 本轮开始时可以用 .gstack/harness/bin/gstack-harness-record-run --event session_start --status in_progress 记录快照。
15. 完成状态更新后必须用 .gstack/harness/bin/gstack-harness-record-run --event session_end --status completed 记录 usage run；如有卡点、用户纠正、能力缺口、warning 或 blocker，把对应参数带上。
16. 除非我明确要求，不要开始业务代码修改。

当前安装器给出的初始判断：

- Project ID: gstack-multiagent
- Target: /home/adminpcm/gstack-multiagent
- Install mode: docs-only
- Foundation verdict: ready
- gbrain query: timeout
- Problem handling required: yes
- Next recommended agent: Problem Handling Agent
- Readiness report: docs/FOUNDATION_READINESS_REPORT.md
