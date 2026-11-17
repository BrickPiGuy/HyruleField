(function (root, factory) {
  const api = factory();
  root.HyruleArt = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  // Original vector art, drawn in code so there are no image files to license or load.
  // Every function returns an SVG string; nothing here touches the DOM.

  const EMBLEMS = {
    power: '<path d="M0,-17 L3,8 L-3,8 Z" fill="#e8eef5"/><rect x="-9" y="8" width="18" height="3" rx="1" fill="#d9b44f"/><rect x="-2" y="11" width="4" height="7" fill="#8a5a2b"/>',
    wisdom: '<rect x="-11" y="-14" width="22" height="28" rx="3" fill="#e9dcc0"/><path d="M-7,-7H7M-7,-1H7M-7,5H3" stroke="#6b4e1f" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="9" r="2.5" fill="#4a7bd6"/>',
    courage: '<path d="M0,-16 L13,-10 V3 C13,11 6,16 0,19 C-6,16 -13,11 -13,3 V-10 Z" fill="#3f7fd6" stroke="#f2c84b" stroke-width="2"/><path d="M0,-8 L5,2 H-5 Z" fill="#f2c84b"/>',
    fire: '<path d="M0,-18 C8,-8 14,-2 10,8 C8,14 -8,14 -10,8 C-14,-2 -4,-8 0,-18 Z" fill="#ff8a3d"/><path d="M0,-6 C5,0 7,4 4,9 C2,12 -2,12 -4,9 C-7,4 -2,0 0,-6 Z" fill="#ffd36b"/>',
    water: '<path d="M0,-18 C8,-6 13,0 13,6 A13,13 0 0 1 -13,6 C-13,0 -8,-6 0,-18 Z" fill="#5db4ff"/><path d="M-6,6 A6,6 0 0 0 2,12" stroke="#d7efff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    forest: '<path d="M0,-18 L11,-2 H5 L13,10 H-13 L-5,-2 H-11 Z" fill="#3fbf72"/><rect x="-2.5" y="10" width="5" height="7" fill="#7a4a24"/>',
    final: '<path d="M-16,16 V-2 H-11 V-9 H-6 V-2 H-3 V-14 H3 V-2 H6 V-9 H11 V-2 H16 V16 Z" fill="#8c6bd1"/><rect x="-3" y="6" width="6" height="10" fill="#1a1030"/>'
  };

  // Small deterministic generator so scenes look the same on every load.
  function makeRng(seed) {
    let value = seed >>> 0 || 1;
    return function next() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function emblem(key) {
    return EMBLEMS[key] || "";
  }

  function tree(x, y, size, fill) {
    const w = size * 0.7;
    return `<path d="M${x},${y - size} L${x + w},${y} H${x - w} Z" fill="${fill}"/>`;
  }

  function particles(count, seed, width, height, className, radius) {
    const rng = makeRng(seed);
    let out = "";
    for (let i = 0; i < count; i += 1) {
      const x = Math.round(rng() * width);
      const y = Math.round(height * 0.2 + rng() * height * 0.75);
      const delay = (rng() * 5).toFixed(1);
      const r = (radius * (0.6 + rng() * 0.8)).toFixed(1);
      out += `<circle class="${className}" cx="${x}" cy="${y}" r="${r}" style="animation-delay:-${delay}s"/>`;
    }
    return out;
  }

  const SCENES = {
    power: {
      label: "A glowing forge",
      sky: ["#3a1d12", "#a4491f"],
      body: () => `
        <path d="M0,140 V104 H210 L240 90 H430 L460 104 H900 V140 Z" fill="#150c08"/>
        <path d="M380,104 H520 L540 88 H360 Z" fill="#241510"/>
        <rect x="395" y="60" width="110" height="28" rx="4" fill="#2b1a12"/>
        <path d="M395,66 H505" stroke="#f2a14a" stroke-width="3" opacity=".7"/>
        ${particles(18, 11, 900, 140, "spark", 2.2)}`
    },
    wisdom: {
      label: "A moonlit library of arches",
      sky: ["#141a3d", "#3b3f86"],
      body: () => `
        ${[120, 330, 540, 750].map((x) => `<path d="M${x},140 V70 A45,45 0 0 1 ${x + 90},70 V140 Z" fill="#0d1230"/><path d="M${x + 14},140 V72 A31,31 0 0 1 ${x + 76},72 V140 Z" fill="#26307a" opacity=".7"/>`).join("")}
        <circle cx="450" cy="34" r="16" fill="#e8eaff" opacity=".85"/>
        ${particles(14, 23, 900, 140, "rune", 3)}`
    },
    courage: {
      label: "A castle gate at sunset",
      sky: ["#4a1c2a", "#d9803c"],
      body: () => `
        <path d="M0,140 V96 H120 V60 H150 V96 H330 V44 H370 V96 H530 V44 H570 V96 H750 V60 H780 V96 H900 V140 Z" fill="#1a0d12"/>
        <path d="M410,140 V86 A40,40 0 0 1 490,86 V140 Z" fill="#2a1219"/>
        <path d="M345,44 L345,20 L368,30 Z M545,44 L545,20 L568,30 Z" fill="#f2c84b"/>
        <circle cx="450" cy="30" r="22" fill="#ffd9a0" opacity=".55"/>`
    },
    fire: {
      label: "A volcano raining embers",
      sky: ["#2a0d0d", "#c2401f"],
      body: () => `
        <path d="M0,140 L230,120 L360,70 L430,38 H470 L540,70 L690,118 L900,140 Z" fill="#190a0a"/>
        <path d="M430,38 H470 L462,58 L450,50 L438,60 Z" fill="#ff9a3c"/>
        <path d="M450,50 L446,100 M450,50 L470,96" stroke="#ff7a2a" stroke-width="3" opacity=".8"/>
        ${particles(26, 5, 900, 140, "ember", 2.4)}`
    },
    water: {
      label: "Rolling waves and rising bubbles",
      sky: ["#0c2a4a", "#2c7fb8"],
      body: () => `
        <path d="M0,96 Q75,80 150,96 T300,96 T450,96 T600,96 T750,96 T900,96 V140 H0 Z" fill="#103d66" opacity=".85"/>
        <path d="M0,116 Q90,100 180,116 T360,116 T540,116 T720,116 T900,116 V140 H0 Z" fill="#0a2c4d"/>
        ${particles(20, 9, 900, 140, "bubble", 3)}`
    },
    forest: {
      label: "A dark forest with fireflies",
      sky: ["#0f2a1a", "#2f7a45"],
      body: () => {
        const rng = makeRng(31);
        let trees = "";
        for (let i = 0; i < 26; i += 1) {
          const x = Math.round(i * 36 + rng() * 14);
          const size = 50 + Math.round(rng() * 40);
          trees += tree(x, 140, size, i % 2 ? "#0c2415" : "#143821");
        }
        return trees + particles(16, 17, 900, 140, "firefly", 2.2);
      }
    }
  };

  function scene(key) {
    const art = SCENES[key];
    if (!art) {
      return "";
    }

    return `<svg class="temple-art" viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${art.label}">
      <defs><linearGradient id="sky-${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${art.sky[0]}"/><stop offset="1" stop-color="${art.sky[1]}"/></linearGradient></defs>
      <rect width="900" height="140" fill="url(#sky-${key})"/>
      ${art.body()}
      <g transform="translate(60 70) scale(2.2)" opacity=".95">${emblem(key)}</g>
    </svg>`;
  }

  return { EMBLEMS, emblem, scene, tree, makeRng, SCENE_KEYS: Object.keys(SCENES) };
});
