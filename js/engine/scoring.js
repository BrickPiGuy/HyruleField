(function (root, factory) {
  const api = factory();
  root.HyruleScoring = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const RANKS = {
    LEGEND: "Legend",
    GOLD: "Gold",
    SILVER: "Silver",
    BRONZE: "Bronze"
  };

  const BASE_POINTS_BY_RANK = {
    [RANKS.LEGEND]: 180,
    [RANKS.GOLD]: 130,
    [RANKS.SILVER]: 90,
    [RANKS.BRONZE]: 60
  };

  function rankForCorruption(corruption) {
    if (corruption <= 20) {
      return RANKS.LEGEND;
    }
    if (corruption <= 35) {
      return RANKS.GOLD;
    }
    if (corruption <= 55) {
      return RANKS.SILVER;
    }
    return RANKS.BRONZE;
  }

  function getSafetyMultiplier(corruption) {
    if (corruption <= 20) {
      return 1.25;
    }
    if (corruption <= 35) {
      return 1.1;
    }
    if (corruption <= 55) {
      return 1;
    }
    return 0.9;
  }

  function getConsistencyMultiplier(safeActionStreak) {
    if (safeActionStreak >= 4) {
      return 1.12;
    }
    if (safeActionStreak >= 2) {
      return 1.05;
    }
    return 1;
  }

  function getRiskPenalty(recklessActionCount) {
    const count = Math.max(0, Number(recklessActionCount || 0));
    return Math.min(0.2, count * 0.03);
  }

  function calculateTempleAward(rank, context) {
    const basePoints = BASE_POINTS_BY_RANK[rank] || 0;
    const safetyMultiplier = getSafetyMultiplier(Number(context.corruption || 100));
    const consistencyMultiplier = getConsistencyMultiplier(Number(context.safeActionStreak || 0));
    const riskPenalty = getRiskPenalty(Number(context.recklessActionCount || 0));
    const combinedMultiplier = Math.max(0.65, (safetyMultiplier * consistencyMultiplier) - riskPenalty);
    const finalPoints = Math.round(basePoints * combinedMultiplier);

    return {
      basePoints,
      finalPoints,
      multipliers: {
        safetyMultiplier,
        consistencyMultiplier,
        riskPenalty,
        combinedMultiplier
      }
    };
  }

  return {
    RANKS,
    BASE_POINTS_BY_RANK,
    rankForCorruption,
    getSafetyMultiplier,
    getConsistencyMultiplier,
    getRiskPenalty,
    calculateTempleAward
  };
});
