# Harness Agent Team

Generated: 2026-05-03
Project: gstack-multiagent

This project uses a standard GStack Harness agent team. The team is installed automatically by `pcm-harness`; the user should not need to choose agents during onboarding.

## Required Core Agents

These agents are always present and cannot be removed by project overrides.

| Agent | Responsibility | Typical Trigger |
|---|---|---|
| Orchestrator Agent | Owns routing, recipe selection, state merge, and handoff discipline. | Every session |
| Foundation Readiness Agent | Diagnoses gbrain/gstack/project protocol/runtime/runner readiness. | First run, migration, unknown state |
| Foundation Remediation Agent | Fixes harness foundation gaps without touching business code or gstack skill internals. | Foundation partial/blocked |
| Problem Handling Agent | Handles warnings, timeouts, runner failures, repeated friction, and unclear blockers. | Any runtime issue |
| Memory / GBrain Agent | Owns durable memory reads/writes, conflict policy, and gbrain schema discipline. | Memory read/write/conflict |
| System Tuning Agent | Converts repeated failures into harness/agent/workflow improvements. | Recurring issue or capability gap |

## Default Capability Agents

These agents are installed by default and can be configured or replaced by project overrides.

| Agent | Responsibility | GStack Skills |
|---|---|---|
| Product Agent | Product direction and scope. | office-hours, plan-ceo-review |
| Planning Agent | Full plan review. | autoplan |
| Design Agent | Design direction and visual QA. | design-consultation, design-shotgun, plan-design-review, design-review |
| Architecture Agent | Engineering plan and architecture review. | plan-eng-review |
| Build Agent | Implementation and local checks. | Codex/Claude coding, health |
| Reality Test Agent | Real app/browser verification. | health, browse, qa, qa-only |
| Review Agent | Pre-landing code review. | review |
| Security/Perf Agent | Security and performance hardening. | cso, benchmark |
| Release Agent | PR, deploy, canary, release docs. | ship, land-and-deploy, canary, document-release |
| Maintenance Agent | Debugging, root cause, restore, learning, retro. | investigate, context-save, context-restore, learn, retro |

## Project-Defined Starter Agents

These agents are installed as starter project-defined roles. Projects can rename, replace, or extend them, but their evidence requirements should stay explicit.

| Agent | Responsibility | GStack Skills |
|---|---|---|
| Code Context Agent | Owns current code facts for product, build, review, release, and incident work. GitNexus is the default provider; Understand Anything is optional for visual dashboards, onboarding, domain graphs, and fallback. | GitNexus status/query/context/impact/detect-changes; optional understand, understand-dashboard, understand-onboard, understand-domain |

## Non-Negotiables

- Do not modify gstack skill internals.
- Do not skip required core agents.
- Do not leave warnings as loose narration; route them to Problem Handling Agent.
- Do not mark gates passing without artifact evidence.
- Ask the user only for high-risk, irreversible, credential, deploy, or destructive actions.
