const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "js/ui/instructor-mode.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

assert.match(source, /PAGE_CONFIG/, "instructor mode should define page configuration");
assert.match(source, /Reveal Next Hint/, "instructor mode should expose hint controls");
assert.match(source, /aria-expanded/, "instructor mode should manage toggle state");
assert.match(source, /expectedAnswers/, "instructor mode should render expected answers");
assert.match(source, /riskMap/, "instructor mode should render risk mapping");
assert.match(css, /\.instructor-panel/, "CSS should style the instructor overlay");
assert.match(css, /#instructor-toggle/, "CSS should style the instructor toggle button");

console.log("Instructor mode checks passed.");
