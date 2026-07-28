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
  assert.match(html, /class="skip-link"/, `${page} should include a skip link`);
  assert.match(html, /id="main-content"/, `${page} should include main content landmark`);
  assert.match(html, /<nav class="top-nav">/, `${page} should include top navigation`);
  assert.match(html, /aria-live="polite"/, `${page} should include at least one live region`);
  assert.match(html, /js\/engine\/game-state\.js/, `${page} should load game state engine`);
  assert.match(html, /js\/engine\/rules-engine\.js/, `${page} should load rules engine`);
  assert.match(html, /js\/content\/mission-loader\.js/, `${page} should load mission loader`);
  assert.match(html, /js\/content\/story-engine\.js/, `${page} should load story engine`);
  assert.match(html, /js\/ui\/hud\.js/, `${page} should load HUD module`);
  assert.match(html, /js\/progress\.js/, `${page} should load progress script`);
  assert.match(html, /js\/ui\/story-log\.js/, `${page} should load story log module`);
  assert.match(html, /js\/challenges\.js/, `${page} should load challenge script`);
});

const indexHtml = read("index.html");
assert.match(indexHtml, /DevOps Triforce: Rise of Lord Ganonix/, "index page title text missing");
assert.match(indexHtml, /id="quiz-submit"/, "index quiz interaction missing");
assert.match(indexHtml, /js\/engine\/random-seed\.js/, "index should load random seed engine");
assert.match(indexHtml, /js\/engine\/incidents\.js/, "index should load incidents engine");
assert.match(indexHtml, /js\/ui\/daily-mode\.js/, "index should load daily mode UI module");

const jsProgress = read("js/progress.js");
assert.match(jsProgress, /HyruleEngine/, "central engine interface missing from progress layer");
assert.match(jsProgress, /window\.HyruleSave\.loadState/, "save schema integration missing");

const jsChallenges = read("js/challenges.js");
assert.match(jsChallenges, /setupFinalBattlePage/, "final battle setup missing");
assert.match(jsChallenges, /HIDDEN_WORKFLOW_CHECK/, "hidden workflow action dispatch missing");
assert.match(jsChallenges, /setupKeyboardShortcuts/, "keyboard shortcut setup missing");

console.log("All site checks passed.");
