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

const ALL_TEMPLES = ["power", "wisdom", "courage", "fire", "water", "forest"];

function getTempleProgressCount(state) {
  return ALL_TEMPLES.filter((key) => Boolean(state[key])).length;
}

function updateGlobalUI(state) {
  const pieceMap = {
    power: state.power,
    wisdom: state.wisdom,
    courage: state.courage,
    fire: state.fire,
    water: state.water,
    forest: state.forest
  };

  document.querySelectorAll("[data-piece]").forEach((node) => {
    const key = node.getAttribute("data-piece");
    node.classList.toggle("complete", Boolean(pieceMap[key]));
    if (node.hasAttribute("data-name")) {
      node.setAttribute("aria-label", `${node.getAttribute("data-name")} temple${pieceMap[key] ? ", restored" : ""}`);
    }
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
    completionNode.textContent = `${getTempleProgressCount(state)} / ${ALL_TEMPLES.length} temples restored`;
  }

  document.querySelectorAll("[data-badge]").forEach((badge) => {
    const key = badge.getAttribute("data-badge");
    const unlocked = key === "champion"
      ? ALL_TEMPLES.every((temple) => state[temple]) && state.corruption <= 45
      : Boolean(state[key]);
    badge.classList.toggle("unlocked", unlocked);
  });

  if (window.HyruleSiteNav && typeof window.HyruleSiteNav.update === "function") {
    window.HyruleSiteNav.update(state);
  }

  if (window.HyruleHubMap && typeof window.HyruleHubMap.update === "function") {
    window.HyruleHubMap.update(state);
  }

  if (window.HyruleHUD && typeof window.HyruleHUD.update === "function") {
    window.HyruleHUD.update(state);
  }

  if (window.HyruleRewardsPanel && typeof window.HyruleRewardsPanel.update === "function") {
    window.HyruleRewardsPanel.update(state);
  }
}

function playSound(name) {
  if (window.HyruleSound && typeof window.HyruleSound.play === "function") {
    window.HyruleSound.play(name);
  }
}

// Picks the one sound that best describes what just happened.
function soundForResult(action, current, next, outcome) {
  if (action.type === window.HyruleActions.TYPES.FINAL_BATTLE_RESOLVE && outcome.ok) {
    return "victory";
  }

  if (ALL_TEMPLES.some((piece) => !current[piece] && next[piece])) {
    return "restored";
  }

  if (outcome.ok === false) {
    return "slip";
  }

  if (action.type === window.HyruleActions.TYPES.PUZZLE_SOLVED) {
    return "chime";
  }

  return null;
}

function dispatch(action) {
  const current = loadState();
  const result = window.HyruleRules.reduceGameState(current, action);
  saveState(result.state);
  updateGlobalUI(result.state);

  const sound = soundForResult(action, current, result.state, result.outcome || {});
  if (sound && action.type !== window.HyruleActions.TYPES.RESET_GAME) {
    playSound(sound);
  }

  const outcome = result.outcome || {};
  trackTelemetry(telemetryEventName("ACTION_RESOLVED"), {
    actionType: action.type,
    ok: outcome.ok !== false,
    outcomeReason: outcome.reason || null,
    corruptionBefore: current.corruption,
    corruptionAfter: result.state.corruption
  });

  ALL_TEMPLES.forEach((piece) => {
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
