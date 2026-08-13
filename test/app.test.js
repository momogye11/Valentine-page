const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const { cleanString, secureEqual, validateEvent } = require("../server");

test("the backend accepts a valid final response and rejects unsafe payloads", () => {
    const valid = validateEvent({
        id: "f65e95e1-cfd5-4934-ae87-7c5da86ed6b4",
        seq: 12,
        type: "final_response",
        stepId: "outcome",
        choiceId: "accepted",
        choiceLabel: "Oui, je viens 😭🤍",
        outcome: "accepted"
    });

    assert.equal(valid.outcome, "accepted");
    assert.equal(validateEvent({ ...valid, seq: 201 }), null);
    assert.equal(validateEvent({ ...valid, outcome: "maybe" }), null);
    assert.equal(validateEvent({ ...valid, type: "keystroke" }), null);
    assert.equal(validateEvent({ ...valid, freeText: "hidden text" }), null);
    assert.equal(validateEvent({ ...valid, freeText: null }).outcome, "accepted");
    assert.equal(validateEvent({ ...valid, type: "text_submitted" }), null);
    assert.equal(cleanString("  réponse  ", 20), "réponse");
    assert.equal(secureEqual("secret", "secret"), true);
    assert.equal(secureEqual("secret", "wrong"), false);
});

test("analytics stays best-effort when sessionStorage is blocked", async () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "analytics.js"), "utf8");
    const requests = [];
    const context = {
        Blob,
        console,
        Math,
        Promise,
        Uint8Array,
        queueMicrotask,
        sessionStorage: {
            getItem() { throw new Error("blocked"); },
            setItem() { throw new Error("blocked"); },
            removeItem() { throw new Error("blocked"); }
        },
        navigator: {},
        document: {
            visibilityState: "visible",
            addEventListener() {}
        },
        fetch: async (url, options) => {
            requests.push({ url, body: JSON.parse(options.body) });
            if (url === "/api/sessions") {
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({
                        sessionId: "60b12de4-b53d-4235-b27e-c6b4156a729a",
                        sessionToken: "temporary-test-token"
                    })
                };
            }
            return { ok: true, status: 202, json: async () => ({ accepted: 1 }) };
        }
    };
    context.window = {
        addEventListener() {}
    };
    vm.createContext(context);
    vm.runInContext(source, context);

    await context.window.valentineAnalytics.start();
    assert.doesNotThrow(() => context.window.valentineAnalytics.track("trip_revealed", { stepId: "trip" }));
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(requests[0].url, "/api/sessions");
    assert.equal(requests.some((request) => request.url === "/api/events"), true);
});

test("the short reveal line and card omit rooms while the detail game stays truthful", () => {
    const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

    assert.match(script, /Deux nuits… oui madame, j’ai vraiment pensé à tout/);
    assert.doesNotMatch(script, /Deux nuits, deux chambres… oui madame/);
    assert.doesNotMatch(html, /<span>CHAMBRES<\/span>/);
    assert.doesNotMatch(html, /Transparence : tes réponses validées/);
    assert.match(script, /Deux chambres, t’es sûr \? 😂/);
});

test("every in-page response is a playful predefined choice", () => {
    const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const analytics = fs.readFileSync(path.join(__dirname, "..", "analytics.js"), "utf8");

    assert.doesNotMatch(html, /<textarea|textReplyForm/);
    assert.doesNotMatch(script, /showTextReply|text_submitted|freeText/);
    assert.doesNotMatch(analytics, /freeText/);
    assert.doesNotMatch(script, /On y va comment \? 🚗/);
    assert.doesNotMatch(script, /id: "transport"/);
    assert.match(script, /Deux chambres, t’es sûr \? 😂/);
    assert.match(script, /La surprise me surprend trop 😂/);
    assert.match(script, /Bon… verdict provisoire \? 👀😂/);
});

test("JELANI tickets are visibly included in the surprise and detail game", () => {
    const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

    assert.match(html, /TICKETS INCLUS/);
    assert.match(html, /Fête JELANI/);
    assert.match(html, /DÉJÀ PRIS/);
    assert.match(script, /id: "party_tickets"/);
    assert.match(script, /JELANI aussi \? 🥳🎟️/);
    assert.match(script, /tickets JELANI sont déjà pris et inclus dans la surprise/);
});
