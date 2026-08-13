(function initializeInvitationAnalytics() {
    "use strict";

    const STORAGE_PREFIX = "morganeInvitation.";
    const CLIENT_KEY = `${STORAGE_PREFIX}clientId`;
    const SESSION_KEY = `${STORAGE_PREFIX}session`;
    const QUEUE_KEY = `${STORAGE_PREFIX}queue`;
    const SEQUENCE_KEY = `${STORAGE_PREFIX}sequence`;
    const STARTED_KEY = `${STORAGE_PREFIX}started`;
    const memoryStorage = new Map();
    let sessionPromise = null;
    let flushing = false;

    function storageGet(key) {
        try {
            return sessionStorage.getItem(key) ?? memoryStorage.get(key) ?? null;
        } catch {
            return memoryStorage.get(key) ?? null;
        }
    }

    function storageSet(key, value) {
        memoryStorage.set(key, String(value));
        try {
            sessionStorage.setItem(key, String(value));
        } catch {
            // The in-memory fallback keeps this page working in private browsers.
        }
    }

    function storageRemove(key) {
        memoryStorage.delete(key);
        try {
            sessionStorage.removeItem(key);
        } catch {
            // Nothing else to clear when browser storage is unavailable.
        }
    }

    function readJson(key, fallback) {
        try {
            return JSON.parse(storageGet(key)) ?? fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        storageSet(key, JSON.stringify(value));
    }

    function createId() {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

        const bytes = new Uint8Array(16);
        if (globalThis.crypto?.getRandomValues) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            for (let index = 0; index < bytes.length; index += 1) {
                bytes[index] = Math.floor(Math.random() * 256);
            }
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
        return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    }

    function getClientId() {
        let clientId = storageGet(CLIENT_KEY);
        if (!clientId) {
            clientId = createId();
            storageSet(CLIENT_KEY, clientId);
        }
        return clientId;
    }

    function nextSequence() {
        const previous = Number(storageGet(SEQUENCE_KEY) || "0");
        const sequence = Number.isSafeInteger(previous) && previous >= 0 ? previous + 1 : 1;
        storageSet(SEQUENCE_KEY, String(sequence));
        return sequence;
    }

    async function ensureSession() {
        const existing = readJson(SESSION_KEY, null);
        if (existing?.sessionId && existing?.sessionToken) return existing;
        if (sessionPromise) return sessionPromise;

        sessionPromise = fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: getClientId(), consent: true }),
            credentials: "same-origin"
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Session failed: ${response.status}`);
                const session = await response.json();
                writeJson(SESSION_KEY, session);
                return session;
            })
            .finally(() => {
                sessionPromise = null;
            });

        return sessionPromise;
    }

    function queueEvent(type, details = {}) {
        const event = {
            id: createId(),
            seq: nextSequence(),
            type,
            stepId: details.stepId || null,
            choiceId: details.choiceId || null,
            choiceLabel: details.choiceLabel || null,
            freeText: details.freeText || null,
            outcome: details.outcome || null,
            action: details.action || null
        };
        const storedQueue = readJson(QUEUE_KEY, []);
        const queue = Array.isArray(storedQueue) ? storedQueue : [];
        queue.push(event);
        writeJson(QUEUE_KEY, queue.slice(-50));
        return event;
    }

    async function flush() {
        if (flushing) return;
        const storedQueue = readJson(QUEUE_KEY, []);
        const queue = Array.isArray(storedQueue) ? storedQueue : [];
        if (!queue.length) return;

        flushing = true;
        try {
            const session = await ensureSession();
            const batch = queue.slice(0, 20);
            const response = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...session, events: batch }),
                credentials: "same-origin",
                keepalive: true
            });
            if (response.status === 401 || response.status === 403) {
                storageRemove(SESSION_KEY);
                await ensureSession();
                throw new Error("Session renewed; retry queued events");
            }
            if (response.status === 400) {
                const rejectedIds = new Set(batch.map((event) => event.id));
                const currentQueue = readJson(QUEUE_KEY, []);
                const remaining = Array.isArray(currentQueue)
                    ? currentQueue.filter((event) => !rejectedIds.has(event.id))
                    : [];
                writeJson(QUEUE_KEY, remaining);
                return;
            }
            if (!response.ok) throw new Error(`Event flush failed: ${response.status}`);

            const sentIds = new Set(batch.map((event) => event.id));
            const currentQueue = readJson(QUEUE_KEY, []);
            const remaining = Array.isArray(currentQueue)
                ? currentQueue.filter((event) => !sentIds.has(event.id))
                : [];
            writeJson(QUEUE_KEY, remaining);
            if (remaining.length) queueMicrotask(flush);
        } catch {
            // The queue is kept in this tab and retried on the next interaction.
        } finally {
            flushing = false;
        }
    }

    async function start() {
        if (storageGet(STARTED_KEY) !== "true") {
            storageSet(STARTED_KEY, "true");
            queueEvent("conversation_started", { stepId: "intro" });
        }
        await ensureSession();
        await flush();
    }

    function track(type, details) {
        queueEvent(type, details);
        void flush();
    }

    async function trackImmediate(type, details) {
        const event = queueEvent(type, details);
        let session = readJson(SESSION_KEY, null);
        try {
            if (!session) session = await ensureSession();
        } catch {
            return;
        }
        if (navigator.sendBeacon) {
            const payload = new Blob([
                JSON.stringify({ ...session, events: [event] })
            ], { type: "text/plain" });
            navigator.sendBeacon("/api/events", payload);
            void flush();
            return;
        }
        await flush();
    }

    window.addEventListener("online", () => void flush());
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") void flush();
    });

    window.valentineAnalytics = { start, track, trackImmediate };
})();
