(function (root, factory) {
  const api = factory(root.HyruleGameState);
  root.HyruleSiteNav = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState) {
  // Marks every nav link with where it stands in the campaign: restored, next quest, or
  // sealed. Links stay clickable; a sealed temple explains what opens it.

  const STATUS_TEXT = {
    done: "restored",
    next: "next quest",
    locked: "sealed",
    open: "open"
  };

  const BADGES = {
    done: "✓",
    next: "★",
    locked: "🔒",
    open: ""
  };

  function statusFor(state, key) {
    if (key === "map") {
      return null;
    }

    const done = key === "final"
      ? Boolean(state.rewards && state.rewards.finalVictoryAwarded)
      : Boolean(state[key]);
    if (done) {
      return "done";
    }

    if (!HyruleGameState.isTempleUnlocked(state, key)) {
      return "locked";
    }

    return HyruleGameState.nextDestination(state) === key ? "next" : "open";
  }

  function update(state) {
    if (typeof document === "undefined" || !state) {
      return;
    }

    document.querySelectorAll(".top-nav a[data-temple]").forEach((link) => {
      const key = link.getAttribute("data-temple");
      const status = statusFor(state, key);
      if (!status) {
        return;
      }

      if (!link.hasAttribute("data-label")) {
        link.setAttribute("data-label", link.textContent.trim());
      }
      const label = link.getAttribute("data-label");

      link.classList.remove("is-done", "is-next", "is-locked");
      if (status !== "open") {
        link.classList.add(`is-${status}`);
      }

      const badge = BADGES[status];
      link.innerHTML = "";
      link.append(document.createTextNode(label));
      if (badge) {
        const mark = document.createElement("span");
        mark.className = "nav-badge";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = badge;
        link.append(mark);
      }
      link.setAttribute("aria-label", `${label}, ${STATUS_TEXT[status]}`);
    });
  }

  return { update, statusFor };
});
