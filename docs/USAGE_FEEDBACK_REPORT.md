# Usage Feedback Report

Generated: 2026-05-10T08:36:13.525Z

## Summary

- Projects scanned: 210
- Usage runs found: 76
- Targets without usage runs: 204

## Recommended Template Source Actions

- Keep gbrain timeout handling in the required Problem Handling path, and consider adding retry/backoff evidence to the run record.
- Clarify target_project git requirements before review, release, and ship recipes.
- Promote repeated stall points into handoff contract changes or workflow recipe changes.
- Review repeated capability gaps and decide whether they need a new agent, stricter gate, or better handoff artifact.

## Warning Counts

| Name | Count |
| --- | --- |
| gbrain_mcp_put_page_transport_failed_once | 20 |
| release_blocked_no_remote_or_deploy_target | 20 |
| gbrain_query_timeout | 19 |
| gbrain_sync_off | 19 |
| local_code_context_status_refreshed | 17 |
| gbrain_project_memory_sync_failed | 16 |
| gbrain_unavailable | 16 |
| local_installed_recorder_version_stale | 16 |
| usage_global_registry_write_failed | 15 |
| usage_registry_write_failed: EROFS writing /home/adminpcm/.gstack-harness/projects.jsonl; local usage run recorded | 15 |
| gitnexus_query_fts_readonly_degraded: query returned empty results after FTS index ensure failed against read-only database; used GitNexus context and source docs for local context | 13 |
| usage_recorder_argument_space_issue: --agent value with spaces was parsed as extra argument | 13 |

## Blocker Counts

| Name | Count |
| --- | --- |
| gbrain_unavailable | 10 |

## Recipe Counts

| Name | Count |
| --- | --- |
| R-0.5 Foundation Remediation | 24 |
| R0 Restore / Resume Context | 18 |
| Problem Handling preflight, then R0 Restore / Resume Context | 12 |
| local-preview | 6 |
| R1 New Idea / Product Direction | 4 |
| Agent chain rehearsal: code-context -> health -> review | 2 |
| Problem Handling preflight -> R0.5 Codebase Map / Project Understanding | 2 |
| R14 System / Agent Capability Tuning | 2 |
| R5 Reality Test / Browser QA after runner dependency fix | 2 |
| Engineering closeout | 1 |
| Full Agent Acceptance | 1 |
| R4 Build After Plan | 1 |

## Event Counts

| Name | Count |
| --- | --- |
| harness_init | 25 |
| session_end | 15 |
| foundation_remediation | 13 |
| session_start | 10 |
| codex_session_start | 3 |
| engineering_closeout | 1 |
| gbrain_chain_scenario_verification | 1 |
| probe | 1 |
| probe-source | 1 |
| recorder_installed_copy_verification | 1 |
| rehearsal_round_1_recorder_verification | 1 |
| rehearsal_round_2_code_context_review | 1 |

## Status Counts

| Name | Count |
| --- | --- |
| completed | 19 |
| ready | 18 |
| in_progress | 13 |
| blocked | 10 |
| fixed | 8 |
| partial | 8 |

## Stall Points

| Name | Count |
| --- | --- |
| gbrain query timed out twice; global harness registry append failed on read-only /home/adminpcm/.gstack-harness/projects.jsonl | 1 |
| sync-gbrain/readiness: gbrain CLI unavailable, fallback artifacts written | 1 |

## User Corrections

_None._

## Capability Gaps

| Name | Count |
| --- | --- |
| harness_seed_page_missing_project_uid_metadata | 20 |
| agent run contract must represent gbrain fallback as first-class evidence and route blocked readiness to remediation | 17 |
| installed_harness_recorder_must_capture_repeatable_agents_skills_tools_after_upgrade | 16 |
| postchange_handoff_must_record_test_evidence_for_review | 15 |
| postchange_should_distinguish_global_detect_risk_from_target_impact_risk | 11 |
| readonly-git-and-registry-handling | 11 |
| browser-qa-system-dependency-missing-libnspr4 | 9 |
| browser-qa-cjk-fonts-missing | 7 |
| harness-gbrain-timeout-state-template | 5 |
| codebase-map-missing-after-foundation | 2 |
| harness-usage-registry-erofs-fallback | 2 |
| harness-usage-registry-read-only | 2 |

## Recent Runs

| Time | Project | Event | Status | Recipe | Warnings |
| --- | --- | --- | --- | --- | --- |
| 2026-05-10T16:13:41+08:00 | gstack-multiagent | engineering_closeout | completed | Engineering closeout | gitnexus_detect_changes_critical_due_large_dirty_worktree |
| 2026-05-10T15:50:11+08:00 | gstack-multiagent | recorder_installed_copy_verification | completed | R0 Restore / Resume Context |  |
| 2026-05-10T15:48:53+08:00 | gstack-multiagent | gbrain_chain_scenario_verification | completed | R0 Restore / Resume Context |  |
| 2026-05-10T15:21:55+08:00 | scenariopcmgbrainscenarioql | probe | completed | R0 Restore / Resume Context |  |
| 2026-05-10T15:21:55+08:00 | scenariopcmgbrainscenarioql | probe-source | completed | R0 Restore / Resume Context |  |
| 2026-05-10T12:31:17+08:00 | huanzhuang | harness_init | ready | R0 Restore / Resume Context | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T12:27:49+08:00 | huanzhuang | harness_init | ready | R0 Restore / Resume Context | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low, gbrain_unavailable |
| 2026-05-10T12:23:53+08:00 | huanzhuang | harness_init | ready | R0 Restore / Resume Context | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T12:23:32+08:00 | huanzhuang | foundation_remediation | fixed | R-0.5 Foundation Remediation | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T12:16:34+08:00 | huanzhuang | harness_init | ready | R0 Restore / Resume Context | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T12:12:41+08:00 | huanzhuang | harness_init | ready | R0 Restore / Resume Context | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T12:12:23+08:00 | huanzhuang | foundation_remediation | fixed | R-0.5 Foundation Remediation | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, detect_risk_high_but_target_impact_low |
| 2026-05-10T11:12:57+08:00 | huanzhuang | rehearsal_round_3_installed_risk_split | blocked | R-0.5 Foundation Remediation | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, gbrain_project_memory_sync_failed, detect_risk_high_but_target_impact_low |
| 2026-05-10T11:12:25+08:00 | huanzhuang | harness_init | blocked | R-0.5 Foundation Remediation | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, gbrain_project_memory_sync_failed |
| 2026-05-10T11:12:24+08:00 | huanzhuang | foundation_remediation | blocked | R-0.5 Foundation Remediation | release_blocked_no_remote_or_deploy_target, gbrain_mcp_put_page_transport_failed_once, gbrain_unavailable, local_code_context_status_refreshed, local_installed_recorder_version_stale, gitnexus_detect_changes_high_after_harness_refresh, detect_changes_high_from_harness_rehearsal_noise, gbrain_project_memory_sync_failed |

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
- /tmp/gstack-harness-self-test-69022/install
- /tmp/gstack-harness-self-test-74301/install
- /tmp/gstack-harness-self-test-79625/install
- /home/adminpcm/gstack-multiagent
- /tmp/gstack-harness-self-test-86967/install
- /tmp/gstack-harness-self-test-92137/install
- /tmp/gstack-harness-self-test-109766/install
- /tmp/gstack-harness-self-test-114739/install
- /tmp/gstack-harness-self-test-134282/install
- /tmp/gstack-harness-self-test-135479/install
- /tmp/gstack-harness-self-test-139532/install
- /tmp/gstack-harness-self-test-149478/install
- /tmp/gstack-harness-self-test-159610/install
- /tmp/gstack-harness-self-test-160758/install
- /tmp/gstack-harness-self-test-173183/install
- /tmp/gstack-harness-self-test-187406/install
- /tmp/gstack-harness-self-test-192177/install
- /tmp/gstack-harness-self-test-253821/install
- /home/adminpcm/projects/huanzhuang
- /tmp/gstack-harness-self-test-317172/install
- /tmp/gstack-harness-self-test-317172/seeded
- /tmp/gstack-harness-self-test-339848/install
- /tmp/gstack-harness-self-test-339848/seeded
- /tmp/gstack-harness-self-test-366915/install
- /tmp/gstack-harness-self-test-366915/seeded
- /tmp/gstack-harness-self-test-373692/install
- /tmp/gstack-harness-self-test-376856/install
- /tmp/gstack-harness-self-test-376856/seeded
- /tmp/gstack-harness-self-test-383124/install
- /tmp/gstack-harness-self-test-383124/seeded
- /tmp/gstack-harness-self-test-389693/install
- /tmp/gstack-harness-self-test-389693/seeded
- /tmp/gstack-harness-self-test-396117/install
- /tmp/gstack-harness-self-test-396117/seeded
- /tmp/gstack-harness-self-test-396117/preserve
- /tmp/gstack-harness-self-test-406292/install
- /tmp/gstack-harness-self-test-406292/seeded
- /tmp/gstack-harness-self-test-416408/install
- /tmp/gstack-harness-self-test-416408/seeded
- /tmp/gstack-harness-self-test-423539/install
- /tmp/gstack-harness-self-test-423539/seeded
- /tmp/gstack-harness-self-test-423539/preserve
- /tmp/gstack-harness-self-test-433627/install
- /tmp/gstack-harness-self-test-433627/seeded
- /tmp/gstack-harness-self-test-433627/preserve
- /tmp/gstack-harness-self-test-443332/install
- /tmp/gstack-harness-self-test-443332/seeded
- /tmp/gstack-harness-self-test-443332/preserve
- /tmp/gstack-harness-self-test-689969/install
- /tmp/gstack-harness-self-test-689969/seeded
- /tmp/gstack-harness-self-test-689969/preserve
- /tmp/gstack-harness-self-test-697918/install
- /tmp/gstack-harness-self-test-697918/seeded
- /tmp/gstack-harness-self-test-697918/preserve
- /tmp/gstack-harness-self-test-706331/install
- /tmp/gstack-harness-self-test-706331/seeded
- /tmp/gstack-harness-self-test-706331/preserve
- /tmp/gstack-harness-self-test-36869/install
- /tmp/gstack-harness-self-test-36869/seeded
- /tmp/gstack-harness-self-test-36869/preserve
- /tmp/gstack-harness-self-test-52051/install
- /tmp/gstack-harness-self-test-52051/seeded
- /tmp/gstack-harness-self-test-52051/preserve
- /tmp/gstack-harness-self-test-64248/install
- /tmp/gstack-harness-self-test-64248/seeded
- /tmp/gstack-harness-self-test-64248/preserve
- /tmp/gstack-harness-self-test-40127/install
- /tmp/gstack-harness-self-test-40127/seeded
- /tmp/gstack-harness-self-test-47512/install
- /tmp/gstack-harness-self-test-47512/seeded
- /tmp/gstack-harness-self-test-54905/install
- /tmp/gstack-harness-self-test-54905/seeded
- /tmp/gstack-harness-self-test-54905/preserve
- /tmp/gstack-harness-self-test-63799/install
- /tmp/gstack-harness-self-test-63799/seeded
- /tmp/gstack-harness-self-test-63799/preserve
- /tmp/gstack-harness-self-test-75146/install
- /tmp/gstack-harness-self-test-75146/seeded
- /tmp/gstack-harness-self-test-75146/preserve
- /tmp/gstack-harness-self-test-84659/install
- /tmp/gstack-harness-self-test-84659/seeded
- /tmp/gstack-harness-self-test-89282/install
- /tmp/gstack-harness-self-test-89282/seeded
- /tmp/gstack-harness-self-test-89282/preserve
- /tmp/gstack-harness-self-test-98624/install
- /tmp/gstack-harness-self-test-98624/seeded
- /tmp/gstack-harness-self-test-98624/preserve
- /tmp/gstack-harness-self-test-107285/install
- /tmp/gstack-harness-self-test-107285/seeded
- /tmp/gstack-harness-self-test-107285/preserve
- /tmp/gstack-harness-self-test-119155/install
- /tmp/gstack-harness-self-test-119155/seeded
- /tmp/gstack-harness-self-test-119155/preserve
- /tmp/gstack-harness-self-test-129408/install
- /tmp/gstack-harness-self-test-129408/seeded
- /tmp/gstack-harness-self-test-134021/install
- /tmp/gstack-harness-self-test-134021/seeded
- /tmp/gstack-harness-self-test-134021/preserve
- /tmp/gstack-harness-self-test-144322/install
- /tmp/gstack-harness-self-test-144322/seeded
- /tmp/gstack-harness-self-test-144322/preserve
- /tmp/gstack-harness-self-test-159452/install
- /tmp/gstack-harness-self-test-159452/seeded
- /tmp/gstack-harness-self-test-166105/install
- /tmp/gstack-harness-self-test-166105/seeded
- /tmp/gstack-harness-self-test-172651/install
- /tmp/gstack-harness-self-test-172651/seeded
- /tmp/gstack-harness-self-test-181688/install
- /tmp/gstack-harness-self-test-181688/seeded
- /tmp/gstack-harness-self-test-181688/preserve
- /tmp/gstack-harness-self-test-195661/install
- /tmp/gstack-harness-self-test-195661/seeded
- /tmp/gstack-harness-self-test-195661/preserve
- /tmp/gstack-harness-self-test-200436/install
- /tmp/gstack-harness-self-test-200436/seeded
- /tmp/gstack-harness-self-test-200436/preserve
- /tmp/gstack-harness-self-test-213327/install
- /tmp/gstack-harness-self-test-213327/seeded
- /tmp/gstack-harness-self-test-213327/preserve
- /tmp/gstack-harness-self-test-223918/install
- /tmp/gstack-harness-self-test-223918/seeded
- /tmp/gstack-harness-self-test-223918/preserve
- /tmp/gstack-harness-self-test-235220/install
- /tmp/gstack-harness-self-test-235220/seeded
- /tmp/gstack-harness-self-test-235220/preserve
- /tmp/gstack-harness-self-test-249370/install
- /tmp/gstack-harness-self-test-249370/seeded
- /tmp/gstack-harness-self-test-249370/preserve
- /tmp/gstack-harness-self-test-261731/install
- /tmp/gstack-harness-self-test-261731/seeded
- /tmp/gstack-harness-self-test-261731/preserve
- /tmp/gstack-harness-self-test-273695/install
- /tmp/gstack-harness-self-test-273695/seeded
- /tmp/gstack-harness-self-test-273695/preserve
- /tmp/gstack-harness-self-test-305751/install
- /tmp/gstack-harness-self-test-305751/seeded
- /tmp/gstack-harness-self-test-305751/preserve
- /tmp/gstack-harness-self-test-316735/install
- /tmp/gstack-harness-self-test-316735/seeded
- /tmp/gstack-harness-self-test-323176/install
- /tmp/gstack-harness-self-test-323176/seeded
- /tmp/gstack-harness-self-test-329939/install
- /tmp/gstack-harness-self-test-329939/seeded
- /tmp/gstack-harness-self-test-329939/preserve
- /tmp/gstack-harness-self-test-357156/install
- /tmp/gstack-harness-self-test-357156/seeded
- /tmp/gstack-harness-self-test-357156/preserve
- /tmp/gstack-harness-self-test-370415/install
- /tmp/gstack-harness-self-test-370415/seeded
- /tmp/gstack-harness-self-test-370415/preserve
- /tmp/pcm-gbrain-scenario-RqWBHl
- /tmp/gstack-harness-self-test-389357/install
- /tmp/gstack-harness-self-test-389357/seeded
- /tmp/gstack-harness-self-test-389357/preserve
- /tmp/gstack-harness-self-test-405581/install
- /tmp/gstack-harness-self-test-413902/install
- /tmp/gstack-harness-self-test-417442/install
- /tmp/gstack-harness-self-test-421380/install
- /tmp/gstack-harness-self-test-424547/install
- /tmp/gstack-harness-self-test-424547/seeded
- /tmp/gstack-harness-self-test-430452/install
- /tmp/gstack-harness-self-test-430452/seeded
- /tmp/gstack-harness-self-test-430677/install
- /tmp/gstack-harness-self-test-430677/seeded
- /tmp/gstack-harness-self-test-430452/preserve
- /tmp/gstack-harness-self-test-430677/preserve
- /tmp/gstack-harness-self-test-448399/install
- /tmp/gstack-harness-self-test-448399/seeded
- /tmp/gstack-harness-self-test-448399/preserve
- /tmp/gstack-harness-self-test-460650/install
- /tmp/gstack-harness-self-test-460650/seeded
- /tmp/gstack-harness-self-test-460650/preserve
- /tmp/gstack-harness-self-test-471389/install
- /tmp/gstack-harness-self-test-471389/seeded
- /tmp/gstack-harness-self-test-471389/preserve
- /tmp/gstack-harness-self-test-482267/install
- /tmp/gstack-harness-self-test-482267/seeded
- /tmp/gstack-harness-self-test-482267/preserve
- /tmp/gstack-harness-self-test-495905/install
- /tmp/gstack-harness-self-test-495905/seeded
- /tmp/gstack-harness-self-test-495905/preserve
- /tmp/gstack-harness-self-test-511750/install
- /tmp/gstack-harness-self-test-511750/seeded
- /tmp/gstack-harness-self-test-511750/preserve
- /tmp/gstack-harness-self-test-525163/install
- /tmp/gstack-harness-self-test-525163/seeded
- /tmp/gstack-harness-self-test-525163/preserve
