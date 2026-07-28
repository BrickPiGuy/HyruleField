(function (root, factory) {
  const api = factory();
  root.HyruleGameState = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const CURRENT_SAVE_VERSION = 4;

  function createDefaultState() {
    return {
      saveVersion: CURRENT_SAVE_VERSION,
      power: false,
      wisdom: false,
      courage: false,
      corruption: 35,
      hiddenWorkflowFound: false,
      approvalGranted: false,
      quizzes: {},
      challenges: {
        securityCards: {}
      },
      rewards: {
        totalScore: 0,
        rewardPoints: 0,
        safeActionStreak: 0,
        recklessActionCount: 0,
        templeRanks: {
          power: null,
          wisdom: null,
          courage: null
        },
        templeScores: {
          power: 0,
          wisdom: 0,
          courage: 0
        },
        lastTempleAward: null,
        finalVictoryAwarded: false
      },
      missions: {
        power: { status: "available" },
        wisdom: { status: "locked" },
        courage: { status: "locked" },
        finalBattle: { status: "locked" }
      }
    };
  }

  function clampCorruption(value) {
    return Math.max(0, Math.min(100, value));
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  return {
    CURRENT_SAVE_VERSION,
    createDefaultState,
    clampCorruption,
    cloneState
  };
});
