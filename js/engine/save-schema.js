(function (root, factory) {
  const api = factory(root.HyruleGameState, root.HyruleMigrations);
  root.HyruleSave = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (HyruleGameState, HyruleMigrations) {
  const STORAGE_KEY = "devopsTriforceState";

  function getStorage(customStorage) {
    if (customStorage) {
      return customStorage;
    }

    if (typeof localStorage !== "undefined") {
      return localStorage;
    }

    return null;
  }

  function loadState(customStorage) {
    const storage = getStorage(customStorage);
    if (!storage) {
      return HyruleGameState.createDefaultState();
    }

    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      return HyruleMigrations.migrateState(parsed);
    } catch (_error) {
      return HyruleGameState.createDefaultState();
    }
  }

  function saveState(state, customStorage) {
    const storage = getStorage(customStorage);
    if (!storage) {
      return;
    }

    const normalized = HyruleMigrations.migrateState(state);
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  return {
    STORAGE_KEY,
    loadState,
    saveState
  };
});
