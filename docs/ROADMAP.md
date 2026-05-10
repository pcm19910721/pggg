# Roadmap

## Near Term

- Keep `bin/` as the canonical executable source and treat installed `.gstack/harness/bin/` files as generated target layout.
- Convert real usage reports into sanitized examples before publishing.
- Keep dependency setup explicit: `pggg` detects missing global gstack/gbrain dependencies, but must not silently install them.
- Design a future `pggg bootstrap` or `pggg --install-deps` flow for user-approved gstack/gbrain setup.
- Expand CI coverage with shell linting when `shellcheck` is available.
- Add focused examples for onboarding a target project, syncing gbrain memory, and running post-change impact checks.

## Later

- Split template-source docs from installed-target docs more cleanly.
- Add fixture-based tests for public sample projects.
- Add a release checklist for publishing harness versions.
- Add compatibility notes for Codex, Claude, GitNexus, and gbrain versions.
