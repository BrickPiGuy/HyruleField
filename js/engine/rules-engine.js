(function (root, factory) {
  const api = factory(root.HyruleGameState, root.HyruleActions);
  root.HyruleRules = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState, HyruleActions) {
  function updateMissionStatus(state) {
    state.missions.wisdom.status = state.power ? "available" : "locked";
    state.missions.courage.status = state.power && state.wisdom ? "available" : "locked";
    state.missions.finalBattle.status = state.power && state.wisdom && state.courage ? "available" : "locked";
  }

  function reduceGameState(state, action) {
    const next = HyruleGameState.cloneState(state);
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
        break;
      }

      case HyruleActions.TYPES.RECKLESS_PATH: {
        next.corruption += 12;
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
        }
        result.outcome = { ok: true, reason: "deploy_success" };
        break;
      }

      case HyruleActions.TYPES.RUSH_RELEASE: {
        next.corruption += 12;
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
