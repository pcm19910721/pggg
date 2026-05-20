# Capability-First Workflow

This document defines PCM's default way of building products in this repo and in projects installed from this harness.

## Core Model

Treat products as compositions:

```text
Product = UI shell
        + hot update channel
        + permission checks
        + capability modules
        + business workflow orchestration
```

The default build motion is:

```text
user intent
-> identify required capabilities
-> look for existing modules first
-> reuse or adapt matching modules
-> write missing modules only when no suitable module exists
-> register module contract
-> compose modules into a workflow
-> verify permission, update, and rollback behavior
```

## Capability Module Contract

A capability module is not just a component or function. It must be understandable by the orchestrator and safe to reuse.

Each module should declare:

```yaml
id:
purpose:
owner:
version:
status: experimental | ready | deprecated
ui_entry:
actions:
inputs:
outputs:
permissions:
data_dependencies:
runtime_dependencies:
hot_update_scope:
rollback:
observability:
tests:
examples:
```

Minimum required fields before reuse:

```text
id
purpose
actions
inputs
outputs
permissions
tests or verification notes
```

## Default Search Before Build

Before implementing a new product feature, agent, workflow, or automation, first classify the request into capabilities.

For each capability:

1. Search local project modules, docs, recipes, agents, scripts, and skill registry.
2. Check whether gstack already has a matching skill or workflow.
3. Check whether GitNexus can identify an existing implementation path.
4. If a module exists, adapt through its declared contract instead of duplicating behavior.
5. If no module exists, create the smallest reusable capability module that solves the current use case.

Do not start from a blank implementation when an existing module or workflow can be reused.

## Product Shell

The UI shell owns:

```text
navigation
layout
identity display
capability discovery
permission-aware entry visibility
update channel selection
global error and loading states
module runtime boundaries
```

The shell should not contain business-specific workflow logic. Business variation belongs in recipes, module configuration, or workflow orchestration.

## Hot Update Boundary

Prefer hot-updating declarative assets first:

```text
capability manifest
workflow recipe
UI schema/configuration
permission policy
copy/config values
feature flags
```

Treat executable code hot updates as high risk. They need explicit versioning, rollback, audit, and compatibility checks.

## Permission Boundary

Permissions belong in module contracts and workflow edges, not only in UI visibility.

Every protected action should answer:

```text
who can see it
who can run it
who can approve it
who can configure it
who can view its output
who can rerun or rollback it
```

The UI may hide unauthorized actions, but the runtime must still enforce permissions.

## Workflow Orchestration

Business products should be expressed as workflows over capabilities.

Each workflow step should declare:

```yaml
step_id:
capability:
action:
input_mapping:
output_mapping:
permission_required:
failure_behavior: retry | compensate | stop | manual_review
audit_event:
```

The goal is to make a new product mostly a change in module selection, policy, and workflow recipe.

## When A Module Is Missing

If a required capability does not exist:

1. Write a short capability gap note.
2. Define the module contract before implementation.
3. Keep the first version narrow and useful to the current workflow.
4. Add a concrete example or verification command.
5. Register the module so future work can find it.

Avoid building a general platform abstraction before at least two real workflows need the same capability.

## Decision Rule

Use this rule when starting product work:

```text
Can this be assembled from existing shell, capability, permission, update, or workflow modules?

Yes -> reuse and compose.
Almost -> adapt the closest module and document the new contract.
No -> build the missing module, then compose it into the workflow.
```

This workflow is durable project policy. It can expire or change only when repeated real work shows a better default.
