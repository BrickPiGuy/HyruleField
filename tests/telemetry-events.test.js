const assert = require("node:assert");

const telemetrySession = require("../js/telemetry/session.js");
const telemetryEvents = require("../js/telemetry/events.js");

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    }
  };
}

const local = createStorage();
const session = createStorage();

const first = telemetryEvents.trackEvent(
  "mission_started",
  { mission: "power" },
  { storage: local, sessionStorage: session, sessionApi: telemetrySession }
);
assert.equal(first.type, "mission_started");
assert.equal(first.payload.mission, "power");
assert.equal(typeof first.sessionId, "string");
assert.equal(first.sequence, 1);

const second = telemetryEvents.trackEvent(
  "mission_completed",
  { mission: "power" },
  { storage: local, sessionStorage: session, sessionApi: telemetrySession }
);
assert.equal(second.sequence, 2);

const events = telemetryEvents.getEvents(local);
assert.equal(events.length, 2);
assert.equal(events[0].id, `${first.sessionId}:1`);
assert.equal(events[1].id, `${first.sessionId}:2`);

const exported = telemetryEvents.exportEvents(local);
assert.match(exported, /mission_completed/);

telemetryEvents.clearEvents(local);
assert.equal(telemetryEvents.getEvents(local).length, 0);

console.log("Telemetry event checks passed.");
