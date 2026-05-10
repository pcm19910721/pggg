# Security Policy

## Reporting

Please report security issues privately to the maintainers before opening a public issue. Include the affected command, input, generated artifact, and any relevant logs with secrets removed.

## Sensitive Data Rules

This project writes local evidence files and may summarize project state into gbrain. Before sharing logs or reports:

- remove API keys, tokens, cookies, private URLs, and local usernames;
- remove generated `.gitnexus/` indexes unless the target repository is public;
- remove `.ai-context/gbrain-fallback/` files if they contain private project state;
- replace local absolute paths with `/path/to/project` style placeholders.

The harness should preserve evidence without silently uploading raw source trees, raw GitNexus indexes, or generated runtime state.
