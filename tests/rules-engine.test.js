const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
global.HyruleGameState = gameState;
const actions = require("../js/engine/actions.js");
global.HyruleActions = actions;
const rules = require("../js/engine/rules-engine.js");

function run(action, inputState) {
  return rules.reduceGameState(inputState, action).state;
}

const start = gameState.createDefaultState();

const afterSafe = run({ type: actions.TYPES.SAFE_PATH }, start);
assert.strictEqual(afterSafe.corruption, 30, "safe path should reduce corruption by 5");

const afterReckless = run({ type: actions.TYPES.RECKLESS_PATH }, start);
assert.strictEqual(afterReckless.corruption, 47, "reckless path should increase corruption by 12");

const afterPower = run({ type: actions.TYPES.COMPLETE_TEMPLE, piece: "power" }, start);
assert.strictEqual(afterPower.power, true, "power temple should be marked complete");
assert.strictEqual(afterPower.corruption, 28, "power completion should reduce corruption by 7");
assert.strictEqual(afterPower.missions.wisdom.status, "available", "wisdom should unlock after power");

const wisdomReady = {
  ...afterPower,
  challenges: { securityCards: { secrets: true, dependency: true, codeql: true } }
};
const afterWorkflow = run({
  type: actions.TYPES.HIDDEN_WORKFLOW_CHECK,
  valid: true,
  allCardsDone: true
}, wisdomReady);
assert.strictEqual(afterWorkflow.wisdom, true, "wisdom should complete after valid workflow reveal");

const blockedDeploy = run({
  type: actions.TYPES.DEPLOY_RELEASE,
  prereqsMet: false
}, start);
assert.strictEqual(blockedDeploy.courage, false, "blocked deploy should not complete courage");
assert.strictEqual(blockedDeploy.corruption, 40, "blocked deploy should increase corruption by 5");

const finalBattleFail = run({
  type: actions.TYPES.FINAL_BATTLE_RESOLVE,
  allMarked: true,
  requiredKeysMet: false
}, start);
assert.strictEqual(finalBattleFail.corruption, 43, "failed final battle should increase corruption by 8");

console.log("Rules engine checks passed.");
