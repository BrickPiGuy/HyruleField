function appendLog(node, line) {
  node.textContent += `\n${line}`;
  node.scrollTop = node.scrollHeight;
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
  let running = false;

  const runSequence = (corruptAtDeploy) => {
    if (running) {
      return;
    }

    running = true;
    resetTimeline(track, nodes, statusNode);
    runButton.disabled = true;
    replayButton.disabled = true;

    nodes.forEach((node, index) => {
      setTimeout(() => {
        const prev = nodes[index - 1];
        if (prev) {
          prev.classList.remove("active");
          prev.classList.add("complete");
        }

        node.classList.add("active");
        setTimelineProgress(track, index, nodes.length);
        statusNode.textContent = `${labels[index]} gate engaged...`;

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
      }, index * 360 + 140);
    });
  };

  runButton.addEventListener("click", () => {
    runSequence(false);
  });

  replayButton.addEventListener("click", () => {
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
    window.HyruleState.decreaseCorruption(5);
    narrativeResult.textContent = "The kingdom stabilizes. You insisted on the full pipeline gates.";
  });

  recklessButton?.addEventListener("click", () => {
    window.HyruleState.increaseCorruption(12);
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
    window.HyruleState.withState((state) => {
      state.quizzes.intro = correct;
      state.corruption += correct ? -4 : 6;
    });

    quizResult.textContent = correct
      ? "Correct. You defended the release gates."
      : "Not quite. Deploy comes after testing, security scans, and review.";
  });
}

function setupPowerPage() {
  const logNode = document.getElementById("ci-log");
  const runButton = document.getElementById("run-ci");
  const doneNode = document.getElementById("power-status");
  const steps = [
    "Checkout source",
    "Install dependencies",
    "Run lint",
    "Run unit tests",
    "Package artifact"
  ];

  runButton?.addEventListener("click", () => {
    if (!logNode) {
      return;
    }

    logNode.textContent = "CI Console Booting...";
    let delay = 240;

    steps.forEach((step, index) => {
      setTimeout(() => {
        appendLog(logNode, `Step ${index + 1}: ${step} ... OK`);
        const stage = document.querySelector(`[data-ci-step='${index + 1}']`);
        stage?.classList.add("active");
      }, delay);
      delay += 260;
    });

    setTimeout(() => {
      appendLog(logNode, "Artifact signed and ready for security gates.");
      doneNode.textContent = "Temple of Power restored.";
      window.HyruleState.completeTemple("power");
      runButton.disabled = true;
    }, delay + 200);
  });
}

function setupWisdomPage() {
  const cards = document.querySelectorAll("[data-security-card]");
  const resolveNode = document.getElementById("wisdom-status");
  const workflowInput = document.getElementById("hidden-workflow-input");
  const workflowCheck = document.getElementById("hidden-workflow-check");
  const workflowResult = document.getElementById("hidden-workflow-result");

  cards.forEach((card) => {
    const button = card.querySelector("button");
    button?.addEventListener("click", () => {
      card.setAttribute("data-cleared", "true");
      button.disabled = true;
      button.textContent = "Secured";
      window.HyruleState.decreaseCorruption(2);

      const remaining = Array.from(cards).some((n) => n.getAttribute("data-cleared") !== "true");
      if (!remaining) {
        resolveNode.textContent = "All security wards reinforced.";
      }
    });
  });

  workflowCheck?.addEventListener("click", () => {
    const text = (workflowInput?.value || "").toLowerCase();
    const valid = text.includes("deploy") && (text.includes("every commit") || text.includes("direct"));

    if (!valid) {
      workflowResult.textContent = "Hint: identify the workflow that deploys directly without checks.";
      window.HyruleState.increaseCorruption(4);
      return;
    }

    window.HyruleState.withState((state) => {
      state.hiddenWorkflowFound = true;
      const allCardsDone = Array.from(cards).every((n) => n.getAttribute("data-cleared") === "true");
      if (allCardsDone) {
        state.wisdom = true;
        state.corruption -= 7;
      }
    });

    workflowResult.textContent = "Hidden workflow exposed. Wisdom restored.";
  });
}

function setupCouragePage() {
  const approveButton = document.getElementById("approve-release");
  const deployButton = document.getElementById("deploy-release");
  const rushButton = document.getElementById("rush-release");
  const statusNode = document.getElementById("courage-status");

  approveButton?.addEventListener("click", () => {
    window.HyruleState.withState((state) => {
      state.approvalGranted = true;
      state.corruption -= 3;
    });
    statusNode.textContent = "Royal approval granted. Deployment gate unlocked.";
    deployButton.disabled = false;
  });

  deployButton?.addEventListener("click", () => {
    window.HyruleState.withState((state) => {
      if (!state.approvalGranted || !(state.power && state.wisdom)) {
        statusNode.textContent = "Cannot deploy yet. Complete Power and Wisdom, then obtain approval.";
        state.corruption += 5;
        return;
      }

      state.courage = true;
      state.corruption -= 8;
      statusNode.textContent = "Deployment successful. Temple of Courage restored.";
    });
    deployButton.disabled = true;
  });

  rushButton?.addEventListener("click", () => {
    window.HyruleState.increaseCorruption(12);
    statusNode.textContent = "Emergency rollback triggered. Reckless deployment failed.";
  });
}

function setupFinalBattlePage() {
  const checks = document.querySelectorAll("input[data-final-task]");
  const finishButton = document.getElementById("finish-battle");
  const resultNode = document.getElementById("battle-result");
  const certificate = document.getElementById("certificate");
  const printButton = document.getElementById("print-badge");

  finishButton?.addEventListener("click", () => {
    const allMarked = Array.from(checks).every((node) => node.checked);

    window.HyruleState.withState((state) => {
      const triforceComplete = state.power && state.wisdom && state.courage;
      if (!allMarked || !triforceComplete) {
        state.corruption += 8;
        resultNode.textContent = "Ganonix resists. Complete every task and restore all three temples first.";
        return;
      }

      state.corruption -= 10;
      resultNode.textContent = "Victory. The kingdom and production are secure.";
      certificate.classList.remove("hidden");
    });
  });

  printButton?.addEventListener("click", () => {
    window.print();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");

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
});
