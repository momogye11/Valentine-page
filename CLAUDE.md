# CLAUDE.md

## Project overview

This repository contains a private, interactive invitation for Morgane. It is a static vanilla HTML/CSS/JavaScript experience with no build step or backend.

The page presents a conversational story from Mohamed, reveals a confirmed stay at Lamantin Beach from August 14 to August 16, 2026, and lets Morgane choose a genuine response. An acceptance opens the phone dialer; other answers open a prefilled SMS. She must still confirm the call or message herself.

## Core files

- `index.html` — semantic page shell, conversation containers, and the trip-card template.
- `style.css` — premium dark coastal visual system, responsive layout, animations, and reduced-motion support.
- `script.js` — configuration, branching conversation engine, automatic music, trip reveal, free-text response, and phone/SMS handoff.

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

Serve the directory through a local static server so audio and browser behavior match production:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Product constraints

- This is a static site. It cannot silently collect or transmit a response.
- The dialer or Messages app only opens after Morgane explicitly clicks the final button; the site cannot place a call or send an SMS silently.
- Do not include booking references, payment details, or other secrets in client-side files.
- Keep all final choices real and clickable. Do not make a refusal button flee or pressure the recipient.
- Keep the room arrangement truthful. The current copy says one room is booked and explicitly offers to arrange two if Morgane prefers.
- Music is attempted on page load and starts reliably on the first user gesture when browser autoplay policy blocks immediate sound.

## Accessibility and responsive behavior

- The document language is French and mobile zoom remains enabled.
- Interactive elements use native buttons and a textarea.
- Focus states are visible.
- `prefers-reduced-motion` disables decorative motion.
- The conversation scrolls independently and the reply area stays available above mobile safe areas.
