(function (root, factory) {
  const api = factory(root.HyruleIncidents);
  root.HyruleDailyMode = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleIncidents) {
  function isoDateToday() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }

  async function renderDailyChallenge(mode) {
    const panel = document.getElementById("daily-mode-panel");
    const list = document.getElementById("daily-challenge-list");
    const seedNode = document.getElementById("daily-seed");
    if (!panel || !list || !seedNode) {
      return;
    }

    const date = isoDateToday();
    const challenge = await HyruleIncidents.getDailyChallenge(date, mode, 3);

    seedNode.textContent = `Daily Seed: ${challenge.seed}`;
    list.innerHTML = challenge.cards
      .map((card) => `<li><strong>${card.title}</strong>: ${card.description}</li>`)
      .join("");
  }

  function setup() {
    const rerollButton = document.getElementById("daily-mode-reroll");
    rerollButton?.addEventListener("click", () => {
      renderDailyChallenge("heroic");
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
