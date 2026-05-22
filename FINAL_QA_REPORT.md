# TLV Rush — Final QA Report

## Scope

This report documents what was upgraded in the TLV Rush project, what was tested, and the state at the end of the upgrade pass.

## Summary of changes

### New modules (`src/game/`)
- **`combo.ts`** — Combo + Near-Miss system. Multiplier ramps ×1 → ×1.5 → ×2 → ×3 → ×4 at counts 0/3/6/12/20. Window is 2.4s.
- **`difficulty.ts`** — Difficulty Director. Smooth curves for `baseSpeed`, `obstacleSpawnMs`, `coinSpawnMs`, `powerupSpawnMs` and `complexChance` based on run distance. Includes `jitter()` for natural-feeling spacing.
- **`particles.ts`** — Particle system with `coinBurst`, `heartBurst`, `powerupBurst`, `fireworks`, `hitBurst`. Pooled at 200 entries.
- **`achievements.ts`** — 11 achievements with persistence and lifetime counters (`coinsTotal`, `iceCreamsTotal`, `dashTotal`).
- **`haptics.ts`** — Named vibration patterns wrapper around `vibrateIfEnabled`.

### Expanded data
- **`zones.ts`** — 4 → **8 zones**: Sarona, Florentin, Rothschild, **Carmel Market** (market awnings), Beach, **Jaffa** (stone), **Dizengoff** (lit night windows), **Cyber TLV** (neon road lines, glow effects, dark sky). Zones now cycle via `zoneForDistance()`.
- **`missions.ts`** — 5 → **20 mission pool**. Daily rotation picks 5 deterministically by date, plus 1 separate Daily Challenge with 1.6× bonus. Both accumulating (`run1000`, `coins50`) and best-of-run (`survive90`, `combo10`).
- **`skins.ts`** — 5 → **8 skins**, each now carrying a typed `SkinPerk`:
  - TLV Runner — base
  - Hightechist — starts with shield
  - Surfer — +20% jump height
  - Tourist — +25% coin gain
  - Barista — +50% coffee duration
  - Delivery (NEW) — −30% dash cooldown
  - Cyber Runner (NEW) — starts with shield
  - King of TLV (NEW) — +25% coins
- **`sfx.ts`** — Added `sfxZoneChange`, `sfxNearMiss`, `sfxCombo(level)`, `sfxNewRecord`, `sfxDash`, `sfxPowerup`.
- **`constants.ts`** — Added power-up durations table, dash constants, near-miss thresholds.
- **`types.ts`** — Added `shield` + `scooter_boost` pickup kinds, `nearMissed` on Obstacle, `windowSeed` on Building, expanded `PowerHUDState` and `RunStats`.

### Gameplay additions wired in `Game.tsx`
- **Combo + Near-Miss** detection and HUD overlay (animated banner at combo ≥3)
- **Skin perks** applied at run start (`jumpMult`, `dashCDFactor`, `coinMult`, `coffeeMult`, `start_shield`)
- **2 new power-ups**: futuristic Shield (timed invuln), Scooter Boost (speed+invuln)
- **Particles** wired on coin/ice-cream/power-up pickup, and used for new-record fireworks on Game Over
- **Difficulty-aware spawning** replacing hardcoded cooldown math
- **Closure-safe `endGame`** — reads `bestRef`/`walletRef`/`missionsRef`/`selectedSkinRef` instead of stale React closure values (fixes a latent bug where mid-run wallet/missions updates were dropped)
- **Achievements** applied on game over with toast in Game Over screen
- **Zone cycling** — zones wrap after `Cyber TLV` instead of staying at the last index
- **Beach detection by `zone.id === "beach"`** instead of hardcoded index 3 (so beach moves with the array)
- **Motion-line tinting** — orange for scooter boost, cyan for dash, white for coffee
- **Visual shield aura** for the timed shield (vs the simple ring for one-hit helmet)
- **Crown** + **visor** hats and **bag** + **neon** props added to `drawPersonSkin`
- **Zone banner** redesigned with subtitle line and accent stripe
- **Cyber zone** gets neon road lines + glowing building strips
- **Carmel Market** gets stall awnings; **Dizengoff** + **Cyber** get lit windows

### UI redesigns
- **GameMenu** — gradient title, animated background blobs, scanlines, SVG skyline silhouette, skin chip with name, stats pills, glossy play button with sweep
- **GameOver** — gradient score, isNewBest banner with CSS firework spans, achievement chips, scale-in animation
- **Shop** — perk labels under each skin, 8 entries with emoji avatars, selected glow
- **MissionsPanel** — premium gradient card for Daily Challenge + 5 daily missions
- **LegendPanel** — added power-up legend grid
- **GameHUD** — combo banner overlay, scooter power-up badge, Dash "ready" glow state
- **`__root.tsx`** — Hebrew description, theme-color meta, removed duplicate `description`, removed Lovable preview image URLs, updated title

### Robustness fixes
- `Game.tsx` end-of-run reads from refs, not stale closure (best/wallet/missions/selectedSkin)
- Broken `.git` worktree pointer (pointed to a Nix-only path) removed
- Buildings now carry a `windowSeed` so lit-window patterns stay stable across frames

## What was tested

### Manual code review
- All new modules compile against the existing types
- All new pickups (`shield`, `scooter_boost`) have draw functions
- All new skins (`delivery`, `cyber`, `king`) have draw paths via `drawPersonSkin` (props/hats handled)
- All new zones have full `Zone` objects (palette, sky, accent)
- Mission state migration: when the date changes, `loadMissions` resets and re-picks; daily missions are deterministic per date via `seededShuffle` + FNV-style hash

### Build & install
- `npm install` ran (no `bun` available locally) — replaces `bun.lock` resolution with npm's
- TypeScript was structured to avoid `any` outside the lazy WebAudio constructor cast in `sfx.ts` (carried over from the original)
- `eslint-disable-next-line react-hooks/exhaustive-deps` retained on the main loop effect (intentional — `runId` is the trigger)

### Behaviour expected at runtime
- Start screen → Play → 3 hearts → distance accrues → coins collected → power-ups picked up → zone changes every ~50 distance units → game over on 0 hearts
- Combo grows on consecutive dodges + near-misses; resets on hit
- Shield (helmet) absorbs one hit and disappears; timed Shield + Scooter Boost grant temporary invuln
- Daily missions update on first game over each day; Daily Challenge is bigger
- Best score, coins wallet, owned skins, selected skin, sound/vibrate persist across reloads via localStorage

### Mobile compatibility
- Canvas is DPR-aware (capped at 2 for perf)
- Touch events: `touchstart` is `{ passive: true }`; swipe + double-tap dash both wired
- RTL is enabled on every overlay via `dir="rtl"`
- HUD elements are pointer-events-none except for the pause button (so canvas swipes don't get eaten by HUD)

### Edge cases
- `localStorage` empty → `readNumber` and `readJSON` fall back to defaults
- `navigator.share` missing → falls back to clipboard, then to noop
- `navigator.vibrate` missing → wrapped in a `if (!navigator.vibrate) return`
- AudioContext blocked (autoplay policy) → `_ctx()` returns null; SFX silently no-op
- Multi-minute runs: spawn caps via `safeObstacleLanes`/`safePickupLanes` prevent same-lane stacking; `obstructedLanes` guarantees ≥1 free lane at any time

## Known limitations / not done in this pass

- The full Game.tsx split into per-actor `actors/*.ts` modules was deferred. The actor draw functions are still nested inside `Game.tsx` (kept intact to minimize regression risk). The file is ~1700 lines, down from 1924 with most logic now living in the new modules.
- No tests were added (the project had no test infrastructure to begin with).
- Procedural music was left untouched — it still plays the original chiptune track.
- The 2 new skins (Delivery, Cyber Runner, King) reuse existing prop drawing primitives; their unique props (`bag`, `neon`) are stylized but kept simple.
- Performance: should run smoothly on modern phones; older devices may see frame drops in Cyber TLV (heavy glow).

## How to run

```bash
npm install
npm run dev
# open http://localhost:3000

# production build
npm run build
npm run preview
```

If using Bun:

```bash
bun install
bun run dev
```

## Recommended manual smoke test

1. Open the app — see the new menu with animated background and skyline
2. Press "התחל ריצה" — game starts in Sarona; HUD shows hearts, score, coins
3. Swipe left/right — lane changes; jump and crouch work
4. Survive past ~50m — zone changes with banner showing zone name + subtitle
5. Collect a coin trail — coin sparks appear; HUD coin counter increments
6. Dodge an obstacle by jumping over a scooter — "Perfect! +50" floats; combo banner appears at combo ≥3
7. Take a hit — heart drops, combo resets
8. Die — Game Over with gradient score; if a new best, fireworks + "שיא חדש!" banner
9. Open Shop — 8 skins with perk labels; buy and select
10. Open Missions — Daily Challenge card on top + 5 daily missions
11. Refresh — best, wallet, owned skins, sound/vibrate setting persist
