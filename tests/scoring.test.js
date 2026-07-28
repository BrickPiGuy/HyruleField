const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
global.HyruleGameState = gameState;
const actions = require("../js/engine/actions.js");
global.HyruleActions = actions;
const scoring = require("../js/engine/scoring.js");
global.HyruleScoring = scoring;
const rewards = require("../js/engine/rewards.js");
global.HyruleRewards = rewards;
const rules = require("../js/engine/rules-engine.js");

function run(action, inputState) {
  return rules.reduceGameState(inputState, action).state;
}

const start = gameState.createDefaultState();
assert.strictEqual(scoring.rankForCorruption(18), "Legend", "rank boundary for legend should be <= 20");
assert.strictEqual(scoring.rankForCorruption(35), "Gold", "rank boundary for gold should be <= 35");
assert.strictEqual(scoring.rankForCorruption(55), "Silver", "rank boundary for silver should be <= 55");
assert.strictEqual(scoring.rankForCorruption(80), "Bronze", "high corruption should map to bronze");

const afterPower = run({ type: actions.TYPES.COMPLETE_TEMPLE, piece: "power" }, start);
assert.strictEqual(afterPower.rewards.templeRanks.power, "Gold", "power rank should be assigned on completion");
assert.strictEqual(afterPower.rewards.totalScore, 130, "gold completion should award 130 score");
assert.strictEqual(afterPower.rewards.rewardPoints, 130, "gold completion should award 130 reward points");

const duplicatePower = run({ type: actions.TYPES.COMPLETE_TEMPLE, piece: "power" }, afterPower);
assert.strictEqual(duplicatePower.rewards.totalScore, 130, "duplicate temple completion should not re-award score");

let progressed = run({ type: actions.TYPES.COMPLETE_TEMPLE, piece: "wisdom" }, afterPower);
progressed = run({ type: actions.TYPES.COMPLETE_TEMPLE, piece: "courage" }, progressed);

const preFinalScore = progressed.rewards.totalScore;
const afterFinal = run({
  type: actions.TYPES.FINAL_BATTLE_RESOLVE,
  allMarked: true,
  requiredKeysMet: true
}, progressed);

assert.strictEqual(afterFinal.rewards.totalScore, preFinalScore + 250, "final victory should add bonus score once");
assert.strictEqual(afterFinal.rewards.finalVictoryAwarded, true, "final victory should set awarded marker");

const repeatedFinal = run({
  type: actions.TYPES.FINAL_BATTLE_RESOLVE,
  allMarked: true,
  requiredKeysMet: true
}, afterFinal);
assert.strictEqual(repeatedFinal.rewards.totalScore, afterFinal.rewards.totalScore, "repeat final wins should not re-award bonus");

console.log("Scoring checks passed.");
