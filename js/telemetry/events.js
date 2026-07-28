(function (root, factory) {
  const api = factory(root.HyruleTelemetrySession);
  root.HyruleTelemetry = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function (SessionApi) {
  const STORAGE_KEY = "hyruleTelemetryEvents";
  const MAX_EVENTS = 1000;

  function getStorage(customStorage) {
    if (customStorage) {
      return customStorage;
    }

    if (typeof localStorage !== "undefined") {
      return localStorage;
    }

    return null;
  }

  function readEvents(customStorage) {
    const storage = getStorage(customStorage);
    if (!storage) {
      return [];
    }

    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeEvents(events, customStorage) {
    const storage = getStorage(customStorage);
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  function getSessionApi() {
    if (SessionApi && typeof SessionApi.getSession === "function" && typeof SessionApi.nextSequence === "function") {
      return SessionApi;
    }

    if (typeof globalThis !== "undefined" && globalThis.HyruleTelemetrySession) {
      return globalThis.HyruleTelemetrySession;
    }

    return {
      getSession() {
        return {
          sessionId: "unknown",
          startedAt: new Date().toISOString(),
          sequence: 0
        };
      },
      nextSequence() {
        return 0;
      }
    };
  }

  function trackEvent(type, payload, options) {
    const details = payload && typeof payload === "object" ? payload : {};
    const opts = options || {};
    const storage = getStorage(opts.storage);
    const sessionApi = opts.sessionApi || getSessionApi();
    const session = sessionApi.getSession(opts.sessionStorage);
    const sequence = sessionApi.nextSequence(opts.sessionStorage);

    const event = {
      id: `${session.sessionId}:${sequence}`,
      type,
      sessionId: session.sessionId,
      sequence,
      timestamp: new Date().toISOString(),
      page: typeof document !== "undefined" ? document.body?.getAttribute("data-page") || null : null,
      path: typeof location !== "undefined" ? location.pathname : null,
      payload: details
    };

    if (!storage) {
      return event;
    }

    const events = readEvents(storage);
    events.push(event);
    const trimmed = events.slice(-MAX_EVENTS);
    writeEvents(trimmed, storage);
    return event;
  }

  function getEvents(customStorage) {
    return readEvents(customStorage);
  }

  function clearEvents(customStorage) {
    writeEvents([], customStorage);
  }

  function exportEvents(customStorage) {
    return JSON.stringify(readEvents(customStorage), null, 2);
  }

  return {
    STORAGE_KEY,
    MAX_EVENTS,
    trackEvent,
    getEvents,
    clearEvents,
    exportEvents
  };
});
