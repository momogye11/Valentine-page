# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page animated invitation, built with vanilla HTML, CSS and JavaScript (no build tools, no
frameworks). The page plays a short cinematic sequence and ends on a question with two real answers.

The current version is addressed to **Morgane** and invites her to a restaurant.

## Non-negotiable design rules

These are deliberate product decisions, not oversights. Do not "fix" them:

1. **The page is never anonymous.** The sender's name (`senderName`) is shown on the intro screen,
   before any animation runs. The recipient always knows who sent the link from the first second.
2. **The "no" button is real.** It is the same size as the "yes" button, it never moves, never flees
   the cursor, and clicking it ends the page gracefully with no retry and no guilt-trip. Earlier
   versions of this project had a cursor-fleeing "no" button — it was removed on purpose.
3. **Nothing is unskippable.** Every timed screen has a visible "Passer →" button.

## Architecture

### Core files
- `index.html` — the five screens, in order: intro → transition → explosion → cinematic → choice
- `script.js` — the whole sequence, driven by adding/removing a `.show` / `.hide` class per screen
- `style.css` — purple/gold theme, animations, mobile-first responsive design

### Flow (script.js)
| Step | Function | Notes |
|---|---|---|
| Intro click | `introBtn` listener | Starts audio, launches the 5s countdown |
| Transition | `finishLoading()` | Skippable via `#skipLoadingBtn`; `loadingDone` guards double-fire |
| Explosion | `startExplosion()` → `createConfetti()` | Flash, name blow-up, confetti canvas |
| Cinematic | `startCinematicMessages()` → `showNextMessage()` | Typewriter effect over `cinematicMessages` |
| Choice | `showChoiceScreen()` → `revealAnswer()` | Both buttons call `revealAnswer()` and hide the buttons |

The `loadingDone` and `cinematicDone` flags exist so that clicking "Passer" while a timer is still
running cannot advance the sequence twice.

## Customization

Edit the constants at the top of `script.js`:
- `personName` — recipient's first name
- `senderName` — sender's name (kept visible; see rule 1 above)

Edit the copy in:
- `cinematicMessages` (script.js) — the typewriter lines
- `revealAnswer(...)` arguments in the `yesBtn` / `noBtn` listeners — the two endings
- `index.html` — intro text, `.choice-question`, `.choice-signature`

Media files:
- `music.mp3` — background track, volume 0.35, starts on intro click. Keep media filenames free of
  spaces and accents: they break audio loading once the site is hosted.
- `ed-sheeran-perfect-official-music-video.mp3`, `image.png`, `IMG_3151.jpg` — unused by the current
  version, kept in the repo as spares

Audio autoplay requires a user gesture, so playback is started from the intro button click. If the
browser still refuses, `startAudio()` fails silently and the page continues without sound.

## Running the project

Static site, no build step:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
# or
open index.html
```

## Color scheme

- Background: purple gradient (`#667eea` → `#764ba2` → `#f093fb`)
- Accent / "yes" button: gold gradient (`#FFD700` → `#FFA500`)
- "No" button: translucent white with a white border (equal visual weight, see rule 2)

## Mobile notes

- `-webkit-tap-highlight-color: transparent` removes the touch highlight
- `min-height: -webkit-fill-available` works around iOS Safari's white bars
- Breakpoints at 768px and 480px; below 480px the two choice buttons stack full-width at equal size
- `vibrate()` is a no-op on iOS (no `navigator.vibrate`), so a CSS `shake` animation backs it up
