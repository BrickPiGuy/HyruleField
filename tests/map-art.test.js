const assert = require("node:assert");

const art = require("../js/ui/art-kit.js");
const mapArt = require("../js/ui/map-art.js");

const keys = ["power", "wisdom", "courage", "fire", "water", "forest", "final"];

function infos(overrides) {
  const base = {};
  keys.forEach((key) => { base[key] = { status: "locked", text: "Sealed" }; });
  return { ...base, ...overrides };
}

// Fresh game: only Power is open, everything else sits in fog.
const fresh = mapArt.render(infos({ power: { status: "next", text: "Next quest: begin here" } }));
assert.strictEqual((fresh.match(/data-map-pin=/g) || []).length, 7, "every destination has a pin");
assert.strictEqual((fresh.match(/data-fog=/g) || []).length, 6, "sealed places are fogged");
assert.match(fresh, /data-hero="power"/, "the flag marks the next quest");
assert.match(fresh, /aria-current="step"/, "the next quest is marked for screen readers");
keys.forEach((key) => {
  assert.match(fresh, new RegExp(`data-map-pin="${key}"[^>]*href="[a-z-]+\\.html"`), `${key} pin links to its page`);
});
assert.match(fresh, /aria-label="Map of Hyrule Field"/);

// Part way through: opened trails glow, restored temples lose their fog.
const mid = mapArt.render(infos({
  power: { status: "done", text: "Restored" },
  wisdom: { status: "next", text: "Next quest" },
  fire: { status: "open", text: "Open" }
}));
assert.strictEqual((mid.match(/class="trail-walked"/g) || []).length, 0, "power has no trail of its own");
assert.strictEqual((mid.match(/class="trail-open"/g) || []).length, 2, "wisdom and fire trails are open");
assert.ok(!/data-fog="power"/.test(mid) && !/data-fog="wisdom"/.test(mid) && !/data-fog="fire"/.test(mid), "open places have no fog");
assert.ok(/data-fog="courage"/.test(mid), "courage is still fogged");

// Victory: no fog, no flag, calm sky.
const won = {};
keys.forEach((key) => { won[key] = { status: "done", text: "Restored" }; });
const calm = mapArt.render(won);
assert.ok(!/data-fog=/.test(calm), "no fog once everything is restored");
assert.ok(!/data-hero=/.test(calm), "no flag when nothing is left to do");
assert.match(calm, /is-calm/, "the storm calms after victory");
assert.strictEqual((calm.match(/class="trail-walked"/g) || []).length, 6, "every trail is walked");

// Art kit
keys.forEach((key) => assert.ok(art.emblem(key).length > 0, `${key} has an emblem`));
["power", "wisdom", "courage", "fire", "water", "forest"].forEach((key) => {
  const scene = art.scene(key);
  assert.match(scene, /<svg class="temple-art"/, `${key} has a banner scene`);
  assert.match(scene, /role="img"/);
});
assert.strictEqual(art.scene("nope"), "", "unknown scene is empty");
assert.strictEqual(art.scene("fire"), art.scene("fire"), "scenes are deterministic");

console.log("Map art checks passed.");
