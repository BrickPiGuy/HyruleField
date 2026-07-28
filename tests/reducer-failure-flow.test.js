const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
global.HyruleGameState = gameState;
const actions = require("../js/engine/actions.js");
global.HyruleActions = actions;
const rules = require("../js/engine/rules-engine.js");

function step(state, action) {
  return rules.reduceGameState(state, action);
}

let state = gameState.createDefaultState();

// Repeated invalid hidden-workflow checks should increase corruption each time.
let result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: false,
  allCardsDone: false
});
state = result.state;
assert.strictEqual(result.outcome.ok, false, "invalid hidden workflow should fail");
assert.strictEqual(result.outcome.reason, "workflow_invalid", "invalid hidden workflow should return reason");
assert.strictEqual(state.corruption, 39, "invalid hidden workflow should add 4 corruption");

result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: false,
  allCardsDone: false
});
state = result.state;
assert.strictEqual(state.corruption, 43, "second invalid hidden workflow should add another 4 corruption");
assert.strictEqual(state.wisdom, false, "wisdom should not unlock on invalid workflow checks");

// Blocked deploy retries should stack penalties but not unlock courage.
result = step(state, {
  type: actions.TYPES.DEPLOY_RELEASE,
  prereqsMet: false
});
state = result.state;
assert.strictEqual(result.outcome.ok, false, "blocked deploy should fail");
assert.strictEqual(result.outcome.reason, "deploy_blocked", "blocked deploy should return reason");
assert.strictEqual(state.corruption, 48, "blocked deploy should add 5 corruption");
assert.strictEqual(state.courage, false, "blocked deploy should not unlock courage");

result = step(state, {
  type: actions.TYPES.DEPLOY_RELEASE,
  prereqsMet: false
});
state = result.state;
assert.strictEqual(state.corruption, 53, "second blocked deploy should add another 5 corruption");
assert.strictEqual(state.courage, false, "courage should remain locked after repeated blocked deploys");

// Corruption should clamp at 100 under repeated high-penalty actions.
for (let i = 0; i < 20; i += 1) {
  result = step(state, { type: actions.TYPES.RECKLESS_PATH });
  state = result.state;
}
assert.strictEqual(state.corruption, 100, "corruption should clamp at 100 upper bound");

// Corruption should clamp at 0 under repeated safe-path actions.
for (let i = 0; i < 30; i += 1) {
  result = step(state, { type: actions.TYPES.SAFE_PATH });
  state = result.state;
}
assert.strictEqual(state.corruption, 0, "corruption should clamp at 0 lower bound");

// Failed final battle should penalize corruption but not set victory.
result = step(state, {
  type: actions.TYPES.FINAL_BATTLE_RESOLVE,
  allMarked: false,
  requiredKeysMet: false
});
state = result.state;
assert.strictEqual(result.outcome.ok, false, "final battle should fail when requirements are unmet");
assert.strictEqual(result.outcome.reason, "battle_failed", "failed final battle should return reason");
assert.strictEqual(state.corruption, 8, "failed final battle should add 8 corruption from zero");

console.log("Reducer failure-flow checks passed.");
