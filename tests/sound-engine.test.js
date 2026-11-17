const assert = require("node:assert");

const sound = require("../js/audio/sound-engine.js");

// A tiny stand-in for the browser's AudioContext that counts what the engine builds.
function makeFakeAudio() {
  const log = { contexts: 0, oscillators: 0, sources: 0, started: 0, resumed: 0, suspended: 0 };

  function param() {
    return {
      value: 0,
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {}
    };
  }

  function node(extra) {
    return { connect() {}, disconnect() {}, ...extra };
  }

  class FakeContext {
    constructor() {
      log.contexts += 1;
      this.state = "suspended";
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.destination = node();
    }
    resume() { this.state = "running"; log.resumed += 1; }
    suspend() { this.state = "suspended"; log.suspended += 1; }
    createGain() { return node({ gain: param() }); }
    createOscillator() {
      log.oscillators += 1;
      return node({ frequency: param(), type: "sine", start() { log.started += 1; }, stop() {} });
    }
    createBiquadFilter() { return node({ frequency: param(), Q: param(), type: "lowpass" }); }
    createBuffer(_channels, length) {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    }
    createBufferSource() {
      log.sources += 1;
      return node({ buffer: null, loop: false, start() { log.started += 1; }, stop() {} });
    }
  }

  return { FakeContext, log };
}

function fakeStorage(initial) {
  const data = { ...(initial || {}) };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    data
  };
}

// Sound definitions are well formed.
Object.entries(sound.SOUNDS).forEach(([name, steps]) => {
  assert.ok(steps.length > 0, `${name} has steps`);
  steps.forEach((step) => {
    assert.ok(step.t >= 0 && step.dur > 0 && step.gain > 0 && step.gain <= 0.3, `${name} step is in range`);
    assert.ok(step.midi >= 24 && step.midi <= 100, `${name} note is audible`);
  });
});
["select", "move", "chime", "slip", "hint", "cleared", "restored", "victory"].forEach((name) => {
  assert.ok(sound.SOUNDS[name], `${name} sound exists`);
});
Object.values(sound.PAGE_THEMES).forEach((theme) => {
  assert.ok(sound.AMBIENT[theme], `ambient bed ${theme} exists`);
});
assert.strictEqual(Math.round(sound.midiToFreq(69)), 440, "A4 is 440 Hz");

// Background beds stay musical and quiet: no sub-200 Hz rumble, only faint hush, and a melody.
Object.entries(sound.AMBIENT).forEach(([theme, bed]) => {
  bed.drones.forEach((drone) => {
    assert.ok(sound.midiToFreq(drone.midi) >= 200, `${theme} drones stay above 200 Hz for small speakers`);
    assert.ok(drone.gain <= 0.035, `${theme} drones are quiet`);
  });
  assert.ok(bed.melody && bed.melody.notes.length >= 4, `${theme} has a melody scale`);
  assert.ok(bed.melody.gain <= 0.06, `${theme} melody is quiet`);
  if (bed.noise) {
    assert.ok(bed.noise.gain <= 0.01, `${theme} hush stays very faint`);
    assert.ok(bed.noise.freq <= 800, `${theme} hush is low-passed, not hissy`);
  }
});

// Off by default: nothing is created or played.
let audio = makeFakeAudio();
let store = fakeStorage();
let engine = sound.createEngine({ AudioContextClass: audio.FakeContext, storage: store });
assert.strictEqual(engine.isEnabled(), false, "sound starts off");
assert.strictEqual(engine.play("chime"), false, "nothing plays while off");
assert.strictEqual(engine.startAmbient("map"), false, "no ambient while off");
assert.strictEqual(audio.log.contexts, 0, "no audio context until sound is turned on");

// Turning it on saves the choice and lets effects play.
let heard = null;
engine.onChange((value) => { heard = value; });
assert.strictEqual(engine.toggle(), true);
assert.strictEqual(heard, true, "listeners hear the change");
assert.strictEqual(store.data[sound.STORAGE_KEY], "1", "choice is saved");
assert.strictEqual(engine.play("chime"), true, "effects play when on");
assert.strictEqual(audio.log.oscillators, sound.SOUNDS.chime.length, "one oscillator per note");
assert.strictEqual(audio.log.resumed >= 1, true, "a suspended context is resumed");
assert.strictEqual(engine.play("not-a-sound"), false, "unknown sounds are ignored");

// Ambient beds start once, switch cleanly, and stop when sound is turned off.
const before = audio.log.oscillators;
assert.strictEqual(engine.startAmbient("water"), true);
assert.ok(audio.log.oscillators > before, "ambient adds oscillators");
assert.ok(audio.log.sources >= 1, "water has a noise bed");
const afterFirst = audio.log.oscillators;
assert.strictEqual(engine.startAmbient("water"), true);
assert.strictEqual(audio.log.oscillators, afterFirst, "restarting the same bed does nothing");
engine.stopAmbient();
assert.strictEqual(engine.setEnabled(false), false);
assert.strictEqual(store.data[sound.STORAGE_KEY], "0", "turning off is saved");
assert.strictEqual(engine.play("slip"), false, "nothing plays after turning off");
assert.ok(audio.log.suspended >= 1, "the context is suspended when muted");

// A saved "on" preference is remembered, but still needs a context created on demand.
audio = makeFakeAudio();
store = fakeStorage({ [sound.STORAGE_KEY]: "1" });
engine = sound.createEngine({ AudioContextClass: audio.FakeContext, storage: store });
assert.strictEqual(engine.isEnabled(), true, "saved preference is read");
assert.strictEqual(audio.log.contexts, 0, "still no audio context before a gesture");

// Browsers without Web Audio, or with blocked storage, never throw.
engine = sound.createEngine({ AudioContextClass: null, storage: store });
assert.strictEqual(engine.supported(), false);
assert.strictEqual(engine.setEnabled(true), false, "cannot enable without Web Audio");
assert.strictEqual(engine.play("chime"), false);
const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
audio = makeFakeAudio();
engine = sound.createEngine({ AudioContextClass: audio.FakeContext, storage: blocked });
assert.strictEqual(engine.isEnabled(), false, "blocked storage means off");
assert.strictEqual(engine.setEnabled(true), true, "still works for this visit");

console.log("Sound engine checks passed.");
