function loadState() {
  return window.HyruleSave.loadState();
}

function telemetryEventName(key) {
  return (window.HyruleActions && window.HyruleActions.TELEMETRY_EVENTS && window.HyruleActions.TELEMETRY_EVENTS[key]) || key.toLowerCase();
}

function trackTelemetry(eventName, payload) {
  if (!window.HyruleTelemetry || typeof window.HyruleTelemetry.trackEvent !== "function") {
    return;
  }

  window.HyruleTelemetry.trackEvent(eventName, payload);
}

function saveState(state) {
  window.HyruleSave.saveState(state);
}

function getTempleProgressCount(state) {
  return [state.power, state.wisdom, state.courage].filter(Boolean).length;
}

function updateGlobalUI(state) {
  const pieceMap = {
    power: state.power,
    wisdom: state.wisdom,
    courage: state.courage
  };

  document.querySelectorAll("[data-piece]").forEach((node) => {
    const key = node.getAttribute("data-piece");
    node.classList.toggle("complete", Boolean(pieceMap[key]));
  });

  const corruptionFill = document.querySelector(".meter-fill");
  const corruptionText = document.getElementById("corruption-label");

  if (corruptionFill) {
    corruptionFill.style.width = `${state.corruption}%`;
  }

  if (corruptionText) {
    corruptionText.textContent = `Lord Ganonix Corruption: ${state.corruption}%`;
  }

  const completionNode = document.getElementById("temple-count");
  if (completionNode) {
    completionNode.textContent = `${getTempleProgressCount(state)} / 3 temples restored`;
  }

  document.querySelectorAll("[data-badge]").forEach((badge) => {
    const key = badge.getAttribute("data-badge");
    const unlocked = key === "champion"
      ? state.power && state.wisdom && state.courage && state.corruption <= 45
      : Boolean(state[key]);
    badge.classList.toggle("unlocked", unlocked);
  });

  if (window.HyruleHUD && typeof window.HyruleHUD.update === "function") {
    window.HyruleHUD.update(state);
  }

  if (window.HyruleRewardsPanel && typeof window.HyruleRewardsPanel.update === "function") {
    window.HyruleRewardsPanel.update(state);
  }
}

function dispatch(action) {
  const current = loadState();
  const result = window.HyruleRules.reduceGameState(current, action);
  saveState(result.state);
  updateGlobalUI(result.state);

  const outcome = result.outcome || {};
  trackTelemetry(telemetryEventName("ACTION_RESOLVED"), {
    actionType: action.type,
    ok: outcome.ok !== false,
    outcomeReason: outcome.reason || null,
    corruptionBefore: current.corruption,
    corruptionAfter: result.state.corruption
  });

  ["power", "wisdom", "courage"].forEach((piece) => {
    if (!current[piece] && result.state[piece]) {
      trackTelemetry(telemetryEventName("MISSION_COMPLETED"), {
        mission: piece,
        sourceAction: action.type
      });
    }
  });

  if (action.type === window.HyruleActions.TYPES.FINAL_BATTLE_RESOLVE && outcome.ok) {
    trackTelemetry(telemetryEventName("MISSION_COMPLETED"), {
      mission: "final-battle",
      sourceAction: action.type
    });
  }

  if (outcome.ok === false) {
    trackTelemetry(telemetryEventName("MISSION_FAILED"), {
      actionType: action.type,
      outcomeReason: outcome.reason || null
    });
  }

  if (action.type === window.HyruleActions.TYPES.RESET_GAME) {
    trackTelemetry(telemetryEventName("MISSION_RETRY"), {
      mission: "full-campaign",
      sourceAction: action.type
    });
  }

  return result;
}

window.HyruleEngine = {
  getState: loadState,
  dispatch,
  reset() {
    return dispatch({ type: window.HyruleActions.TYPES.RESET_GAME });
  }
};

// Backwards-compatible adapter while page scripts are migrated.
window.HyruleState = {
  getState: loadState,
  completeTemple(piece) {
    return dispatch({ type: window.HyruleActions.TYPES.COMPLETE_TEMPLE, piece });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateGlobalUI(loadState());

  const resetButton = document.getElementById("reset-progress");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      window.HyruleEngine.reset();
      location.reload();
    });
  }
});
