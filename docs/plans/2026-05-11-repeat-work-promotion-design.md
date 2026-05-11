# Repeat Work Promotion Design

## Goal

Make repeated user instructions a first-class harness signal. The system should
learn from the first run, reuse the pattern on the second run, and promote stable
repetition into project protocol instead of asking the user to repeat the same
format, fields, workflow, or schedule.

## Context

`gstack-multiagent` is the template source for installing a project-level harness
into target projects. Changes here must affect installed targets, not only this
source checkout.

The current system already has the right foundation:

- `AGENTS.md` defines hard local agent rules.
- `CLAUDE_MD_TEMPLATE.md` is rendered into target project managed instructions.
- `SYSTEM_TUNING_LOOP.md` defines how repeated failures become system changes.
- `WORKFLOW_RECIPES.md` defines repeatable agent workflows.
- `GSTACK_SKILL_REGISTRY.md` defines skill boundaries.
- `.gstack/usage-runs/` stores run evidence and user corrections.
- `docs/SCHEDULER_MODEL.md` describes scheduler-visible tasks.

The missing behavior is a crisp promotion loop for repeated work.

## Product Decision

Do not implement this as a bare prompt or as automatic skill creation.

The harness should treat repeated work as evidence:

1. First occurrence is discovery.
2. Second occurrence requires reuse.
3. Third through tenth stable occurrences become a promotion candidate.
4. Repeated clarification of the same preference is a system tuning failure.

Promotion should prefer existing project-level mechanisms before creating new
skills:

```text
preference -> handoff rule
workflow -> workflow recipe
agent boundary -> agent capability
recurring cadence -> scheduled candidate
missing capability -> capability gap
cross-project reusable primitive -> possible new skill
```

## Protocol

### Detection

The Orchestrator should classify work as repeatable when the user uses signals
such as:

- "按上次"
- "还是那个格式"
- "以后都这样"
- "每天"
- "每周"
- "别再问这个"

It should also inspect prior evidence:

- `.gstack/usage-runs/index.jsonl`
- `.gstack/usage-runs/*.json`
- `docs/USAGE_FEEDBACK_REPORT.md`
- `docs/SYSTEM_TUNING_REPORT.md`
- gbrain project and agent memory, when available

### Reuse

On the second occurrence, the agent must reuse prior known choices before asking:

- output format
- report columns
- destination path
- quality gate expectations
- preferred workflow recipe
- skip policy
- handoff recipient

If the prior pattern cannot be found, the agent should record a memory miss.

### Promotion

Stable repetition should produce a promotion note with:

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

### Scheduling

The harness must not silently enable recurring work.

A scheduled candidate can become active only when all are explicit:

- cadence
- permission scope
- input source
- output artifact
- failure handling
- monitoring or review path
- user approval

## File-Level Design

### `AGENTS.md`

Add a compact rule block near the top of the project instructions:

- repeated work must enter the promotion protocol;
- second occurrence must reuse known preferences;
- repeated clarification is a system failure;
- recurring work becomes a scheduled candidate, not an automatic cron.

### `CLAUDE_MD_TEMPLATE.md`

Add the same behavior to the managed project instructions so every installed
target inherits it.

This is the propagation point.

### `SYSTEM_TUNING_LOOP.md`

Add the formal state machine:

```text
discovery -> reuse_required -> promotion_candidate -> approved_protocol
```

Define tuning failure cases:

- asking for the same format twice;
- ignoring a prior user correction;
- failing to record a reusable pattern;
- enabling recurrence without approval;
- creating a new skill when a recipe or handoff rule would work.

### `WORKFLOW_RECIPES.md`

Add `R16: Repeat Work Promotion / Automation Candidate`.

The recipe should run after normal task completion, not instead of doing the work.
It should produce a promotion note, update tuning evidence, and recommend the next
protocol change.

### `GSTACK_SKILL_REGISTRY.md`

Add the skill boundary rule:

Repeated work does not automatically mean a new skill. Prefer recipes, handoff
rules, agent capabilities, and scheduled candidates. New skill creation is for
stable, cross-project, reusable primitives.

### `PROJECT_STATE_TEMPLATE.md`

Add lightweight state fields:

- repeat work patterns;
- promotion backlog;
- scheduled candidates.

This gives installed projects a visible place to track the learning loop.

### `bin/gstack-harness-init`

Render the same repeat-work fields into generated `PROJECT_STATE.md` and
`.gstack/project-state.json`. The installer does not copy
`PROJECT_STATE_TEMPLATE.md` directly, so this is required for real target
projects to inherit the state fields.

### `.gstack/agents/orchestrator.yaml`

Update the manifest so the Orchestrator explicitly reads usage runs and system
tuning reports and writes promotion evidence.

### `docs/AGENT_RUN_CONTRACT.md`

Require file-backed evidence for:

- repeated user correction;
- repeated task pattern;
- memory miss;
- promotion candidate;
- scheduled candidate.

## Expected Behavior

Example:

1. User asks for a report with specific columns and formatting.
2. Agent completes the report and records the format in run evidence.
3. User later says "按上次报表来".
4. Agent finds the previous pattern and runs without re-asking for columns.
5. After stable repetition, Agent proposes a scheduled candidate.
6. User approves cadence and failure handling before recurrence is enabled.

If the agent asks for the same column list again on the second run, the harness
records a tuning failure.

## Validation

The first implementation should be validated with docs and installer propagation:

1. Source docs include the protocol.
2. `CLAUDE_MD_TEMPLATE.md` includes the installed-target rule.
3. `bin/gstack-harness-init --dry-run --target <tmp>` shows the managed template
   would be installed or upgraded.
4. GitNexus `detect_changes` reports only expected documentation/template impact.
5. A rehearsal target can be initialized and inspected for the new managed rule.
6. Automated tests verify installer-rendered `PROJECT_STATE.md` and
   `.gstack/project-state.json` contain repeat-work state.

## Non-Goals

- Do not create a cron runner in this change.
- Do not modify gstack skill internals.
- Do not auto-create `SKILL.md`.
- Do not silently enable recurring tasks.
- Do not add a large new database or state store.

## Success Criteria

- Installed projects inherit the rule.
- The Orchestrator has a clear repeat-work responsibility.
- Tuning docs define second-repeat failure.
- Workflow recipes define how to promote a repeated pattern.
- State templates expose promotion backlog and scheduled candidates.
- The rule is evidence-backed, not only conversational.
