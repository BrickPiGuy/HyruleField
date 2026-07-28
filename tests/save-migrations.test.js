const assert = require("node:assert");

const gameState = require("../js/engine/game-state.js");
global.HyruleGameState = gameState;
const migrations = require("../js/engine/migrations.js");
global.HyruleMigrations = migrations;
const saveSchema = require("../js/engine/save-schema.js");

const legacyState = {
  power: true,
  corruption: 999,
  challenges: {}
};

const migrated = migrations.migrateState(legacyState);
assert.strictEqual(migrated.saveVersion, gameState.CURRENT_SAVE_VERSION, "migrated save version should be current");
assert.strictEqual(migrated.corruption, 100, "corruption should be clamped during migration");
assert.ok(migrated.challenges.securityCards, "security cards map should exist after migration");

const storage = {
  buffer: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.buffer, key) ? this.buffer[key] : null;
  },
  setItem(key, value) {
    this.buffer[key] = value;
  }
};

saveSchema.saveState(legacyState, storage);
const loaded = saveSchema.loadState(storage);
assert.strictEqual(loaded.saveVersion, gameState.CURRENT_SAVE_VERSION, "loaded save should be migrated");
assert.strictEqual(loaded.power, true, "saved and loaded data should preserve existing progress");

console.log("Save migration checks passed.");
