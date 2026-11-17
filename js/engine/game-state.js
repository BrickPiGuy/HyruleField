(function (root, factory) {
  const api = factory();
  root.HyruleGameState = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const CURRENT_SAVE_VERSION = 5;
  const TEMPLE_PIECES = ["power", "wisdom", "courage", "fire", "water", "forest"];
  const SAGE_TEMPLES = ["fire", "water", "forest"];

  // Which restored temples open each door. The final battle needs all six.
  const TEMPLE_REQUIREMENTS = {
    power: [],
    wisdom: ["power"],
    courage: ["power", "wisdom"],
    fire: ["power"],
    water: ["power"],
    forest: ["power"],
    final: ["power", "wisdom", "courage", "fire", "water", "forest"]
  };

  function isTempleUnlocked(state, key) {
    const required = TEMPLE_REQUIREMENTS[key] || [];
    return required.every((piece) => Boolean(state && state[piece]));
  }

  // The single best place to send the player next: the first unfinished temple that is
  // open, then the final battle once every temple is restored, then nothing.
  function nextDestination(state) {
    const open = TEMPLE_PIECES.find((piece) => !state[piece] && isTempleUnlocked(state, piece));
    if (open) {
      return open;
    }
    if (TEMPLE_PIECES.every((piece) => state[piece]) && !(state.rewards && state.rewards.finalVictoryAwarded)) {
      return "final";
    }
    return null;
  }

  function createDefaultState() {
    return {
      saveVersion: CURRENT_SAVE_VERSION,
      power: false,
      wisdom: false,
      courage: false,
      fire: false,
      water: false,
      forest: false,
      corruption: 35,
      hiddenWorkflowFound: false,
      approvalGranted: false,
      quizzes: {},
      trials: {},
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
          courage: null,
          fire: null,
          water: null,
          forest: null
        },
        templeScores: {
          power: 0,
          wisdom: 0,
          courage: 0,
          fire: 0,
          water: 0,
          forest: 0
        },
        lastTempleAward: null,
        finalVictoryAwarded: false
      },
      missions: {
        power: { status: "available" },
        wisdom: { status: "locked" },
        courage: { status: "locked" },
        fire: { status: "locked" },
        water: { status: "locked" },
        forest: { status: "locked" },
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
    TEMPLE_PIECES,
    SAGE_TEMPLES,
    TEMPLE_REQUIREMENTS,
    isTempleUnlocked,
    nextDestination,
    createDefaultState,
    clampCorruption,
    cloneState
  };
});
