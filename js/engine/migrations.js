(function (root, factory) {
  const api = factory(root.HyruleGameState);
  root.HyruleMigrations = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState) {
  function mergeLegacyState(legacyState) {
    const defaultState = HyruleGameState.createDefaultState();
    return {
      ...defaultState,
      ...legacyState,
      quizzes: {
        ...defaultState.quizzes,
        ...(legacyState.quizzes || {})
      },
      challenges: {
        ...defaultState.challenges,
        ...(legacyState.challenges || {}),
        securityCards: {
          ...(defaultState.challenges.securityCards || {}),
          ...((legacyState.challenges && legacyState.challenges.securityCards) || {})
        }
      },
      rewards: {
        ...defaultState.rewards,
        ...(legacyState.rewards || {}),
        templeRanks: {
          ...defaultState.rewards.templeRanks,
          ...((legacyState.rewards && legacyState.rewards.templeRanks) || {})
        }
      },
      missions: {
        ...defaultState.missions,
        ...(legacyState.missions || {})
      }
    };
  }

  function toV2(state) {
    const merged = mergeLegacyState(state);
    merged.saveVersion = 2;

    if (!merged.challenges.securityCards) {
      merged.challenges.securityCards = {};
    }

    return merged;
  }

  function toV3(state) {
    const merged = mergeLegacyState(state);
    merged.saveVersion = 3;
    return merged;
  }

  function migrateState(inputState) {
    const raw = inputState && typeof inputState === "object" ? inputState : {};
    const version = Number(raw.saveVersion || 1);
    let migrated = raw;

    if (version < 2) {
      migrated = toV2(migrated);
    }

    if (version < 3) {
      migrated = toV3(migrated);
    }

    migrated.corruption = HyruleGameState.clampCorruption(Number(migrated.corruption || 35));
    migrated.saveVersion = HyruleGameState.CURRENT_SAVE_VERSION;

    return migrated;
  }

  return {
    migrateState
  };
});
