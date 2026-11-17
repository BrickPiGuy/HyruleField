(function (root, factory) {
  const api = factory(root.HyruleSound);
  root.HyruleSoundToggle = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleSound) {
  // The sound switch in the menu. Sound starts off. When it is on, the background bed for
  // the current page begins on the first click or key press, never before.

  function label(enabled) {
    return enabled ? "Sound: On" : "Sound: Off";
  }

  function mount() {
    if (typeof document === "undefined" || !HyruleSound || !HyruleSound.supported()) {
      return;
    }

    const nav = document.querySelector(".top-nav");
    if (!nav || document.getElementById("sound-toggle")) {
      return;
    }

    const theme = HyruleSound.themeForPage(document.body.getAttribute("data-page"));
    const button = document.createElement("button");
    button.type = "button";
    button.id = "sound-toggle";
    button.className = "secondary sound-toggle";

    const render = (enabled) => {
      button.textContent = `${enabled ? "🔊" : "🔇"} ${label(enabled)}`;
      button.setAttribute("aria-pressed", enabled ? "true" : "false");
      button.setAttribute("aria-label", `${label(enabled)}. Press to turn sound ${enabled ? "off" : "on"}.`);
    };

    render(HyruleSound.isEnabled());
    nav.appendChild(button);

    button.addEventListener("click", () => {
      const enabled = HyruleSound.toggle();
      if (enabled) {
        HyruleSound.startAmbient(theme);
        HyruleSound.play("select");
      }
    });

    HyruleSound.onChange(render);

    // Sound was left on last time: start the bed right away so it carries across pages. If the
    // browser holds the audio back, the first click or key press releases it.
    if (HyruleSound.isEnabled()) {
      HyruleSound.startAmbient(theme);
      const resume = () => {
        document.removeEventListener("pointerdown", resume, true);
        document.removeEventListener("keydown", resume, true);
        if (HyruleSound.isEnabled()) {
          HyruleSound.startAmbient(theme);
        }
      };
      document.addEventListener("pointerdown", resume, true);
      document.addEventListener("keydown", resume, true);
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", mount);
  }

  return { mount, label };
});
