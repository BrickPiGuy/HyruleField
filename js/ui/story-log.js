(function (root, factory) {
  const api = factory();
  root.HyruleStoryLog = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  let listNode = null;

  function setup() {
    const shell = document.querySelector(".site-shell");
    if (!shell) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "story-log-panel";
    panel.innerHTML = "<p class=\"story-log-title\">Story Log</p><ul id=\"story-log-list\"></ul>";

    const rewardsPanel = document.querySelector(".rewards-panel");
    if (rewardsPanel) {
      rewardsPanel.insertAdjacentElement("afterend", panel);
    } else {
      const hudPanel = document.querySelector(".hud-panel");
      if (hudPanel) {
        hudPanel.insertAdjacentElement("afterend", panel);
      } else {
        shell.prepend(panel);
      }
    }

    listNode = panel.querySelector("#story-log-list");
  }

  function addEntry(entry) {
    if (!listNode || !entry) {
      return;
    }

    const item = document.createElement("li");
    item.className = "story-log-entry";
    item.innerHTML = `<strong>${entry.title}</strong><span>${entry.text}</span>`;
    listNode.prepend(item);

    while (listNode.children.length > 6) {
      listNode.removeChild(listNode.lastChild);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setup();
  });

  return {
    addEntry
  };
});
