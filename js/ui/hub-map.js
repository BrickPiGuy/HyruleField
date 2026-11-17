(function (root, factory) {
  const api = factory(root.HyruleGameState);
  root.HyruleHubMap = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState) {
  // The Hyrule map on the home page. One glance shows what is restored, what is sealed
  // and the single next quest, so the player never has to guess where to go.

  const NODES = [
    { key: "fire", name: "Temple of Fire", topic: "Testing and quality", icon: "🔥", href: "fire.html", row: "sages" },
    { key: "forest", name: "Temple of the Forest", topic: "Infrastructure as code", icon: "🌲", href: "forest.html", row: "sages" },
    { key: "water", name: "Temple of Water", topic: "Monitoring and incidents", icon: "💧", href: "water.html", row: "sages" },
    { key: "power", name: "Temple of Power", topic: "Continuous integration", icon: "⚔️", href: "power.html", row: "path" },
    { key: "wisdom", name: "Temple of Wisdom", topic: "DevSecOps", icon: "📜", href: "wisdom.html", row: "path" },
    { key: "courage", name: "Temple of Courage", topic: "Continuous deployment", icon: "🛡️", href: "courage.html", row: "path" },
    { key: "final", name: "Ganonix's Castle", topic: "The final battle", icon: "🏰", href: "final-battle.html", row: "castle" }
  ];

  const LABELS = {
    power: "Power", wisdom: "Wisdom", courage: "Courage", fire: "Fire", water: "Water", forest: "Forest"
  };

  function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function describeNode(state, node) {
    const done = node.key === "final"
      ? Boolean(state.rewards && state.rewards.finalVictoryAwarded)
      : Boolean(state[node.key]);
    const unlocked = HyruleGameState.isTempleUnlocked(state, node.key);
    const isNext = HyruleGameState.nextDestination(state) === node.key;

    if (done) {
      const rank = node.key !== "final" && state.rewards && state.rewards.templeRanks
        ? state.rewards.templeRanks[node.key]
        : null;
      return { status: "done", text: rank ? `Restored (${rank})` : "Restored" };
    }

    if (!unlocked) {
      const missing = (HyruleGameState.TEMPLE_REQUIREMENTS[node.key] || []).filter((piece) => !state[piece]);
      return { status: "locked", text: `Sealed: restore ${missing.map((piece) => LABELS[piece]).join(" and ")} first` };
    }

    const started = node.key !== "final" && Array.isArray((state.trials || {})[node.key]) && state.trials[node.key].length > 0;
    if (isNext) {
      return { status: "next", text: started ? "Next quest: continue" : "Next quest: begin here" };
    }
    return { status: "open", text: started ? "In progress" : "Open" };
  }

  function render(state) {
    const rows = { sages: [], path: [], castle: [] };
    NODES.forEach((node) => {
      const info = describeNode(state, node);
      const label = `${node.name}. ${node.topic}. ${info.text}.`;
      rows[node.row].push(`
        <a class="map-node" data-map-node="${node.key}" data-state="${info.status}" href="${node.href}" aria-label="${escapeHtml(label)}"${info.status === "next" ? ' aria-current="step"' : ""}>
          <span class="map-icon" aria-hidden="true">${node.icon}</span>
          <span class="map-name">${escapeHtml(node.name)}</span>
          <span class="map-topic">${escapeHtml(node.topic)}</span>
          <span class="map-status">${escapeHtml(info.text)}</span>
        </a>`);
    });

    return `
      <p class="map-row-label">The Triforce Path <span>(in order)</span></p>
      <div class="map-row map-path">${rows.path.join("")}</div>
      <p class="map-row-label">Sage Trials <span>(open after Power, any order)</span></p>
      <div class="map-row map-sages">${rows.sages.join("")}</div>
      <p class="map-row-label">The Final Battle <span>(needs all six temples)</span></p>
      <div class="map-row map-castle">${rows.castle.join("")}</div>`;
  }

  function update(state) {
    if (typeof document === "undefined") {
      return;
    }

    const mount = document.getElementById("hub-map");
    if (!mount || !state) {
      return;
    }

    mount.innerHTML = render(state);
  }

  return { NODES, describeNode, render, update };
});
