(function (root, factory) {
  const api = factory(root.HyruleRandomSeed);
  root.HyruleIncidents = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleRandomSeed) {
  const fallbackCards = [
    { id: "artifact-tamper", title: "Dark Artifact", description: "Artifact checksum mismatch detected." },
    { id: "shadow-merge", title: "Shadow Merge", description: "Unreviewed code entered main." },
    { id: "secret-curse", title: "Secret Curse", description: "Leaked credentials found." },
    { id: "dependency-blight", title: "Dependency Blight", description: "Critical dependency vulnerability found." }
  ];

  let cardsCache = null;

  async function loadCards() {
    if (cardsCache) {
      return cardsCache;
    }

    try {
      if (typeof fetch !== "function") {
        throw new Error("fetch_unavailable");
      }
      const response = await fetch("data/incidents/cards.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("cards_fetch_failed");
      }
      const parsed = await response.json();
      cardsCache = parsed.cards || fallbackCards;
      return cardsCache;
    } catch (_error) {
      cardsCache = fallbackCards;
      return cardsCache;
    }
  }

  function seededShuffle(items, seedText) {
    const list = items.slice();
    const seed = HyruleRandomSeed.hashString(seedText);
    const rng = HyruleRandomSeed.createRng(seed);

    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }

    return list;
  }

  function buildSeedText(dateText, mode) {
    return `${dateText}|${mode || "standard"}`;
  }

  async function getDailyChallenge(dateText, mode, count) {
    const cards = await loadCards();
    const takeCount = Math.max(1, Math.min(Number(count || 3), cards.length));
    const seedText = buildSeedText(dateText, mode);
    const shuffled = seededShuffle(cards, seedText);

    return {
      seed: seedText,
      cards: shuffled.slice(0, takeCount)
    };
  }

  return {
    getDailyChallenge,
    __test: {
      seededShuffle,
      buildSeedText
    }
  };
});
