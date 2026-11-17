(function (root, factory) {
  const api = factory(root.HyruleArt);
  root.HyruleTempleArt = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleArt) {
  // Adds a themed banner above each temple's title so every temple feels like its own place.

  function mount() {
    if (typeof document === "undefined" || !HyruleArt) {
      return;
    }

    const page = document.body.getAttribute("data-page");
    if (!HyruleArt.SCENE_KEYS.includes(page) || document.querySelector(".temple-banner")) {
      return;
    }

    const anchor = document.querySelector(".top-nav") || document.querySelector("main h1");
    if (!anchor) {
      return;
    }

    const banner = document.createElement("div");
    banner.className = "temple-banner";
    banner.setAttribute("data-theme", page);
    banner.innerHTML = HyruleArt.scene(page);
    anchor.insertAdjacentElement(anchor.classList.contains("top-nav") ? "afterend" : "beforebegin", banner);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", mount);
  }

  return { mount };
});
