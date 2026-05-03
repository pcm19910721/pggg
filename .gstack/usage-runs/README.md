# Usage Runs

This directory stores append-only structured feedback from real harness usage in this target project.

The installer records `harness_init` automatically. Agents should record session snapshots with:

```bash
.gstack/harness/bin/gstack-harness-record-run --event session_end --status completed
```

Template-source maintainers can aggregate registered target projects with:

```bash
gstack-harness-usage-report
```

To keep aggregation running after reboot, enable the user timer once:

```bash
.gstack/harness/bin/gstack-harness-enable-report-timer
```
