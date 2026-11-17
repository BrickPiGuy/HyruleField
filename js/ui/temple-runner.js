(function (root, factory) {
  const api = factory(root.HyrulePuzzles, root.HyrulePuzzleUI);
  root.HyruleTrials = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyrulePuzzles, HyrulePuzzleUI) {
  // Runs a temple's chambers one at a time: progress pips, a slip counter, a hint after
  // two mistakes, and progress that survives a page reload (state.trials[temple]).

  const TEMPLE_LABELS = {
    power: { label: "Temple of Power", href: "power.html" },
    wisdom: { label: "Temple of Wisdom", href: "wisdom.html" },
    courage: { label: "Temple of Courage", href: "courage.html" },
    fire: { label: "Temple of Fire", href: "fire.html" },
    water: { label: "Temple of Water", href: "water.html" },
    forest: { label: "Temple of the Forest", href: "forest.html" }
  };

  const HINT_AFTER_MISTAKES = 2;

  function missingRequirements(mission, state) {
    const required = Array.isArray(mission.requires) ? mission.requires : [];
    return required.filter((key) => !state[key]);
  }

  function renderSealed(rootNode, missing) {
    const links = missing
      .map((key) => TEMPLE_LABELS[key])
      .filter(Boolean)
      .map((entry) => `<a class="btn-link" href="${entry.href}">${HyrulePuzzleUI.escapeHtml(entry.label)}</a>`)
      .join(" ");
    rootNode.innerHTML = `
      <div class="trial-sealed" role="status">
        <h2>The temple door is sealed</h2>
        <p>An ancient ward blocks the way. Restore the earlier temple${missing.length > 1 ? "s" : ""} first.</p>
        <p>${links}</p>
      </div>`;
  }

  function run(options) {
    const { temple, root: rootNode, mission, getState, dispatch, onComplete } = options;
    const puzzles = Array.isArray(mission.trials) ? mission.trials : [];
    if (!rootNode || puzzles.length === 0) {
      return { sealed: false, total: 0 };
    }

    const missing = missingRequirements(mission, getState());
    if (missing.length > 0) {
      renderSealed(rootNode, missing);
      return { sealed: true, total: puzzles.length };
    }

    const types = HyrulePuzzles.TYPES;
    let current = 0;
    let slips = 0;
    let finished = false;

    const solvedIds = () => {
      const trials = getState().trials || {};
      return Array.isArray(trials[temple]) ? trials[temple] : [];
    };

    rootNode.innerHTML = `
      <div class="trial-header">
        <ol class="trial-pips" aria-label="Chambers"></ol>
        <p class="trial-slips" data-trial-slips>Slips: 0</p>
      </div>
      <div class="trial-stage"></div>
      <div class="trial-footer" aria-live="polite"></div>`;
    const pipsNode = rootNode.querySelector(".trial-pips");
    const stageNode = rootNode.querySelector(".trial-stage");
    const footerNode = rootNode.querySelector(".trial-footer");
    const slipsNode = rootNode.querySelector("[data-trial-slips]");

    function renderPips() {
      const done = solvedIds();
      pipsNode.innerHTML = puzzles.map((puzzle, index) => {
        const state = done.includes(puzzle.id) ? "done" : (index === current ? "current" : "todo");
        const label = `Chamber ${index + 1}: ${puzzle.title}${state === "done" ? " (cleared)" : state === "current" ? " (current)" : ""}`;
        return `<li class="trial-pip" data-state="${state}" aria-label="${HyrulePuzzleUI.escapeHtml(label)}" ${state === "current" ? 'aria-current="step"' : ""}><span aria-hidden="true">${state === "done" ? "&#10003;" : index + 1}</span></li>`;
      }).join("");
    }

    function finish() {
      if (finished) {
        return;
      }
      finished = true;
      renderPips();
      stageNode.innerHTML = `
        <div class="trial-cleared" role="status">
          <h3>Every chamber is cleared</h3>
          <p>The ward breaks and the way ahead opens.</p>
        </div>`;
      footerNode.textContent = "";
      if (typeof onComplete === "function") {
        onComplete();
      }
    }

    function showChamber(index) {
      current = index;
      const puzzle = puzzles[index];
      let mistakes = 0;
      renderPips();
      footerNode.textContent = "";
      stageNode.innerHTML = `<div class="trial-room" data-chamber="${index + 1}"></div>`;
      const roomNode = stageNode.querySelector(".trial-room");
      let room = null;

      room = HyrulePuzzleUI.createRoom(roomNode, puzzle, {
        onCheck(result) {
          if (!result.correct) {
            mistakes += 1;
            slips += 1;
            slipsNode.textContent = `Slips: ${slips}`;
            dispatch({ type: window.HyruleActions.TYPES.PUZZLE_MISTAKE, temple, puzzleId: puzzle.id });
            if (mistakes >= HINT_AFTER_MISTAKES) {
              room.showHint();
            }
            return;
          }

          dispatch({ type: window.HyruleActions.TYPES.PUZZLE_SOLVED, temple, puzzleId: puzzle.id });
          room.lock();
          renderPips();

          if (index + 1 >= puzzles.length) {
            finish();
            return;
          }

          const next = document.createElement("button");
          next.type = "button";
          next.className = "trial-next";
          next.textContent = `Enter chamber ${index + 2} of ${puzzles.length}`;
          next.addEventListener("click", () => showChamber(index + 1));
          footerNode.textContent = "";
          footerNode.appendChild(next);
          next.focus();
        }
      });
    }

    const done = solvedIds();
    const firstOpen = puzzles.findIndex((puzzle) => !done.includes(puzzle.id));
    if (firstOpen === -1) {
      finish();
    } else {
      showChamber(firstOpen);
    }

    return { sealed: false, total: puzzles.length, types };
  }

  return {
    TEMPLE_LABELS,
    run,
    missingRequirements
  };
});
