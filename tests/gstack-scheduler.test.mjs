import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  analyzeTask,
  initializeScheduler,
  loadSchedulerState,
  claimNextTask,
  completeTask,
  registerAgent,
  scheduleTask,
} from '../scripts/gstack-scheduler.mjs';

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-scheduler-test-'));
}

test('analyzeTask decomposes a complex coding task into design, implementation, and test subtasks', () => {
  const analysis = analyzeTask({
    id: 'task-demo',
    type: 'coding',
    priority: 'high',
    description: 'Implement a scheduler across multiple modules with tests and review gates. '.repeat(5),
  });

  assert.equal(analysis.recommendedDomain, 'integration');
  assert.equal(analysis.subtasks.length, 3);
  assert.deepEqual(
    analysis.subtasks.map((item) => [item.id, item.type, item.recommendedDomain, item.dependencies]),
    [
      ['task-demo.design', 'analysis', 'core', []],
      ['task-demo.implement', 'coding', 'integration', ['task-demo.design']],
      ['task-demo.test', 'testing', 'support', ['task-demo.implement']],
    ],
  );
  assert.equal(analysis.strategy, 'fan-out-fan-in');
  assert.equal(analysis.modelTier, 'frontier');
});

test('scheduleTask chooses the best available agent using capability, load, history, health, and availability', () => {
  const project = tempProject();
  initializeScheduler(project, { topology: 'hierarchical-mesh', maxAgents: 6 });

  registerAgent(project, {
    agentId: 'agent-busy-coder',
    role: 'Build Agent',
    domain: 'integration',
    capabilities: ['coding', 'implementation'],
    status: 'busy',
    workload: 0.9,
    health: 1,
    successRate: 0.99,
    averageDurationMs: 1000,
  });
  registerAgent(project, {
    agentId: 'agent-good-coder',
    role: 'Build Agent',
    domain: 'integration',
    capabilities: ['coding', 'implementation', 'debugging'],
    status: 'idle',
    workload: 0.1,
    health: 0.95,
    successRate: 0.85,
    averageDurationMs: 8000,
  });
  registerAgent(project, {
    agentId: 'agent-reviewer',
    role: 'Review Agent',
    domain: 'support',
    capabilities: ['review'],
    status: 'idle',
    workload: 0,
    health: 1,
    successRate: 0.9,
    averageDurationMs: 2000,
  });

  const result = scheduleTask(project, {
    taskId: 'task-1',
    type: 'coding',
    priority: 'normal',
    description: 'Add retry handling to the payment integration.',
  });

  assert.equal(result.status, 'assigned');
  assert.equal(result.primaryAgent.agentId, 'agent-good-coder');
  assert.equal(result.task.assignedTo, 'agent-good-coder');
  assert.ok(result.agentScores[0].totalScore > result.agentScores[1].totalScore);

  const state = loadSchedulerState(project);
  assert.equal(state.agents.agents['agent-good-coder'].status, 'busy');
  assert.equal(state.tasks.tasks['task-1'].status, 'assigned');
});

test('scheduleTask queues work when no agent is available in the recommended domain', () => {
  const project = tempProject();
  initializeScheduler(project, { topology: 'hierarchical-mesh', maxAgents: 3 });
  registerAgent(project, {
    agentId: 'agent-full',
    role: 'Build Agent',
    domain: 'integration',
    capabilities: ['coding'],
    status: 'busy',
    workload: 1,
    health: 1,
    successRate: 0.8,
    averageDurationMs: 1000,
  });

  const result = scheduleTask(project, {
    taskId: 'task-queued',
    type: 'coding',
    priority: 'normal',
    description: 'Implement a small parser.',
  });

  assert.equal(result.status, 'queued');
  assert.equal(result.primaryAgent, null);
  assert.equal(result.queuedDomain, 'integration');

  const state = loadSchedulerState(project);
  assert.deepEqual(state.queues.queues.integration, ['task-queued']);
  assert.equal(state.tasks.tasks['task-queued'].status, 'queued');
});

test('claimNextTask assigns queued work to an idle agent and removes it from the queue', () => {
  const project = tempProject();
  initializeScheduler(project, { topology: 'hierarchical-mesh', maxAgents: 3 });
  scheduleTask(project, {
    taskId: 'task-queued',
    type: 'coding',
    priority: 'normal',
    description: 'Implement a small parser.',
  });
  registerAgent(project, {
    agentId: 'agent-good-coder',
    role: 'Build Agent',
    domain: 'integration',
    capabilities: ['coding', 'implementation'],
    status: 'idle',
    workload: 0,
    health: 1,
    successRate: 0.9,
    averageDurationMs: 1000,
  });

  const result = claimNextTask(project, { agentId: 'agent-good-coder' });

  assert.equal(result.status, 'assigned');
  assert.equal(result.task.taskId, 'task-queued');
  assert.equal(result.task.assignedTo, 'agent-good-coder');

  const state = loadSchedulerState(project);
  assert.deepEqual(state.queues.queues.integration, []);
  assert.equal(state.tasks.tasks['task-queued'].status, 'assigned');
  assert.equal(state.agents.agents['agent-good-coder'].status, 'busy');
  assert.equal(state.agents.agents['agent-good-coder'].currentTask, 'task-queued');
});

test('completeTask records task evidence and releases the assigned agent', () => {
  const project = tempProject();
  initializeScheduler(project, { topology: 'hierarchical-mesh', maxAgents: 3 });
  registerAgent(project, {
    agentId: 'agent-good-coder',
    role: 'Build Agent',
    domain: 'integration',
    capabilities: ['coding', 'implementation'],
    status: 'idle',
    workload: 0.1,
    health: 1,
    successRate: 0.9,
    averageDurationMs: 1000,
  });
  scheduleTask(project, {
    taskId: 'task-1',
    type: 'coding',
    priority: 'normal',
    description: 'Implement a small parser.',
  });

  const result = completeTask(project, {
    taskId: 'task-1',
    status: 'completed',
    result: 'Implemented with tests.',
    evidence: ['diff', 'test'],
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.task.completedAt.length > 0, true);
  assert.deepEqual(result.task.evidence, ['diff', 'test']);

  const state = loadSchedulerState(project);
  assert.equal(state.tasks.tasks['task-1'].status, 'completed');
  assert.equal(state.agents.agents['agent-good-coder'].status, 'idle');
  assert.equal(state.agents.agents['agent-good-coder'].currentTask, null);
  assert.equal(state.agents.agents['agent-good-coder'].taskCount, 1);
  assert.equal(state.agents.agents['agent-good-coder'].workload, 0);
});
