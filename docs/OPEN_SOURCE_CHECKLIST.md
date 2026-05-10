# Open Source Checklist

Use this checklist before pushing the repository to a public remote.

- [ ] `git status --short --ignored` shows only expected source changes and ignored runtime artifacts.
- [ ] `git grep -n -E "/home/|adminpcm|API_KEY|TOKEN|SECRET|PASSWORD"` has no private paths or secrets in tracked source.
- [ ] `npm test` passes.
- [ ] `npm run check:shell` passes.
- [ ] `bin/gstack-harness-self-test` passes when local gbrain/gstack dependencies are available.
- [ ] Generated runtime files are ignored: `.gitnexus/`, `.ai-context/gitnexus-*`, `.ai-context/gbrain-fallback/`, `PROJECT_STATE.md`, `.gstack/project-state.json`, `.gstack/harness/agents/`, `.gstack/harness/bin/`, `.gstack/usage-runs/*.json`, `docs/agents/*.json`.
- [ ] Real usage reports are removed or sanitized into example files.
- [ ] README quick start and contribution rules match the current source layout.
- [ ] README or release notes state that `pggg` does not silently install global gstack/gbrain dependencies; any dependency bootstrap must be explicit and user-approved.
