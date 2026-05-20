# Workspace Hygiene Agent Design

## Context

GStack Harness currently improves project memory, agent routing, code context, and
run evidence. It also creates local artifacts in installed target projects:
`.gstack/`, `.ai-context/`, `.gitnexus/`, generated reports, backups, usage runs,
and browser or QA evidence.

The problem is not that artifacts exist. The problem is that the target project
does not get a durable workspace contract explaining which files are source,
which files are evidence, which files are cache, which files are large assets,
and which files are dangerous to commit.

Two target projects show the gap.

`~/TPW-amz` is about `943M`. The largest growth areas are:

- `outputs/`: about `580M`, product image and export outputs.
- `TPW-amz/chrome-profile/`: about `109M`, browser profile state.
- `TPW-amz/chrome-cdp-profile/`: about `34M`, browser automation profile state.
- `.gitnexus/`: about `33M`, local code index.
- `output/playwright/`: about `21M`, browser test artifacts.
- `captures/`: about `11M`, capture evidence.
- `.env`, cookie files, Chrome cookie databases, and profile databases are
  present and must be treated as secret or sign-in state risk.

`~/projects/cloudcontrol` is about `2.8G`. The largest growth areas are:

- `cloudcontrolprojects/apk-download-service/public-files/`: about `891M`.
- `cloudcontrolprojects/apk/`: about `891M`.
- `cloudcontrolprojects/apk-download-service/dist/`: about `829M`.
- `cloudctl/artifacts/`: about `29M`, device screenshots and tree captures.
- `.gitnexus/`: about `54M`.
- APKs, zips, firmware, dashboard run logs, screenshots, and generated service
  bundles are mixed with source and docs.

This is larger than `.gitignore`. `.gitignore` hides noise from Git, but it does
not answer what should be moved, retained, reviewed, summarized, or blocked
before commit.

## Decision

Add a required core **Workspace Hygiene Agent** to every installed gstack target
project.

Workspace Hygiene Agent owns the target project's file hygiene contract:

- scan installed target projects for generated, runtime, large, and risky files;
- classify changed and untracked files into human-readable buckets;
- detect disk growth after QA, browser testing, and other artifact-heavy flows;
- recommend `.gitignore` additions without silently changing project policy;
- recommend artifact relocation into `.gstack/runtime/`, `.gstack/artifacts/`,
  or project-specific `artifacts/` directories;
- flag secret and sign-in state risks before commit;
- block commit or release gates when staged files include dangerous artifacts.

The agent must not delete user files by default. Cleanup is always an explicit
action after report review.

## Placement

Workspace Hygiene Agent sits after Repository State Agent and before commit,
review, release, and long-running QA loops:

```text
pggg / harness init
-> Foundation Readiness
-> Foundation Remediation if needed
-> Repository State Agent
-> Workspace Hygiene Agent
-> Code Context Agent / GitNexus
-> Build / Reality Test / Review / Release
```

For QA and browser-heavy workflows:

```text
before QA: Repository State snapshot + Workspace Hygiene baseline
-> QA / browse / playwright / device test
after QA: Workspace Hygiene delta report
-> Review / fix / commit gate
```

Repository State Agent answers "what changed in Git?" Workspace Hygiene Agent
answers "what kind of files are these, how big did they get, and are they safe?"

## Responsibilities

Workspace Hygiene Agent owns:

- current workspace size by directory;
- top file and directory growth since a baseline;
- untracked, modified, ignored, and staged file classification;
- known harness-owned files and directories;
- generated report and backup noise;
- QA/browser/device evidence directories;
- large binary and packaged asset detection;
- secret, cookie, database, token, profile, and local account state detection;
- recommended `.gitignore` additions;
- recommended relocation paths;
- commit gate verdict for dangerous staged files;
- human-readable hygiene report and machine-readable JSON state.

It does not own:

- semantic code impact analysis;
- deciding whether a large asset is a real product asset;
- deleting files;
- rewriting application output paths without implementation approval;
- Git operations such as reset, stash, or commit;
- replacing Repository State Agent's baseline and staged-scope facts.

## Interfaces

Workspace Hygiene Agent writes:

```text
docs/WORKSPACE_HYGIENE_REPORT.md
.gstack/workspace-hygiene.json
.gstack/workspace-hygiene-baseline.json
docs/agents/workspace-hygiene.json
```

`.gstack/project-state.json` gains:

```json
{
  "workspace_hygiene": {
    "status": "warning",
    "report": "docs/WORKSPACE_HYGIENE_REPORT.md",
    "baseline_path": ".gstack/workspace-hygiene-baseline.json",
    "total_size_bytes": 3035832320,
    "growth_since_baseline_bytes": 94371840,
    "buckets": {
      "source_candidate": 12,
      "harness_owned": 42,
      "runtime_artifact": 310,
      "large_asset": 18,
      "secret_risk": 3,
      "backup_noise": 25,
      "unknown_review": 7
    },
    "largest_dirs": [],
    "secret_risks": [],
    "large_assets": [],
    "ignore_recommendations": [],
    "relocation_recommendations": [],
    "commit_gate": "blocked",
    "warnings": [],
    "blockers": []
  }
}
```

## Classification Buckets

The scanner should classify each relevant file into one primary bucket.

`source_candidate`
: Files likely to be source, tests, docs, config, or project content. These may
  belong in commits and should be reviewed normally.

`harness_owned`
: Files created by gstack harness or code context, such as `.gstack/`,
  `.ai-context/`, `.gitnexus/`, generated agent JSON, usage runs, readiness
  outputs, and local bridge state.

`runtime_artifact`
: Files created while running, testing, browsing, or probing the app, such as
  Playwright output, screenshots, browser profiles, Chrome cache, device tree
  captures, `test-results/`, `captures/`, and runtime logs.

`large_asset`
: Large binaries or packaged files such as `.apk`, `.zip`, `.7z`, `.tar.gz`,
  `.img`, `.exe`, large generated images, firmware, and release bundles.

`secret_risk`
: Files likely to contain secrets or local account state, such as `.env`,
  cookies, Chrome `Cookies` databases, `.sqlite`, `.db`, `.pma`, token files,
  account profiles, and local credential exports.

`backup_noise`
: Timestamped backups, `.bak-*`, Windows `Zone.Identifier` sidecars, old generated
  report backups, and repeated harness-install backups.

`unknown_review`
: Files that do not match a known rule or conflict with several rules. These must
  be shown clearly rather than hidden.

## Default Policy

The first implementation should use conservative defaults:

```yaml
workspace_hygiene_policy:
  scan_ignored_files: true
  scan_untracked_files: true
  scan_modified_files: true
  scan_staged_files: true
  max_report_items_per_bucket: 25
  large_file_threshold_mb: 10
  large_directory_threshold_mb: 100
  secret_risk_blocks_commit: true
  browser_profile_blocks_commit: true
  generated_runtime_blocks_commit: true
  large_asset_blocks_commit: ask
  auto_apply_gitignore: false
  auto_delete_files: false
  auto_move_files: false
```

Safe automation:

- scan and classify files;
- write reports and JSON artifacts;
- write a hygiene baseline;
- recommend `.gitignore` additions;
- warn after QA if workspace size grew sharply;
- block obviously dangerous staged files.

Ask first:

- modifying `.gitignore`;
- moving files into `.gstack/runtime/` or `artifacts/`;
- deleting caches, profiles, logs, outputs, or backups;
- allowing large assets through a commit gate;
- changing app scripts to write outputs somewhere else.

Never do automatically:

- delete user files;
- remove product assets;
- remove QA evidence needed for the current task;
- scrub or rewrite secrets in place;
- stage all untracked files.

## Gitignore Strategy

The agent should distinguish between standard harness ignores and
project-specific recommendations.

Standard harness-owned ignores:

```text
.gstack/
.ai-context/
.gitnexus/
.understand-anything/
*.bak-*
```

Common runtime recommendations:

```text
test-results/
playwright-report/
.playwright-cli/
captures/
output/
outputs/
tmp/
**/chrome-profile/
**/chrome-cdp-profile/
```

Common large artifact recommendations:

```text
*.apk
*.zip
*.7z
*.tar.gz
*.img
*.exe
```

These large artifact rules should be recommendations, not universal automatic
changes. In projects like cloudcontrol, APKs and firmware may be real business
assets. The report must say "large asset, review storage policy" rather than
"delete this."

## QA Delta

Before QA, browse, or device test starts, the agent should write a baseline:

```text
.gstack/workspace-hygiene-baseline.json
```

The baseline records:

- timestamp;
- Git HEAD and branch if available;
- workspace total size;
- top directories by size;
- current untracked, ignored, and staged counts;
- current secret risks;
- current large assets;
- current runtime artifact directories.

After QA, the agent writes a delta section:

```text
## Since Baseline

- Added files: 142
- Added size: 96M
- Largest new directory: output/playwright, 21M
- New secret risks: 0
- New large assets: 1
- New runtime artifacts: 137
- Commit gate: warning
```

This directly addresses the observed "QA 后明显变大" failure mode. The user should
not need to remember what QA produced.

## Commit Gate

Workspace Hygiene commit gate should run before review, ship, or commit flows.

Gate states:

- `pass`: no risky staged files.
- `warning`: large assets or unknown files are staged and need explicit review.
- `blocked`: staged files include secret risk, browser profile, cookies,
  database, runtime cache, or known harness-owned runtime output.

Blocked examples:

```text
.env
**/Cookies
**/chrome-profile/**
**/chrome-cdp-profile/**
*.sqlite
*.db
*.pma
.gitnexus/**
.gstack/usage-runs/*.json
.ai-context/runs/**
```

Warning examples:

```text
*.apk
*.zip
*.7z
*.tar.gz
*.img
large generated images
dashboard run logs
device screenshots
```

The gate must explain the reason in plain language and name the file paths.

## Report Shape

`docs/WORKSPACE_HYGIENE_REPORT.md` should be readable without opening JSON.

Recommended sections:

```markdown
# Workspace Hygiene Report

Generated: <timestamp>
Target: <path>
Git: <branch/head/status>
Verdict: pass | warning | blocked

## Summary

## Since Baseline

## Buckets

## Secret And Sign-In State Risks

## Large Assets

## Runtime Artifacts

## Harness-Owned Files

## Gitignore Recommendations

## Relocation Recommendations

## Commit Gate

## Next Actions
```

The JSON report should preserve exact paths, sizes, Git statuses, bucket reasons,
and recommendations so later agents can consume it.

## Integration Points

`gstack-harness-init`
: Installs the policy defaults, creates placeholder report paths, and includes
  Workspace Hygiene Agent in generated team docs.

`gstack-harness-readiness`
: Performs a light hygiene probe and warns when a target has obvious dangerous
  files, large untracked directories, or missing hygiene artifacts.

`scripts/ai-context-bridge.mjs`
: Can include hygiene status in memory-check and postchange bundles, but should
  not own the scanner.

`gstack-harness-record-run`
: Records hygiene warnings and blockers as usage signals.

`/qa`, `/qa-only`, `/browse`, and Playwright-heavy workflows
: Should call the baseline before testing and the delta report after testing.

`/review`, `/ship`, and release workflows
: Should require a passing or explicitly acknowledged hygiene gate.

## Problem Handling

Workspace Hygiene issues should route through Workspace Hygiene Agent before
generic Problem Handling:

```text
workspace_hygiene_missing
workspace_hygiene_scan_failed
workspace_growth_too_large
secret_risk_detected
browser_profile_staged
runtime_artifact_staged
large_asset_policy_unknown
gitignore_recommendations_pending
artifact_relocation_pending
```

Problem Handling records the outcome. Workspace Hygiene Agent decides whether the
issue is warning, blocked, or safe to acknowledge.

## Minimum Viable Scope

The first implementation should:

1. add Workspace Hygiene Agent to required core agent docs and generated team files;
2. add hygiene policy defaults to `.gstack/project-state.json`;
3. add a read-only scanner command that writes `docs/WORKSPACE_HYGIENE_REPORT.md`
   and `.gstack/workspace-hygiene.json`;
4. classify Git status entries plus top ignored/runtime directories;
5. detect secret risks, browser profiles, runtime artifacts, large files, and
   backup noise;
6. generate `.gitignore` recommendations without applying them;
7. add baseline and delta modes for QA workflows;
8. add commit gate mode for staged files;
9. add tests using fixture projects that mimic TPW-amz and cloudcontrol patterns.

Do not implement automatic deletion, automatic migration, or automatic `.gitignore`
modification in the first version.

## Success Criteria

The agent succeeds when a user can run it on any installed target project and
answer these questions in under one minute:

- What files changed because of my work?
- What files were generated by gstack or QA?
- What directories grew the most?
- What is dangerous to commit?
- What should be ignored?
- What should move to an artifact directory?
- What needs human judgment before cleanup?

For the observed projects, success means:

- TPW-amz reports `outputs/`, browser profiles, Playwright output, captures,
  `.gitnexus/`, `.env`, cookies, and Chrome profile databases in the right buckets.
- cloudcontrol reports APK/public-files/dist growth, `cloudctl/artifacts/`,
  `.gitnexus/`, release bundles, dashboard logs, and `.env.local.txt` in the right
  buckets.
- QA after a baseline reports size growth and new artifacts without relying on
  the user's memory.
