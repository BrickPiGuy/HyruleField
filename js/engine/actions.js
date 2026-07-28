(function (root, factory) {
  const api = factory();
  root.HyruleActions = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const TYPES = {
    RESET_GAME: "RESET_GAME",
    SAFE_PATH: "SAFE_PATH",
    RECKLESS_PATH: "RECKLESS_PATH",
    INTRO_QUIZ: "INTRO_QUIZ",
    COMPLETE_TEMPLE: "COMPLETE_TEMPLE",
    SECURITY_CARD_CLEARED: "SECURITY_CARD_CLEARED",
    HIDDEN_WORKFLOW_CHECK: "HIDDEN_WORKFLOW_CHECK",
    GRANT_APPROVAL: "GRANT_APPROVAL",
    DEPLOY_RELEASE: "DEPLOY_RELEASE",
    RUSH_RELEASE: "RUSH_RELEASE",
    FINAL_BATTLE_RESOLVE: "FINAL_BATTLE_RESOLVE"
  };

  const TELEMETRY_EVENTS = {
    MISSION_STARTED: "mission_started",
    MISSION_RETRY: "mission_retry",
    MISSION_FAILED: "mission_failed",
    MISSION_COMPLETED: "mission_completed",
    ACTION_RESOLVED: "action_resolved"
  };

  return {
    TYPES,
    TELEMETRY_EVENTS
  };
});
