# CLAUDE.md

## Project overview

This repository contains a private, interactive invitation for Morgane. It is a static vanilla HTML/CSS/JavaScript experience with no build step or backend.

The page presents a conversational story from Mohamed, reveals a confirmed stay at Lamantin Beach from August 14 to August 16, 2026, and lets Morgane choose a genuine response. The last action opens WhatsApp with her answer prefilled; she must still press Send herself.

## Core files

- `index.html` — semantic page shell, conversation containers, and the trip-card template.
- `style.css` — premium dark coastal visual system, responsive layout, animations, and reduced-motion support.
- `script.js` — configuration, branching conversation engine, music control, trip reveal, free-text response, and WhatsApp handoff.

## Personalization

Edit the `CONFIG` object at the beginning of `script.js`:

- `recipient` — invitation recipient.
- `sender` — invitation sender.
- `dates` — human-readable dates used in the outgoing message.
- `destination` — hotel name.
- `musicFile` — optional local soundtrack.
- `whatsappNumber` — sender's international number without `+`, spaces, or punctuation. If empty, WhatsApp opens and asks the recipient to choose a contact.

The visible date and destination details in `index.html` must be updated separately if the booking changes.

## Running locally

Serve the directory through a local static server so audio and browser behavior match production:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Product constraints

- This is a static site. It cannot silently collect or transmit a response.
- WhatsApp only receives a prefilled message after Morgane explicitly clicks the final button and then confirms Send in WhatsApp.
- Do not include booking references, payment details, or other secrets in client-side files.
- Keep all final choices real and clickable. Do not make a refusal button flee or pressure the recipient.
- Keep the room arrangement truthful. The current copy says one room is booked and explicitly offers to arrange two if Morgane prefers.

## Accessibility and responsive behavior

- The document language is French and mobile zoom remains enabled.
- Interactive elements use native buttons and a textarea.
- Focus states are visible.
- `prefers-reduced-motion` disables decorative motion.
- The conversation scrolls independently and the reply area stays available above mobile safe areas.
