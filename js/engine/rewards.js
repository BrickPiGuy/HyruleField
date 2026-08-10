(function (root, factory) {
  const api = factory();
  root.HyruleRewards = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const rankPoints = {
    Legend: 180,
    Gold: 130,
    Silver: 90,
    Bronze: 60
  };

  const FINAL_VICTORY_BONUS = 250;
  const MASTERY_RANKS = new Set(["Legend", "Gold"]);

  function pointsForRank(rank) {
    return rankPoints[rank] || 0;
  }

  function campaignRouteForRank(rank) {
    return MASTERY_RANKS.has(rank) ? "mastery" : "recovery";
  }

  function finalVictoryBonus() {
    return FINAL_VICTORY_BONUS;
  }

  return {
    pointsForRank,
    campaignRouteForRank,
    finalVictoryBonus,
    rankPoints
  };
});
