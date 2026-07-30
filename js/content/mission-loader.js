(function (root, factory) {
  const api = factory();
  root.HyruleMissionLoader = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const cache = {};

  const fallbackMissions = {
    power: {
      title: "Temple of Power",
      ciSteps: [
        "Checkout source",
        "Install dependencies",
        "Run lint",
        "Run unit tests",
        "Package artifact"
      ]
    },
    wisdom: {
      title: "Temple of Wisdom",
      objective: "Secure the pipeline by clearing all security wards and exposing unsafe direct deploy.",
      securityCards: [
        { id: "secrets", title: "Secret Curse", description: "Rotate leaked credentials and enable secret scanning." },
        { id: "dependency", title: "Dependency Blight", description: "Patch vulnerable packages and re-run checks." },
        { id: "codeql", title: "Theft of Wisdom", description: "Enable code analysis and least-privilege permissions." }
      ],
      hiddenWorkflow: {
        previewTemplate: "{action} {frequency} {destination}, skipping {gates}.",
        segments: [
          {
            id: "action",
            label: "Risky action",
            correctValue: "Deploy",
            options: ["Promote", "Deploy", "Scan", "Approve", "Attest"]
          },
          {
            id: "frequency",
            label: "How often",
            correctValue: "every commit",
            options: ["after approval", "every commit", "per release train", "after a security waiver", "only for emergency fixes"]
          },
          {
            id: "destination",
            label: "Destination",
            correctValue: "directly to production",
            options: ["to staging for soak", "directly to production", "to a canary ring", "to an isolated review app", "to a hardened pre-prod gate"]
          },
          {
            id: "gates",
            label: "Skipped gates",
            correctValue: "tests, security scans, and review gates",
            options: ["artifact signing and provenance checks", "tests, security scans, and review gates", "secret rotation and dashboard reviews", "rollback drills and alert tuning", "dependency pinning and branch protection"]
          }
        ],
        requiredWords: ["deploy"],
        anyPhrases: ["every commit", "direct"]
      }
    },
    courage: {
      title: "Temple of Courage",
      objective: "Deploy only after approval and upstream gates are complete.",
      requiredStateKeys: ["approvalGranted", "power", "wisdom"],
      prereqsDisplay: [
        "Royal approval granted",
        "Temple of Power restored",
        "Temple of Wisdom restored"
      ]
    },
    "final-battle": {
      title: "The Final Battle",
      objective: "Complete every battle checklist item with all three temples restored.",
      checklist: [
        "Repair the build.",
        "Make all tests pass.",
        "Resolve all security findings.",
        "Protect production environment.",
        "Obtain release approval.",
        "Deploy the restored release."
      ],
      pipelineStages: [
        "Commit",
        "Build",
        "Test",
        "Security Scan",
        "Review / Approval",
        "Deploy"
      ],
      requiredStateKeys: ["power", "wisdom", "courage"],
      messages: {
        failure: "Ganonix resists. Complete every task and restore all three temples first.",
        success: "Victory. The kingdom and production are secure."
      }
    }
  };

  async function loadMission(name) {
    if (cache[name]) {
      return cache[name];
    }

    const fallback = fallbackMissions[name] || null;

    try {
      const response = await fetch(`data/missions/${name}.json`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed mission fetch: ${name}`);
      }

      const data = await response.json();
      cache[name] = data;
      return data;
    } catch (_error) {
      if (fallback) {
        cache[name] = fallback;
        return fallback;
      }
      throw new Error(`Mission not found: ${name}`);
    }
  }

  return {
    loadMission
  };
});
