const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const puzzles = require("../js/puzzles/puzzle-engine.js");

const root = path.resolve(__dirname, "..");

// Every temple with chambers: valid puzzles, unique ids, solvable, and a mix of types.
const temples = ["power", "wisdom", "courage", "fire", "water", "forest"];
const typesSeenAcrossGame = new Set();

temples.forEach((temple) => {
  const mission = JSON.parse(fs.readFileSync(path.join(root, `data/missions/${temple}.json`), "utf8"));
  assert.ok(Array.isArray(mission.trials) && mission.trials.length >= 4, `${temple} should have at least 4 chambers`);

  const ids = new Set();
  const typesInTemple = new Set();
  mission.trials.forEach((puzzle) => {
    assert.deepStrictEqual(puzzles.validatePuzzle(puzzle), [], `${temple}/${puzzle.id} should be a valid puzzle`);
    assert.ok(!ids.has(puzzle.id), `${temple}/${puzzle.id} id should be unique`);
    ids.add(puzzle.id);
    typesInTemple.add(puzzle.type);
    typesSeenAcrossGame.add(puzzle.type);

    const solved = puzzles.checkAnswer(puzzle, puzzles.solutionFor(puzzle));
    assert.strictEqual(solved.correct, true, `${temple}/${puzzle.id} should accept its own solution`);
  });

  assert.ok(typesInTemple.size >= 3, `${temple} should mix at least 3 puzzle types`);
});

puzzles.TYPES.forEach((type) => {
  assert.ok(typesSeenAcrossGame.has(type), `no chamber uses the ${type} puzzle type`);
});

// Order puzzles
const order = {
  id: "o", type: "order", title: "t", prompt: "p", hint: "h", success: "ok",
  items: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
  answer: ["a", "b", "c"]
};
assert.strictEqual(puzzles.checkAnswer(order, ["a", "b", "c"]).correct, true);
assert.strictEqual(puzzles.checkAnswer(order, ["b", "a", "c"]).correct, false);
assert.strictEqual(puzzles.checkAnswer(order, ["b", "a", "c"]).score, 1, "order reports steps in place");
assert.strictEqual(puzzles.checkAnswer(order, ["a", "b"]).correct, false, "incomplete order is wrong");
assert.strictEqual(puzzles.checkAnswer(order, null).correct, false, "missing answer is wrong");

// Spot puzzles
const spot = {
  id: "s", type: "spot", title: "t", prompt: "p", hint: "h", success: "ok",
  lines: ["a", "b", "c", "d", "e"], answer: [1, 3]
};
assert.strictEqual(puzzles.checkAnswer(spot, [3, 1]).correct, true, "order of flags does not matter");
assert.strictEqual(puzzles.checkAnswer(spot, [1]).correct, false);
const falseAlarm = puzzles.checkAnswer(spot, [1, 3, 4]);
assert.strictEqual(falseAlarm.correct, false, "flagging a safe line is wrong");
assert.strictEqual(falseAlarm.falseAlarms, 1);
assert.match(puzzles.checkAnswer(spot, []).feedback, /Flag at least one/);

// Match puzzles
const match = {
  id: "m", type: "match", title: "t", prompt: "p", hint: "h", success: "ok",
  pairs: [{ left: "L1", right: "R1" }, { left: "L2", right: "R2" }, { left: "L3", right: "R3" }]
};
assert.strictEqual(puzzles.checkAnswer(match, { L1: "R1", L2: "R2", L3: "R3" }).correct, true);
assert.strictEqual(puzzles.checkAnswer(match, { L1: "R2", L2: "R1", L3: "R3" }).score, 1);
assert.strictEqual(puzzles.checkAnswer(match, { L1: "R1" }).correct, false, "unpaired items are wrong");

// Switch puzzles
const sw = {
  id: "w", type: "switches", title: "t", prompt: "p", hint: "h", success: "ok",
  clues: ["c"],
  switches: [{ id: "x", label: "X" }, { id: "y", label: "Y" }, { id: "z", label: "Z" }],
  target: { x: true, y: false, z: true }
};
assert.strictEqual(puzzles.checkAnswer(sw, { x: true, y: false, z: true }).correct, true);
assert.strictEqual(puzzles.checkAnswer(sw, { x: true, z: true }).correct, true, "an unset switch counts as off");
assert.strictEqual(puzzles.checkAnswer(sw, { x: true, y: true, z: true }).score, 2);

// Choice puzzles
const choice = {
  id: "c", type: "choice", title: "t", prompt: "p", hint: "h", success: "ok",
  options: [{ id: "a", text: "A", why: "no because a" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
  answer: "b"
};
assert.strictEqual(puzzles.checkAnswer(choice, "b").correct, true);
assert.strictEqual(puzzles.checkAnswer(choice, "a").feedback, "no because a", "wrong choices explain why");
assert.strictEqual(puzzles.checkAnswer(choice, null).correct, false);

// Validation catches broken content
assert.ok(puzzles.validatePuzzle({ id: "x", type: "nope" }).length > 0, "unknown type is invalid");
assert.ok(puzzles.validatePuzzle({ ...order, answer: ["a", "b"] }).length > 0, "order answer must cover every item");
assert.ok(puzzles.validatePuzzle({ ...spot, answer: [9] }).length > 0, "spot answer must be in range");
assert.ok(puzzles.validatePuzzle({ ...spot, answer: [0, 1, 2, 3, 4] }).length > 0, "spot cannot flag every line");
assert.ok(puzzles.validatePuzzle({ ...sw, target: { x: true } }).length > 0, "switch target must be complete");
assert.ok(puzzles.validatePuzzle({ ...choice, answer: "zzz" }).length > 0, "choice answer must be an option");
assert.ok(puzzles.validatePuzzle({ ...order, hint: "" }).length > 0, "hint is required");

// Shuffle never hands back the solved arrangement
for (let seed = 1; seed <= 25; seed += 1) {
  let value = seed;
  const rng = () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
  const shuffled = puzzles.shuffleUnsolved(["a", "b", "c", "d"], rng);
  assert.notDeepStrictEqual(shuffled, ["a", "b", "c", "d"], "shuffle must not return the solved order");
  assert.deepStrictEqual(shuffled.slice().sort(), ["a", "b", "c", "d"], "shuffle keeps every item");
}

console.log("Puzzle engine checks passed.");
