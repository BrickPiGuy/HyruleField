(function (root, factory) {
  const api = factory();
  root.HyruleInstructorMode = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const PAGE_CONFIG = {
    index: {
      title: "Kingdom Commander Notes",
      label: "Front Page",
      expectedAnswers: [
        "Build, test, scan, review, deploy",
        "Use the safe path before assembling the Triforce",
        "The quiz answer is the fully gated release order"
      ],
      riskMap: [
        "Reckless deploy raises corruption immediately.",
        "Skipping gates weakens the release story and breaks production trust."
      ],
      hints: [
        "The Run Full Gate Sequence button demonstrates the safe release path.",
        "The timeline shows the order the pipeline should follow.",
        "The quiz only has one answer that keeps production secure."
      ]
    },
    power: {
      title: "Temple of Power Notes",
      label: "CI Forge",
      expectedAnswers: [
        "Checkout source",
        "Install dependencies",
        "Run lint",
        "Run unit tests",
        "Package artifact"
      ],
      riskMap: [
        "Missing any gate leaves the forge unstable.",
        "CI only restores Power when every stage completes cleanly."
      ],
      hints: [
        "The mission objective is to stabilize CI by completing all forge gates.",
        "Use the Run CI Workflow button to replay the pipeline.",
        "The stage list mirrors the mission JSON exactly."
      ]
    },
    wisdom: {
      title: "Temple of Wisdom Notes",
      label: "Security Wards",
      expectedAnswers: [
        "Describe one unsafe workflow in a single sentence.",
        "Include action, frequency, and skipped safety gates.",
        "Reference direct production flow and bypassed checks."
      ],
      riskMap: [
        "Unfixed secrets, dependencies, or code analysis findings keep the temple corrupted.",
        "The hidden workflow hint points to direct deploy without checks."
      ],
      hints: [
        "The hidden workflow box is the clue to expose the corruption.",
        "Clear all three security cards before validating the hidden workflow.",
        "Guide learners to describe the pattern type without giving the exact phrase."
      ]
    },
    courage: {
      title: "Temple of Courage Notes",
      label: "Approval Gate",
      expectedAnswers: [
        "approvalGranted",
        "power",
        "wisdom"
      ],
      riskMap: [
        "Deploying without approval triggers rollback.",
        "Courage depends on the upstream temples already being restored."
      ],
      hints: [
        "Approval unlocks the deploy button.",
        "The required state keys match the checklist for this temple.",
        "Power and Wisdom must already be restored before Courage can finish."
      ]
    },
    final: {
      title: "Final Battle Notes",
      label: "Release Victory",
      expectedAnswers: [
        "Repair the build.",
        "Make all tests pass.",
        "Resolve all security findings.",
        "Protect production environment.",
        "Obtain release approval.",
        "Deploy the restored release."
      ],
      riskMap: [
        "The final battle requires all three temples to be restored.",
        "If any checklist item is missed, Ganonix resists the release."
      ],
      hints: [
        "The final checklist combines every earlier gate.",
        "The printable badge only appears after a successful resolution.",
        "Use the battlefield as a summary, not a shortcut."
      ]
    }
  };

  function getPageId() {
    return document.body.getAttribute("data-page") || "index";
  }

  function getMissionName(pageId) {
    if (pageId === "final") {
      return "final-battle";
    }

    return pageId;
  }

  function createList(items) {
    return items.map((item) => `<li>${item}</li>`).join("");
  }

  async function loadMission(pageId) {
    const missionName = getMissionName(pageId);
    if (!window.HyruleMissionLoader || typeof window.HyruleMissionLoader.loadMission !== "function") {
      return null;
    }

    try {
      return await window.HyruleMissionLoader.loadMission(missionName);
    } catch (_error) {
      return null;
    }
  }

  function buildModel(pageId, mission) {
    const config = PAGE_CONFIG[pageId];
    if (!config) {
      return null;
    }

    if (pageId === "power" && mission) {
      return {
        ...config,
        expectedAnswers: Array.isArray(mission.ciSteps) ? mission.ciSteps : config.expectedAnswers,
        hints: [
          mission.objective || config.hints[0],
          "Each pipeline stage must clear before the forge is restored.",
          "The reward is granted only after the last stage finishes."
        ]
      };
    }

    if (pageId === "wisdom" && mission) {
      return {
        ...config,
        expectedAnswers: [
          "Describe one unsafe workflow in a single sentence.",
          "Include action, frequency, and skipped safety gates.",
          "Reference direct production flow and bypassed checks.",
          ...(Array.isArray(mission.securityCards) ? mission.securityCards.map((card) => card.title) : [])
        ],
        hints: [
          mission.objective || config.hints[0],
          "The reveal action is about identifying direct deploy behavior.",
          "Every security ward must be cleared first.",
          "Coach with pattern categories, not an exact answer phrase."
        ]
      };
    }

    if (pageId === "courage" && mission) {
      return {
        ...config,
        expectedAnswers: Array.isArray(mission.requiredStateKeys) ? mission.requiredStateKeys : config.expectedAnswers,
        hints: [
          mission.objective || config.hints[0],
          "Approval is the last gate before deployment.",
          "Upstream temples must already be complete."
        ]
      };
    }

    if (pageId === "final" && mission) {
      return {
        ...config,
        expectedAnswers: Array.isArray(mission.checklist) ? mission.checklist : config.expectedAnswers,
        hints: [
          mission.objective || config.hints[0],
          "The final battle checks state, checklist, and release approval.",
          "Victory only appears once every earlier mission has been solved."
        ]
      };
    }

    return config;
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.className = "instructor-panel hidden";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="instructor-panel__header">
        <div>
          <p class="instructor-kicker">Instructor Mode</p>
          <h2 data-instructor-title>Instructor Notes</h2>
          <p class="instructor-label" data-instructor-label></p>
        </div>
        <button type="button" class="secondary" data-instructor-close>Hide Notes</button>
      </div>
      <div class="instructor-grid">
        <section>
          <h3>Expected Answers</h3>
          <ul data-instructor-answers></ul>
        </section>
        <section>
          <h3>Risk Mapping</h3>
          <ul data-instructor-risks></ul>
        </section>
      </div>
      <section class="instructor-hints">
        <div class="instructor-controls">
          <button type="button" class="secondary" data-instructor-next>Reveal Next Hint</button>
          <button type="button" class="secondary" data-instructor-reset>Reset Hint</button>
        </div>
        <p class="instructor-hint-title">Hint</p>
        <p data-instructor-hint></p>
      </section>
    `;
    return panel;
  }

  function setVisible(panel, toggleButton, visible) {
    panel.classList.toggle("hidden", !visible);
    panel.setAttribute("aria-hidden", String(!visible));
    toggleButton.setAttribute("aria-expanded", String(visible));
    toggleButton.textContent = visible ? "Hide Instructor Mode" : "Instructor Mode";
  }

  async function initializePage() {
    const pageId = getPageId();
    if (!PAGE_CONFIG[pageId]) {
      return;
    }

    const nav = document.querySelector(".top-nav");
    if (!nav) {
      return;
    }

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.id = "instructor-toggle";
    toggleButton.className = "secondary";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.textContent = "Instructor Mode";
    nav.appendChild(toggleButton);

    const panel = createPanel();
    document.body.appendChild(panel);

    const titleNode = panel.querySelector("[data-instructor-title]");
    const labelNode = panel.querySelector("[data-instructor-label]");
    const answersNode = panel.querySelector("[data-instructor-answers]");
    const risksNode = panel.querySelector("[data-instructor-risks]");
    const hintNode = panel.querySelector("[data-instructor-hint]");
    const nextButton = panel.querySelector("[data-instructor-next]");
    const resetButton = panel.querySelector("[data-instructor-reset]");
    const closeButton = panel.querySelector("[data-instructor-close]");

    const mission = await loadMission(pageId);
    const model = buildModel(pageId, mission);
    if (!model) {
      return;
    }

    titleNode.textContent = model.title;
    labelNode.textContent = model.label;
    answersNode.innerHTML = createList(model.expectedAnswers);
    risksNode.innerHTML = createList(model.riskMap);

    let hintIndex = 0;
    const hints = model.hints && model.hints.length ? model.hints : ["No hints available."];
    hintNode.textContent = hints[hintIndex];

    nextButton.addEventListener("click", () => {
      hintIndex = (hintIndex + 1) % hints.length;
      hintNode.textContent = hints[hintIndex];
    });

    resetButton.addEventListener("click", () => {
      hintIndex = 0;
      hintNode.textContent = hints[hintIndex];
    });

    const close = () => setVisible(panel, toggleButton, false);
    closeButton.addEventListener("click", close);

    toggleButton.addEventListener("click", () => {
      const visible = panel.classList.contains("hidden");
      setVisible(panel, toggleButton, visible);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializePage().catch(() => {
      // Instructor mode should never block the main game flow.
    });
  });

  return {
    PAGE_CONFIG
  };
});
