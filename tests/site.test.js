const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");

const pages = [
  "index.html",
  "power.html",
  "wisdom.html",
  "courage.html",
  "final-battle.html"
];

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

pages.forEach((page) => {
  const html = read(page);
  assert.match(html, /<nav class="top-nav">/, `${page} should include top navigation`);
  assert.match(html, /js\/engine\/game-state\.js/, `${page} should load game state engine`);
  assert.match(html, /js\/engine\/rules-engine\.js/, `${page} should load rules engine`);
  assert.match(html, /js\/content\/mission-loader\.js/, `${page} should load mission loader`);
  assert.match(html, /js\/ui\/hud\.js/, `${page} should load HUD module`);
  assert.match(html, /js\/progress\.js/, `${page} should load progress script`);
  assert.match(html, /js\/challenges\.js/, `${page} should load challenge script`);
});

const indexHtml = read("index.html");
assert.match(indexHtml, /DevOps Triforce: Rise of Lord Ganonix/, "index page title text missing");
assert.match(indexHtml, /id="quiz-submit"/, "index quiz interaction missing");

const jsProgress = read("js/progress.js");
assert.match(jsProgress, /HyruleEngine/, "central engine interface missing from progress layer");
assert.match(jsProgress, /window\.HyruleSave\.loadState/, "save schema integration missing");

const jsChallenges = read("js/challenges.js");
assert.match(jsChallenges, /setupFinalBattlePage/, "final battle setup missing");
assert.match(jsChallenges, /HIDDEN_WORKFLOW_CHECK/, "hidden workflow action dispatch missing");

console.log("All site checks passed.");
