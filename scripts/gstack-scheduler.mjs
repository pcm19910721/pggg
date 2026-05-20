#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SCHEDULER_DIR = '.gstack/scheduler';
const SWARM_FILE = 'swarm.json';
const AGENTS_FILE = 'agents.json';
const TASKS_FILE = 'tasks.json';
const QUEUES_FILE = 'queues.json';
const HANDOFFS_DIR = 'handoffs';

const DOMAINS = ['queen', 'foundation', 'memory', 'code-context', 'core', 'integration', 'support', 'release'];

const DOMAIN_CAPABILITIES = {
  queen: ['coordination', 'planning', 'oversight'],
  foundation: ['readiness', 'remediation', 'environment'],
  memory: ['memory', 'gbrain', 'knowledge'],
  'code-context': ['gitnexus', 'impact', 'code-map'],
  core: ['architecture', 'analysis', 'design'],
  integration: ['coding', 'implementation', 'debugging'],
  support: ['testing', 'review', 'quality'],
  release: ['release', 'deploy', 'canary'],
};

const TYPE_CAPABILITIES = {
  research: ['research', 'analysis', 'synthesis'],
  analysis: ['analysis', 'reasoning'],
  coding: ['coding', 'implementation', 'debugging'],
  testing: ['testing', 'validation', 'quality'],
  review: ['review', 'analysis', 'quality'],
  documentation: ['documentation', 'writing'],
  coordination: ['coordination', 'planning'],
  release: ['release', 'deploy'],
  security: ['security', 'review'],
  custom: ['general'],
};

const TYPE_DOMAIN = {
  research: 'core',
  analysis: 'core',
  coding: 'integration',
  testing: 'support',
  review: 'support',
  documentation: 'support',
  coordination: 'queen',
  release: 'release',
  security: 'support',
  custom: 'core',
};

const PRIORITY_WEIGHT = {
  critical: 1.3,
  high: 1.15,
  normal: 1,
  low: 0.9,
  background: 0.8,
};

function schedulerPath(projectDir, file) {
  return path.join(projectDir, SCHEDULER_DIR, file);
}

function handoffPath(projectDir, taskId, ext) {
  return path.join(projectDir, SCHEDULER_DIR, HANDOFFS_DIR, `${taskId}.${ext}`);
}

function ensureSchedulerDir(projectDir) {
  fs.mkdirSync(path.join(projectDir, SCHEDULER_DIR), { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePriority(priority) {
  return Object.hasOwn(PRIORITY_WEIGHT, priority) ? priority : 'normal';
}

function normalizeTask(input) {
  const type = input.type || 'custom';
  return {
    taskId: input.taskId || input.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    priority: normalizePriority(input.priority || 'normal'),
    description: input.description || input.task || '',
    status: input.status || 'pending',
    assignedTo: input.assignedTo || null,
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso(),
    evidenceRequired: input.evidenceRequired || defaultEvidenceRequired(type),
    result: input.result || null,
  };
}

function normalizeAgent(input) {
  if (!input.agentId) {
    throw new Error('agentId is required');
  }
  const domain = input.domain || inferDomainFromRole(input.role || input.agentId);
  const capabilities = unique([
    ...(DOMAIN_CAPABILITIES[domain] || []),
    ...(input.capabilities || []),
  ]);
  return {
    agentId: input.agentId,
    role: input.role || input.agentId,
    domain,
    capabilities,
    status: input.status || 'idle',
    workload: clamp(Number(input.workload ?? 0), 0, 1),
    health: clamp(Number(input.health ?? 1), 0, 1),
    successRate: clamp(Number(input.successRate ?? input.success_rate ?? 0.75), 0, 1),
    averageDurationMs: Math.max(0, Number(input.averageDurationMs ?? input.average_duration_ms ?? 30000)),
    costTier: input.costTier || inferCostTier(domain),
    activeFiles: input.activeFiles || [],
    currentTask: input.currentTask || null,
    taskCount: Number(input.taskCount || 0),
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean).map(String)));
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function inferDomainFromRole(role) {
  const lower = role.toLowerCase();
  if (lower.includes('orchestrator') || lower.includes('queen')) return 'queen';
  if (lower.includes('foundation')) return 'foundation';
  if (lower.includes('memory') || lower.includes('gbrain')) return 'memory';
  if (lower.includes('context') || lower.includes('gitnexus')) return 'code-context';
  if (lower.includes('architect') || lower.includes('planning')) return 'core';
  if (lower.includes('build') || lower.includes('coder')) return 'integration';
  if (lower.includes('review') || lower.includes('test') || lower.includes('qa')) return 'support';
  if (lower.includes('release') || lower.includes('deploy')) return 'release';
  return 'core';
}

function inferCostTier(domain) {
  if (domain === 'queen' || domain === 'core' || domain === 'release') return 'frontier';
  if (domain === 'integration' || domain === 'support' || domain === 'code-context') return 'balanced';
  return 'economy';
}

function defaultEvidenceRequired(type) {
  if (type === 'coding') return ['diff', 'test', 'review'];
  if (type === 'testing') return ['test-output'];
  if (type === 'review') return ['review-report'];
  if (type === 'release') return ['review', 'qa', 'deployment-status'];
  return ['summary'];
}

export function initializeScheduler(projectDir = process.cwd(), options = {}) {
  ensureSchedulerDir(projectDir);
  const generatedAt = nowIso();
  const swarm = {
    swarmId: options.swarmId || `gstack-swarm-${Date.now()}`,
    topology: options.topology || 'hierarchical-mesh',
    maxAgents: Number(options.maxAgents || 12),
    strategy: options.strategy || 'evidence-gated',
    status: 'running',
    domains: DOMAINS,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
  const agents = { version: '1.0.0', agents: {} };
  const tasks = { version: '1.0.0', tasks: {} };
  const queues = {
    version: '1.0.0',
    queues: Object.fromEntries(DOMAINS.map((domain) => [domain, []])),
  };

  writeJson(schedulerPath(projectDir, SWARM_FILE), swarm);
  writeJson(schedulerPath(projectDir, AGENTS_FILE), agents);
  writeJson(schedulerPath(projectDir, TASKS_FILE), tasks);
  writeJson(schedulerPath(projectDir, QUEUES_FILE), queues);
  return { swarm, agents, tasks, queues };
}

export function loadSchedulerState(projectDir = process.cwd()) {
  ensureSchedulerDir(projectDir);
  const state = {
    swarm: readJson(schedulerPath(projectDir, SWARM_FILE), null),
    agents: readJson(schedulerPath(projectDir, AGENTS_FILE), { version: '1.0.0', agents: {} }),
    tasks: readJson(schedulerPath(projectDir, TASKS_FILE), { version: '1.0.0', tasks: {} }),
    queues: readJson(schedulerPath(projectDir, QUEUES_FILE), {
      version: '1.0.0',
      queues: Object.fromEntries(DOMAINS.map((domain) => [domain, []])),
    }),
  };
  if (!state.swarm) {
    return initializeScheduler(projectDir);
  }
  for (const domain of DOMAINS) {
    state.queues.queues[domain] ||= [];
  }
  return state;
}

function saveSchedulerState(projectDir, state) {
  ensureSchedulerDir(projectDir);
  writeJson(schedulerPath(projectDir, SWARM_FILE), state.swarm);
  writeJson(schedulerPath(projectDir, AGENTS_FILE), state.agents);
  writeJson(schedulerPath(projectDir, TASKS_FILE), state.tasks);
  writeJson(schedulerPath(projectDir, QUEUES_FILE), state.queues);
}

function writeTaskHandoff(projectDir, task, analysis, primaryAgent = null) {
  const handoff = {
    schema: 'gstack-harness.scheduler_handoff.v1',
    task_id: task.taskId,
    description: task.description,
    status: task.status,
    recipe: defaultRecipeForTask(task),
    primary_agent: primaryAgent,
    required_capabilities: analysis.requiredCapabilities || [],
    required_evidence: task.evidenceRequired || [],
    allowed_writes: defaultAllowedWritesForTask(task),
    suggested_commands: suggestedCommandsForTask(task),
    completion_contract: {
      complete: `gstack-harness-schedule complete-task --target . --task-id ${task.taskId} --status completed --evidence <paths> --result "<summary>"`,
      fail: `gstack-harness-schedule complete-task --target . --task-id ${task.taskId} --status failed --result "<reason>"`,
    },
    generated_at: nowIso(),
  };
  writeJson(handoffPath(projectDir, task.taskId, 'json'), handoff);
  fs.mkdirSync(path.dirname(handoffPath(projectDir, task.taskId, 'md')), { recursive: true });
  fs.writeFileSync(handoffPath(projectDir, task.taskId, 'md'), renderTaskHandoffMarkdown(handoff));
  return {
    json: path.relative(projectDir, handoffPath(projectDir, task.taskId, 'json')),
    markdown: path.relative(projectDir, handoffPath(projectDir, task.taskId, 'md')),
  };
}

function defaultRecipeForTask(task) {
  if (task.type === 'coding') return 'R4 Scoped Coding Task';
  if (task.type === 'testing') return 'R5 Verification / Reality Test';
  if (task.type === 'review') return 'R8 Review';
  if (task.type === 'release') return 'R10 Release Readiness';
  return 'custom';
}

function defaultAllowedWritesForTask(task) {
  if (task.type === 'coding') return ['targeted source files', 'targeted tests', 'task evidence artifacts'];
  if (task.type === 'testing') return ['test evidence artifacts', 'QA reports'];
  if (task.type === 'documentation') return ['documentation files'];
  return ['task evidence artifacts'];
}

function suggestedCommandsForTask(task) {
  if (task.type === 'coding') {
    return [
      'node scripts/ai-context-bridge.mjs baseline',
      'node scripts/ai-context-bridge.mjs status',
      'run targeted tests',
      'node scripts/ai-context-bridge.mjs postchange --scope all --test-command "<command>" --test-exit-code <code> --test-artifact "<path>"',
    ];
  }
  return ['capture file-backed evidence before completion'];
}

function renderTaskHandoffMarkdown(handoff) {
  return `# Scheduler Handoff: ${handoff.task_id}

Status: ${handoff.status}
Recipe: ${handoff.recipe}

## Task

${handoff.description || '(no description)'}

## Primary Agent

${handoff.primary_agent ? `${handoff.primary_agent.agentId} (${handoff.primary_agent.domain})` : 'Unassigned'}

## Required Evidence

${handoff.required_evidence.map((item) => `- ${item}`).join('\n') || '- summary'}

## Suggested Commands

${handoff.suggested_commands.map((item) => `- ${item}`).join('\n')}

## Completion

- Complete: \`${handoff.completion_contract.complete}\`
- Fail: \`${handoff.completion_contract.fail}\`
`;
}

export function registerAgent(projectDir = process.cwd(), agentInput) {
  const state = loadSchedulerState(projectDir);
  const agent = normalizeAgent(agentInput);
  const previous = state.agents.agents[agent.agentId] || {};
  state.agents.agents[agent.agentId] = {
    ...previous,
    ...agent,
    createdAt: previous.createdAt || agent.createdAt,
    updatedAt: nowIso(),
  };
  state.swarm.updatedAt = nowIso();
  saveSchedulerState(projectDir, state);
  return state.agents.agents[agent.agentId];
}

export function analyzeTask(taskInput) {
  const task = normalizeTask(taskInput);
  const requiredCapabilities = identifyRequiredCapabilities(task);
  const subtasks = decomposeTask(task);
  const complexity = calculateComplexity(task, subtasks);
  const recommendedDomain = determineOptimalDomain(task, requiredCapabilities);
  const strategy = determineExecutionStrategy(complexity, subtasks);
  const modelTier = determineModelTier(complexity, task.priority);

  return {
    taskId: task.taskId,
    type: task.type,
    priority: task.priority,
    recommendedDomain,
    requiredCapabilities,
    subtasks,
    complexity,
    strategy,
    modelTier,
    confidence: calculateConfidence(requiredCapabilities, subtasks),
    evidenceRequired: task.evidenceRequired,
  };
}

function identifyRequiredCapabilities(task) {
  const lower = task.description.toLowerCase();
  const caps = new Set(TYPE_CAPABILITIES[task.type] || TYPE_CAPABILITIES.custom);
  if (lower.includes('security')) caps.add('security');
  if (lower.includes('performance')) caps.add('performance');
  if (lower.includes('architecture')) caps.add('architecture');
  if (lower.includes('deploy')) caps.add('deploy');
  if (lower.includes('memory') || lower.includes('gbrain')) caps.add('memory');
  if (lower.includes('gitnexus') || lower.includes('impact')) caps.add('impact');
  return Array.from(caps);
}

function decomposeTask(task) {
  if (isSimpleTask(task)) return [];
  if (task.type === 'coding') {
    return [
      subtask(task, 'design', 'Design and impact plan', 'analysis', [], ['architecture', 'design'], 'core'),
      subtask(task, 'implement', 'Implement scoped code changes', 'coding', [`${task.taskId}.design`], ['coding', 'implementation'], 'integration'),
      subtask(task, 'test', 'Verify implementation and evidence gates', 'testing', [`${task.taskId}.implement`], ['testing', 'validation'], 'support'),
    ];
  }
  if (task.type === 'testing') {
    return [
      subtask(task, 'analyze', 'Identify required checks', 'analysis', [], ['analysis', 'testing'], 'support'),
      subtask(task, 'execute', 'Run checks and capture evidence', 'testing', [`${task.taskId}.analyze`], ['testing'], 'support'),
    ];
  }
  if (task.type === 'research') {
    return [
      subtask(task, 'gather', 'Gather current facts', 'research', [], ['research'], 'core'),
      subtask(task, 'synthesize', 'Synthesize findings', 'analysis', [`${task.taskId}.gather`], ['analysis'], 'core'),
    ];
  }
  if (task.type === 'coordination') {
    return [
      subtask(task, 'plan', 'Plan delegation', 'coordination', [], ['planning'], 'queen'),
      subtask(task, 'execute', 'Coordinate execution', 'coordination', [`${task.taskId}.plan`], ['coordination'], 'queen'),
    ];
  }
  return [subtask(task, 'execute', task.description, task.type, [], identifyRequiredCapabilities(task), TYPE_DOMAIN[task.type] || 'core')];
}

function isSimpleTask(task) {
  const simpleTypes = new Set(['documentation', 'review']);
  return task.description.length < 180 || simpleTypes.has(task.type);
}

function subtask(task, suffix, description, type, dependencies, requiredCapabilities, recommendedDomain) {
  return {
    id: `${task.taskId}.${suffix}`,
    name: suffix,
    description,
    type,
    priority: task.priority,
    dependencies,
    requiredCapabilities,
    recommendedDomain,
  };
}

function calculateComplexity(task, subtasks) {
  let complexity = 0.3;
  complexity += subtasks.length * 0.1;
  complexity += subtasks.reduce((sum, item) => sum + item.dependencies.length, 0) * 0.05;
  complexity *= PRIORITY_WEIGHT[task.priority] || 1;
  const typeBoost = {
    coordination: 0.2,
    release: 0.2,
    security: 0.2,
    coding: 0.15,
    testing: 0.1,
    analysis: 0.1,
    research: 0.1,
    review: 0.05,
    documentation: 0.05,
    custom: 0.1,
  };
  complexity += typeBoost[task.type] || 0.1;
  complexity += Math.min(task.description.length / 2000, 0.2);
  return Number(Math.min(1, complexity).toFixed(3));
}

function determineOptimalDomain(task, capabilities) {
  if (capabilities.includes('memory')) return 'memory';
  if (capabilities.includes('impact')) return 'code-context';
  if (capabilities.includes('deploy')) return 'release';
  return TYPE_DOMAIN[task.type] || 'core';
}

function determineExecutionStrategy(complexity, subtasks) {
  if (subtasks.length === 0) return 'sequential';
  const hasDependencies = subtasks.some((item) => item.dependencies.length > 0);
  if (!hasDependencies && subtasks.length > 2) return 'parallel';
  if (hasDependencies && subtasks.length > 3) return 'pipeline';
  if (complexity > 0.7) return 'fan-out-fan-in';
  return 'hybrid';
}

function determineModelTier(complexity, priority) {
  if (priority === 'critical' || complexity >= 0.65) return 'frontier';
  if (complexity >= 0.35) return 'balanced';
  return 'economy';
}

function calculateConfidence(capabilities, subtasks) {
  return Number(Math.min(0.95, 0.55 + capabilities.length * 0.04 + subtasks.length * 0.05).toFixed(3));
}

export function scoreAgent(agent, taskInput, analysis = analyzeTask(taskInput)) {
  const task = normalizeTask(taskInput);
  const capabilityScore = calculateCapabilityScore(agent, task, analysis.requiredCapabilities);
  const loadScore = 1 - clamp(agent.workload ?? 0, 0, 1);
  const performanceScore = clamp(agent.successRate ?? 0.75, 0, 1);
  const healthScore = clamp(agent.health ?? 1, 0, 1);
  const availabilityScore = agent.status === 'idle' ? 1 : agent.status === 'busy' ? 0.3 : 0;
  const domainBoost = agent.domain === analysis.recommendedDomain ? 0.08 : 0;
  const speedPenalty = Math.min((agent.averageDurationMs || 0) / 600000, 0.08);
  const totalScore = clamp(
    capabilityScore * 0.3 +
      loadScore * 0.2 +
      performanceScore * 0.25 +
      healthScore * 0.15 +
      availabilityScore * 0.1 +
      domainBoost -
      speedPenalty,
    0,
    1,
  );

  return {
    agentId: agent.agentId,
    domain: agent.domain,
    totalScore: Number(totalScore.toFixed(4)),
    capabilityScore: Number(capabilityScore.toFixed(4)),
    loadScore: Number(loadScore.toFixed(4)),
    performanceScore: Number(performanceScore.toFixed(4)),
    healthScore: Number(healthScore.toFixed(4)),
    availabilityScore,
  };
}

function calculateCapabilityScore(agent, task, requiredCapabilities) {
  let score = 0.35;
  if (agent.domain === (TYPE_DOMAIN[task.type] || 'core')) score += 0.3;
  const agentCaps = new Set(agent.capabilities || []);
  const matches = requiredCapabilities.filter((cap) => agentCaps.has(cap)).length;
  score += Math.min(0.4, matches * 0.12);
  return clamp(score, 0, 1);
}

export function scheduleTask(projectDir = process.cwd(), taskInput) {
  const state = loadSchedulerState(projectDir);
  const task = normalizeTask(taskInput);
  const analysis = analyzeTask(task);
  const agents = Object.values(state.agents.agents);
  const candidateScores = agents
    .map((agent) => ({ agent, score: scoreAgent(agent, task, analysis) }))
    .filter(({ agent }) => agent.status !== 'terminated' && agent.domain === analysis.recommendedDomain)
    .sort((a, b) => b.score.totalScore - a.score.totalScore);
  const best = candidateScores.find(({ agent, score }) => agent.status === 'idle' && score.totalScore >= 0.35);

  if (!best) {
    task.status = 'queued';
    task.analysis = analysis;
    state.tasks.tasks[task.taskId] = task;
    const queue = state.queues.queues[analysis.recommendedDomain] ||= [];
    if (!queue.includes(task.taskId)) queue.push(task.taskId);
    state.swarm.updatedAt = nowIso();
    saveSchedulerState(projectDir, state);
    task.handoff = writeTaskHandoff(projectDir, task, analysis, null);
    saveSchedulerState(projectDir, state);
    return {
      status: 'queued',
      task,
      analysis,
      queuedDomain: analysis.recommendedDomain,
      primaryAgent: null,
      agentScores: candidateScores.map((item) => item.score),
    };
  }

  task.status = 'assigned';
  task.assignedTo = best.agent.agentId;
  task.analysis = analysis;
  task.startedAt = nowIso();
  state.tasks.tasks[task.taskId] = task;
  state.agents.agents[best.agent.agentId] = {
    ...best.agent,
    status: 'busy',
    currentTask: task.taskId,
    workload: Math.min(1, Number(best.agent.workload || 0) + 0.35),
    updatedAt: nowIso(),
  };
  state.swarm.updatedAt = nowIso();
  saveSchedulerState(projectDir, state);
  task.handoff = writeTaskHandoff(projectDir, task, analysis, {
    agentId: best.agent.agentId,
    domain: best.agent.domain,
    score: best.score.totalScore,
  });
  state.tasks.tasks[task.taskId] = task;
  saveSchedulerState(projectDir, state);
  return {
    status: 'assigned',
    task,
    analysis,
    primaryAgent: {
      agentId: best.agent.agentId,
      domain: best.agent.domain,
      score: best.score.totalScore,
    },
    backupAgents: candidateScores
      .filter(({ agent }) => agent.agentId !== best.agent.agentId)
      .slice(0, 2)
      .map(({ agent, score }) => ({ agentId: agent.agentId, domain: agent.domain, score: score.totalScore })),
    agentScores: candidateScores.map((item) => item.score),
  };
}

function assignQueuedTask(projectDir, state, agent, task, domain) {
  task.status = 'assigned';
  task.assignedTo = agent.agentId;
  task.startedAt = task.startedAt || nowIso();
  task.updatedAt = nowIso();
  task.handoff = writeTaskHandoff(projectDir, task, task.analysis || analyzeTask(task), {
    agentId: agent.agentId,
    domain: agent.domain,
  });
  state.tasks.tasks[task.taskId] = task;
  state.agents.agents[agent.agentId] = {
    ...agent,
    status: 'busy',
    currentTask: task.taskId,
    workload: Math.min(1, Number(agent.workload || 0) + 0.35),
    updatedAt: nowIso(),
  };
  const queue = state.queues.queues[domain] ||= [];
  state.queues.queues[domain] = queue.filter((taskId) => taskId !== task.taskId);
  state.swarm.updatedAt = nowIso();
}

export function claimNextTask(projectDir = process.cwd(), input = {}) {
  const state = loadSchedulerState(projectDir);
  const agent = state.agents.agents[input.agentId];
  if (!agent) {
    throw new Error(`Unknown agent: ${input.agentId}`);
  }
  if (agent.status !== 'idle') {
    return { status: 'unavailable', reason: `agent_status_${agent.status}`, task: null, agent };
  }

  const domain = input.domain || agent.domain;
  const queue = state.queues.queues[domain] ||= [];
  const taskId = queue.find((candidate) => state.tasks.tasks[candidate]?.status === 'queued');
  if (!taskId) {
    return { status: 'empty', queuedDomain: domain, task: null, agent };
  }

  const task = state.tasks.tasks[taskId];
  assignQueuedTask(projectDir, state, agent, task, domain);
  saveSchedulerState(projectDir, state);
  return {
    status: 'assigned',
    task: state.tasks.tasks[taskId],
    primaryAgent: {
      agentId: agent.agentId,
      domain: agent.domain,
    },
  };
}

export function completeTask(projectDir = process.cwd(), input = {}) {
  const state = loadSchedulerState(projectDir);
  const task = state.tasks.tasks[input.taskId];
  if (!task) {
    throw new Error(`Unknown task: ${input.taskId}`);
  }
  const finalStatus = input.status || 'completed';
  task.status = finalStatus;
  task.result = input.result || task.result || null;
  task.evidence = input.evidence || task.evidence || [];
  task.completedAt = nowIso();
  task.updatedAt = nowIso();
  state.tasks.tasks[task.taskId] = task;

  if (task.assignedTo && state.agents.agents[task.assignedTo]) {
    const agent = state.agents.agents[task.assignedTo];
    const releasedAgent = {
      ...agent,
      status: 'idle',
      currentTask: null,
      workload: 0,
      taskCount: Number(agent.taskCount || 0) + 1,
      updatedAt: nowIso(),
    };
    state.agents.agents[task.assignedTo] = releasedAgent;
    if (input.promoteNext) {
      const domain = input.domain || releasedAgent.domain;
      const queue = state.queues.queues[domain] ||= [];
      const nextTaskId = queue.find((candidate) => state.tasks.tasks[candidate]?.status === 'queued');
      if (nextTaskId) {
        assignQueuedTask(projectDir, state, releasedAgent, state.tasks.tasks[nextTaskId], domain);
      }
    }
  }

  state.swarm.updatedAt = nowIso();
  saveSchedulerState(projectDir, state);
  const promoted = task.assignedTo ? Object.values(state.tasks.tasks).find((candidate) => (
    candidate.assignedTo === task.assignedTo &&
    candidate.status === 'assigned' &&
    candidate.taskId !== task.taskId
  )) : null;
  return {
    status: finalStatus,
    task,
    ...(promoted ? { promoted: { status: 'assigned', task: promoted } } : {}),
  };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (item.startsWith('--')) {
      const key = item.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(item);
    }
  }
  return args;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage() {
  process.stdout.write(`gstack-harness-schedule commands:
  init [--target DIR] [--max-agents N]
  register-agent --target DIR --agent-id ID --role ROLE --domain DOMAIN --capabilities a,b,c
  analyze --target DIR --type coding --priority high --description TEXT
  schedule --target DIR --task-id ID --type coding --priority normal --description TEXT
  claim-next --target DIR --agent-id ID [--domain DOMAIN]
  complete-task --target DIR --task-id ID [--status completed] [--result TEXT] [--evidence a,b,c] [--promote-next]
  status [--target DIR]
`);
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = args._[0] || 'status';
  const target = path.resolve(String(args.target || '.'));
  if (command === 'help' || args.help) {
    usage();
    return;
  }
  if (command === 'init') {
    print(initializeScheduler(target, { maxAgents: args['max-agents'] }));
    return;
  }
  if (command === 'register-agent') {
    print(registerAgent(target, {
      agentId: args['agent-id'],
      role: args.role,
      domain: args.domain,
      capabilities: args.capabilities ? String(args.capabilities).split(',').map((item) => item.trim()) : [],
      costTier: args['cost-tier'],
    }));
    return;
  }
  if (command === 'analyze') {
    print(analyzeTask({
      taskId: args['task-id'],
      type: args.type,
      priority: args.priority,
      description: args.description,
    }));
    return;
  }
  if (command === 'schedule') {
    print(scheduleTask(target, {
      taskId: args['task-id'],
      type: args.type,
      priority: args.priority,
      description: args.description,
    }));
    return;
  }
  if (command === 'claim-next') {
    print(claimNextTask(target, {
      agentId: args['agent-id'],
      domain: args.domain,
    }));
    return;
  }
  if (command === 'complete-task') {
    print(completeTask(target, {
      taskId: args['task-id'],
      status: args.status,
      result: args.result,
      evidence: args.evidence ? String(args.evidence).split(',').map((item) => item.trim()).filter(Boolean) : [],
      promoteNext: Boolean(args['promote-next']),
    }));
    return;
  }
  if (command === 'status') {
    print(loadSchedulerState(target));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`ERROR: ${error.message}\n`);
    process.exit(2);
  }
}
