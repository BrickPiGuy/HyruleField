function loadState() {
  return window.HyruleSave.loadState();
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
}

function dispatch(action) {
  const current = loadState();
  const result = window.HyruleRules.reduceGameState(current, action);
  saveState(result.state);
  updateGlobalUI(result.state);
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
