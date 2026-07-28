const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");
const filePath = path.join(root, "data/incidents/cards.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

assert.ok(Array.isArray(data.cards), "incident cards should be an array");
assert.ok(data.cards.length >= 4, "incident card set should contain at least 4 cards");

data.cards.forEach((card, index) => {
  assert.ok(card.id, `card ${index} should include id`);
  assert.ok(card.title, `card ${index} should include title`);
  assert.ok(card.description, `card ${index} should include description`);
});

console.log("Incidents content checks passed.");
