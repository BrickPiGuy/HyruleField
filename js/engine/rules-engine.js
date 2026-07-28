(function (root, factory) {
  const api = factory(root.HyruleGameState, root.HyruleActions, root.HyruleScoring, root.HyruleRewards);
  root.HyruleRules = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState, HyruleActions, HyruleScoring, HyruleRewards) {
  const scoring = HyruleScoring || {
    rankForCorruption(corruption) {
      if (corruption <= 20) {
        return "Legend";
      }
      if (corruption <= 35) {
        return "Gold";
      }
      if (corruption <= 55) {
        return "Silver";
      }
      return "Bronze";
    },
    calculateTempleAward(rank) {
      const map = { Legend: 180, Gold: 130, Silver: 90, Bronze: 60 };
      const basePoints = map[rank] || 0;
      return {
        basePoints,
        finalPoints: basePoints,
        multipliers: {
          safetyMultiplier: 1,
          consistencyMultiplier: 1,
          riskPenalty: 0,
          combinedMultiplier: 1
        }
      };
    }
  };

  const rewards = HyruleRewards || {
    pointsForRank(rank) {
      const map = { Legend: 180, Gold: 130, Silver: 90, Bronze: 60 };
      return map[rank] || 0;
    },
    finalVictoryBonus() {
      return 250;
    }
  };

  function ensureRewardsState(state) {
    if (!state.rewards) {
      state.rewards = {
        totalScore: 0,
        rewardPoints: 0,
        safeActionStreak: 0,
        recklessActionCount: 0,
        templeRanks: { power: null, wisdom: null, courage: null },
        templeScores: { power: 0, wisdom: 0, courage: 0 },
        lastTempleAward: null,
        finalVictoryAwarded: false
      };
    }

    if (!state.rewards.templeRanks) {
      state.rewards.templeRanks = { power: null, wisdom: null, courage: null };
    }

    if (!state.rewards.templeScores) {
      state.rewards.templeScores = { power: 0, wisdom: 0, courage: 0 };
    }

    if (typeof state.rewards.safeActionStreak !== "number") {
      state.rewards.safeActionStreak = 0;
    }

    if (typeof state.rewards.recklessActionCount !== "number") {
      state.rewards.recklessActionCount = 0;
    }

    if (!Object.prototype.hasOwnProperty.call(state.rewards, "lastTempleAward")) {
      state.rewards.lastTempleAward = null;
    }
  }

  function incrementSafeStreak(state) {
    state.rewards.safeActionStreak += 1;
  }

  function markReckless(state) {
    state.rewards.recklessActionCount += 1;
    state.rewards.safeActionStreak = 0;
  }

  function awardTempleCompletion(state, piece) {
    if (!piece || state.rewards.templeRanks[piece]) {
      return;
    }

    const rank = scoring.rankForCorruption(HyruleGameState.clampCorruption(state.corruption));
    const award = scoring.calculateTempleAward(rank, {
      corruption: state.corruption,
      safeActionStreak: state.rewards.safeActionStreak,
      recklessActionCount: state.rewards.recklessActionCount
    });

    state.rewards.templeRanks[piece] = rank;
    state.rewards.templeScores[piece] = award.finalPoints;
    state.rewards.totalScore += award.finalPoints;
    state.rewards.rewardPoints += award.finalPoints;
    state.rewards.lastTempleAward = {
      piece,
      rank,
      ...award
    };
  }
  function updateMissionStatus(state) {
    state.missions.wisdom.status = state.power ? "available" : "locked";
    state.missions.courage.status = state.power && state.wisdom ? "available" : "locked";
    state.missions.finalBattle.status = state.power && state.wisdom && state.courage ? "available" : "locked";
  }

  function reduceGameState(state, action) {
    const next = HyruleGameState.cloneState(state);
    ensureRewardsState(next);
    const result = {
      state: next,
      outcome: { ok: true }
    };

    switch (action.type) {
      case HyruleActions.TYPES.RESET_GAME: {
        result.state = HyruleGameState.createDefaultState();
        return {
          ...result,
          outcome: { ok: true, reason: "reset" }
        };
      }

      case HyruleActions.TYPES.SAFE_PATH: {
        next.corruption -= 5;
        incrementSafeStreak(next);
        result.outcome = { ok: true, reason: "safe_path" };
        break;
      }

      case HyruleActions.TYPES.RECKLESS_PATH: {
        next.corruption += 12;
        markReckless(next);
        result.outcome = { ok: true, reason: "reckless_path" };
        break;
      }

      case HyruleActions.TYPES.INTRO_QUIZ: {
        const correct = Boolean(action.correct);
        next.quizzes.intro = correct;
        next.corruption += correct ? -4 : 6;
        result.outcome = {
          ok: correct,
          reason: correct ? "quiz_correct" : "quiz_incorrect"
        };
        break;
      }

      case HyruleActions.TYPES.COMPLETE_TEMPLE: {
        const piece = action.piece;
        if (["power", "wisdom", "courage"].includes(piece)) {
          if (!next[piece]) {
            next[piece] = true;
            next.corruption -= 7;
            awardTempleCompletion(next, piece);
          }
        }
        break;
      }

      case HyruleActions.TYPES.SECURITY_CARD_CLEARED: {
        const cardId = action.cardId;
        if (cardId && !next.challenges.securityCards[cardId]) {
          next.challenges.securityCards[cardId] = true;
          next.corruption -= 2;
        }
        break;
      }

      case HyruleActions.TYPES.HIDDEN_WORKFLOW_CHECK: {
        if (!action.valid) {
          next.corruption += 4;
          result.outcome = { ok: false, reason: "workflow_invalid" };
          break;
        }

        next.hiddenWorkflowFound = true;
        if (action.allCardsDone && !next.wisdom) {
          next.wisdom = true;
          next.corruption -= 7;
          awardTempleCompletion(next, "wisdom");
        }

        result.outcome = { ok: true, reason: "workflow_revealed" };
        break;
      }

      case HyruleActions.TYPES.GRANT_APPROVAL: {
        if (!next.approvalGranted) {
          next.approvalGranted = true;
          next.corruption -= 3;
        }
        break;
      }

      case HyruleActions.TYPES.DEPLOY_RELEASE: {
        const prereqsMet = Boolean(action.prereqsMet);
        if (!prereqsMet) {
          next.corruption += 5;
          result.outcome = { ok: false, reason: "deploy_blocked" };
          break;
        }

        if (!next.courage) {
          next.courage = true;
          next.corruption -= 8;
          awardTempleCompletion(next, "courage");
        }
        result.outcome = { ok: true, reason: "deploy_success" };
        break;
      }

      case HyruleActions.TYPES.RUSH_RELEASE: {
        next.corruption += 12;
        markReckless(next);
        break;
      }

      case HyruleActions.TYPES.FINAL_BATTLE_RESOLVE: {
        const allMarked = Boolean(action.allMarked);
        const requiredKeysMet = Boolean(action.requiredKeysMet);

        if (!allMarked || !requiredKeysMet) {
          next.corruption += 8;
          result.outcome = { ok: false, reason: "battle_failed" };
          break;
        }

        next.corruption -= 10;
        if (!next.rewards.finalVictoryAwarded) {
          const bonus = rewards.finalVictoryBonus();
          next.rewards.totalScore += bonus;
          next.rewards.rewardPoints += bonus;
          next.rewards.finalVictoryAwarded = true;
        }
        result.outcome = { ok: true, reason: "battle_won", victory: true };
        break;
      }

      default: {
        result.outcome = { ok: false, reason: "unknown_action" };
      }
    }

    next.corruption = HyruleGameState.clampCorruption(next.corruption);
    updateMissionStatus(next);
    return result;
  }

  return {
    reduceGameState
  };
});
