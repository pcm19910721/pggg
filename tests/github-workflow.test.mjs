import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('GitHub Actions runs the full harness verification gate', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'test.yml'), 'utf8');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /actions\/checkout@v6(?:\.\d+){0,2}/);
  assert.match(workflow, /actions\/setup-node@v6(?:\.\d+){0,2}/);
  assert.doesNotMatch(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /timeout-minutes:/);
  assert.match(workflow, /run: npm run verify/);
  assert.doesNotMatch(workflow, /run: npm test\b/);
  assert.doesNotMatch(workflow, /run: npm run check:shell\b/);
});
