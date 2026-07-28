const STORAGE_KEY = "devopsTriforceState";

const DEFAULT_STATE = {
  power: false,
  wisdom: false,
  courage: false,
  corruption: 35,
  hiddenWorkflowFound: false,
  approvalGranted: false,
  quizzes: {},
  challenges: {}
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...DEFAULT_STATE,
      ...parsed,
      quizzes: {
        ...DEFAULT_STATE.quizzes,
        ...(parsed.quizzes || {})
      },
      challenges: {
        ...DEFAULT_STATE.challenges,
        ...(parsed.challenges || {})
      }
    };
  } catch (_error) {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
}

function withState(callback) {
  const state = loadState();
  callback(state);
  state.corruption = clamp(state.corruption, 0, 100);
  saveState(state);
  updateGlobalUI(state);
}

window.HyruleState = {
  getState: loadState,
  saveState,
  withState,
  increaseCorruption(amount) {
    withState((state) => {
      state.corruption += amount;
    });
  },
  decreaseCorruption(amount) {
    withState((state) => {
      state.corruption -= amount;
    });
  },
  completeTemple(piece) {
    withState((state) => {
      state[piece] = true;
      state.corruption -= 7;
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateGlobalUI(loadState());

  const resetButton = document.getElementById("reset-progress");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      saveState({ ...DEFAULT_STATE });
      updateGlobalUI(loadState());
      location.reload();
    });
  }
});
