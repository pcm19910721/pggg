# Source Rehearsal Method

This document is for the `gstack-multiagent` source project only.

It must not be copied into target projects by `pcm-harness`, and target projects must not be told to rehearse against `huanzhuang`.

## Boundary

```text
gstack-multiagent = harness source and rule consolidation project
huanzhuang = local live rehearsal target for this source project
pcm-harness target projects = normal users of the harness, not rehearsal infrastructure
```

The rehearsal method exists to improve this source project. It is not part of the installed target-project workflow.

## Loop

Use this loop for future harness behavior changes:

```text
1. Solidify candidate changes in /home/adminpcm/gstack-multiagent.
2. Refresh the installed harness in /home/adminpcm/projects/huanzhuang from that source.
3. Rehearse in huanzhuang with the installed .gstack/harness/bin/* and scripts/ai-context-bridge.mjs, not a source-tree temp copy.
4. Record the run in huanzhuang .gstack/usage-runs/.
5. Preserve evidence: tests, GitNexus output, readiness output, fallback artifacts, and handoff notes.
6. Score the run using the rehearsal scorecard.
7. Extract the lesson from evidence, not from intention.
8. Return to /home/adminpcm/gstack-multiagent and solidify only the verified contract, manifest, runbook, or harness rule.
```

Rules without rehearsal evidence are proposals. Rules with rehearsal evidence can become contract.
Evidence from a source-tree temporary copy is not sufficient when the behavior depends on installed harness files.

## Scorecard

Each rehearsal is scored out of 100.

| Area | Points | What good looks like |
|---|---:|---|
| Preflight correctness | 15 | Reads state, contract, manifest, GitNexus status, and memory state before routing. |
| Routing correctness | 15 | Selects the right agent/recipe and does not enter business flow when blocked. |
| Evidence completeness | 20 | Leaves test logs, GitNexus output, readiness output, fallback artifacts, and usage run. |
| Handoff quality | 15 | A later agent can continue from the handoff without rereading the chat. |
| Gate accuracy | 15 | Gate status matches command, exit code, artifact, and current commit. |
| Failure handling | 10 | Stale bridge, failed tests, gbrain unavailable, and fallback states route correctly. |
| Source consolidation | 10 | Verified lessons are folded back into this source project. |

Minimum bar:

```text
80+ = usable pattern
70-79 = useful evidence, needs harness repair before reuse
<70 = failed rehearsal, fix process before more breadth
```

## Task Matrix

Run these rehearsal families repeatedly:

| Round | Focus | Primary agents | Expected stress |
|---|---|---|---|
| 1 | Foundation / Memory | foundation-readiness, foundation-remediation, memory-gbrain, problem-handling | gbrain unavailable, sync fallback, readiness blocked |
| 2 | Code Context / Review | code-context, review, orchestrator | stale bridge status, detect_changes, impact, review handoff |
| 3 | Build / Health | code-context, build, reality-test, review | symbol impact, tests, postchange evidence |
| 4 | Release Readiness | release, review, security-perf, problem-handling | no remote, no deploy target, release gate blocked |

## Current Evidence

May 10, 2026 writable rehearsal in `huanzhuang`:

```text
.gstack/usage-runs/20260510T020808Z-session_end-27353.json
.ai-context/runs/20260510T020759Z/
.ai-context/gbrain-fallback/
```

Outcome:

```text
npm test passed: 9 tests OK
GitNexus code context refreshed to current HEAD
sync-gbrain fell back because gbrain was unavailable
readiness ended blocked on gbrain_unavailable
```

Source rules consolidated from that run:

- `fallback` is a first-class status/evidence path.
- `gbrain_unavailable` in readiness is blocked.
- Bridge status must be refreshed before trusting local Code Context reports.
- Usage runs need tools/skills evidence, not only high-level agent names.

May 10, 2026 recorder verification rehearsal in `huanzhuang`:

```text
.gstack/usage-runs/20260510T024158Z-rehearsal_round_1_recorder_verification-74476.json
```

Outcome:

```text
npm test passed: 9 tests OK
usage run captured agents, skills, and tools
.gstack/project-state.json usage.latest_agents/latest_skills/latest_tools updated
readiness remained blocked on gbrain_unavailable
installed target recorder was still pre-upgrade, so the source recorder was used for verification
```

Source rules consolidated from that verification:

- `gstack-harness-record-run` must accept repeatable `--agent`, `--skill`, and `--tool`.
- Usage run JSON must write `agents_used`, `skills_used`, and `tools_used`.
- Usage index JSONL must include compact `agents`, `skills`, and `tools` fields so later reports can aggregate the chain.
- `.gstack/project-state.json` must summarize `usage.latest_agents`, `usage.latest_skills`, and `usage.latest_tools`.
- Source-only rehearsal documents and the local rehearsal target path must not be copied into normal install targets.

May 10, 2026 Code Context / Review rehearsal in `huanzhuang`:

```text
.ai-context/runs/round2-review-handoff/
.gstack/usage-runs/20260510T025145Z-rehearsal_round_2_code_context_review-98390.json
```

Outcome:

```text
npm test passed: 9 tests OK
GitNexus detect-changes risk: low
postchange handoff captured test command, exit code, and artifact
docs/CODE_CONTEXT_REPORT.md exposed test_evidence next to risk/detect_changes fields
readiness remained blocked on gbrain_unavailable
```

Source rules consolidated from that verification:

- `postchange` handoff is incomplete for review unless it records test evidence.
- Review handoff must carry command, exit code, and artifact for each relevant test/check.
- `docs/CODE_CONTEXT_REPORT.md` must expose `test_evidence` next to GitNexus risk so later agents can consume one current context bundle.

May 10, 2026 installed-harness verification in `huanzhuang`:

```text
.ai-context/runs/installed-round2-review-handoff/
.gstack/usage-runs/20260510T030030Z-rehearsal_round_2_installed_harness_verification-118203.json
```

Outcome:

```text
source harness was installed into huanzhuang before verification
installed scripts/ai-context-bridge.mjs status wrote test_evidence: []
installed scripts/ai-context-bridge.mjs postchange captured npm test command, exit code 0, and artifact
installed .gstack/harness/bin/gstack-harness-record-run captured agents, skills, and tools
readiness remained blocked on gbrain_unavailable
GitNexus detect-changes risk became high because harness refresh touched shared bridge/report files
```

Source rule consolidated from that correction:

- Installed-harness behavior must be verified after refreshing the rehearsal target; source-tree temporary execution can only be preliminary evidence.

May 10, 2026 Build / Health rehearsal in `huanzhuang`:

```text
.ai-context/runs/round3-build-health-installed-risk-split/
.gstack/usage-runs/20260510T031257Z-rehearsal_round_3_installed_risk_split-144164.json
```

Task:

```text
TDD change in test.py: normalize capability["model"] for display/logging.
Added test_capability_model_name_is_normalized_for_display_and_logging.
```

Outcome:

```text
RED: targeted unittest failed because capability["model"] preserved raw input
GREEN: resolve_model_capability now stores normalized model name
npm test passed: 10 tests OK
target impact resolve_model_capability: low
detect_changes risk: high because the rehearsal target still contained harness refresh/state noise
installed postchange wrote detect_risk: high and impact_risks: [{"target":"resolve_model_capability","risk":"low"}]
readiness remained blocked on gbrain_unavailable
```

Source rules consolidated from that verification:

- Build/Health handoff must distinguish global detect risk from target symbol impact risk.
- A high global detect risk in a dirty rehearsal target is not enough by itself to classify the business symbol change as high risk.
- `postchange` should expose `detect_risk` and per-target `impact_risks` in both run JSON and `docs/CODE_CONTEXT_REPORT.md`.

May 10, 2026 gbrain transport and memory-closure rehearsal in `huanzhuang`:

```text
docs/FOUNDATION_READINESS_REPORT.md
.gstack/readiness-last.json
project/huanzhuang/{overview,state,foundation-readiness,quality-gates,handoff}
```

Task:

```text
Verify that gbrain stays usable after restart-like minimal PATH conditions, then refresh project memory so the next agent reads current routing state.
```

Outcome:

```text
gbrain wrapper failed under PATH=/usr/bin:/bin when it used `exec bun ...`
healthcheck had previously killed duplicate `gbrain serve` processes, which can close Codex MCP stdio transports
updated local gbrain wrapper to resolve bun from $HOME/.bun/bin, PATH, or /usr/local/bin
updated ~/.gbrain/healthcheck.sh to observe `gbrain serve` processes instead of killing them
MCP protocol initialize + get_stats passed under HOME=/home/adminpcm PATH=/usr/bin:/bin
huanzhuang sync-gbrain wrote 9/9 project memory pages with no warnings
handoff/state/foundation-readiness/quality-gates now route to Orchestrator + R0 Restore / Resume Context
search no longer returns stale huanzhuang Foundation Remediation handoff text
```

Source rules consolidated from that verification:

- Codex MCP transport stability is a first-class readiness concern, not only a CLI availability check.
- `gbrain serve` is an MCP stdio child process. Health checks must not kill multiple `gbrain serve` processes as duplicates.
- A restart-proof gbrain wrapper must work with a minimal PATH and must not assume `bun` is on PATH.
- After readiness changes, run full `sync-gbrain`, then read `project/<id>/handoff` and `project/<id>/state` to confirm the next agent route.
- The self-test must include a minimal-PATH `HOME/.bun/bin/gbrain --version` regression so the wrapper bug is caught before another installed rehearsal.

May 10, 2026 fresh install memory-closure verification:

```text
/tmp/pcm-gbrain-scenario-fixed-ZJQLXE/init.out
/tmp/pcm-gbrain-scenario-fixed-ZJQLXE/.gstack/sync-gbrain-last.json
project/scenario20260510154147/{state,handoff}
```

Task:

```text
Verify that a new pcm-harness target writes project-scoped gbrain memory before the first readiness verdict, so a later Codex session can resume from gbrain state/handoff without manual sync.
```

Outcome:

```text
Before fix: real fresh install returned after ~119s with status partial because project/<id>/handoff was missing; remediation timed out at 90s, while manual sync-gbrain --page state --page handoff later succeeded in 12s.
After fix: init runs sync-gbrain before first readiness, returned in 79s with status ready, did not run remediation, and gbrain get project/<id>/state plus project/<id>/handoff both showed Orchestrator + R0 Restore / Resume Context.
Self-test now asserts fresh install status ready and verifies gbrain state/handoff contain the reusable next-agent route.
```

Source rules consolidated from that verification:

- Fresh install must close the memory loop before reporting readiness.
- `project/<id>/state` and `project/<id>/handoff` are the minimal gbrain pages a new conversation needs for lightweight restore.
- Remediation is a fallback, not the normal path for first-run project memory creation.
