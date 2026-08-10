(function (root, factory) {
  const api = factory(root.HyruleMissionLoader);
  root.HyruleHUD = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleMissionLoader) {
  const pageToMission = {
    power: "power",
    wisdom: "wisdom",
    courage: "courage",
    final: "final-battle"
  };

  const pageToCampaignStep = {
    power: "power",
    wisdom: "wisdom",
    courage: "courage",
    final: "final"
  };

  const missionRoutes = {
    power: {
      label: "Temple of Power",
      href: "power.html"
    },
    wisdom: {
      label: "Temple of Wisdom",
      href: "wisdom.html"
    },
    courage: {
      label: "Temple of Courage",
      href: "courage.html"
    },
    final: {
      label: "Final Battle",
      href: "final-battle.html"
    }
  };

  const campaignRouteOrder = ["power", "wisdom", "courage", "final"];

  let objectiveNode = null;
  let gateNode = null;
  let pathKickerNode = null;
  let pathTitleNode = null;
  let pathCopyNode = null;
  let pathLinkNode = null;

  function getActiveRoute(page) {
    if (page === "index") {
      return {
        label: "Kingdom",
        href: "index.html"
      };
    }

    const campaignStep = pageToCampaignStep[page];
    return campaignStep ? missionRoutes[campaignStep] : null;
  }

  function isRouteComplete(page, state) {
    if (page === "index") {
      return false;
    }

    if (page === "final") {
      return Boolean(state && state.rewards && state.rewards.finalVictoryAwarded);
    }

    const campaignStep = pageToCampaignStep[page];
    return Boolean(campaignStep && state && state[campaignStep]);
  }

  function getCampaignGuide(page, state) {
    const lastAward = state && state.rewards ? state.rewards.lastTempleAward : null;
    const branchLabel = lastAward && lastAward.branch === "mastery" ? "Mastery Route" : "Recovery Route";

    if (page === "index") {
      return {
        message: "Start at the Temple of Power. Restore the gates in order.",
        bannerTitle: "Campaign Start: Temple of Power",
        bannerKicker: "Next destination",
        actionLabel: "Go to Temple of Power",
        href: missionRoutes.power.href,
        showAction: true,
        complete: false
      };
    }

    const currentRoute = getActiveRoute(page);
    const currentIndex = campaignRouteOrder.indexOf(pageToCampaignStep[page]);
    if (!currentRoute || currentIndex < 0) {
      return {
        message: "Choose a temple path to continue the campaign.",
        bannerTitle: "Choose a temple path",
        bannerKicker: "Campaign route",
        actionLabel: "Go to Kingdom",
        href: "index.html",
        showAction: false,
        complete: false
      };
    }

    const complete = isRouteComplete(page, state);
    const nextKey = campaignRouteOrder[currentIndex + 1] || null;
    const nextRoute = nextKey ? missionRoutes[nextKey] : missionRoutes.power;

    if (!complete) {
      if (page === "final") {
        return {
          message: "Restore Power, Wisdom, and Courage to unlock the final battle.",
          bannerTitle: "Final Battle Locked",
          bannerKicker: "Complete all temples first",
          actionLabel: "Go to Temple of Power",
          href: missionRoutes.power.href,
          showAction: false,
          complete: false
        };
      }

      return {
        message: `Complete ${currentRoute.label} to unlock ${nextRoute.label}.`,
        bannerTitle: `Next: ${nextRoute.label}`,
        bannerKicker: `${branchLabel} pending`,
        actionLabel: `Continue to ${nextRoute.label}`,
        href: nextRoute.href,
        showAction: false,
        complete: false
      };
    }

    if (page === "final") {
      return {
        message: "Lord Ganonix is defeated. Return to the Kingdom to finish the campaign.",
        bannerTitle: "Campaign Complete: Return to Kingdom",
        bannerKicker: "Victory",
        actionLabel: "Return to Kingdom",
        href: "index.html",
        showAction: true,
        complete: true
      };
    }

    return {
      message: `${currentRoute.label} restored on the ${branchLabel.toLowerCase()}. Next destination: ${nextRoute.label}.`,
      bannerTitle: `Next: ${nextRoute.label} (${branchLabel})`,
      bannerKicker: `${currentRoute.label} restored`,
      actionLabel: `Continue to ${nextRoute.label}`,
      href: nextRoute.href,
      showAction: true,
      complete: true
    };
  }

  function markCurrentNavLink(page) {
    const activeRoute = getActiveRoute(page);
    if (!activeRoute) {
      return;
    }

    document.querySelectorAll(".top-nav a").forEach((link) => {
      const href = String(link.getAttribute("href") || "");
      const isCurrent = href === activeRoute.href;
      link.classList.toggle("is-current", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function missionLabel(key) {
    const labels = {
      power: "Power",
      wisdom: "Wisdom",
      courage: "Courage",
      finalBattle: "Final Battle"
    };
    return labels[key] || key;
  }

  function missionStatusSummary(state) {
    const missionKeys = ["power", "wisdom", "courage", "finalBattle"];
    return missionKeys.map((key) => {
      const mission = state.missions && state.missions[key] ? state.missions[key] : { status: "locked" };
      return `${missionLabel(key)}: ${mission.status}`;
    }).join(" | ");
  }

  async function resolveObjectiveText(page) {
    if (!pageToMission[page]) {
      return "Choose a temple path to begin restoring the pipeline gates.";
    }

    try {
      const mission = await HyruleMissionLoader.loadMission(pageToMission[page]);
      return mission.objective || "Objective unavailable for this mission.";
    } catch (_error) {
      return "Objective unavailable for this mission.";
    }
  }

  async function setup() {
    const shell = document.querySelector(".site-shell");
    const statusBar = document.querySelector(".status-bar");

    if (!shell || !statusBar) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "hud-panel";
    panel.innerHTML = "<p class=\"hud-title\">Mission HUD</p><p id=\"hud-objective\">Loading objective...</p><p id=\"hud-gates\"></p><div class=\"hud-path\" aria-live=\"polite\"><p id=\"hud-path-kicker\" class=\"hud-path-kicker\"></p><h2 id=\"hud-path-title\" class=\"hud-path-title\"></h2><p id=\"hud-path-copy\"></p><a id=\"hud-path-link\" class=\"btn-link hud-path-link\" href=\"index.html\">Continue</a></div>";
    statusBar.insertAdjacentElement("afterend", panel);

    objectiveNode = panel.querySelector("#hud-objective");
    gateNode = panel.querySelector("#hud-gates");
    pathKickerNode = panel.querySelector("#hud-path-kicker");
    pathTitleNode = panel.querySelector("#hud-path-title");
    pathCopyNode = panel.querySelector("#hud-path-copy");
    pathLinkNode = panel.querySelector("#hud-path-link");

    const page = document.body.getAttribute("data-page");
    objectiveNode.textContent = await resolveObjectiveText(page);
    markCurrentNavLink(page);

    if (window.HyruleEngine && typeof window.HyruleEngine.getState === "function") {
      update(window.HyruleEngine.getState());
    }
  }

  function update(state) {
    if (gateNode) {
      gateNode.textContent = missionStatusSummary(state);
    }

    const page = document.body.getAttribute("data-page");
    const guide = getCampaignGuide(page, state || {});

    if (pathCopyNode) {
      pathCopyNode.textContent = guide.message;
    }

    if (pathKickerNode) {
      pathKickerNode.textContent = guide.bannerKicker;
    }

    if (pathTitleNode) {
      pathTitleNode.textContent = guide.bannerTitle;
    }

    if (pathLinkNode && pathCopyNode && pathKickerNode && pathTitleNode) {
      pathLinkNode.closest(".hud-path")?.classList.toggle("is-complete", Boolean(guide.complete));
    }

    if (pathLinkNode) {
      pathLinkNode.textContent = guide.actionLabel;
      pathLinkNode.setAttribute("href", guide.href);
      pathLinkNode.hidden = !guide.showAction;
      pathLinkNode.setAttribute("aria-hidden", guide.showAction ? "false" : "true");
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      setup();
    });
  }

  return {
    update,
    getCampaignGuide,
    missionStatusSummary
  };
});
