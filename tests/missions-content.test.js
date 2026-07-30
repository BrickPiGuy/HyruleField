const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

const missionFiles = [
  "data/missions/power.json",
  "data/missions/wisdom.json",
  "data/missions/courage.json",
  "data/missions/final-battle.json"
];

missionFiles.forEach((file) => {
  const mission = readJson(file);
  assert.ok(mission.id, `${file} should have id`);
  assert.ok(mission.title, `${file} should have title`);
  assert.ok(mission.objective, `${file} should have objective`);
});

const wisdom = readJson("data/missions/wisdom.json");
assert.ok(Array.isArray(wisdom.securityCards) && wisdom.securityCards.length >= 3, "wisdom should define security cards");
assert.ok(wisdom.hiddenWorkflow && Array.isArray(wisdom.hiddenWorkflow.requiredWords), "wisdom should define workflow requiredWords");
assert.ok(Array.isArray(wisdom.hiddenWorkflow.segments) && wisdom.hiddenWorkflow.segments.length === 4, "wisdom should define four workflow dropdown segments");
wisdom.hiddenWorkflow.segments.forEach((segment) => {
  assert.ok(Array.isArray(segment.options) && segment.options.length === 5, `workflow segment ${segment.id} should define five choices`);
  assert.ok(segment.options.includes(segment.correctValue), `workflow segment ${segment.id} should include its correct choice`);
});

const courage = readJson("data/missions/courage.json");
assert.ok(Array.isArray(courage.requiredStateKeys) && courage.requiredStateKeys.length > 0, "courage should define requiredStateKeys");

const finalBattle = readJson("data/missions/final-battle.json");
assert.ok(Array.isArray(finalBattle.checklist) && finalBattle.checklist.length > 0, "final battle should define checklist items");
assert.ok(Array.isArray(finalBattle.pipelineStages) && finalBattle.pipelineStages.length > 0, "final battle should define pipeline stages");
assert.ok(finalBattle.messages && finalBattle.messages.success && finalBattle.messages.failure, "final battle should define outcome messages");

console.log("Mission content checks passed.");
