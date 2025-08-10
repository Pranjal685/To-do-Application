// Simple test harness for /ai/task-flow in AI_OFFLINE + NO_DB modes
// Run with: AI_OFFLINE=1 NO_DB=1 TEST_JWT="Bearer <your-dev-jwt>" node scripts/test_ai_task_flow.js

import fetch from 'node-fetch';

const AUTH = process.env.TEST_JWT || 'Bearer dev';
const BASE = process.env.BASE_URL || 'http://localhost:4000';

async function callFlow(message, state) {
  const res = await fetch(`${BASE}/ai/task-flow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH,
    },
    body: JSON.stringify({ message, state }),
  });
  const data = await res.json();
  return data;
}

async function run() {
  console.log('Test 1: compact triple + tags + priority + due');
  let state = { values: {}, mode: 'auto' };
  let out = await callFlow('Exam prep 45/5 x3 tomorrow 6pm #study urgent', state);
  console.log(JSON.stringify(out, null, 2));
  state.values = out.values;

  console.log('\nTest 2: add subtasks and notifications off');
  out = await callFlow('subtasks: read, notes, revise; notifications off', state);
  console.log(JSON.stringify(out, null, 2));
  state.values = out.values;

  console.log('\nTest 3: title override via label');
  out = await callFlow('title: Final Exam Prep', state);
  console.log(JSON.stringify(out, null, 2));

  console.log('\nReady?', out.confirmationReady, 'Next:', out.nextField || out.nextQuestion);
}

run().catch((e) => {
  console.error('Test failed', e);
  process.exit(1);
});



