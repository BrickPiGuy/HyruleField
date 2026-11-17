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

const instructor = require("../js/ui/instructor-mode.js");
function fakeStorage() {
  const data = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

const store = fakeStorage();
assert.strictEqual(instructor.isInstructorAccessEnabled("", store), false, "instructor mode is hidden by default");
assert.strictEqual(instructor.isInstructorAccessEnabled("?other=1", store), false, "unrelated parameters do not enable it");
assert.strictEqual(instructor.isInstructorAccessEnabled("?instructor=1", store), true, "?instructor=1 enables it");
assert.strictEqual(instructor.isInstructorAccessEnabled("", store), true, "it stays on for the rest of the session");
assert.strictEqual(instructor.isInstructorAccessEnabled("?instructor=0", store), false, "?instructor=0 turns it off");
assert.strictEqual(instructor.isInstructorAccessEnabled("", store), false, "and it stays off afterwards");
const brokenStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
assert.strictEqual(instructor.isInstructorAccessEnabled("?instructor=1", brokenStorage), true, "works when storage is blocked");
assert.strictEqual(instructor.isInstructorAccessEnabled("", brokenStorage), false, "and stays hidden without a flag");

console.log("Instructor mode checks passed.");
