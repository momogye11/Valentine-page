# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive birthday webpage for Aisha with a playful twist: the "Pas encore !" (Not yet!) button actively avoids the user's cursor, while the "Oui, montre-moi !" (Yes, show me!) button triggers a birthday celebration with a surprise image. The project is built with vanilla HTML, CSS, and JavaScript (no build tools or frameworks).

## Architecture

### Core Files
- `index.html` - Main HTML structure with birthday question, buttons, and celebration image container
- `script.js` - All interactive behavior including:
  - Personalization constants at top (`personName` = "Aisha", `gifUrl`)
  - Audio player using HTML5 Audio API with mobile compatibility
  - "Pas encore !" button fleeing behavior (mousemove for desktop, touchstart for mobile)
  - Success state when "Oui, montre-moi !" is clicked
- `style.css` - Complete styling with purple/gold birthday theme, animations, and mobile responsive design

### Key Implementation Details

**Audio System** (script.js:19-82)
- Uses HTML5 `<audio>` element (currently with Ed Sheeran's "Perfect" - can be replaced with birthday song)
- Requires user interaction to start (browser autoplay policy)
- Starts at 20 seconds to skip intro
- Gold gradient activation button appears top-right and fades after click
- Mobile touch events handled separately from desktop clicks

**Button Fleeing Behavior** (script.js:84-183)
- Desktop: mousemove event triggers repositioning when cursor approaches within 120px threshold
- Mobile: touchstart event teleports button to random safe position in center zone
- Button becomes absolutely positioned relative to `.card` when fleeing starts
- Safety margins (120px) prevent button from escaping card boundaries
- If position calculation pushes near edges, button teleports to center zone (50% of card area)

**State Management**
- `isNoBtnActive` flag disables fleeing after "Yes" is clicked
- `audioStarted` flag prevents duplicate audio initialization
- CSS classes toggle visibility: `.hide`, `.show`, `.fleeing`

## Customization

To personalize this page, modify the constants at the top of `script.js`:
- `personName` - Name of the birthday person (currently "Aisha")
- `gifUrl` - Path to celebration image (currently "IMG_3151.jpg")

Replace these media files:
- `image.png` - Main image displayed on card (can be any birthday-related image)
- `IMG_3151.jpg` - Celebration image shown after clicking "Oui, montre-moi !"
- `ed-sheeran-perfect-official-music-video.mp3` - Background music (can be replaced with "Happy Birthday" song)

## Running the Project

This is a static website with no build step. Simply open `index.html` in a web browser:

```bash
# Using Python's built-in server
python3 -m http.server 8000

# Using Node's http-server (if installed)
npx http-server

# Or just open the file directly
open index.html
```

Note: Audio autoplay requires user interaction due to browser policies. Users must click the sound button.

## Color Scheme

The birthday theme uses:
- Background: Purple gradient (`#667eea` → `#764ba2` → `#f093fb`)
- Primary button (Yes): Gold gradient (`#FFD700` → `#FFA500`)
- Card: White with slight transparency
- Glow effects: Golden (`rgba(255, 215, 0, ...)`)

## Mobile Considerations

The project includes specific mobile optimizations:
- Touch event handlers with `preventDefault()` to avoid ghost clicks
- `passive: false` on sound button touchstart to ensure preventDefault works
- `-webkit-tap-highlight-color: transparent` to remove touch highlight
- Responsive design breakpoint at 600px
- Mobile "Pas encore !" button uses teleportation rather than cursor tracking (no hover state)
