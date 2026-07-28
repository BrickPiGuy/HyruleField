const assert = require("node:assert");

const storyEngine = require("../js/content/story-engine.js");

const eventConfig = {
  branches: [
    { id: "safe", when: { outcomeReason: "safe_path" }, title: "Safe", text: "ok" },
    { id: "risky", when: { outcomeReason: "reckless_path" }, title: "Risky", text: "bad" }
  ]
};

const safeBranch = storyEngine.__test.pickBranch(eventConfig, { outcomeReason: "safe_path" });
assert.strictEqual(safeBranch.id, "safe", "safe path should match safe branch");

const riskyBranch = storyEngine.__test.pickBranch(eventConfig, { outcomeReason: "reckless_path" });
assert.strictEqual(riskyBranch.id, "risky", "reckless path should match risky branch");

const noneBranch = storyEngine.__test.pickBranch(eventConfig, { outcomeReason: "unknown" });
assert.strictEqual(noneBranch, null, "unknown outcome should not match a branch");

console.log("Story engine checks passed.");
