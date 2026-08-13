# CLAUDE.md

## Project overview

This repository contains a private, interactive invitation for Morgane. The interface is vanilla HTML/CSS/JavaScript, served by a small Node/Express backend with PostgreSQL response logging.

The page presents a conversational story from Mohamed, reveals a confirmed stay at Lamantin Beach from August 14 to August 16, 2026, and lets Morgane choose a genuine response. An acceptance opens the phone dialer; other answers open a prefilled SMS. She must still confirm the call or message herself.

## Core files

- `index.html` — semantic page shell, conversation containers, and the trip-card template.
- `style.css` — premium dark coastal visual system, responsive layout, animations, and reduced-motion support.
- `script.js` — configuration, branching conversation engine, automatic music, trip reveal, free-text response, and phone/SMS handoff.
- `analytics.js` — consent-disclosed, best-effort delivery of validated choices; it never records typing in progress.
- `server.js` — static files, response API, PostgreSQL schema initialization, and the protected `/admin` timeline.
- `test/app.test.js` — backend validation, storage-failure resilience, and key content assertions.

## Personalization

Edit the `CONFIG` object at the beginning of `script.js`:

- `recipient` — invitation recipient.
- `sender` — invitation sender.
- `dates` — human-readable dates used in the outgoing message.
- `destination` — hotel name.
- `musicFile` — optional local soundtrack.
- `callNumber` — international number opened when Morgane accepts.
- `messageNumber` — number opened in the Messages app for every non-acceptance response.

The visible date and destination details in `index.html` must be updated separately if the booking changes.

## Running locally

Install dependencies and run the same Node server used in production:

```bash
npm install
npm start
```

Then open `http://localhost:8080`. Without `DATABASE_URL`, the invitation still works but response logging and `/admin` return 503.

Run the automated checks with `npm run check && npm test`.

## Product constraints

- Response logging starts only after Morgane clicks the disclosed entry button. It records validated choices, submitted free text, the final outcome, and clicks on call/SMS — never keystrokes, location, or device fingerprinting.
- Production requires `DATABASE_URL`, `ADMIN_USER`, and `ADMIN_PASSWORD` as server environment variables. Never commit their values.
- `/admin` is private and protected with HTTPS Basic Auth. Keep search-engine blocking and cache prevention enabled.
- The dialer or Messages app only opens after Morgane explicitly clicks the final button; the site cannot place a call or send an SMS silently.
- Do not include booking references, payment details, or other secrets in client-side files.
- Keep all final choices real and clickable. Do not make a refusal button flee or pressure the recipient.
- Keep the room arrangement truthful. The current booking and reveal both specify two rooms.
- Music is attempted on page load and starts reliably on the first user gesture when browser autoplay policy blocks immediate sound.

## Accessibility and responsive behavior

- The document language is French and mobile zoom remains enabled.
- Interactive elements use native buttons and a textarea.
- Focus states are visible.
- `prefers-reduced-motion` disables decorative motion.
- The conversation scrolls independently and the reply area stays available above mobile safe areas.
