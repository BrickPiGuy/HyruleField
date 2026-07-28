const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");
const storyPath = path.join(root, "data/story/events.json");
const story = JSON.parse(fs.readFileSync(storyPath, "utf8"));

assert.ok(story.events, "story events root should exist");

["path-choice", "intro-quiz", "deploy-attempt", "final-battle"].forEach((key) => {
  const event = story.events[key];
  assert.ok(event, `story event '${key}' should exist`);
  assert.ok(Array.isArray(event.branches) && event.branches.length >= 2, `story event '${key}' should have at least 2 branches`);

  event.branches.forEach((branch, index) => {
    assert.ok(branch.id, `${key} branch ${index} should define id`);
    assert.ok(branch.title, `${key} branch ${index} should define title`);
    assert.ok(branch.text, `${key} branch ${index} should define text`);
    assert.ok(branch.when && branch.when.outcomeReason, `${key} branch ${index} should define outcomeReason condition`);
  });
});

console.log("Story content checks passed.");
