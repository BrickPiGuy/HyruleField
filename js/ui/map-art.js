(function (root, factory) {
  const api = factory(root.HyruleArt || (typeof require === "function" ? require("./art-kit.js") : undefined));
  root.HyruleMapArt = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleArt) {
  // The illustrated overworld. Takes one info object per destination and returns an SVG
  // string: glowing paths for opened routes, fog over sealed places, a flag over the next quest.

  const W = 900;
  const H = 620;

  // Where each destination sits on the map, and the trail that leads to it.
  const SITES = {
    power: { x: 450, y: 540, trail: null },
    wisdom: { x: 290, y: 400, trail: "M450,540 C390,520 330,470 290,400" },
    courage: { x: 520, y: 300, trail: "M290,400 C330,340 450,360 520,300" },
    final: { x: 450, y: 95, trail: "M520,300 C600,230 560,150 450,95" },
    forest: { x: 110, y: 470, trail: "M450,540 C300,600 170,580 110,470" },
    fire: { x: 790, y: 200, trail: "M450,540 C620,470 700,320 790,200" },
    water: { x: 790, y: 520, trail: "M450,540 C600,600 720,590 790,520" }
  };

  const NAMES = {
    power: "Temple of Power",
    wisdom: "Temple of Wisdom",
    courage: "Temple of Courage",
    fire: "Temple of Fire",
    water: "Temple of Water",
    forest: "Temple of the Forest",
    final: "Ganonix's Castle"
  };

  const HREFS = {
    power: "power.html",
    wisdom: "wisdom.html",
    courage: "courage.html",
    fire: "fire.html",
    water: "water.html",
    forest: "forest.html",
    final: "final-battle.html"
  };

  const RING = {
    power: "#f2c84b", wisdom: "#7aa2ff", courage: "#f2c84b",
    fire: "#ff8a55", water: "#5db4ff", forest: "#58d98a", final: "#a78bfa"
  };

  function escapeXml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function terrain() {
    const rng = HyruleArt.makeRng(7);
    let forestTrees = "";
    for (let i = 0; i < 34; i += 1) {
      const angle = rng() * Math.PI * 2;
      const dist = 40 + rng() * 85;
      const x = Math.round(SITES.forest.x + Math.cos(angle) * dist * 1.1);
      const y = Math.round(SITES.forest.y + Math.sin(angle) * dist * 0.8 + 10);
      forestTrees += HyruleArt.tree(x, y, 22 + Math.round(rng() * 14), i % 3 ? "#1d5a34" : "#16452a");
    }

    let grass = "";
    for (let i = 0; i < 40; i += 1) {
      const x = Math.round(60 + rng() * 780);
      const y = Math.round(150 + rng() * 440);
      grass += `<path d="M${x},${y} l-3,-7 m3,7 l0,-9 m0,9 l3,-7" stroke="#3f7a44" stroke-width="1.6" fill="none" opacity=".55"/>`;
    }

    return `
      <rect width="${W}" height="${H}" fill="url(#mapSky)"/>
      <path d="M0,200 L90,150 L170,190 L260,120 L350,175 L450,110 L560,170 L650,120 L740,180 L820,140 L900,190 V330 H0 Z" fill="#1c2540" opacity=".9"/>
      <path d="M0,260 C150,200 300,250 450,230 C600,210 750,260 900,225 V${H} H0 Z" fill="#2f6a3a"/>
      <path d="M0,340 C180,300 330,360 480,340 C650,318 780,370 900,340 V${H} H0 Z" fill="#35773f"/>
      <path d="M0,450 C200,420 380,470 560,450 C720,432 820,470 900,450 V${H} H0 Z" fill="#2d6a37"/>
      ${grass}
      <!-- forest region -->
      <ellipse cx="${SITES.forest.x}" cy="${SITES.forest.y + 18}" rx="130" ry="85" fill="#174a2b" opacity=".75"/>
      ${forestTrees}
      <!-- fire mountain -->
      <path d="M650,290 L720,160 L760,100 H820 L860,160 L900,290 Z" fill="#3b1a14"/>
      <path d="M760,100 H820 L808,128 L790,114 L772,130 Z" fill="#ff8a3d"/>
      <path d="M790,114 L786,200 M790,114 L820,190" stroke="#ff6a2a" stroke-width="4" opacity=".8" stroke-linecap="round"/>
      <circle cx="790" cy="200" r="60" fill="url(#lavaGlow)"/>
      <!-- lake -->
      <ellipse cx="${SITES.water.x}" cy="${SITES.water.y + 20}" rx="115" ry="62" fill="#1e5f96"/>
      <ellipse cx="${SITES.water.x}" cy="${SITES.water.y + 20}" rx="115" ry="62" fill="none" stroke="#7cc4f5" stroke-width="2" opacity=".5"/>
      <path d="M${SITES.water.x - 60},${SITES.water.y + 30} q15,-8 30,0 t30,0 t30,0 M${SITES.water.x - 40},${SITES.water.y + 52} q12,-7 24,0 t24,0" stroke="#a6dcff" stroke-width="2" fill="none" opacity=".6"/>
      <!-- castle crag and storm -->
      <path d="M300,200 L380,130 L450,95 L520,130 L600,200 Z" fill="#1b1230"/>
      <g class="storm">
        <ellipse cx="450" cy="40" rx="150" ry="30" fill="#2a1747" opacity=".85"/>
        <ellipse cx="380" cy="58" rx="80" ry="20" fill="#3a2060" opacity=".7"/>
        <ellipse cx="530" cy="58" rx="90" ry="22" fill="#3a2060" opacity=".7"/>
      </g>`;
  }

  function trails(infos) {
    let base = "";
    let opened = "";
    let walked = "";
    Object.keys(SITES).forEach((key) => {
      const site = SITES[key];
      if (!site.trail) {
        return;
      }
      const info = infos[key] || { status: "locked" };
      base += `<path d="${site.trail}" class="trail-base"/>`;
      if (info.status === "done") {
        walked += `<path d="${site.trail}" class="trail-walked"/>`;
      } else if (info.status !== "locked") {
        opened += `<path d="${site.trail}" class="trail-open"/>`;
      }
    });
    return `<g class="trails" fill="none">${base}${opened}${walked}</g>`;
  }

  function pin(key, info) {
    const site = SITES[key];
    const status = info.status;
    const ring = RING[key];
    const label = `${NAMES[key]}. ${info.text}.`;
    const scale = key === "final" ? 1.45 : 1.15;
    return `
      <a class="map-pin" data-map-pin="${key}" data-state="${status}" href="${HREFS[key]}" aria-label="${escapeXml(label)}"${status === "next" ? ' aria-current="step"' : ""} transform="translate(${site.x} ${site.y})">
        ${status === "next" ? '<circle class="pin-pulse" r="44" fill="none" stroke="#f2c84b" stroke-width="3"/>' : ""}
        <circle class="pin-plate" r="${key === "final" ? 42 : 34}" fill="#0a1216" stroke="${ring}" stroke-width="${status === "done" ? 5 : 3}"/>
        <g class="pin-emblem" transform="scale(${scale})">${HyruleArt.emblem(key)}</g>
        ${status === "done" ? '<circle cx="26" cy="-26" r="11" fill="#49d17d" stroke="#0a1216" stroke-width="2"/><path d="M20,-26 l4,4 l8,-9" stroke="#0a1216" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ""}
        <text class="pin-name" y="${key === "final" ? 66 : 58}" text-anchor="middle">${escapeXml(NAMES[key])}</text>
        <text class="pin-status" y="${key === "final" ? 82 : 74}" text-anchor="middle">${escapeXml(status === "locked" ? "Sealed" : info.text)}</text>
      </a>`;
  }

  function fog(key, info) {
    if (info.status !== "locked") {
      return "";
    }
    const site = SITES[key];
    const radius = key === "final" ? 105 : 78;
    return `<g class="fog" data-fog="${key}" transform="translate(${site.x} ${site.y})" pointer-events="none">
      <circle r="${radius}" fill="url(#fogGrad)"/>
      <g transform="translate(0 -6)"><rect x="-9" y="-2" width="18" height="14" rx="3" fill="#dfe6f2"/><path d="M-6,-2 V-8 A6,6 0 0 1 6,-8 V-2" fill="none" stroke="#dfe6f2" stroke-width="3"/></g>
    </g>`;
  }

  function hero(infos) {
    const nextKey = Object.keys(infos).find((key) => infos[key].status === "next");
    if (!nextKey) {
      return "";
    }
    const site = SITES[nextKey];
    return `<g transform="translate(${site.x} ${site.y - 62})" pointer-events="none"><g class="hero-flag" data-hero="${nextKey}">
      <path d="M0,0 V-26" stroke="#e8d8a0" stroke-width="3" stroke-linecap="round"/>
      <path d="M0,-26 L22,-19 L0,-12 Z" fill="#f2c84b"/>
    </g></g>`;
  }

  function render(infos) {
    const keys = Object.keys(SITES);
    const safe = {};
    keys.forEach((key) => {
      safe[key] = infos && infos[key] ? infos[key] : { status: "locked", text: "Sealed" };
    });

    const finalDone = safe.final.status === "done";
    return `<svg class="hyrule-map${finalDone ? " is-calm" : ""}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Map of Hyrule Field" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2146"/><stop offset=".42" stop-color="#2c4f45"/><stop offset="1" stop-color="#244a2f"/></linearGradient>
        <radialGradient id="fogGrad"><stop offset="0" stop-color="#0c1424" stop-opacity=".94"/><stop offset=".65" stop-color="#101a30" stop-opacity=".82"/><stop offset="1" stop-color="#101a30" stop-opacity="0"/></radialGradient>
        <radialGradient id="lavaGlow"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
      </defs>
      ${terrain()}
      ${trails(safe)}
      ${keys.map((key) => pin(key, safe[key])).join("")}
      ${keys.map((key) => fog(key, safe[key])).join("")}
      ${hero(safe)}
    </svg>`;
  }

  return { SITES, NAMES, render };
});
