(function (root, factory) {
  const api = factory();
  root.HyruleStoryEngine = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const fallbackEvents = {
    events: {
      "path-choice": {
        branches: [
          {
            id: "stabilize",
            when: { outcomeReason: "safe_path" },
            title: "Stability Restored",
            text: "The release wards hum in harmony."
          },
          {
            id: "chaos",
            when: { outcomeReason: "reckless_path" },
            title: "Chaos Surge",
            text: "A rushed deploy cracked the gate seals."
          }
        ]
      },
      "intro-quiz": {
        branches: [
          {
            id: "quiz-pass",
            when: { outcomeReason: "quiz_correct" },
            title: "Gate Doctrine Learned",
            text: "You chose the secure order."
          },
          {
            id: "quiz-fail",
            when: { outcomeReason: "quiz_incorrect" },
            title: "Sequence Broken",
            text: "Pipeline order collapsed."
          }
        ]
      },
      "deploy-attempt": {
        branches: [
          {
            id: "deploy-success",
            when: { outcomeReason: "deploy_success" },
            title: "Gate of Courage Holds",
            text: "Deployment succeeded with discipline."
          },
          {
            id: "deploy-blocked",
            when: { outcomeReason: "deploy_blocked" },
            title: "Gate Denied",
            text: "Deployment was denied by upstream gates."
          }
        ]
      },
      "final-battle": {
        branches: [
          {
            id: "victory",
            when: { outcomeReason: "battle_won" },
            title: "Ganonix Defeated",
            text: "The Triforce is balanced."
          },
          {
            id: "setback",
            when: { outcomeReason: "battle_failed" },
            title: "Shadow Resistance",
            text: "Recover every gate and return stronger."
          }
        ]
      }
    }
  };

  let cache = null;

  function matchesBranch(branch, context) {
    const when = branch.when || {};
    if (when.outcomeReason && when.outcomeReason !== context.outcomeReason) {
      return false;
    }
    return true;
  }

  function pickBranch(eventConfig, context) {
    const branches = (eventConfig && eventConfig.branches) || [];
    const match = branches.find((branch) => matchesBranch(branch, context));
    return match || null;
  }

  async function loadEvents() {
    if (cache) {
      return cache;
    }

    try {
      if (typeof fetch !== "function") {
        throw new Error("fetch_unavailable");
      }
      const response = await fetch("data/story/events.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("story_fetch_failed");
      }
      cache = await response.json();
      return cache;
    } catch (_error) {
      cache = fallbackEvents;
      return cache;
    }
  }

  async function getNarrative(eventKey, context) {
    const events = await loadEvents();
    const eventConfig = events.events[eventKey];
    if (!eventConfig) {
      return null;
    }

    const selected = pickBranch(eventConfig, {
      outcomeReason: context && context.outcome && context.outcome.reason ? context.outcome.reason : null
    });

    if (!selected) {
      return null;
    }

    return {
      eventKey,
      id: selected.id,
      title: selected.title,
      text: selected.text
    };
  }

  return {
    getNarrative,
    __test: {
      pickBranch
    }
  };
});
