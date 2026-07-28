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

  return {
    RANKS,
    rankForCorruption
  };
});
