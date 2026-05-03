# Usage Feedback Report

Generated: 2026-05-03T05:22:53.301Z

## Summary

- Projects scanned: 23
- Usage runs found: 17
- Targets without usage runs: 20

## Recommended Template Source Actions

- Keep gbrain timeout handling in the required Problem Handling path, and consider adding retry/backoff evidence to the run record.
- Clarify target_project git requirements before review, release, and ship recipes.
- Promote repeated stall points into handoff contract changes or workflow recipe changes.
- Review repeated capability gaps and decide whether they need a new agent, stricter gate, or better handoff artifact.

## Warning Counts

| Name | Count |
| --- | --- |
| gbrain_sync_off | 17 |
| gbrain_query_timeout | 15 |
| not_git_repo | 3 |
| codebase_map_missing | 2 |
| gstack_harness_registry_erofs | 2 |
| not_git_repo_blocks_review_release | 2 |
| usage_global_registry_read_only | 2 |
| gbrain_core_pages_missing | 1 |
| gbrain_empty | 1 |
| gbrain_seed_timeout | 1 |
| test_refresh_large_session_files skipped: insufficient disk space | 1 |

## Blocker Counts

_None._

## Recipe Counts

| Name | Count |
| --- | --- |
| Problem Handling preflight, then R0 Restore / Resume Context | 9 |
| R-0.5 Foundation Remediation | 4 |
| Problem Handling preflight -> R0.5 Codebase Map / Project Understanding | 2 |
| R14 System / Agent Capability Tuning | 2 |

## Event Counts

| Name | Count |
| --- | --- |
| harness_init | 5 |
| foundation_remediation | 4 |
| session_end | 4 |
| codex_session_start | 2 |
| session_start | 2 |

## Status Counts

| Name | Count |
| --- | --- |
| completed | 4 |
| fixed | 4 |
| in_progress | 4 |
| ready | 4 |
| partial | 1 |

## Stall Points

| Name | Count |
| --- | --- |
| gbrain query timed out twice; global harness registry append failed on read-only /home/adminpcm/.gstack-harness/projects.jsonl | 1 |

## User Corrections

_None._

## Capability Gaps

| Name | Count |
| --- | --- |
| harness-gbrain-timeout-state-template | 5 |
| codebase-map-missing-after-foundation | 2 |
| harness-usage-registry-erofs-fallback | 2 |
| harness-usage-registry-read-only | 2 |

## Recent Runs

| Time | Project | Event | Status | Recipe | Warnings |
| --- | --- | --- | --- | --- | --- |
| 2026-05-03T12:58:39+08:00 | maoheshuizhinengti | harness_init | partial | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off, not_git_repo |
| 2026-05-03T12:58:21+08:00 | maoheshuizhinengti | foundation_remediation | fixed | R-0.5 Foundation Remediation | gbrain_query_timeout, gbrain_sync_off, not_git_repo |
| 2026-05-03T12:56:13+08:00 | maoheshuizhinengti | foundation_remediation | fixed | R-0.5 Foundation Remediation | gbrain_query_timeout, gbrain_sync_off, not_git_repo |
| 2026-05-03T12:52:43+08:00 | maoheshuizhinengti | foundation_remediation | fixed | R-0.5 Foundation Remediation | gbrain_query_timeout, gbrain_sync_off |
| 2026-05-03T12:49:48+08:00 | maoheshuizhinengti | foundation_remediation | fixed | R-0.5 Foundation Remediation | gbrain_seed_timeout, gbrain_empty, gbrain_core_pages_missing, gbrain_query_timeout, gbrain_sync_off |
| 2026-05-03T12:46:37+08:00 | maoheshuizhinengti | harness_init | ready | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |
| 2026-05-03T12:45:07+08:00 | maoheshuizhinengti | harness_init | ready | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |
| 2026-04-30T23:26:45+08:00 | stzhengli | session_end | completed | Problem Handling preflight -> R0.5 Codebase Map / Project Understanding | gbrain_sync_off, codebase_map_missing, usage_global_registry_read_only |
| 2026-04-30T23:26:16+08:00 | stzhengli | session_end | completed | Problem Handling preflight -> R0.5 Codebase Map / Project Understanding | gbrain_sync_off, codebase_map_missing, usage_global_registry_read_only |
| 2026-04-30T23:20:02+08:00 | stzhengli | session_start | in_progress | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |
| 2026-04-30T23:19:26+08:00 | stzhengli | codex_session_start | in_progress | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |
| 2026-04-30T23:19:25+08:00 | stzhengli | harness_init | ready | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |
| 2026-04-30T06:31:23+08:00 | .codex-tools | session_end | completed | R14 System / Agent Capability Tuning | gbrain_query_timeout, gbrain_sync_off, gstack_harness_registry_erofs, not_git_repo_blocks_review_release, test_refresh_large_session_files skipped: insufficient disk space |
| 2026-04-30T06:03:38+08:00 | .codex-tools | session_end | completed | R14 System / Agent Capability Tuning | gbrain_query_timeout, gbrain_sync_off, gstack_harness_registry_erofs, not_git_repo_blocks_review_release |
| 2026-04-30T05:58:02+08:00 | .codex-tools | session_start | in_progress | Problem Handling preflight, then R0 Restore / Resume Context | gbrain_query_timeout, gbrain_sync_off |

## Scanned Targets

- /mnt/c/Users/Admin/Desktop/.codex-tools
- /tmp/gstack-pipeline-check.3nsFvq
- /mnt/e/DONE/stzhengli
- /tmp/gstack-flow-check-M3trlm
- /tmp/gstack-harness-self-test-283167/install
- /tmp/gstack-flow-check-QIciNf
- /tmp/gstack-remediate-empty-e0dYVG
- /tmp/gstack-remediate-empty-QHs5fd
- /tmp/gstack-harness-self-test-285645/install
- /tmp/gstack-harness-self-test-287384/install
- /tmp/gstack-harness-self-test-288959/install
- /tmp/gstack-harness-self-test-292737/install
- /tmp/gstack-harness-self-test-294788/install
- /tmp/gstack-harness-self-test-297755/install
- /tmp/tmp.CVS6qJVO4D
- /tmp/gstack-harness-self-test-302816/install
- /tmp/gstack-harness-self-test-306111/install
- /tmp/gstack-harness-self-test-311062/install
- /tmp/gstack-harness-self-test-316493/install
- /tmp/gstack-harness-self-test-321174/install
- /tmp/gstack-harness-self-test-326750/install
- /tmp/gstack-harness-self-test-332503/install
- /home/adminpcm/projects/maoheshuizhinengti
