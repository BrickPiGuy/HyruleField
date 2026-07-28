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

assert.strictEqual(state.missions.power.status, "available", "power mission should start available");
assert.strictEqual(state.missions.wisdom.status, "locked", "wisdom should start locked");
assert.strictEqual(state.missions.courage.status, "locked", "courage should start locked");
assert.strictEqual(state.missions.finalBattle.status, "locked", "final battle should start locked");

let result = step(state, { type: actions.TYPES.COMPLETE_TEMPLE, piece: "power" });
state = result.state;
assert.strictEqual(state.power, true, "power should be complete");
assert.strictEqual(state.missions.wisdom.status, "available", "wisdom should unlock after power");
assert.strictEqual(state.missions.courage.status, "locked", "courage should remain locked until wisdom");

result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "secrets" });
state = result.state;
result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "dependency" });
state = result.state;
result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "codeql" });
state = result.state;

assert.strictEqual(state.challenges.securityCards.secrets, true, "secrets card should be marked cleared");
assert.strictEqual(state.challenges.securityCards.dependency, true, "dependency card should be marked cleared");
assert.strictEqual(state.challenges.securityCards.codeql, true, "codeql card should be marked cleared");

const corruptionAfterCards = state.corruption;
result = step(state, { type: actions.TYPES.SECURITY_CARD_CLEARED, cardId: "secrets" });
state = result.state;
assert.strictEqual(state.corruption, corruptionAfterCards, "duplicate card clear should not change corruption");

result = step(state, {
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: true
});
state = result.state;
assert.strictEqual(result.outcome.ok, true, "hidden workflow resolution should succeed");
assert.strictEqual(state.wisdom, true, "wisdom should complete after valid workflow reveal");
assert.strictEqual(state.missions.courage.status, "available", "courage should unlock after wisdom");

result = step(state, { type: actions.TYPES.GRANT_APPROVAL });
state = result.state;
assert.strictEqual(state.approvalGranted, true, "approval should be granted");

result = step(state, {
  type: actions.TYPES.DEPLOY_RELEASE,
  prereqsMet: true
});
state = result.state;
assert.strictEqual(result.outcome.ok, true, "deploy should succeed when prerequisites are met");
assert.strictEqual(state.courage, true, "courage should complete after successful deploy");
assert.strictEqual(state.missions.finalBattle.status, "available", "final battle should unlock after courage");

result = step(state, {
  type: actions.TYPES.FINAL_BATTLE_RESOLVE,
  allMarked: true,
  requiredKeysMet: true
});
state = result.state;
assert.strictEqual(result.outcome.ok, true, "final battle should succeed when all conditions are met");
assert.strictEqual(result.outcome.victory, true, "final battle should flag victory");

result = step(state, { type: actions.TYPES.RESET_GAME });
state = result.state;
assert.strictEqual(state.power, false, "reset should clear power progress");
assert.strictEqual(state.missions.wisdom.status, "locked", "reset should lock wisdom mission");
assert.strictEqual(state.missions.finalBattle.status, "locked", "reset should lock final battle mission");

console.log("Reducer flow checks passed.");
