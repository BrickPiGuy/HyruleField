const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");

const output = execFileSync(process.execPath, [path.join(root, "scripts/validate-missions.js")], {
  cwd: root,
  encoding: "utf8"
});

assert.match(output, /Validated 4 mission files\./, "validator should report all mission files");

const missionsDir = path.join(root, "data/missions");
const fileNames = fs.readdirSync(missionsDir).filter((file) => file.endsWith(".json"));
assert.equal(fileNames.length, 4, "mission fixture count should remain stable for this test");

console.log("Mission validator checks passed.");
