const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
const actions = require("../js/engine/actions.js");
const migrations = require("../js/engine/migrations.js");
const sitesNav = require("../js/ui/site-nav.js");

globalThis.HyruleGameState = gameState;
globalThis.HyruleActions = actions;
const scoring = require("../js/engine/scoring.js");
const rewards = require("../js/engine/rewards.js");
globalThis.HyruleScoring = scoring;
globalThis.HyruleRewards = rewards;
const rules = require("../js/engine/rules-engine.js");

const T = actions.TYPES;

function step(state, action) {
  return rules.reduceGameState(state, action);
}

// Six temples, with the right doors sealed at the start.
let state = gameState.createDefaultState();
assert.strictEqual(state.saveVersion, 5);
assert.deepStrictEqual(gameState.TEMPLE_PIECES, ["power", "wisdom", "courage", "fire", "water", "forest"]);
assert.strictEqual(gameState.isTempleUnlocked(state, "power"), true);
["wisdom", "courage", "fire", "water", "forest", "final"].forEach((key) => {
  assert.strictEqual(gameState.isTempleUnlocked(state, key), false, `${key} should start sealed`);
});
assert.strictEqual(gameState.nextDestination(state), "power");

// Power opens Wisdom and all three sage temples, in any order.
state = step(state, { type: T.COMPLETE_TEMPLE, piece: "power" }).state;
assert.strictEqual(state.missions.fire.status, "available");
assert.strictEqual(state.missions.water.status, "available");
assert.strictEqual(state.missions.forest.status, "available");
assert.strictEqual(state.missions.wisdom.status, "available");
assert.strictEqual(state.missions.courage.status, "locked", "courage still needs wisdom");
assert.strictEqual(gameState.isTempleUnlocked(state, "forest"), true);
assert.strictEqual(gameState.nextDestination(state), "wisdom");

// Sage temples can be completed in any order and earn a rank.
state = step(state, { type: T.COMPLETE_TEMPLE, piece: "water" }).state;
assert.strictEqual(state.water, true);
assert.ok(state.rewards.templeRanks.water, "water earns a rank");
assert.ok(state.rewards.templeScores.water > 0, "water earns points");
assert.strictEqual(state.missions.water.status, "complete");

// Puzzle actions: solving once lowers corruption, repeats do nothing, mistakes cost.
const before = state.corruption;
let result = step(state, { type: T.PUZZLE_SOLVED, temple: "fire", puzzleId: "fire-pyramid-order" });
assert.strictEqual(result.state.corruption, before - 1);
assert.deepStrictEqual(result.state.trials.fire, ["fire-pyramid-order"]);
const repeat = step(result.state, { type: T.PUZZLE_SOLVED, temple: "fire", puzzleId: "fire-pyramid-order" });
assert.strictEqual(repeat.state.corruption, result.state.corruption, "re-solving a chamber changes nothing");
assert.deepStrictEqual(repeat.state.trials.fire, ["fire-pyramid-order"]);
result = step(result.state, { type: T.PUZZLE_MISTAKE, temple: "fire", puzzleId: "fire-flaky-spot" });
assert.strictEqual(result.outcome.ok, false);
assert.strictEqual(result.state.corruption, repeat.state.corruption + 2);
assert.strictEqual(step(state, { type: T.PUZZLE_SOLVED, temple: "nope", puzzleId: "x" }).state.trials.nope, undefined, "unknown temples are ignored");

// The map's next quest follows the order, then points at the final battle.
const everything = gameState.cloneState(state);
["power", "wisdom", "courage", "fire", "water", "forest"].forEach((key) => { everything[key] = true; });
assert.strictEqual(gameState.nextDestination(everything), "final");
assert.strictEqual(gameState.isTempleUnlocked(everything, "final"), true);
const missingOne = gameState.cloneState(everything);
missingOne.forest = false;
assert.strictEqual(gameState.isTempleUnlocked(missingOne, "final"), false, "final battle needs all six temples");
everything.rewards.finalVictoryAwarded = true;
assert.strictEqual(gameState.nextDestination(everything), null, "nothing is left after victory");

// Nav status labels.
assert.strictEqual(sitesNav.statusFor(gameState.createDefaultState(), "power"), "next");
assert.strictEqual(sitesNav.statusFor(gameState.createDefaultState(), "fire"), "locked");
assert.strictEqual(sitesNav.statusFor(state, "fire"), "open");
assert.strictEqual(sitesNav.statusFor(state, "water"), "done");
assert.strictEqual(sitesNav.statusFor(state, "map"), null);

// A version 4 save upgrades without losing progress.
const v4 = {
  saveVersion: 4,
  power: true,
  wisdom: true,
  courage: false,
  corruption: 20,
  rewards: { totalScore: 130, templeRanks: { power: "Gold", wisdom: "Silver", courage: null }, templeScores: { power: 130, wisdom: 90, courage: 0 } },
  missions: { power: { status: "available" }, wisdom: { status: "available" }, courage: { status: "available" }, finalBattle: { status: "locked" } }
};
const upgraded = migrations.migrateState(v4);
assert.strictEqual(upgraded.saveVersion, 5);
assert.strictEqual(upgraded.power, true);
assert.strictEqual(upgraded.fire, false);
assert.deepStrictEqual(upgraded.trials, {});
assert.strictEqual(upgraded.rewards.templeRanks.power, "Gold", "old ranks survive");
assert.strictEqual(upgraded.rewards.templeRanks.fire, null, "new temples start unranked");
assert.strictEqual(upgraded.rewards.templeScores.wisdom, 90, "old scores survive");
assert.strictEqual(upgraded.rewards.templeScores.forest, 0);

console.log("Temple checks passed.");
