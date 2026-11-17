(function (root, factory) {
  const api = factory();
  root.HyruleSoundEngine = api;
  if (typeof window !== "undefined" && root === window) {
    root.HyruleSound = api.createEngine({
      AudioContextClass: window.AudioContext || window.webkitAudioContext || null,
      storage: (function () {
        try {
          return window.localStorage;
        } catch (_error) {
          return null;
        }
      })()
    });
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  // Every sound is synthesized with the Web Audio API, so there are no audio files to license
  // or download. Sound is off until the player turns it on, and nothing plays before a click
  // or key press, because browsers block audio that starts on its own.

  const STORAGE_KEY = "hyruleSoundEnabled";
  const MASTER_VOLUME = 0.5;

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Short effects. Each step: t = start offset (s), midi note, dur (s), type, gain, slideTo (midi).
  const SOUNDS = {
    select: [{ t: 0, midi: 88, dur: 0.06, type: "triangle", gain: 0.12 }],
    move: [{ t: 0, midi: 79, dur: 0.05, type: "square", gain: 0.05 }],
    chime: [
      { t: 0, midi: 72, dur: 0.35, type: "triangle", gain: 0.22 },
      { t: 0.09, midi: 76, dur: 0.35, type: "triangle", gain: 0.22 },
      { t: 0.18, midi: 79, dur: 0.35, type: "triangle", gain: 0.22 },
      { t: 0.27, midi: 84, dur: 0.6, type: "triangle", gain: 0.25 }
    ],
    slip: [
      { t: 0, midi: 45, dur: 0.22, type: "sawtooth", gain: 0.18, slideTo: 36 },
      { t: 0, midi: 33, dur: 0.22, type: "square", gain: 0.1, slideTo: 28 }
    ],
    hint: [
      { t: 0, midi: 88, dur: 0.45, type: "sine", gain: 0.16 },
      { t: 0.14, midi: 95, dur: 0.6, type: "sine", gain: 0.14 }
    ],
    cleared: [
      { t: 0, midi: 67, dur: 0.25, type: "triangle", gain: 0.22 },
      { t: 0.12, midi: 71, dur: 0.25, type: "triangle", gain: 0.22 },
      { t: 0.24, midi: 74, dur: 0.25, type: "triangle", gain: 0.22 },
      { t: 0.36, midi: 79, dur: 0.7, type: "triangle", gain: 0.26 },
      { t: 0.36, midi: 83, dur: 0.7, type: "sine", gain: 0.12 }
    ],
    restored: [
      { t: 0, midi: 67, dur: 0.16, type: "square", gain: 0.1 },
      { t: 0.17, midi: 67, dur: 0.16, type: "square", gain: 0.1 },
      { t: 0.34, midi: 67, dur: 0.16, type: "square", gain: 0.1 },
      { t: 0.52, midi: 72, dur: 0.9, type: "square", gain: 0.11 },
      { t: 0.52, midi: 76, dur: 0.9, type: "triangle", gain: 0.16 },
      { t: 0.52, midi: 60, dur: 0.9, type: "triangle", gain: 0.18 }
    ],
    victory: [
      { t: 0, midi: 60, dur: 0.18, type: "square", gain: 0.1 },
      { t: 0.2, midi: 64, dur: 0.18, type: "square", gain: 0.1 },
      { t: 0.4, midi: 67, dur: 0.18, type: "square", gain: 0.1 },
      { t: 0.6, midi: 72, dur: 0.18, type: "square", gain: 0.1 },
      { t: 0.8, midi: 76, dur: 0.18, type: "square", gain: 0.1 },
      { t: 1.0, midi: 79, dur: 0.18, type: "square", gain: 0.1 },
      { t: 1.25, midi: 84, dur: 1.6, type: "triangle", gain: 0.2 },
      { t: 1.25, midi: 79, dur: 1.6, type: "triangle", gain: 0.14 },
      { t: 1.25, midi: 72, dur: 1.6, type: "triangle", gain: 0.14 },
      { t: 1.25, midi: 60, dur: 1.6, type: "sine", gain: 0.18 }
    ]
  };

  // Quiet background beds. drones: sustained notes; noise: filtered hiss (wind, water, rumble);
  // chirps: occasional bird-like calls.
  const AMBIENT = {
    map: { drones: [{ midi: 48, gain: 0.05 }, { midi: 55, gain: 0.035 }, { midi: 64, gain: 0.02 }], noise: { freq: 500, q: 0.6, gain: 0.012 } },
    power: { drones: [{ midi: 36, gain: 0.07 }, { midi: 43, gain: 0.04 }], noise: { freq: 220, q: 0.8, gain: 0.02 } },
    wisdom: { drones: [{ midi: 50, gain: 0.04 }, { midi: 57, gain: 0.035 }, { midi: 62, gain: 0.025 }, { midi: 69, gain: 0.015 }] },
    courage: { drones: [{ midi: 41, gain: 0.07 }, { midi: 48, gain: 0.05 }, { midi: 55, gain: 0.03 }] },
    fire: { drones: [{ midi: 33, gain: 0.07 }], noise: { freq: 160, q: 0.7, gain: 0.04 } },
    water: { drones: [{ midi: 52, gain: 0.03 }, { midi: 59, gain: 0.025 }], noise: { freq: 900, q: 0.5, gain: 0.03 } },
    forest: { drones: [{ midi: 45, gain: 0.04 }, { midi: 52, gain: 0.03 }], noise: { freq: 700, q: 0.4, gain: 0.016 }, chirps: true },
    final: { drones: [{ midi: 38, gain: 0.07 }, { midi: 45, gain: 0.05 }, { midi: 50, gain: 0.03 }], noise: { freq: 300, q: 0.7, gain: 0.02 } }
  };

  const PAGE_THEMES = {
    index: "map", training: "map", power: "power", wisdom: "wisdom", courage: "courage",
    fire: "fire", water: "water", forest: "forest", final: "final"
  };

  function createEngine(options) {
    const settings = options || {};
    const AudioContextClass = settings.AudioContextClass || null;
    const storage = settings.storage || null;
    const listeners = [];

    let enabled = false;
    try {
      enabled = Boolean(storage) && storage.getItem(STORAGE_KEY) === "1";
    } catch (_error) {
      enabled = false;
    }

    let ctx = null;
    let master = null;
    let ambient = null;
    let ambientTheme = null;
    let chirpTimer = null;

    function supported() {
      return Boolean(AudioContextClass);
    }

    function notify() {
      listeners.forEach((listener) => listener(enabled));
    }

    function ensureContext() {
      if (!supported()) {
        return null;
      }

      if (!ctx) {
        ctx = new AudioContextClass();
        master = ctx.createGain();
        master.gain.value = MASTER_VOLUME;
        master.connect(ctx.destination);
      }

      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume();
      }

      return ctx;
    }

    function playStep(step, startAt) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = startAt + step.t;
      const end = start + step.dur;

      osc.type = step.type || "sine";
      osc.frequency.setValueAtTime(midiToFreq(step.midi), start);
      if (typeof step.slideTo === "number") {
        osc.frequency.exponentialRampToValueAtTime(midiToFreq(step.slideTo), end);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(step.gain, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(end + 0.05);
    }

    function play(name) {
      if (!enabled || !SOUNDS[name] || !ensureContext()) {
        return false;
      }

      const startAt = ctx.currentTime + 0.01;
      SOUNDS[name].forEach((step) => playStep(step, startAt));
      return true;
    }

    function noiseBuffer() {
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    function chirp() {
      if (!ctx || !enabled || ambientTheme !== "forest") {
        return;
      }

      const start = ctx.currentTime + 0.01;
      const base = 84 + Math.floor(Math.random() * 8);
      playStep({ t: 0, midi: base, dur: 0.12, type: "sine", gain: 0.05, slideTo: base + 5 }, start);
      playStep({ t: 0.16, midi: base + 3, dur: 0.1, type: "sine", gain: 0.04, slideTo: base + 8 }, start);
    }

    function stopAmbient() {
      if (chirpTimer) {
        clearInterval(chirpTimer);
        chirpTimer = null;
      }

      if (ambient) {
        ambient.nodes.forEach((node) => {
          try {
            if (typeof node.stop === "function") {
              node.stop();
            }
            node.disconnect();
          } catch (_error) {
            // Node already stopped.
          }
        });
        ambient = null;
      }

      ambientTheme = null;
    }

    function startAmbient(theme) {
      const bed = AMBIENT[theme];
      if (!enabled || !bed || !ensureContext()) {
        return false;
      }

      if (ambientTheme === theme && ambient) {
        return true;
      }

      stopAmbient();
      ambientTheme = theme;
      const bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(master);
      const nodes = [bus];

      (bed.drones || []).forEach((drone, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoDepth = ctx.createGain();
        osc.type = index % 2 ? "triangle" : "sine";
        osc.frequency.value = midiToFreq(drone.midi);
        gain.gain.value = drone.gain;
        lfo.frequency.value = 0.07 + index * 0.03;
        lfoDepth.gain.value = drone.gain * 0.4;
        lfo.connect(lfoDepth);
        lfoDepth.connect(gain.gain);
        osc.connect(gain);
        gain.connect(bus);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, gain, lfoDepth);
      });

      if (bed.noise) {
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        source.buffer = noiseBuffer();
        source.loop = true;
        filter.type = "bandpass";
        filter.frequency.value = bed.noise.freq;
        filter.Q.value = bed.noise.q;
        gain.gain.value = bed.noise.gain;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        source.start();
        nodes.push(source, filter, gain);
      }

      ambient = { nodes };

      if (bed.chirps) {
        chirpTimer = setInterval(() => {
          if (Math.random() < 0.55) {
            chirp();
          }
        }, 3500);
      }

      return true;
    }

    function setEnabled(value) {
      enabled = Boolean(value) && supported();
      try {
        if (storage) {
          storage.setItem(STORAGE_KEY, enabled ? "1" : "0");
        }
      } catch (_error) {
        // Preference just will not persist.
      }

      if (!enabled) {
        stopAmbient();
        if (ctx && typeof ctx.suspend === "function") {
          ctx.suspend();
        }
      }

      notify();
      return enabled;
    }

    return {
      supported,
      isEnabled: () => enabled,
      setEnabled,
      toggle: () => setEnabled(!enabled),
      play,
      startAmbient,
      stopAmbient,
      ensureContext,
      themeForPage: (page) => PAGE_THEMES[page] || null,
      onChange(listener) {
        listeners.push(listener);
      }
    };
  }

  return { STORAGE_KEY, SOUNDS, AMBIENT, PAGE_THEMES, midiToFreq, createEngine };
});
