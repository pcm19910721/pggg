# GStack Scheduler Model

This scheduler ports the useful parts of Ruflo's swarm control plane into the
project harness without pretending that state registration is real worker
execution.

## File Flow

```text
bin/gstack-harness-schedule
  -> scripts/gstack-scheduler.mjs
    -> .gstack/scheduler/swarm.json
    -> .gstack/scheduler/agents.json
    -> .gstack/scheduler/tasks.json
    -> .gstack/scheduler/queues.json
```

`swarm.json` stores the control-plane envelope:

```json
{
  "swarmId": "gstack-swarm-...",
  "topology": "hierarchical-mesh",
  "maxAgents": 12,
  "strategy": "evidence-gated",
  "status": "running",
  "domains": ["queen", "foundation", "memory", "code-context", "core", "integration", "support", "release"]
}
```

`agents.json` stores scheduler-visible worker metadata:

```json
{
  "agents": {
    "build": {
      "agentId": "build",
      "role": "Build Agent",
      "domain": "integration",
      "capabilities": ["coding", "implementation", "debugging"],
      "status": "idle",
      "workload": 0,
      "health": 1,
      "successRate": 0.75,
      "averageDurationMs": 30000,
      "costTier": "balanced",
      "activeFiles": [],
      "currentTask": null
    }
  }
}
```

`tasks.json` stores the task ledger:

```json
{
  "tasks": {
    "task-1": {
      "taskId": "task-1",
      "type": "coding",
      "priority": "normal",
      "description": "Implement retry handling",
      "status": "assigned",
      "assignedTo": "build",
      "evidenceRequired": ["diff", "test", "review"],
      "analysis": {
        "recommendedDomain": "integration",
        "strategy": "hybrid",
        "modelTier": "balanced"
      }
    }
  }
}
```

`queues.json` is a per-domain backlog. If no idle agent is available in the
recommended domain, the task is queued instead of being silently assigned.

## Parameter Path

`schedule --type coding --priority high --description ...` becomes:

```text
CLI args
  -> normalizeTask()
      taskId, type, priority, description, evidenceRequired
  -> analyzeTask()
      requiredCapabilities
      subtasks
      complexity
      recommendedDomain
      strategy
      modelTier
      confidence
  -> scoreAgent()
      capabilityScore
      loadScore
      performanceScore
      healthScore
      availabilityScore
      totalScore
  -> scheduleTask()
      assigned task + busy agent
      OR queued task + domain queue entry
```

The agent score mirrors Ruflo's QueenCoordinator weighting:

```text
totalScore =
  capabilityScore  * 0.30
+ loadScore        * 0.20
+ performanceScore * 0.25
+ healthScore      * 0.15
+ availability     * 0.10
+ small domain boost
- speed penalty
```

## Task Analysis

Complex coding tasks are decomposed into:

```text
task.design     -> core
task.implement  -> integration, depends on design
task.test       -> support, depends on implement
```

The strategy is chosen from:

```text
no subtasks                      -> sequential
no dependencies and >2 subtasks  -> parallel
dependencies and >3 subtasks     -> pipeline
complexity > 0.7                 -> fan-out-fan-in
otherwise                        -> hybrid
```

Model tier is a cost hint for the executing agent:

```text
economy   -> simple, low-risk work
balanced  -> normal implementation/review work
frontier  -> critical or complex/high-risk work
```

## Boundary

This is a control plane. It does not spawn Codex or Claude workers by itself.
Execution remains the harness agent's responsibility. The scheduler decides
ownership, records status, and gives the executing agent a structured handoff.

## Usage

```bash
.gstack/harness/bin/gstack-harness-schedule init --target .

.gstack/harness/bin/gstack-harness-schedule register-agent \
  --target . \
  --agent-id build \
  --role "Build Agent" \
  --domain integration \
  --capabilities coding,implementation,debugging

.gstack/harness/bin/gstack-harness-schedule schedule \
  --target . \
  --task-id task-1 \
  --type coding \
  --priority high \
  --description "Implement retry handling with tests"
```
