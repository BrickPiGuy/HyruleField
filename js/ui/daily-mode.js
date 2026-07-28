(function (root, factory) {
  const api = factory(root.HyruleIncidents);
  root.HyruleDailyMode = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleIncidents) {
  const MODE_LABELS = {
    standard: "Standard",
    heroic: "Heroic"
  };

  function isoDateToday() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }

  async function renderDailyChallenge(mode) {
    const panel = document.getElementById("daily-mode-panel");
    const list = document.getElementById("daily-challenge-list");
    const seedNode = document.getElementById("daily-seed");
    const rerollButton = document.getElementById("daily-mode-reroll");
    if (!panel || !list || !seedNode || !rerollButton) {
      return;
    }

    const activeMode = mode === "heroic" ? "heroic" : "standard";
    const date = isoDateToday();
    const challenge = await HyruleIncidents.getDailyChallenge(date, activeMode, 3);

    seedNode.textContent = `Daily Seed (${MODE_LABELS[activeMode]}): ${challenge.seed}`;
    list.innerHTML = challenge.cards
      .map((card) => `<li><strong>${card.title}</strong>: ${card.description}</li>`)
      .join("");

    const nextMode = activeMode === "standard" ? "heroic" : "standard";
    rerollButton.textContent = `Switch to ${MODE_LABELS[nextMode]} Seed`;
    rerollButton.setAttribute("data-mode", activeMode);
  }

  function setup() {
    const rerollButton = document.getElementById("daily-mode-reroll");
    rerollButton?.addEventListener("click", () => {
      const currentMode = rerollButton.getAttribute("data-mode") === "heroic" ? "heroic" : "standard";
      const nextMode = currentMode === "standard" ? "heroic" : "standard";
      renderDailyChallenge(nextMode).catch(() => {
        // Daily challenge should fail quietly if data cannot load.
      });
    });

    renderDailyChallenge("standard").catch(() => {
      // Daily challenge should fail quietly if data cannot load.
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.getAttribute("data-page") === "index") {
      setup();
    }
  });

  return {
    renderDailyChallenge
  };
});
