(function (root, factory) {
  const api = factory();
  root.HyruleTelemetrySession = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const SESSION_KEY = "hyruleTelemetrySession";
  let inMemorySession = null;

  function createSession() {
    return {
      sessionId: `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`,
      startedAt: new Date().toISOString(),
      sequence: 0
    };
  }

  function normalizeSession(value) {
    if (!value || typeof value !== "object") {
      return createSession();
    }

    const sessionId = value.sessionId || createSession().sessionId;
    const startedAt = value.startedAt || new Date().toISOString();
    const sequence = Number.isInteger(value.sequence) && value.sequence >= 0 ? value.sequence : 0;

    return { sessionId, startedAt, sequence };
  }

  function getStorage(customStorage) {
    if (customStorage) {
      return customStorage;
    }

    if (typeof sessionStorage !== "undefined") {
      return sessionStorage;
    }

    return null;
  }

  function getSession(customStorage) {
    const storage = getStorage(customStorage);
    if (!storage) {
      if (!inMemorySession) {
        inMemorySession = createSession();
      }
      return inMemorySession;
    }

    try {
      const raw = storage.getItem(SESSION_KEY);
      const parsed = raw ? JSON.parse(raw) : createSession();
      const normalized = normalizeSession(parsed);
      storage.setItem(SESSION_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (_error) {
      const fallback = createSession();
      storage.setItem(SESSION_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  function saveSession(session, customStorage) {
    const normalized = normalizeSession(session);
    const storage = getStorage(customStorage);

    if (!storage) {
      inMemorySession = normalized;
      return normalized;
    }

    storage.setItem(SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function nextSequence(customStorage) {
    const session = getSession(customStorage);
    const next = {
      ...session,
      sequence: session.sequence + 1
    };
    saveSession(next, customStorage);
    return next.sequence;
  }

  return {
    SESSION_KEY,
    createSession,
    getSession,
    saveSession,
    nextSequence
  };
});
