async function setupFinalBattlePageImpl(deps) {
  const dispatchAction = deps && deps.dispatchAction;
  const emitStory = deps && deps.emitStory;
  const isReducedMotionPreferred = deps && deps.isReducedMotionPreferred;
  if (typeof dispatchAction !== "function" || typeof emitStory !== "function" || typeof isReducedMotionPreferred !== "function") {
    return;
  }

  const mission = await window.HyruleMissionLoader.loadMission("final-battle");
  const objectiveNode = document.getElementById("final-objective");
  const checklistNode = document.getElementById("final-checklist");
  const progressNode = document.getElementById("battle-progress");
  const pipelineNode = document.getElementById("final-pipeline");
  const finishButton = document.getElementById("finish-battle");
  const resultNode = document.getElementById("battle-result");
  const certificate = document.getElementById("certificate");
  const printButton = document.getElementById("print-badge");
  const championNode = document.getElementById("certificate-champion");
  const scoreNode = document.getElementById("certificate-score");
  const corruptionNode = document.getElementById("certificate-corruption");
  const timeNode = document.getElementById("certificate-time");
  const codeNode = document.getElementById("certificate-code");
  const sealsNode = document.getElementById("certificate-seals-list");

  if (objectiveNode && mission.objective) {
    objectiveNode.textContent = mission.objective;
  }

  if (checklistNode && Array.isArray(mission.checklist)) {
    checklistNode.innerHTML = mission.checklist
      .map((item) => `<label class="quiz-option"><input data-final-task type="checkbox"> ${item}</label>`)
      .join("");
  }

  if (pipelineNode && Array.isArray(mission.pipelineStages)) {
    pipelineNode.innerHTML = mission.pipelineStages
      .map((stage) => `<div class="pipeline-step active">${stage}</div>`)
      .join("");
  }

  const checks = document.querySelectorAll("input[data-final-task]");
  const requiredKeys = Array.isArray(mission.requiredStateKeys)
    ? mission.requiredStateKeys
    : ["power", "wisdom", "courage"];
  const failureMessage = mission.messages && mission.messages.failure
    ? mission.messages.failure
    : "Ganonix resists. Complete every task and restore all three temples first.";
  const successMessage = mission.messages && mission.messages.success
    ? mission.messages.success
    : "Victory. The kingdom and production are secure.";

  const formatCompletionTime = (date) => new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  const buildRecordCode = (state, date) => {
    const stamp = date.toISOString().replace(/[-:TZ.]/g, "").slice(2, 14);
    const score = Number(state?.rewards?.totalScore || 0);
    return `HF-${stamp}-${Math.max(0, score)}`;
  };

  const updateChecklistProgress = () => {
    const total = checks.length;
    const checked = Array.from(checks).filter((node) => node.checked).length;
    const remaining = Math.max(total - checked, 0);

    if (progressNode) {
      progressNode.textContent = `${checked} / ${total} tasks complete${remaining > 0 ? ` (${remaining} remaining)` : ""}`;
    }
  };

  checks.forEach((node) => {
    node.addEventListener("change", updateChecklistProgress);
  });
  updateChecklistProgress();

  finishButton?.addEventListener("click", () => {
    const allMarked = Array.from(checks).every((node) => node.checked);
    const state = window.HyruleEngine.getState();
    const requiredKeysMet = requiredKeys.every((key) => Boolean(state[key]));

    const result = dispatchAction({
      type: window.HyruleActions.TYPES.FINAL_BATTLE_RESOLVE,
      allMarked,
      requiredKeysMet
    });
    emitStory("final-battle", result);

    if (!result.outcome.ok) {
      resultNode.textContent = failureMessage;
      resultNode.classList.remove("success");
      resultNode.classList.add("failure");
      certificate.classList.add("hidden");
      if (printButton) {
        printButton.disabled = true;
      }
      if (sealsNode) {
        sealsNode.innerHTML = "<li>Pending final verification...</li>";
      }
      return;
    }

    resultNode.textContent = successMessage;
    resultNode.classList.remove("failure");
    resultNode.classList.add("success");

    const resolvedState = result.state || window.HyruleEngine.getState();
    const completedAt = new Date();

    if (championNode) {
      championNode.textContent = "Hero of DevOps";
    }

    if (scoreNode) {
      scoreNode.textContent = String(resolvedState?.rewards?.totalScore || 0);
    }

    if (corruptionNode) {
      corruptionNode.textContent = `${resolvedState?.corruption ?? 0}%`;
    }

    if (timeNode) {
      timeNode.textContent = formatCompletionTime(completedAt);
    }

    if (codeNode) {
      codeNode.textContent = buildRecordCode(resolvedState, completedAt);
    }

    if (sealsNode) {
      const earnedSeals = Array.isArray(mission.checklist)
        ? mission.checklist.map((item) => `<li>${item.replace(/\.$/, "")}</li>`).join("")
        : "<li>Build, test, and security defenses verified</li>";
      sealsNode.innerHTML = earnedSeals;
    }

    certificate.classList.remove("hidden");
    if (printButton) {
      printButton.disabled = false;
    }
    certificate.scrollIntoView({ behavior: isReducedMotionPreferred() ? "auto" : "smooth", block: "start" });
  });

  printButton?.addEventListener("click", () => {
    window.print();
  });
}

if (typeof window !== "undefined") {
  window.HyruleFinalBattleChallenge = {
    setupFinalBattlePage: setupFinalBattlePageImpl
  };
}
