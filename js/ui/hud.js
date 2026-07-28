(function (root, factory) {
  const api = factory(root.HyruleMissionLoader);
  root.HyruleHUD = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleMissionLoader) {
  const pageToMission = {
    power: "power",
    wisdom: "wisdom",
    courage: "courage",
    final: "final-battle"
  };

  let objectiveNode = null;
  let gateNode = null;

  function missionLabel(key) {
    const labels = {
      power: "Power",
      wisdom: "Wisdom",
      courage: "Courage",
      finalBattle: "Final Battle"
    };
    return labels[key] || key;
  }

  function missionStatusSummary(state) {
    const missionKeys = ["power", "wisdom", "courage", "finalBattle"];
    return missionKeys.map((key) => {
      const mission = state.missions && state.missions[key] ? state.missions[key] : { status: "locked" };
      return `${missionLabel(key)}: ${mission.status}`;
    }).join(" | ");
  }

  async function resolveObjectiveText(page) {
    if (!pageToMission[page]) {
      return "Choose a temple path to begin restoring the pipeline gates.";
    }

    try {
      const mission = await HyruleMissionLoader.loadMission(pageToMission[page]);
      return mission.objective || "Objective unavailable for this mission.";
    } catch (_error) {
      return "Objective unavailable for this mission.";
    }
  }

  async function setup() {
    const shell = document.querySelector(".site-shell");
    const statusBar = document.querySelector(".status-bar");

    if (!shell || !statusBar) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "hud-panel";
    panel.innerHTML = "<p class=\"hud-title\">Mission HUD</p><p id=\"hud-objective\">Loading objective...</p><p id=\"hud-gates\"></p>";
    statusBar.insertAdjacentElement("afterend", panel);

    objectiveNode = panel.querySelector("#hud-objective");
    gateNode = panel.querySelector("#hud-gates");

    const page = document.body.getAttribute("data-page");
    objectiveNode.textContent = await resolveObjectiveText(page);
  }

  function update(state) {
    if (gateNode) {
      gateNode.textContent = missionStatusSummary(state);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setup();
  });

  return {
    update
  };
});
