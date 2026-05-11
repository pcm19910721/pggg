# Repeat Work Promotion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a project-installable repeat-work promotion protocol to the harness so repeated user instructions become reusable project protocol.

**Architecture:** This is a protocol and template propagation change. It updates source docs, installed managed instructions, project state templates, and Orchestrator contracts without changing gstack skill internals or enabling automatic scheduling.

**Tech Stack:** Markdown protocol docs, YAML agent manifest, Bash installer dry-run verification, GitNexus change detection.

---

### Task 1: Add The Local Agent Rule

**Files:**
- Modify: `AGENTS.md`

**Step 1: Inspect the existing managed GitNexus block**

Run:

```bash
sed -n '1,80p' AGENTS.md
```

Expected: The file contains the GitNexus instruction block at the top.

**Step 2: Add a repeat-work rule before or after the GitNexus block**

Add a short section titled `Repeat Work Promotion` that says:

```markdown
## Repeat Work Promotion

- Treat repeated user instructions as system evidence, not chat trivia.
- First occurrence is discovery; second occurrence must reuse known preferences before asking again.
- If the user has to repeat the same format, field list, workflow, or schedule twice, record it as a system tuning failure.
- Promote stable repeated work in this order: handoff rule, workflow recipe, agent capability, scheduled candidate, capability gap, possible new skill.
- Do not silently enable recurring work. Create a scheduled candidate until cadence, permissions, outputs, failure handling, monitoring, and user approval are explicit.
```

**Step 3: Review the top of the file**

Run:

```bash
sed -n '1,120p' AGENTS.md
```

Expected: The rule is visible and does not obscure the GitNexus safety requirements.

### Task 2: Propagate The Rule To Installed Targets

**Files:**
- Modify: `CLAUDE_MD_TEMPLATE.md`

**Step 1: Locate the Project Orchestrator section**

Run:

```bash
rg -n "Project Orchestrator|Usage feedback automation|Problem handling rule" CLAUDE_MD_TEMPLATE.md
```

Expected: The template has the managed instructions installed into target projects.

**Step 2: Add a compact repeat-work section**

Add a section after the continuous tuning paragraph:

```markdown
Repeat work promotion:

- Treat repeated user instructions as reusable project protocol.
- On the first occurrence, complete the task and record format, fields, workflow, artifacts, and user corrections.
- On the second occurrence, look up prior usage runs, tuning notes, project memory, and recipes before asking the same question again.
- If the user has to repeat the same preference twice, record a system tuning failure with `--user-correction`, `--where-stalled`, or `--capability-gap`.
- Promote stable repetition to a handoff rule, workflow recipe, agent capability, scheduled candidate, capability gap, or possible new skill, in that order.
- Do not silently enable recurring work. Recurrence requires explicit cadence, permissions, output artifact, failure handling, monitoring path, and user approval.
```

**Step 3: Verify the direct prompt mirrors the rule**

Update the Codex prompt block in the same file so it mentions repeat-work lookup
before asking repeated preference questions.

### Task 3: Define The Tuning State Machine

**Files:**
- Modify: `SYSTEM_TUNING_LOOP.md`

**Step 1: Find the decision principles and capability gap sections**

Run:

```bash
rg -n "能力缺口|决策原则|周期节奏|和 gstack skills 的关系" SYSTEM_TUNING_LOOP.md
```

Expected: These sections exist.

**Step 2: Add repeat-work promotion state**

Add a section before `## 调教 Agent 的职责`:

```markdown
## 重复工作升级协议

状态：

```text
discovery -> reuse_required -> promotion_candidate -> approved_protocol
```

判定：

- 第一次出现：完成任务，记录样本、格式、字段、artifact、用户纠正。
- 第二次出现：必须先复用已知偏好，再询问缺失信息。
- 第三到第十次稳定出现：生成 promotion candidate。
- 第二次仍要求用户重复同一偏好：记为 system tuning failure。

升级顺序：

```text
handoff rule -> workflow recipe -> agent capability -> scheduled candidate -> capability gap -> possible new skill
```

定时约束：

只有 cadence、permissions、input source、output artifact、failure handling、monitoring path 和 user approval 都明确时，scheduled candidate 才能升级为 active recurrence。
```

**Step 3: Ensure it does not contradict existing skill boundaries**

Run:

```bash
rg -n "不重写 gstack skill|possible new skill|scheduled candidate|system tuning failure" SYSTEM_TUNING_LOOP.md
```

Expected: The new section reinforces existing boundaries.

### Task 4: Add A Workflow Recipe

**Files:**
- Modify: `WORKFLOW_RECIPES.md`

**Step 1: Find the recipe list around R14 and R15**

Run:

```bash
rg -n "R14|R15|System / Agent Capability Tuning|Multi-Agent / Browser Collaboration" WORKFLOW_RECIPES.md
```

Expected: R14 and R15 exist.

**Step 2: Add `R16: Repeat Work Promotion / Automation Candidate`**

Append a recipe with:

- applicability signals;
- flow: complete normal work, inspect prior evidence, classify repetition, write promotion note, update state/gbrain when durable;
- outputs: promotion note, updated tuning report, scheduled candidate if applicable;
- state updates: maintenance/system tuning;
- tuning hook: repeated clarification is a failure.

**Step 3: Check recipe numbering**

Run:

```bash
rg -n "^## R[0-9]+:" WORKFLOW_RECIPES.md
```

Expected: R16 appears after R15 without replacing existing recipes.

### Task 5: Add Skill Boundary Guidance

**Files:**
- Modify: `GSTACK_SKILL_REGISTRY.md`

**Step 1: Find the core principles**

Run:

```bash
sed -n '1,45p' GSTACK_SKILL_REGISTRY.md
```

Expected: Core principles mention project-level orchestration and not rewriting gstack skills.

**Step 2: Add repeat-work boundary**

Add a short subsection:

```markdown
## Repeat Work Boundary

Repeated work does not automatically create a new gstack skill. Promote in this order:

```text
handoff rule -> workflow recipe -> agent capability -> scheduled candidate -> capability gap -> possible new skill
```

Create or modify a skill only when the repeated pattern is stable, cross-project, reusable, and cannot be expressed as project-level orchestration.
```

### Task 6: Expose State In Project Templates And Installer Output

**Files:**
- Modify: `PROJECT_STATE_TEMPLATE.md`
- Modify: `bin/gstack-harness-init`
- Test: `tests/gstack-harness-init.test.mjs`

**Step 1: Add markdown state fields**

Add under `## Notes` or before it:

```markdown
## Repeat Work Promotion

- Known patterns:
- Promotion backlog:
- Scheduled candidates:
- Recent memory misses:
```

**Step 2: Add JSON state fields**

In the JSON template, add:

```json
"repeat_work": {
  "known_patterns": [],
  "promotion_backlog": [],
  "scheduled_candidates": [],
  "recent_memory_misses": []
}
```

Expected: JSON remains syntactically valid in the fenced example.

**Step 3: Render the same state during install**

Update `bin/gstack-harness-init` so generated `PROJECT_STATE.md` contains:

```markdown
## Repeat Work Promotion

- Known patterns:
- Promotion backlog:
- Scheduled candidates:
- Recent memory misses:
```

Update generated `.gstack/project-state.json` with:

```json
"repeat_work": {
  "known_patterns": [],
  "promotion_backlog": [],
  "scheduled_candidates": [],
  "recent_memory_misses": []
}
```

**Step 4: Add an installer regression test**

Create or update `tests/gstack-harness-init.test.mjs` so it runs
`bin/gstack-harness-init --mode docs-only --no-start-codex` against a temp target
and asserts both installed state files include repeat-work fields.

### Task 7: Update Orchestrator Manifest And Run Contract

**Files:**
- Modify: `.gstack/agents/orchestrator.yaml`
- Modify: `docs/AGENT_RUN_CONTRACT.md`

**Step 1: Update Orchestrator reads/writes**

Add to reads:

```yaml
- .gstack/usage-runs/index.jsonl
- docs/USAGE_FEEDBACK_REPORT.md
```

Add promotion evidence to artifacts or reports:

```yaml
- repeat-work promotion notes
```

**Step 2: Update run contract evidence**

In `docs/AGENT_RUN_CONTRACT.md`, add repeated preference, memory miss,
promotion candidate, and scheduled candidate as valid evidence examples.

**Step 3: Verify manifest parses visually**

Run:

```bash
sed -n '1,120p' .gstack/agents/orchestrator.yaml
```

Expected: YAML indentation remains consistent.

### Task 8: Verify Installer Propagation

**Files:**
- No source modifications expected.

**Step 1: Run installer dry-run**

Run:

```bash
tmp="$(mktemp -d)"
bin/gstack-harness-init --target "$tmp" --mode docs-only --dry-run --no-start-codex
```

Expected: Dry-run reports managed/template files would be written.

**Step 2: Run a real install into a temp target**

Run:

```bash
tmp="$(mktemp -d)"
bin/gstack-harness-init --target "$tmp" --mode docs-only --no-start-codex
rg -n "Repeat work|repeated user instructions|重复" "$tmp" CLAUDE.md PROJECT_STATE.md GSTACK_SKILL_REGISTRY.md WORKFLOW_RECIPES.md SYSTEM_TUNING_LOOP.md
```

Expected: The repeat-work protocol appears in installed target files, and
`PROJECT_STATE.md` plus `.gstack/project-state.json` include repeat-work state.

### Task 9: Run Change Detection And Review Diff

**Files:**
- No source modifications expected.

**Step 1: Run GitNexus detect changes**

Run:

```bash
gitnexus_detect_changes(scope: "all", repo: "gstack-multiagent")
```

Expected: Changes are documentation/template/manifest scoped.

**Step 2: Review git diff**

Run:

```bash
git diff -- AGENTS.md CLAUDE_MD_TEMPLATE.md SYSTEM_TUNING_LOOP.md WORKFLOW_RECIPES.md GSTACK_SKILL_REGISTRY.md PROJECT_STATE_TEMPLATE.md .gstack/agents/orchestrator.yaml docs/AGENT_RUN_CONTRACT.md bin/gstack-harness-init tests/gstack-harness-init.test.mjs docs/plans/2026-05-11-repeat-work-promotion-design.md docs/plans/2026-05-11-repeat-work-promotion-implementation.md
```

Expected: Diff matches this plan and does not modify gstack skill internals.

### Task 10: Commit

**Files:**
- All changed files from prior tasks.

**Step 1: Stage the protocol change**

Run:

```bash
git add AGENTS.md CLAUDE_MD_TEMPLATE.md SYSTEM_TUNING_LOOP.md WORKFLOW_RECIPES.md GSTACK_SKILL_REGISTRY.md PROJECT_STATE_TEMPLATE.md .gstack/agents/orchestrator.yaml docs/AGENT_RUN_CONTRACT.md bin/gstack-harness-init tests/gstack-harness-init.test.mjs docs/plans/2026-05-11-repeat-work-promotion-design.md docs/plans/2026-05-11-repeat-work-promotion-implementation.md
```

**Step 2: Commit**

Run:

```bash
git commit -m "docs: add repeat work promotion protocol"
```

Expected: Commit succeeds after verification.
