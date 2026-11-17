(function (root, factory) {
  const api = factory(root.HyrulePuzzles);
  root.HyrulePuzzleUI = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyrulePuzzles) {
  // Renders one puzzle into a container. Every control is a real <button> so the whole
  // game is playable by keyboard; drag and drop is an extra for the ordering puzzle.

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const TYPE_LABELS = {
    order: "Order the ritual",
    spot: "Spot the flaw",
    match: "Match the pairs",
    switches: "Light the sigils",
    choice: "Choose your move"
  };

  function createRoom(container, puzzle, options) {
    const settings = options || {};
    const onCheck = typeof settings.onCheck === "function" ? settings.onCheck : () => {};
    const rng = typeof settings.rng === "function" ? settings.rng : Math.random;
    let locked = false;
    let hintVisible = false;

    // Answer state for each puzzle type.
    const state = {
      order: puzzle.type === "order"
        ? HyrulePuzzles.shuffleUnsolved(puzzle.items.map((item) => item.id), rng)
        : [],
      spot: new Set(),
      match: {},
      matchSelected: null,
      matchRights: puzzle.type === "match"
        ? HyrulePuzzles.shuffleUnsolved(puzzle.pairs.map((pair) => pair.right), rng)
        : [],
      switches: puzzle.type === "switches"
        ? Object.fromEntries(puzzle.switches.map((entry) => [entry.id, false]))
        : {},
      choice: null
    };

    let focusKey = null;

    container.innerHTML = `
      <div class="puzzle-room" data-puzzle-id="${escapeHtml(puzzle.id)}" data-puzzle-type="${escapeHtml(puzzle.type)}">
        <p class="puzzle-kind">${escapeHtml(TYPE_LABELS[puzzle.type] || "Puzzle")}</p>
        <h3 class="puzzle-title">${escapeHtml(puzzle.title)}</h3>
        <p class="puzzle-prompt">${escapeHtml(puzzle.prompt)}</p>
        <div class="puzzle-body"></div>
        <div class="puzzle-actions">
          <button type="button" class="puzzle-check" data-puzzle-check>Check answer</button>
          <button type="button" class="secondary puzzle-hint-toggle" data-puzzle-hint aria-expanded="false">Need a hint?</button>
        </div>
        <p class="puzzle-hint" data-puzzle-hint-text hidden>${escapeHtml(puzzle.hint)}</p>
        <p class="puzzle-feedback" data-puzzle-feedback role="status" aria-live="polite"></p>
      </div>`;

    const body = container.querySelector(".puzzle-body");
    const feedbackNode = container.querySelector("[data-puzzle-feedback]");
    const checkButton = container.querySelector("[data-puzzle-check]");
    const hintButton = container.querySelector("[data-puzzle-hint]");
    const hintNode = container.querySelector("[data-puzzle-hint-text]");

    function setFeedback(text, tone) {
      feedbackNode.textContent = text;
      feedbackNode.setAttribute("data-tone", tone || "");
    }

    function showHint() {
      hintVisible = true;
      hintNode.hidden = false;
      hintButton.setAttribute("aria-expanded", "true");
    }

    function currentAnswer() {
      switch (puzzle.type) {
        case "order": return state.order.slice();
        case "spot": return Array.from(state.spot).sort((a, b) => a - b);
        case "match": return { ...state.match };
        case "switches": return { ...state.switches };
        case "choice": return state.choice;
        default: return null;
      }
    }

    function renderOrder() {
      const textById = Object.fromEntries(puzzle.items.map((item) => [item.id, item.text]));
      body.innerHTML = `<ol class="puzzle-order" aria-label="Drag items, or use the arrow buttons, to put them in order">${state.order.map((id, index) => `
        <li class="order-item" draggable="${locked ? "false" : "true"}" data-order-id="${escapeHtml(id)}">
          <span class="order-number" aria-hidden="true">${index + 1}</span>
          <span class="order-text">${escapeHtml(textById[id])}</span>
          <span class="order-controls">
            <button type="button" class="order-move" data-move="up" data-id="${escapeHtml(id)}" aria-label="Move ${escapeHtml(textById[id])} up" ${index === 0 || locked ? "disabled" : ""}>&#9650;</button>
            <button type="button" class="order-move" data-move="down" data-id="${escapeHtml(id)}" aria-label="Move ${escapeHtml(textById[id])} down" ${index === state.order.length - 1 || locked ? "disabled" : ""}>&#9660;</button>
          </span>
        </li>`).join("")}</ol>`;
    }

    function moveOrder(id, toIndex) {
      const from = state.order.indexOf(id);
      if (from < 0 || toIndex < 0 || toIndex >= state.order.length || from === toIndex) {
        return;
      }
      state.order.splice(from, 1);
      state.order.splice(toIndex, 0, id);
    }

    function renderSpot() {
      body.innerHTML = `
        <p class="puzzle-meta">Flag every unsafe line. There ${puzzle.answer.length === 1 ? "is 1 flaw" : `are ${puzzle.answer.length} flaws`}.</p>
        <ol class="puzzle-code" aria-label="${escapeHtml(puzzle.fileName || "File under inspection")}">${puzzle.lines.map((line, index) => `
          <li><button type="button" class="code-line${state.spot.has(index) ? " is-flagged" : ""}" data-line="${index}" aria-pressed="${state.spot.has(index) ? "true" : "false"}" ${locked ? "disabled" : ""}><span class="line-no" aria-hidden="true">${index + 1}</span><code>${escapeHtml(line) || "&nbsp;"}</code></button></li>`).join("")}
        </ol>`;
    }

    function renderMatch() {
      const lefts = puzzle.pairs.map((pair) => pair.left);
      const rightTag = (right) => {
        const left = Object.keys(state.match).find((key) => state.match[key] === right);
        return left ? lefts.indexOf(left) + 1 : null;
      };
      body.innerHTML = `
        <p class="puzzle-meta">Pick a term on the left, then its partner on the right. Pick a pair again to undo it.</p>
        <div class="puzzle-match">
          <ul class="match-col" aria-label="Terms">${lefts.map((left, index) => {
            const paired = state.match[left];
            const selected = state.matchSelected === left;
            return `<li><button type="button" class="match-item${selected ? " is-selected" : ""}${paired ? " is-paired" : ""}" data-left="${escapeHtml(left)}" aria-pressed="${selected ? "true" : "false"}" ${locked ? "disabled" : ""}><span class="pair-tag${paired ? " is-set" : ""}">${index + 1}</span>${escapeHtml(left)}</button></li>`;
          }).join("")}</ul>
          <ul class="match-col" aria-label="Partners">${state.matchRights.map((right) => {
            const tag = rightTag(right);
            return `<li><button type="button" class="match-item${tag ? " is-paired" : ""}" data-right="${escapeHtml(right)}" ${locked ? "disabled" : ""}><span class="pair-tag${tag ? " is-set" : ""}">${tag || ""}</span>${escapeHtml(right)}</button></li>`;
          }).join("")}</ul>
        </div>`;
    }

    function renderSwitches() {
      body.innerHTML = `
        <ul class="puzzle-clues" aria-label="Clues">${puzzle.clues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join("")}</ul>
        <div class="puzzle-switches">${puzzle.switches.map((entry) => `
          <button type="button" class="sigil${state.switches[entry.id] ? " is-lit" : ""}" data-switch="${escapeHtml(entry.id)}" aria-pressed="${state.switches[entry.id] ? "true" : "false"}" ${locked ? "disabled" : ""}>
            <span class="sigil-flame" aria-hidden="true">${state.switches[entry.id] ? "&#128293;" : "&#9675;"}</span>
            <span class="sigil-label">${escapeHtml(entry.label)}</span>
            <span class="sigil-state">${state.switches[entry.id] ? "ON" : "OFF"}</span>
          </button>`).join("")}</div>`;
    }

    function renderChoice() {
      body.innerHTML = `<div class="puzzle-choice" role="radiogroup" aria-label="Options">${puzzle.options.map((option) => `
        <button type="button" class="choice-option${state.choice === option.id ? " is-selected" : ""}" role="radio" aria-checked="${state.choice === option.id ? "true" : "false"}" data-choice="${escapeHtml(option.id)}" ${locked ? "disabled" : ""}>${escapeHtml(option.text)}</button>`).join("")}</div>`;
    }

    function render() {
      ({ order: renderOrder, spot: renderSpot, match: renderMatch, switches: renderSwitches, choice: renderChoice })[puzzle.type]();
      if (focusKey) {
        const target = body.querySelector(focusKey);
        if (target && typeof target.focus === "function") {
          target.focus();
        }
        focusKey = null;
      }
    }

    body.addEventListener("click", (event) => {
      if (locked) {
        return;
      }
      const target = event.target.closest("button");
      if (!target || !body.contains(target)) {
        return;
      }

      if (puzzle.type === "order" && target.dataset.move) {
        const id = target.dataset.id;
        const index = state.order.indexOf(id);
        moveOrder(id, target.dataset.move === "up" ? index - 1 : index + 1);
        focusKey = `[data-move="${target.dataset.move}"][data-id="${CSS.escape(id)}"]`;
        render();
        if (!body.querySelector(focusKey) || body.querySelector(focusKey).disabled) {
          const other = body.querySelector(`[data-id="${CSS.escape(id)}"]:not([disabled])`);
          other?.focus();
        }
      } else if (puzzle.type === "spot" && target.dataset.line !== undefined) {
        const index = Number(target.dataset.line);
        if (state.spot.has(index)) {
          state.spot.delete(index);
        } else {
          state.spot.add(index);
        }
        focusKey = `[data-line="${index}"]`;
        render();
      } else if (puzzle.type === "match") {
        if (target.dataset.left !== undefined) {
          const left = target.dataset.left;
          if (state.match[left]) {
            delete state.match[left];
            state.matchSelected = null;
          } else {
            state.matchSelected = left;
          }
          focusKey = `[data-left="${CSS.escape(left)}"]`;
        } else if (target.dataset.right !== undefined) {
          const right = target.dataset.right;
          const holder = Object.keys(state.match).find((key) => state.match[key] === right);
          if (state.matchSelected) {
            if (holder) {
              delete state.match[holder];
            }
            state.match[state.matchSelected] = right;
            const next = puzzle.pairs.find((pair) => !state.match[pair.left]);
            state.matchSelected = next ? next.left : null;
          } else if (holder) {
            delete state.match[holder];
          }
          focusKey = `[data-right="${CSS.escape(right)}"]`;
        }
        render();
      } else if (puzzle.type === "switches" && target.dataset.switch) {
        const id = target.dataset.switch;
        state.switches[id] = !state.switches[id];
        focusKey = `[data-switch="${CSS.escape(id)}"]`;
        render();
      } else if (puzzle.type === "choice" && target.dataset.choice) {
        state.choice = target.dataset.choice;
        focusKey = `[data-choice="${CSS.escape(target.dataset.choice)}"]`;
        render();
      }
    });

    if (puzzle.type === "order") {
      let dragId = null;
      body.addEventListener("dragstart", (event) => {
        const item = event.target.closest("[data-order-id]");
        if (!item || locked) {
          return;
        }
        dragId = item.dataset.orderId;
        item.classList.add("is-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", dragId);
        }
      });
      body.addEventListener("dragover", (event) => {
        if (dragId) {
          event.preventDefault();
        }
      });
      body.addEventListener("drop", (event) => {
        const item = event.target.closest("[data-order-id]");
        if (!item || !dragId) {
          return;
        }
        event.preventDefault();
        moveOrder(dragId, state.order.indexOf(item.dataset.orderId));
        dragId = null;
        render();
      });
      body.addEventListener("dragend", () => {
        dragId = null;
        body.querySelectorAll(".is-dragging").forEach((node) => node.classList.remove("is-dragging"));
      });
    }

    checkButton.addEventListener("click", () => {
      if (locked) {
        return;
      }
      const answer = currentAnswer();
      const result = HyrulePuzzles.checkAnswer(puzzle, answer);
      setFeedback(result.feedback, result.correct ? "success" : "error");
      onCheck(result, answer);
    });

    hintButton.addEventListener("click", () => {
      if (hintVisible) {
        hintVisible = false;
        hintNode.hidden = true;
        hintButton.setAttribute("aria-expanded", "false");
      } else {
        showHint();
      }
    });

    render();

    return {
      getAnswer: currentAnswer,
      showHint,
      setFeedback,
      lock() {
        locked = true;
        checkButton.disabled = true;
        render();
      }
    };
  }

  return {
    TYPE_LABELS,
    createRoom,
    escapeHtml
  };
});
