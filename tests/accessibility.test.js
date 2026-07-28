const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const challenges = fs.readFileSync(path.join(root, "js/challenges.js"), "utf8");

assert.match(css, /prefers-reduced-motion: reduce/, "CSS should include reduced-motion media query");
assert.match(css, /button:focus-visible/, "CSS should include visible focus style for buttons");
assert.match(css, /\.skip-link/, "CSS should define skip link styling");

assert.match(challenges, /!event\.altKey\s*\|\|\s*!event\.shiftKey/, "shortcuts should use modifier keys");
assert.match(challenges, /shouldIgnoreShortcut/, "shortcuts should avoid stealing typing focus");

console.log("Accessibility checks passed.");
