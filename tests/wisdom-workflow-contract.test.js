const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
global.HyruleGameState = gameState;
const actions = require("../js/engine/actions.js");
global.HyruleActions = actions;
const rules = require("../js/engine/rules-engine.js");
const challenges = require("../js/challenges.js");

function step(state, action) {
  return rules.reduceGameState(state, action);
}

let state = gameState.createDefaultState();

let result = step(state, {
  type: actions.TYPES.COMPLETE_TEMPLE,
  piece: "power"
});
state = result.state;

let before = state;
result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: false
});
state = result.state;

let message = challenges.hiddenWorkflowMessage({
  attempt: 1,
  valid: true,
  allCardsDone: false,
  hadWisdomBefore: Boolean(before.wisdom),
  hasWisdomNow: Boolean(state.wisdom)
});
assert.match(message, /clear all wards/i, "valid reveal before all cards should request clearing wards");
assert.strictEqual(state.wisdom, false, "wisdom should remain locked until all cards are cleared");

before = state;
result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: false
});
state = result.state;
message = challenges.hiddenWorkflowMessage({
  attempt: 2,
  valid: true,
  allCardsDone: false,
  hadWisdomBefore: Boolean(before.wisdom),
  hasWisdomNow: Boolean(state.wisdom)
});
assert.match(message, /attempt 2/i, "repeat reveal should increment attempt feedback");
assert.match(message, /clear all wards/i, "repeat reveal before all cards should keep clear-wards guidance");

result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "secrets" });
state = result.state;
result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "dependency" });
state = result.state;
result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "codeql" });
state = result.state;

before = state;
result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: true
});
state = result.state;
message = challenges.hiddenWorkflowMessage({
  attempt: 3,
  valid: true,
  allCardsDone: true,
  hadWisdomBefore: Boolean(before.wisdom),
  hasWisdomNow: Boolean(state.wisdom)
});
assert.match(message, /wisdom restored/i, "first successful reveal after cards should report wisdom restored");
assert.strictEqual(state.wisdom, true, "wisdom should unlock after valid reveal and all cards done");

before = state;
result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: true
});
state = result.state;
message = challenges.hiddenWorkflowMessage({
  attempt: 4,
  valid: true,
  allCardsDone: true,
  hadWisdomBefore: Boolean(before.wisdom),
  hasWisdomNow: Boolean(state.wisdom)
});
assert.match(message, /confirmed again/i, "subsequent successful reveals should report repeat confirmation");

message = challenges.hiddenWorkflowMessage({
  attempt: 5,
  valid: false,
  allCardsDone: false,
  hadWisdomBefore: false,
  hasWisdomNow: false
});
assert.match(message, /hint/i, "invalid reveal should provide hint message");

console.log("Wisdom workflow contract checks passed.");