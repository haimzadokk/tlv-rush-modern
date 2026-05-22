# TLV Rush — Final QA Report

This document covers the upgrades applied to TLV Rush across three consecutive passes (Modern Mobile Runner + Character Selection & Landmarks + Playtest-driven polish).

---

## Pass 3 — Playtest-driven polish

Triggered by live playtest feedback on the deployed game. Five fixes:

### 1. Grace period at run start
- Initial `spawnCooldown` bumped from 1.8s → **3s** so the player has time to orient before the first obstacle appears.

### 2. Daily Challenge no longer duplicates as a daily mission
- `pickDailyMissions(dateStr, exclude)` now accepts an exclude list.
- `freshState()` picks the challenge first, then picks the 5 daily missions from the remaining pool.
- The 5 daily missions and the 1 Daily Challenge are now always distinct.

### 3. Iconic landmarks much more visible
- Per-building landmark chance raised from 16% → **30%**.
- New `forceLandmarkNextBuilding` flag on `gameRef`. It's set:
  - At run start — the player's very first big building will be a landmark.
  - Every time a new zone is entered — every zone "introduces itself" with its signature landmark.
- The flag self-clears the moment a landmark actually spawns, so it only forces *one* landmark per trigger.

### 4. Hebrew labels on each landmark
- New `label` field on `LandmarkInfo` and per-frame Hebrew text rendered above the building on a translucent black plate with a cyan accent stroke. Visible only when `z > 0.28` so it doesn't clutter the distant skyline.
- Labels:
  - מגדלי עזריאלי (all three Azrieli towers share the label)
  - מגדל שלום
  - דיזנגוף סנטר
  - היכל הכדורסל מנורה
  - הקריה
  - מגדל השעון יפו
- Toast text upgraded to match the labels exactly ("עברת ליד מגדלי עזריאלי", "היכל הכדורסל מנורה באופק", etc.).

### 5. Menu music (synthwave-style)
- New `startMenuMusic()` / `stopMenuMusic()` in `game/music.ts`.
- Slower (86 BPM vs 124 BPM gameplay), moody chord progression (Am → G → F → E), sine bass + sawtooth pads + triangle arpeggio + soft hi-hat.
- Has its own `menuMasterGain` so it can fade out independently of the gameplay music.
- Game.tsx music effect now routes:
  - `view === "playing"` → gameplay track
  - `view === "menu" | "character"` → menu track
  - anything else → silence

### 6. Favicon
- Inline SVG data-URI favicon: indigo rounded square with gold `T` + small cyan dot. No extra HTTP request, no file in `public/`. Fixes the 404 spotted in the deployed console.

---

---

## Pass 2 — Character Selection, Iconic Landmarks, Polish

### New modules
- **`game/landmarks.ts`** — Iconic landmarks (Azrieli round/triangle/square, Migdal Shalom, Dizengoff Center, Menorah Hall, Kirya, Yafo Clock) with toast text and per-zone mapping.
- **`components/CharacterSelect.tsx`** — Pre-run character selection screen for 3 starter characters.

### Data
- **`skins.ts`** — New `blogger` skin (📱, more_coins perk, free). Added taglines and `prop: "phone"`. Exported `STARTER_CHARACTERS = ["hightechist", "blogger", "surfer"]` and a shared `skinEmoji(id)` helper. Hightechist `prop` changed from `coffee` to `bag` (cleaner archetype).
- **`storage.ts`** — Added `selectedCharacter` + `characterChosen` keys.
- **`types.ts`** — Added `LandmarkKind`, optional `landmark`/`announced` on Building, `"character"` view.

### Home screen
- Tagline **"רוץ. התחמק. שרוד את תל אביב."**
- Subtitle **"שליחים, קורקינטים, מזגנים וניאון — העיר שלא עוצרת מחכה לך."**
- **Animated Hero character** — bobbing idle of selected skin emoji with colored glow
- **Daily Hook card** — shows Daily Challenge label, progress bar, reward
- **Character card** — selected character emoji, name, perk; tap to open Character Select
- **3 bigger nav cards** — Shop / Missions / איך משחקים
- **Skyline SVG enhanced** with Azrieli-triplet silhouette hint

### Character Select screen (`view === "character"`)
- 3 starter cards with avatar, name, description, perk badge, italic tagline
- Cancel button visible only after the user has already chosen
- "יאללה לרוץ ▶" CTA at bottom with sweep effect
- Flow:
  - First time: Start → CharacterSelect → "יאללה לרוץ" → playing
  - Subsequent: Start → playing directly. Use "החלף ›" link on home to re-enter
- Persists to `selectedSkin`, `selectedCharacter`, and `characterChosen` flag in localStorage
- All 3 starters are merged into `ownedSkins` on initialization so the Shop never "locks" them

### In-game additions
- **Iconic landmarks** spawn occasionally (16% chance per building) and only in matching zones:
  - **Sarona**: Azrieli triplet, Kirya
  - **Florentin / Rothschild**: Migdal Shalom
  - **Carmel**: Menorah Hall
  - **Jaffa**: Yafo Clock
  - **Dizengoff**: Dizengoff Center
  - **Cyber TLV**: Azrieli, Kirya
- **Pass-by toast** — when a landmark passes z ≥ 0.55, a one-time float text fires (e.g., "עברת ליד עזריאלי", "דיזנגוף סנטר באופק")
- **Heartbeat warning** — red pulsing frame around the playfield when only 1 heart remains

### Tutorial overhaul
- 4 numbered visual steps with gradient badges per action (lane / jump / crouch / dash)
- Text reminder that the tutorial can be reopened via "איך משחקים"

### Game Over additions
- **Character strip** — emoji + name + perk + missions-progressed badge
- Existing dramatic reveal, achievements, fireworks remain

### Engineering
- `Game.tsx` flow now splits `handlePlayPressed` (decides whether to detour to character select) and `actuallyStartRun` (the real game start) — clean separation
- `applyRunStats` return value now captured to surface `newlyCompleted.length` to GameOver
- Game over closure-safe reads (best/wallet/missions/selectedSkin) maintained via refs

---

## Pass 1 — Modern Mobile Runner upgrade (recap)

### New modules
- `combo.ts` — Combo + Near-Miss + Multiplier (×1 → ×4)
- `difficulty.ts` — Difficulty Director (smooth speed/spawn curves)
- `particles.ts` — Particle system (coin sparks, heart burst, power-up rings, fireworks, hit debris)
- `achievements.ts` — 11 achievements with persistence + lifetime counters
- `haptics.ts` — Named vibration patterns

### Content expanded
- Zones 4 → **8** (added Carmel Market, Jaffa, Dizengoff, Cyber TLV Night with neon/glow)
- Skins 5 → **8** (added Delivery, Cyber Runner, King of TLV) — pass 2 added a 9th: Blogger
- Missions 5 → pool of **20**, with deterministic daily pick of 5 + a Daily Challenge (1.6× reward)
- Power-ups: 2 new — futuristic Shield (timed invuln aura), Scooter Boost (speed + invuln)
- Sound: zone change, near-miss, combo, new-record, dash, power-up

### Per-skin perks
- `start_shield`, `high_jump`, `more_coins`, `long_coffee`, `dash_cooldown`

### Polished UI
- Animated home menu with gradient logo + scanlines + skyline
- HUD with Combo banner, scooter badge, Dash-ready glow
- GameOver with new-record fireworks + achievement chips + scale-in
- Shop showing per-skin perk label
- Daily Challenge premium card in MissionsPanel

---

## What was tested

| Check | Result |
| --- | --- |
| `npm install` | ✅ 313 packages |
| `tsc --noEmit` | ✅ 0 errors |
| `vite build` (client + ssr) | ✅ builds in ~4s each |
| `eslint .` | ✅ 0 errors (6 warnings on stock shadcn UI files only) |

### Mobile / RTL
- Canvas DPR-aware (capped at 2)
- All overlays use `dir="rtl"`
- `touchstart` is `{ passive: true }` so the page can never block swipe
- HUD layout works on 360px-wide phones
- Character-select screen is scrollable but the 3 cards fit on a typical screen without scrolling
- Heartbeat warning uses inset border + box-shadow — never covers gameplay

### Edge cases
- `localStorage` empty → defaults flow correctly; `characterChosen` triggers Character Select on first run
- Existing users with only `tlv_runner` in ownedSkins → `STARTER_CHARACTERS` merged automatically on load
- `applyRunStats` returns `newlyCompleted` count → visible on GameOver
- Landmark spawning only triggers when the zone has matching landmarks; never errors on zones with empty list

### Known limitations
- The full Game.tsx split into separate `actors/*` modules was again deferred — keeping the giant draw routines inline avoids regression risk. Each landmark is its own ~30-line block inside `drawLandmark()`.
- Procedural music unchanged.
- Daily Hook card on home shows progress but only the Missions panel can claim — by design, so the home stays focused.

---

## How to run

```bash
npm install
npm run dev          # http://localhost:8080 (Vite default for this project)
npm run build        # production build → dist/
npm run preview
```

If you prefer Bun:

```bash
bun install
bun run dev
```

## How to deploy to Cloudflare Workers

The project is wired for Cloudflare Workers via `@cloudflare/vite-plugin` and `wrangler.jsonc` (`name: "tlv-rush-modern"`).

**Easiest path — Cloudflare dashboard, Git-driven (auto-deploy on push):**
1. Cloudflare dashboard → Workers & Pages → Create application → "Import a repository"
2. Connect GitHub, pick `tlv-rush-modern`
3. Build command: `npm run build`
4. Deploy command: `npx wrangler deploy`
5. Every `git push` to `main` triggers a new deploy automatically

**Manual deploy from CLI:**
```bash
npm install -g wrangler
wrangler login
cd C:\Users\haimz\tlv-rush-modern
npm run build
npx wrangler deploy
```

The deployed URL will be `https://tlv-rush-modern.<your-subdomain>.workers.dev`.

---

## Recommended smoke test after deploy

1. Open the URL — home shows new gradient logo + tagline + Hero character bob + Daily Hook
2. Tap **התחל ריצה** → Character Select appears (first time only)
3. Pick e.g. Hightechist → tap **יאללה לרוץ ▶** → game starts with shield active
4. Run past ~50m → enter Florentin — banner "פלורנטין"
5. Continue — when a landmark spawns, a toast like "עברת ליד עזריאלי" appears
6. Take 2 hits → 1 heart remaining → red heartbeat border kicks in
7. Die → Game Over shows your character + perk + missions progressed
8. From menu → tap the character card → Character Select with **← ביטול** available
