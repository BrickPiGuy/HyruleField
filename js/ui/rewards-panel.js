(function (root, factory) {
  const api = factory();
  root.HyruleRewardsPanel = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  let panelRoot = null;

  function renderRanks(templeRanks) {
    const entries = [
      ["Power", templeRanks.power],
      ["Wisdom", templeRanks.wisdom],
      ["Courage", templeRanks.courage]
    ];

    return entries.map(([name, rank]) => `${name}: ${rank || "-"}`).join(" | ");
  }

  function setup() {
    const shell = document.querySelector(".site-shell");
    if (!shell) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "rewards-panel";
    panel.innerHTML = "<p class=\"rewards-title\">Score and Rewards</p><p id=\"rewards-score\"></p><p id=\"rewards-ranks\"></p>";

    const hudPanel = document.querySelector(".hud-panel");
    if (hudPanel) {
      hudPanel.insertAdjacentElement("afterend", panel);
    } else {
      const statusBar = document.querySelector(".status-bar");
      if (statusBar) {
        statusBar.insertAdjacentElement("afterend", panel);
      } else {
        shell.prepend(panel);
      }
    }

    panelRoot = panel;
  }

  function update(state) {
    if (!panelRoot) {
      return;
    }

    const rewards = state.rewards || { totalScore: 0, rewardPoints: 0, templeRanks: {} };
    const scoreNode = panelRoot.querySelector("#rewards-score");
    const ranksNode = panelRoot.querySelector("#rewards-ranks");

    if (scoreNode) {
      scoreNode.textContent = `Total Score: ${rewards.totalScore} | Reward Points: ${rewards.rewardPoints}`;
    }

    if (ranksNode) {
      ranksNode.textContent = renderRanks(rewards.templeRanks || {});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setup();
  });

  return {
    update
  };
});
