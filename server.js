const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 8080);
const root = __dirname;
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 8_000,
        ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined
    })
    : null;

const EVENT_TYPES = new Set([
    "conversation_started",
    "choice_selected",
    "trip_revealed",
    "text_submitted",
    "final_response",
    "contact_action"
]);
const OUTCOMES = new Set(["accepted", "needs_details", "thinking", "declined"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicFiles = new Map([
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/style.css", "style.css"],
    ["/script.js", "script.js"],
    ["/analytics.js", "analytics.js"],
    ["/media/music", "Guy2Bezbar - Je pense à toi (Paroles).mp3"]
]);

const rateBuckets = new Map();

function rateLimit(key, maximum, windowMs) {
    const now = Date.now();
    const current = rateBuckets.get(key);
    const bucket = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
    bucket.count += 1;
    rateBuckets.set(key, bucket);

    if (rateBuckets.size > 2_000) {
        for (const [bucketKey, value] of rateBuckets) {
            if (value.resetAt <= now || rateBuckets.size > 1_500) rateBuckets.delete(bucketKey);
        }
    }
    return bucket.count <= maximum;
}

function hash(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function secureEqual(left, right) {
    const leftBuffer = Buffer.from(String(left));
    const rightBuffer = Buffer.from(String(right));
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function cleanString(value, maximum = 160) {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return null;
    const cleaned = value.trim();
    return cleaned ? cleaned.slice(0, maximum) : null;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDakarDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Africa/Dakar",
        dateStyle: "medium",
        timeStyle: "medium"
    }).format(new Date(value));
}

function requireDatabase(_request, response, next) {
    if (pool) return next();
    response.status(503).json({ error: "tracking_unavailable" });
}

function requireSameOrigin(request, response, next) {
    const origin = request.get("origin");
    if (!origin) {
        return isProduction
            ? response.status(403).json({ error: "missing_origin" })
            : next();
    }

    try {
        if (new URL(origin).host === request.get("host")) return next();
    } catch {
        // The error response below is intentional.
    }

    return response.status(403).json({ error: "invalid_origin" });
}

function limitAdminAttempts(request, response, next) {
    if (rateLimit(`admin:${request.ip}`, 12, 15 * 60 * 1000)) return next();
    response.set("Retry-After", "900");
    return response.status(429).type("text").send("Trop de tentatives. Réessaie plus tard.");
}

function requireAdmin(request, response, next) {
    const configuredUser = process.env.ADMIN_USER;
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredUser || !configuredPassword) {
        return response.status(503).type("text").send("Admin access is not configured.");
    }

    const authorization = request.get("authorization") || "";
    if (authorization.startsWith("Basic ")) {
        try {
            const [user, ...passwordParts] = Buffer.from(authorization.slice(6), "base64")
                .toString("utf8")
                .split(":");
            const password = passwordParts.join(":");
            if (secureEqual(user, configuredUser) && secureEqual(password, configuredPassword)) {
                return next();
            }
        } catch {
            // Fall through to the authentication challenge.
        }
    }

    response.set("WWW-Authenticate", 'Basic realm="Suivi Morgane", charset="UTF-8"');
    return response.status(401).type("text").send("Authentification requise.");
}

function validateEvent(event) {
    if (!event || typeof event !== "object") return null;
    if (!UUID_PATTERN.test(event.id || "")) return null;
    if (!Number.isInteger(event.seq) || event.seq < 1 || event.seq > 200) return null;
    if (!EVENT_TYPES.has(event.type)) return null;

    const outcome = cleanString(event.outcome, 32);
    if (outcome && !OUTCOMES.has(outcome)) return null;

    const freeText = cleanString(event.freeText, 300);
    if (event.freeText && !freeText) return null;

    return {
        id: event.id,
        seq: event.seq,
        type: event.type,
        stepId: cleanString(event.stepId, 64),
        choiceId: cleanString(event.choiceId, 64),
        choiceLabel: cleanString(event.choiceLabel, 180),
        freeText,
        outcome,
        action: cleanString(event.action, 32)
    };
}

async function initializeDatabase() {
    if (!pool) {
        console.warn("DATABASE_URL is missing; response tracking is disabled.");
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS invitation_sessions (
            id UUID PRIMARY KEY,
            client_id UUID UNIQUE NOT NULL,
            token_hash TEXT NOT NULL,
            consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            outcome TEXT CHECK (outcome IN ('accepted', 'needs_details', 'thinking', 'declined'))
        );

        CREATE TABLE IF NOT EXISTS invitation_events (
            id UUID PRIMARY KEY,
            session_id UUID NOT NULL REFERENCES invitation_sessions(id) ON DELETE CASCADE,
            sequence INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            step_id TEXT,
            choice_id TEXT,
            choice_label TEXT,
            free_text VARCHAR(300),
            outcome TEXT,
            action TEXT,
            received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(session_id, sequence)
        );

        CREATE INDEX IF NOT EXISTS invitation_events_session_time_idx
            ON invitation_events(session_id, received_at);
        CREATE INDEX IF NOT EXISTS invitation_sessions_last_seen_idx
            ON invitation_sessions(last_seen_at DESC);
    `);
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((request, response, next) => {
    response.set({
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; media-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"
    });
    next();
});
app.use(express.json({ limit: "8kb", type: ["application/json", "text/plain"] }));

app.get("/health", async (_request, response) => {
    if (!pool) return response.status(503).json({ ok: false, database: false });
    try {
        await pool.query("SELECT 1");
        return response.json({ ok: true, database: true });
    } catch {
        return response.status(503).json({ ok: false, database: false });
    }
});

app.post("/api/sessions", requireSameOrigin, requireDatabase, async (request, response, next) => {
    try {
        if (request.body?.consent !== true || !UUID_PATTERN.test(request.body?.clientId || "")) {
            return response.status(400).json({ error: "invalid_session_request" });
        }
        if (!rateLimit(`session:${request.ip}`, 20, 60 * 60 * 1000)) {
            return response.status(429).json({ error: "rate_limited" });
        }

        const sessionId = crypto.randomUUID();
        const sessionToken = crypto.randomBytes(32).toString("base64url");
        const result = await pool.query(
            `INSERT INTO invitation_sessions (id, client_id, token_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (client_id) DO UPDATE
             SET token_hash = EXCLUDED.token_hash, last_seen_at = NOW()
             RETURNING id`,
            [sessionId, request.body.clientId, hash(sessionToken)]
        );

        response.set("Cache-Control", "no-store");
        return response.status(201).json({ sessionId: result.rows[0].id, sessionToken });
    } catch (error) {
        return next(error);
    }
});

app.post("/api/events", requireSameOrigin, requireDatabase, async (request, response, next) => {
    const { sessionId, sessionToken } = request.body || {};
    const rawEvents = request.body?.events;
    if (!UUID_PATTERN.test(sessionId || "") || typeof sessionToken !== "string") {
        return response.status(400).json({ error: "invalid_credentials" });
    }
    if (!Array.isArray(rawEvents) || rawEvents.length === 0 || rawEvents.length > 20) {
        return response.status(400).json({ error: "invalid_events" });
    }
    const events = rawEvents.map(validateEvent);
    if (events.some((event) => !event)) {
        return response.status(400).json({ error: "invalid_event" });
    }

    const client = await pool.connect();
    try {
        const sessionResult = await client.query(
            "SELECT token_hash FROM invitation_sessions WHERE id = $1",
            [sessionId]
        );
        if (!sessionResult.rowCount || !secureEqual(sessionResult.rows[0].token_hash, hash(sessionToken))) {
            return response.status(401).json({ error: "invalid_session" });
        }
        if (!rateLimit(`events:${sessionId}`, 120, 60 * 1000)) {
            return response.status(429).json({ error: "rate_limited" });
        }

        await client.query("BEGIN");
        let inserted = 0;
        let finalOutcome = null;
        for (const event of events) {
            const result = await client.query(
                `INSERT INTO invitation_events
                    (id, session_id, sequence, event_type, step_id, choice_id, choice_label, free_text, outcome, action)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT DO NOTHING`,
                [
                    event.id,
                    sessionId,
                    event.seq,
                    event.type,
                    event.stepId,
                    event.choiceId,
                    event.choiceLabel,
                    event.freeText,
                    event.outcome,
                    event.action
                ]
            );
            inserted += result.rowCount;
            if (event.type === "final_response" && event.outcome) finalOutcome = event.outcome;

            if (result.rowCount) {
                console.log(JSON.stringify({
                    log: "invitation_event",
                    eventId: event.id,
                    sessionId,
                    type: event.type
                }));
            }
        }

        await client.query(
            `UPDATE invitation_sessions
             SET last_seen_at = NOW(),
                 outcome = COALESCE($2, outcome),
                 completed_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE completed_at END
             WHERE id = $1`,
            [sessionId, finalOutcome]
        );
        await client.query("COMMIT");
        return response.status(202).json({ accepted: inserted });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        return next(error);
    } finally {
        client.release();
    }
});

app.get("/admin", limitAdminAttempts, requireAdmin, requireDatabase, async (_request, response, next) => {
    try {
        const sessionsResult = await pool.query(`
            SELECT s.*,
                COALESCE(JSON_AGG(e ORDER BY e.sequence) FILTER (WHERE e.id IS NOT NULL), '[]') AS events
            FROM invitation_sessions s
            LEFT JOIN invitation_events e ON e.session_id = s.id
            GROUP BY s.id
            ORDER BY s.last_seen_at DESC
            LIMIT 100
        `);

        const outcomeLabels = {
            accepted: "Partante 🎉",
            needs_details: "Demande des détails 👀",
            thinking: "Réfléchit 🤍",
            declined: "Ne peut pas venir"
        };
        const typeLabels = {
            conversation_started: "Conversation commencée",
            choice_selected: "Réponse choisie",
            trip_revealed: "Surprise découverte",
            text_submitted: "Message libre envoyé",
            final_response: "Réponse finale",
            contact_action: "Action de contact"
        };

        const sessionCards = sessionsResult.rows.map((session, index) => {
            const eventRows = session.events.map((event) => `
                <li>
                    <time>${escapeHtml(formatDakarDate(event.received_at))}</time>
                    <div>
                        <strong>${escapeHtml(typeLabels[event.event_type] || event.event_type)}</strong>
                        ${event.choice_label ? `<span>${escapeHtml(event.choice_label)}</span>` : ""}
                        ${event.free_text ? `<blockquote>${escapeHtml(event.free_text)}</blockquote>` : ""}
                        ${event.action ? `<span>Action : ${escapeHtml(event.action)}</span>` : ""}
                    </div>
                </li>
            `).join("");
            return `
                <details class="session" ${index === 0 ? "open" : ""}>
                    <summary>
                        <span class="session-number">Visite ${sessionsResult.rows.length - index}</span>
                        <strong>${escapeHtml(outcomeLabels[session.outcome] || "En cours…")}</strong>
                        <time>${escapeHtml(formatDakarDate(session.created_at))}</time>
                    </summary>
                    <ol>${eventRows || "<li>Aucune réponse enregistrée.</li>"}</ol>
                </details>
            `;
        }).join("");

        response.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" });
        return response.type("html").send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suivi Morgane</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#061719;color:#f6f0e5}*{box-sizing:border-box}
body{margin:0;padding:32px 18px;background:radial-gradient(circle at top,#123335,#061719 45%);min-height:100vh}
main{max-width:860px;margin:auto}header{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:28px}
h1{margin:0;font:600 clamp(36px,7vw,62px) Georgia,serif}header p{margin:6px 0 0;color:#aebdb9}.refresh{color:#061719;background:#e8d5b7;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700}
.empty,.session{display:block;margin:12px 0;border:1px solid #29484a;border-radius:18px;background:#0a2224;overflow:hidden}
summary{display:grid;grid-template-columns:1fr auto;gap:6px 18px;padding:18px;cursor:pointer}.session-number{color:#c7a97c;font-size:12px;letter-spacing:.08em;text-transform:uppercase}summary strong{grid-row:1/3;grid-column:2;align-self:center}summary time{color:#8fa39f;font-size:12px}
ol{list-style:none;margin:0;padding:4px 18px 18px;border-top:1px solid #29484a}li{display:grid;grid-template-columns:145px 1fr;gap:16px;padding:15px 0;border-bottom:1px solid #1c393b}li:last-child{border:0}li time{color:#829995;font-size:11px}li div{display:grid;gap:5px}li span{color:#e8d5b7}blockquote{margin:4px 0 0;padding:10px 12px;border-left:2px solid #df8064;background:#102c2e;border-radius:0 10px 10px 0}.privacy{margin-top:28px;color:#829995;font-size:11px}@media(max-width:560px){header{align-items:start}.refresh{font-size:0}.refresh::after{content:'↻';font-size:20px}summary{grid-template-columns:1fr}summary strong{grid-row:auto;grid-column:auto}li{grid-template-columns:1fr;gap:5px}}
</style></head><body><main><header><div><h1>Suivi Morgane</h1><p>${sessionsResult.rows.length} visite${sessionsResult.rows.length > 1 ? "s" : ""} enregistrée${sessionsResult.rows.length > 1 ? "s" : ""}</p></div><a class="refresh" href="/admin">Actualiser</a></header>
${sessionCards || '<p class="empty" style="padding:24px">Aucune réponse pour le moment.</p>'}
<p class="privacy">Heure de Dakar · Aucun suivi de localisation, appareil ou frappe en cours.</p></main></body></html>`);
    } catch (error) {
        return next(error);
    }
});

app.get("/favicon.ico", (_request, response) => response.status(204).end());

for (const [route, filename] of publicFiles) {
    app.get(route, (_request, response) => {
        if (filename.endsWith(".html")) {
            response.set("Cache-Control", "no-cache");
        } else if (filename.endsWith(".mp3")) {
            response.set("Cache-Control", "public, max-age=604800");
        }
        response.sendFile(path.join(root, filename));
    });
}

app.use((_request, response) => response.status(404).type("text").send("Not found"));
app.use((error, _request, response, _next) => {
    if (error?.type === "entity.parse.failed") {
        return response.status(400).json({ error: "invalid_json" });
    }
    console.error(error);
    return response.status(500).json({ error: "server_error" });
});

async function shutdown() {
    if (pool) await pool.end();
    process.exit(0);
}

async function startServer() {
    await initializeDatabase();
    return app.listen(port, "0.0.0.0", () => {
        console.log(`Invitation server listening on port ${port}${isProduction ? " in production" : ""}.`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error("Database initialization failed", error);
        process.exit(1);
    });
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}

module.exports = { app, cleanString, secureEqual, validateEvent };
