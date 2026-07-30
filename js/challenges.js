function appendLog(node, line) {
  node.textContent += `\n${line}`;
  node.scrollTop = node.scrollHeight;
}

function dispatchAction(action) {
  return window.HyruleEngine.dispatch(action);
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

function isReducedMotionPreferred() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function computeBaseStepDelay(targetMs, initialDelay, divisor, reducedMotion) {
  if (reducedMotion) {
    return 0;
  }

  return Math.round((targetMs - initialDelay) / Math.max(divisor, 1));
}

function estimateReadableDelay(text, reducedMotion) {
  if (reducedMotion) {
    return 0;
  }

  const minVisibleMs = 850;
  const charsPerSecond = 24;
  const estimatedMs = Math.ceil((text.length / charsPerSecond) * 1000);
  return Math.max(minVisibleMs, estimatedMs);
}

function stepDelayForText(baseStepDelay, text, reducedMotion) {
  return Math.max(baseStepDelay, estimateReadableDelay(text, reducedMotion));
}

function hiddenWorkflowMessage(context) {
  const {
    attempt,
    valid,
    allCardsDone,
    hadWisdomBefore,
    hasWisdomNow
  } = context;

  if (!valid) {
    return `Attempt ${attempt}: hint - identify the workflow that deploys directly without checks.`;
  }

  if (!allCardsDone && !hasWisdomNow) {
    return `Attempt ${attempt}: hidden workflow exposed. Clear all wards to restore Wisdom.`;
  }

  if (!hadWisdomBefore && hasWisdomNow) {
    return `Attempt ${attempt}: hidden workflow exposed. Wisdom restored.`;
  }

  return `Attempt ${attempt}: corruption pattern confirmed again.`;
}

const HIDDEN_WORKFLOW_RUNE_SIGILS = {
  action: "ᚨᚲᛏ",
  frequency: "ᚠᚱᛖᛩ",
  destination: "ᚷᚨᛏᛖ",
  gates: "ᚹᚨᚱᛞ"
};

function hiddenWorkflowPlaceholder(segment) {
  if (!segment || !segment.id) {
    return "ᚱᚢᚾᛖ";
  }

  const sigil = HIDDEN_WORKFLOW_RUNE_SIGILS[segment.id] || "ᚱᚢᚾᛖ";
  return `ᚱᚢᚾᛖ-${sigil}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHiddenWorkflowPreview(hiddenWorkflow, values) {
  if (!hiddenWorkflow || !Array.isArray(hiddenWorkflow.segments)) {
    return "";
  }

  const template = hiddenWorkflow.previewTemplate || "{action} {frequency} {destination}, skipping {gates}.";
  return hiddenWorkflow.segments.reduce((sentence, segment) => {
    const replacement = values[segment.id] || hiddenWorkflowPlaceholder(segment);
    return sentence.replace(`{${segment.id}}`, replacement);
  }, template);
}

function renderHiddenWorkflowPreviewMarkup(hiddenWorkflow, values, previousValues) {
  if (!hiddenWorkflow || !Array.isArray(hiddenWorkflow.segments)) {
    return "";
  }

  const template = hiddenWorkflow.previewTemplate || "{action} {frequency} {destination}, skipping {gates}.";
  return hiddenWorkflow.segments.reduce((markup, segment) => {
    const value = values[segment.id] || "";
    const rune = hiddenWorkflowPlaceholder(segment);
    const justResolved = !previousValues[segment.id] && value;
    const tokenMarkup = `<span class="workflow-token${value ? " is-filled" : ""}${justResolved ? " just-resolved" : ""}" data-token-id="${escapeHtml(segment.id)}" data-filled="${value ? "true" : "false"}"><span class="workflow-rune">${escapeHtml(rune)}</span><span class="workflow-solved">${escapeHtml(value || rune)}</span></span>`;
    return markup.replace(`{${segment.id}}`, tokenMarkup);
  }, template);
}

function seededShuffleOptions(options, seedText) {
  const list = Array.isArray(options) ? options.slice() : [];
  const randomApi = typeof window !== "undefined" ? window.HyruleRandomSeed : null;
  if (!randomApi || typeof randomApi.hashString !== "function" || typeof randomApi.createRng !== "function") {
    return list;
  }

  const seed = randomApi.hashString(seedText);
  const rng = randomApi.createRng(seed);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }

  return list;
}

function renderHiddenWorkflowComposer(root, previewNode, hiddenWorkflow) {
  const segments = hiddenWorkflow && Array.isArray(hiddenWorkflow.segments)
    ? hiddenWorkflow.segments
    : [];

  if (!root || segments.length === 0) {
    return {
      readValues() {
        return {};
      },
      isValid() {
        return false;
      }
    };
  }

  const sessionSeed = (typeof window !== "undefined"
    && window.HyruleTelemetrySession
    && typeof window.HyruleTelemetrySession.getSession === "function"
    && window.HyruleTelemetrySession.getSession().sessionId)
    || `wisdom-${new Date().toISOString()}`;

  root.innerHTML = segments.map((segment) => {
    const selectId = `hidden-workflow-${segment.id}`;
    const options = seededShuffleOptions(segment.options, `${sessionSeed}|wisdom|${segment.id}`);
    return `
      <label class="hidden-workflow-segment" for="${selectId}">
        <span class="hidden-workflow-label">${segment.label}</span>
        <select class="hidden-workflow-select" id="${selectId}" data-hidden-workflow-segment="${segment.id}">
          <option value="">Choose one</option>
          ${options.map((option) => `<option value="${option}">${option}</option>`).join("")}
        </select>
      </label>`;
  }).join("");

  const selects = Array.from(root.querySelectorAll("[data-hidden-workflow-segment]"));
  const readValues = () => selects.reduce((values, select) => {
    values[select.getAttribute("data-hidden-workflow-segment")] = select.value;
    return values;
  }, {});
  let previousValues = {};

  const updatePreview = () => {
    const values = readValues();
    const allFilled = segments.every((segment) => Boolean(values[segment.id]));

    selects.forEach((select) => {
      const label = select.closest(".hidden-workflow-segment");
      const isFilled = Boolean(select.value);
      select.setAttribute("data-filled", isFilled ? "true" : "false");
      if (label) {
        label.setAttribute("data-filled", isFilled ? "true" : "false");
      }
    });

    root.setAttribute("data-complete", allFilled ? "true" : "false");

    if (!previewNode) {
      previousValues = values;
      return;
    }

    previewNode.innerHTML = renderHiddenWorkflowPreviewMarkup(hiddenWorkflow, values, previousValues);
    previewNode.setAttribute("aria-label", renderHiddenWorkflowPreview(hiddenWorkflow, values));
    const wasComplete = previewNode.getAttribute("data-complete") === "true";
    previewNode.setAttribute("data-complete", allFilled ? "true" : "false");
    if (allFilled && !wasComplete) {
      previewNode.classList.remove("decoded");
      void previewNode.offsetWidth;
      previewNode.classList.add("decoded");
    } else if (!allFilled) {
      previewNode.classList.remove("decoded");
    }

    previousValues = values;
  };

  selects.forEach((select) => {
    select.addEventListener("change", updatePreview);
  });
  updatePreview();

  return {
    readValues,
    isValid() {
      const values = readValues();
      return segments.every((segment) => values[segment.id] === segment.correctValue);
    }
  };
}

function emitStory(eventKey, actionResult) {
  if (!window.HyruleStoryEngine || !window.HyruleStoryLog) {
    return;
  }

  window.HyruleStoryEngine.getNarrative(eventKey, actionResult)
    .then((entry) => {
      if (entry) {
        window.HyruleStoryLog.addEntry(entry);
      }
    })
    .catch(() => {
      // Narrative logging should not interrupt core gameplay flow.
    });
}

function clickButton(id) {
  const node = document.getElementById(id);
  if (node && !node.disabled) {
    node.click();
  }
}

function shouldIgnoreShortcut(target) {
  if (!target) {
    return false;
  }

  const tag = String(target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
}

function setupKeyboardShortcuts(page) {
  const keyMap = {
    index: {
      "1": "safe-path",
      "2": "reckless-path",
      q: "quiz-submit",
      t: "timeline-run"
    },
    power: {
      r: "run-ci"
    },
    wisdom: {
      c: "hidden-workflow-check"
    },
    courage: {
      a: "approve-release",
      d: "deploy-release",
      f: "rush-release"
    },
    final: {
      v: "finish-battle",
      p: "print-badge"
    }
  };

  const map = keyMap[page];
  if (!map) {
    return;
  }

  document.addEventListener("keydown", (event) => {
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (shouldIgnoreShortcut(event.target)) {
      return;
    }

    const key = String(event.key || "").toLowerCase();
    const targetId = map[key];
    if (!targetId) {
      return;
    }

    event.preventDefault();
    clickButton(targetId);
  });
}

function setTimelineProgress(track, index, total) {
  const pct = Math.round(((index + 1) / total) * 100);
  track.style.setProperty("--progress", `${pct}%`);
}

function resetTimeline(track, nodes, statusNode) {
  track.style.setProperty("--progress", "0%");
  nodes.forEach((node) => {
    node.classList.remove("active", "complete", "corrupt");
  });
  statusNode.textContent = "Timeline reset. Awaiting command.";
}

function setupPipelineTimeline() {
  const track = document.getElementById("timeline-track");
  const runButton = document.getElementById("timeline-run");
  const replayButton = document.getElementById("timeline-replay");
  const statusNode = document.getElementById("timeline-status");

  if (!track || !runButton || !replayButton || !statusNode) {
    return;
  }

  const nodes = Array.from(track.querySelectorAll(".timeline-node"));
  const labels = ["Commit", "Build", "Test", "Security Scan", "Review", "Deploy"];
  const reducedMotion = isReducedMotionPreferred();
  const timelineTargetMs = 6000;
  const initialDelay = reducedMotion ? 0 : 260;
  const baseStepDelay = computeBaseStepDelay(timelineTargetMs, initialDelay, nodes.length - 1, reducedMotion);
  let running = false;

  const runSequence = (corruptAtDeploy) => {
    if (running) {
      return;
    }

    running = true;
    resetTimeline(track, nodes, statusNode);
    runButton.disabled = true;
    replayButton.disabled = true;

    const statusMessages = labels.map((label) => `${label} gate engaged...`);
    const stepDelays = statusMessages.map((message) => stepDelayForText(baseStepDelay, message, reducedMotion));

    nodes.forEach((node, index) => {
      const delayToStep = stepDelays.slice(0, index).reduce((total, value) => total + value, initialDelay);
      setTimeout(() => {
        const prev = nodes[index - 1];
        if (prev) {
          prev.classList.remove("active");
          prev.classList.add("complete");
        }

        node.classList.add("active");
        setTimelineProgress(track, index, nodes.length);
        statusNode.textContent = statusMessages[index];

        if (corruptAtDeploy && index === nodes.length - 1) {
          node.classList.remove("active", "complete");
          node.classList.add("corrupt");
          statusNode.textContent = "Corruption surge: deploy attempted before secure gates.";
        }

        if (index === nodes.length - 1) {
          if (!corruptAtDeploy) {
            node.classList.remove("active");
            node.classList.add("complete");
            statusNode.textContent = "Timeline complete. All gates held.";
          }

          running = false;
          runButton.disabled = false;
          replayButton.disabled = false;
        }
      }, delayToStep);
    });
  };

  runButton.addEventListener("click", () => {
    runSequence(false);
  });

  replayButton.addEventListener("click", () => {
    trackTelemetry(telemetryEventName("MISSION_RETRY"), {
      mission: "kingdom-timeline",
      trigger: "timeline-replay"
    });
    runSequence(false);
  });

  const recklessButton = document.getElementById("reckless-path");
  recklessButton?.addEventListener("click", () => {
    runSequence(true);
  });
}

function setupIndexPage() {
  setupPipelineTimeline();

  const safeButton = document.getElementById("safe-path");
  const recklessButton = document.getElementById("reckless-path");
  const narrativeResult = document.getElementById("choice-result");

  safeButton?.addEventListener("click", () => {
    const result = dispatchAction({ type: window.HyruleActions.TYPES.SAFE_PATH });
    emitStory("path-choice", result);
    narrativeResult.textContent = "The kingdom stabilizes. You insisted on the full pipeline gates.";
  });

  recklessButton?.addEventListener("click", () => {
    const result = dispatchAction({ type: window.HyruleActions.TYPES.RECKLESS_PATH });
    emitStory("path-choice", result);
    narrativeResult.textContent = "Ganonix harvests chaos from your rushed deploy.";
  });

  const quizSubmit = document.getElementById("quiz-submit");
  const quizResult = document.getElementById("quiz-result");

  quizSubmit?.addEventListener("click", () => {
    const selected = document.querySelector("input[name='kingdom-quiz']:checked");
    if (!selected) {
      quizResult.textContent = "Choose an answer first.";
      return;
    }

    const correct = selected.value === "build-test-scan-review-deploy";
    const result = dispatchAction({
      type: window.HyruleActions.TYPES.INTRO_QUIZ,
      correct
    });
    emitStory("intro-quiz", result);

    quizResult.textContent = correct
      ? "Correct. You defended the release gates."
      : "Not quite. Deploy comes after testing, security scans, and review.";
  });
}

async function setupPowerPage() {
  const logNode = document.getElementById("ci-log");
  const pipelineNode = document.getElementById("ci-pipeline");
  const runButton = document.getElementById("run-ci");
  const doneNode = document.getElementById("power-status");
  const mission = await window.HyruleMissionLoader.loadMission("power");
  const steps = mission.ciSteps || [];

  if (pipelineNode) {
    pipelineNode.innerHTML = steps
      .map((step, index) => `<div class="pipeline-step" data-ci-step="${index + 1}">${step}</div>`)
      .join("");
  }

  runButton?.addEventListener("click", () => {
    if (!logNode) {
      return;
    }

    logNode.textContent = "CI Console Booting...";
    const reducedMotion = isReducedMotionPreferred();
    const sequenceTargetMs = 6000;
    const initialDelay = reducedMotion ? 0 : 260;
    const baseStepDelay = computeBaseStepDelay(sequenceTargetMs, initialDelay, steps.length + 1, reducedMotion);
    let delay = initialDelay;

    if (runButton) {
      runButton.disabled = true;
    }

    steps.forEach((step, index) => {
      const line = `Step ${index + 1}: ${step} ... OK`;
      const stepDelay = stepDelayForText(baseStepDelay, line, reducedMotion);
      setTimeout(() => {
        appendLog(logNode, line);
        const stage = document.querySelector(`[data-ci-step='${index + 1}']`);
        stage?.classList.add("active");
      }, delay);
      delay += stepDelay;
    });

    const completionLine = "Artifact signed and ready for security gates.";
    const completionDelay = stepDelayForText(baseStepDelay, completionLine, reducedMotion);
    setTimeout(() => {
      appendLog(logNode, completionLine);
      doneNode.textContent = "Temple of Power restored.";
      dispatchAction({
        type: window.HyruleActions.TYPES.COMPLETE_TEMPLE,
        piece: "power"
      });
      runButton.disabled = true;
    }, delay + completionDelay);
  });
}

async function setupWisdomPage() {
  const cardsRoot = document.getElementById("security-cards");
  const objectiveNode = document.getElementById("wisdom-objective");
  const resolveNode = document.getElementById("wisdom-status");
  const workflowComposerNode = document.getElementById("hidden-workflow-composer");
  const workflowCheck = document.getElementById("hidden-workflow-check");
  const workflowPreview = document.getElementById("hidden-workflow-preview");
  const workflowResult = document.getElementById("hidden-workflow-result");
  const mission = await window.HyruleMissionLoader.loadMission("wisdom");

  if (objectiveNode && mission.objective) {
    objectiveNode.textContent = mission.objective;
  }

  if (cardsRoot && Array.isArray(mission.securityCards)) {
    cardsRoot.innerHTML = mission.securityCards.map((card) => {
      const buttonLabel = card.fixLabel || "Apply Fix";
      return `
      <article class="card" data-security-card="${card.id}">
        <h2>${card.title}</h2>
        <p>${card.description}</p>
        <button>${buttonLabel}</button>
      </article>`;
    }).join("");
  }

  const cards = document.querySelectorAll("[data-security-card]");
  const workflowComposer = renderHiddenWorkflowComposer(
    workflowComposerNode,
    workflowPreview,
    mission.hiddenWorkflow || {}
  );
  let workflowAttempts = 0;
  let workflowRevealed = false;

  cards.forEach((card) => {
    const button = card.querySelector("button");
    button?.addEventListener("click", () => {
      card.setAttribute("data-cleared", "true");
      button.disabled = true;
      button.textContent = "Secured";
      dispatchAction({
        type: window.HyruleActions.TYPES.SECURITY_CARD_CLEARED,
        cardId: card.getAttribute("data-security-card")
      });

      const remaining = Array.from(cards).some((n) => n.getAttribute("data-cleared") !== "true");
      if (!remaining) {
        resolveNode.textContent = "All security wards reinforced.";
      }
    });
  });

  workflowCheck?.addEventListener("click", () => {
    workflowAttempts += 1;
    const valid = workflowComposer.isValid();

    if (!valid) {
      dispatchAction({
        type: window.HyruleActions.TYPES.HIDDEN_WORKFLOW_CHECK,
        valid: false,
        allCardsDone: false
      });
      workflowResult.textContent = hiddenWorkflowMessage({
        attempt: workflowAttempts,
        valid,
        allCardsDone: false,
        hadWisdomBefore: false,
        hasWisdomNow: false
      });
      return;
    }

    const stateBefore = window.HyruleEngine.getState();
    const hadWisdomBefore = Boolean(stateBefore && stateBefore.wisdom);
    const allCardsDone = Array.from(cards).every((n) => n.getAttribute("data-cleared") === "true");
    const result = dispatchAction({
      type: window.HyruleActions.TYPES.HIDDEN_WORKFLOW_CHECK,
      valid: true,
      allCardsDone
    });

    const hasWisdomNow = Boolean(result && result.state && result.state.wisdom);
    if (!workflowRevealed) {
      workflowRevealed = true;
    }
    workflowResult.textContent = hiddenWorkflowMessage({
      attempt: workflowAttempts,
      valid,
      allCardsDone,
      hadWisdomBefore,
      hasWisdomNow
    });
  });
}

async function setupCouragePage() {
  const mission = await window.HyruleMissionLoader.loadMission("courage");
  const objectiveNode = document.getElementById("courage-objective");
  const prereqsNode = document.getElementById("courage-prereqs");
  const approveButton = document.getElementById("approve-release");
  const deployButton = document.getElementById("deploy-release");
  const rushButton = document.getElementById("rush-release");
  const statusNode = document.getElementById("courage-status");

  if (objectiveNode && mission.objective) {
    objectiveNode.textContent = mission.objective;
  }

  if (prereqsNode && Array.isArray(mission.prereqsDisplay)) {
    prereqsNode.innerHTML = mission.prereqsDisplay.map((item) => `<li>${item}</li>`).join("");
  }

  approveButton?.addEventListener("click", () => {
    dispatchAction({
      type: window.HyruleActions.TYPES.GRANT_APPROVAL
    });
    statusNode.textContent = "Royal approval granted. Deployment gate unlocked.";
    deployButton.disabled = false;
  });

  deployButton?.addEventListener("click", () => {
    const state = window.HyruleEngine.getState();
    const requiredKeys = Array.isArray(mission.requiredStateKeys)
      ? mission.requiredStateKeys
      : ["approvalGranted", "power", "wisdom"];
    const prereqsMet = requiredKeys.every((key) => Boolean(state[key]));
    const result = dispatchAction({
      type: window.HyruleActions.TYPES.DEPLOY_RELEASE,
      prereqsMet
    });
    emitStory("deploy-attempt", result);

    if (!result.outcome.ok) {
      statusNode.textContent = "Cannot deploy yet. Complete Power and Wisdom, then obtain approval.";
      return;
    }

    statusNode.textContent = "Deployment successful. Temple of Courage restored.";
    deployButton.disabled = true;
  });

  rushButton?.addEventListener("click", () => {
    dispatchAction({ type: window.HyruleActions.TYPES.RUSH_RELEASE });
    statusNode.textContent = "Emergency rollback triggered. Reckless deployment failed.";
  });
}

async function setupFinalBattlePage() {
  const module = window.HyruleFinalBattleChallenge;
  if (!module || typeof module.setupFinalBattlePage !== "function") {
    return;
  }

  await module.setupFinalBattlePage({
    dispatchAction,
    emitStory,
    isReducedMotionPreferred
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page");
    const missionName = {
      index: "kingdom",
      power: "power",
      wisdom: "wisdom",
      courage: "courage",
      final: "final-battle"
    }[page] || "unknown";

    trackTelemetry(telemetryEventName("MISSION_STARTED"), {
      mission: missionName,
      page
    });

    if (page === "index") {
      setupIndexPage();
    } else if (page === "power") {
      setupPowerPage();
    } else if (page === "wisdom") {
      setupWisdomPage();
    } else if (page === "courage") {
      setupCouragePage();
    } else if (page === "final") {
      setupFinalBattlePage();
    }

    setupKeyboardShortcuts(page);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    computeBaseStepDelay,
    estimateReadableDelay,
    stepDelayForText,
    hiddenWorkflowMessage,
    renderHiddenWorkflowPreview,
    renderHiddenWorkflowPreviewMarkup,
    seededShuffleOptions
  };
}
