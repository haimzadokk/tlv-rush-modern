# TLV Rush — Tel Aviv Endless Runner

A modern, mobile-first endless runner set in the streets of Tel Aviv. Dodge Wolt couriers, e-scooters, AC drips and matkot balls. Collect coins and ice creams. Build combos. Beat your best.

## Features

- **8 dynamic Tel Aviv zones** — Sarona, Florentin, Rothschild, Carmel Market, Beach, Jaffa, Dizengoff, and a futuristic neon "Cyber TLV Night"
- **3 lanes + jump + crouch + Dash** — full mobile gestures (swipe + double-tap)
- **Combo + Near-Miss + Multiplier** scoring system (×1 → ×4)
- **7 power-ups**: Coffee (×2 speed/score), Helmet, Futuristic Shield, Magnet (Rav-Kav), Sunglasses (×2 score), Scooter Boost, Ice Cream (heal)
- **8 skins with unique perks**: TLV Runner, Hightechist (start with shield), Surfer (higher jump), Tourist (+25% coins), Barista (longer coffee), Delivery (faster dash), Cyber Runner, King of TLV
- **Daily missions** — 5 rotating daily + 1 Daily Challenge (from a pool of 20+)
- **Achievements** with persistence
- **Difficulty Director** — speed and complexity scale smoothly with distance
- **Particles, motion lines, screen shake, futuristic glow, neon Cyber TLV mode**
- **Procedural sound + music** (Web Audio, no asset downloads) — sound + vibration toggle
- **RTL Hebrew UI** built for mobile

## Tech stack

- React 19 + TypeScript
- TanStack Start v1 + TanStack Router
- Vite 7
- Tailwind CSS v4 + shadcn/ui
- Cloudflare Workers (deploy target)
- Web Audio API (no audio assets)

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

If you prefer Bun:

```bash
bun install
bun run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── routes/                 file-based routes (TanStack Router)
│   ├── __root.tsx          shell + meta + error/404 pages
│   └── index.tsx           mounts <Game />
├── components/
│   ├── Game.tsx            game orchestrator — canvas loop, view switching
│   ├── GameHUD.tsx         hearts/score/coins/combo/zone/power-ups
│   ├── GameMenu.tsx        animated home screen (logo, stats, skin chip)
│   ├── GameOver.tsx        dramatic reveal with achievements + fireworks
│   ├── GamePause.tsx       pause overlay
│   ├── Shop.tsx            8 skins with perk labels
│   ├── MissionsPanel.tsx   daily 5 + Daily Challenge
│   ├── LegendPanel.tsx     dodge-color + power-up legend
│   ├── Tutorial.tsx        first-time onboarding
│   ├── SettingsToggles.tsx sound + vibration toggles
│   └── ui/                 shadcn/ui primitives
└── game/
    ├── types.ts            shared types (Obstacle, Pickup, RunStats, ...)
    ├── constants.ts        balance constants (spawn z, durations, behavior)
    ├── zones.ts            8 zone palettes + zoneForDistance()
    ├── skins.ts            8 skins with typed perks
    ├── missions.ts         pool of 20 missions + daily pick + challenge
    ├── titles.ts           survival titles by score
    ├── combo.ts            Combo + Near-Miss + multiplier
    ├── difficulty.ts       Difficulty Director (speed/spawn curve)
    ├── particles.ts        burst-style particle system
    ├── achievements.ts     11 achievements with persistence
    ├── haptics.ts          named vibration patterns
    ├── sfx.ts              Web Audio SFX (jump/duck/coin/combo/etc.)
    ├── music.ts            procedural chiptune music
    ├── settings.ts         sound + vibration toggles
    └── storage.ts          localStorage helpers (best, coins, skins, etc.)
```

## Controls

| Action       | Touch              | Keyboard          |
| ------------ | ------------------ | ----------------- |
| Change lane  | Swipe left / right | ← → or A / D      |
| Jump         | Swipe up           | ↑ / W / Space     |
| Crouch       | Swipe down         | ↓ / S             |
| Dash         | Double-tap         | Shift             |
| Pause        | ⏸ button           | Esc / P           |

## Scoring

- Distance + speed bonus accrue continuously
- Each coin: 5 + `coinMult` × (perk bonuses)
- Perfect Dodge: +50 × combo multiplier
- Near Miss: +25 × combo multiplier
- Sunglasses power-up: ×2 distance score
- Ice cream while at full hearts: +100
- Combo grows on consecutive dodges / near misses (×1.5 at 3, ×2 at 6, ×3 at 12, ×4 at 20)

## Persistence (localStorage)

- `tlv-runner-best` — best score
- `tlv-runner-coins` — wallet
- `tlv-runner-owned-skins` / `tlv-runner-selected-skin`
- `tlv-runner-missions` — daily state with rotation
- `tlv-runner-achievements` — unlocked + lifetime counters
- `tlv-runner-tutorial-done`, `-sound`, `-vibrate`

## Future ideas

- Online leaderboard
- Weekly events (e.g., "Florentin Friday")
- More obstacles per zone
- Boss runs (race against a Wolt courier swarm)
- Cloud save via Supabase / Cloudflare D1

## Credits

Game design + implementation: built on top of a Lovable starter. Upgraded into a modern mobile runner.
