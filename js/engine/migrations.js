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
      trials: {
        ...defaultState.trials,
        ...(legacyState.trials || {})
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
        },
        templeScores: {
          ...defaultState.rewards.templeScores,
          ...((legacyState.rewards && legacyState.rewards.templeScores) || {})
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

  function toV4(state) {
    const merged = mergeLegacyState(state);
    merged.saveVersion = 4;
    return merged;
  }

  function toV5(state) {
    // v5 adds the Fire, Water and Forest temples and per-temple trial progress.
    const merged = mergeLegacyState(state);
    merged.saveVersion = 5;
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

    if (version < 4) {
      migrated = toV4(migrated);
    }

    if (version < 5) {
      migrated = toV5(migrated);
    }

    migrated.corruption = HyruleGameState.clampCorruption(Number(migrated.corruption || 35));
    migrated.saveVersion = HyruleGameState.CURRENT_SAVE_VERSION;

    return migrated;
  }

  return {
    migrateState
  };
});
