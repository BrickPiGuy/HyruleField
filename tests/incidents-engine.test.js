const assert = require("node:assert");

const randomSeed = require("../js/engine/random-seed.js");
global.HyruleRandomSeed = randomSeed;
const incidents = require("../js/engine/incidents.js");

const sampleCards = [
  { id: "a" },
  { id: "b" },
  { id: "c" },
  { id: "d" }
];

const shuffledA = incidents.__test.seededShuffle(sampleCards, "2026-07-28|standard").map((x) => x.id).join(",");
const shuffledB = incidents.__test.seededShuffle(sampleCards, "2026-07-28|standard").map((x) => x.id).join(",");
const shuffledC = incidents.__test.seededShuffle(sampleCards, "2026-07-29|standard").map((x) => x.id).join(",");

assert.strictEqual(shuffledA, shuffledB, "same seed should produce same order");
assert.notStrictEqual(shuffledA, shuffledC, "different seed should produce different order");
assert.strictEqual(incidents.__test.buildSeedText("2026-07-28", "heroic"), "2026-07-28|heroic", "seed text should combine date and mode");

console.log("Incidents engine checks passed.");
