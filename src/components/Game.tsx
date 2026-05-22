import { useCallback, useEffect, useRef, useState } from "react";
import { Shop } from "./Shop";
import { MissionsPanel } from "./MissionsPanel";
import { GameHUD } from "./GameHUD";
import { GameMenu } from "./GameMenu";
import { GameOver } from "./GameOver";
import { GamePause } from "./GamePause";
import { Tutorial } from "./Tutorial";
import { LegendPanel } from "./LegendPanel";
import { CharacterSelect } from "./CharacterSelect";
import {
  readNumber,
  writeNumber,
  readJSON,
  writeJSON,
  readString,
  writeString,
  storageKeys,
} from "@/game/storage";
import {
  loadMissions,
  saveMissions,
  applyRunStats,
  claimReward,
  claimChallenge,
  type MissionsState,
  type MissionId,
} from "@/game/missions";
import {
  SKINS,
  getSkin,
  DEFAULT_SKIN,
  STARTER_CHARACTERS,
  type SkinId,
  type SkinDef,
} from "@/game/skins";
import { ZONES, zoneForDistance } from "@/game/zones";
import { LANDMARKS, pickLandmarkFor } from "@/game/landmarks";
import type { LandmarkKind } from "@/game/types";
import {
  sfxJumpDodge,
  sfxDuckDodge,
  sfxHit,
  sfxShield,
  sfxCoin,
  sfxGameOver,
  sfxZoneChange,
  sfxNearMiss,
  sfxCombo,
  sfxNewRecord,
  sfxDash,
  sfxPowerup,
} from "@/game/sfx";
import { startMusic, stopMusic } from "@/game/music";
import { haptics } from "@/game/haptics";
import {
  HEART_MAX,
  OBSTACLE_SPAWN_Z,
  PICKUP_SPAWN_Z,
  TRACK_VISUAL_START_Z,
  OBSTACLE_BEHAVIOR,
  OBSTACLE_MIN_LANE_GAP,
  PICKUP_OBSTACLE_MIN_GAP,
  HUD_UPDATE_INTERVAL_MS,
  NEAR_MISS_LANE_DIST,
  POWERUP_MS,
  DASH_DURATION_MS,
  DASH_COOLDOWN_MS,
  JUMP_INITIAL_V,
} from "@/game/constants";
import type {
  ObstacleKind,
  PickupKind,
  Obstacle,
  Pickup,
  Building,
  FloatText,
  Lane,
  PowerHUDState,
  RunStats,
  GameView,
} from "@/game/types";
import {
  newCombo,
  tickCombo,
  bumpCombo,
  breakCombo,
  scoreWithCombo,
  nearMissBonus,
  perfectDodgeBonus,
} from "@/game/combo";
import { difficultyFor, jitter } from "@/game/difficulty";
import { ParticleSystem } from "@/game/particles";
import {
  loadAchievements,
  saveAchievements,
  applyRunForAchievements,
  achievementById,
  type AchievementId,
} from "@/game/achievements";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [view, setView] = useState<GameView>("menu");
  const [runId, setRunId] = useState(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(
    () => readString(storageKeys.tutorialDone, "") !== "1",
  );
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(HEART_MAX);
  const [coinsHUD, setCoinsHUD] = useState(0);
  const [zoneName, setZoneName] = useState(ZONES[0].hebrew);
  const [comboDisplay, setComboDisplay] = useState<{
    count: number;
    multiplier: number;
    kind: string | null;
  }>({ count: 0, multiplier: 1, kind: null });
  const [powerHUD, setPowerHUD] = useState<PowerHUDState>({
    shield: false,
    coffee: 0,
    magnet: 0,
    shades: 0,
    scooter: 0,
    dashCD: 0,
  });

  const [best, setBest] = useState<number>(() => readNumber(storageKeys.best, 0));
  const [walletCoins, setWalletCoins] = useState<number>(() => readNumber(storageKeys.coins, 0));
  const [ownedSkins, setOwnedSkins] = useState<SkinId[]>(() => {
    const stored = readJSON<SkinId[]>(storageKeys.ownedSkins, [DEFAULT_SKIN]);
    return Array.from(new Set([...stored, DEFAULT_SKIN, ...STARTER_CHARACTERS]));
  });
  const [selectedSkin, setSelectedSkin] = useState<SkinId>(
    () => readString(storageKeys.selectedSkin, DEFAULT_SKIN) as SkinId,
  );
  const [characterChosen, setCharacterChosen] = useState<boolean>(
    () => readString(storageKeys.characterChosen, "") === "1",
  );
  const [missions, setMissions] = useState<MissionsState>(() => loadMissions());

  const [runStats, setRunStats] = useState<RunStats | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
  const [missionsProgressed, setMissionsProgressed] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [runCharacter, setRunCharacter] = useState<SkinId>(selectedSkin);

  const [shareCopied, setShareCopied] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // refs for closure-safe reads inside the game loop
  const bestRef = useRef(best);
  const walletRef = useRef(walletCoins);
  const missionsRef = useRef(missions);
  const selectedSkinRef = useRef(selectedSkin);
  useEffect(() => {
    bestRef.current = best;
  }, [best]);
  useEffect(() => {
    walletRef.current = walletCoins;
  }, [walletCoins]);
  useEffect(() => {
    missionsRef.current = missions;
  }, [missions]);
  useEffect(() => {
    selectedSkinRef.current = selectedSkin;
  }, [selectedSkin]);

  const viewRef = useRef<GameView>("menu");
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const setGameView = useCallback((next: GameView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const gameRef = useRef({
    lane: 1 as 0 | 1 | 2,
    targetLane: 1 as 0 | 1 | 2,
    laneShift: 0,
    jumpY: 0,
    jumpV: 0,
    jumpMult: 1,
    crouching: 0,
    dashT: 0,
    dashCD: 0,
    dashCDFactor: 1,
    obstacles: [] as Obstacle[],
    pickups: [] as Pickup[],
    buildings: [] as Building[],
    floats: [] as FloatText[],
    particles: new ParticleSystem(),
    combo: newCombo(),
    speed: 0.005,
    distance: 0,
    spawnCooldown: 0,
    coinCooldown: 0,
    powerupCooldown: 4000,
    buildingCooldown: 0,
    hearts: HEART_MAX,
    score: 0,
    coins: 0,
    coinMult: 1,
    coffeeMult: 1,
    invuln: 0,
    shield: false,
    shieldT: 0,
    coffeeT: 0,
    magnetT: 0,
    shadesT: 0,
    scooterT: 0,
    runCycle: 0,
    zoneIndex: 0,
    zonesVisitedSet: new Set<number>(),
    flash: 0,
    pickupFlash: 0,
    zoneBannerT: 0,
    zoneBannerName: "",
    zoneBannerSub: "",
    iceCreamsRun: 0,
    dodgedRun: 0,
    dashesRun: 0,
    nearMissRun: 0,
    powerupsRun: 0,
    hitsRun: 0,
    highestCombo: 0,
    beachMs: 0,
    unhitMs: 0,
    longestUnhitMs: 0,
    lastTap: 0,
    metersRun: 0,
    shakeT: 0,
    shakeStrength: 0,
    hudAccum: 0,
    dodgePulse: 0,
    dodgePulseMax: 400,
    dodgePulseKind: "jump" as "jump" | "duck" | "hit" | "shield",
  });

  // ─── Input ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const g = gameRef.current;
    const moveLane = (dir: -1 | 1) => {
      g.targetLane = Math.max(0, Math.min(2, g.targetLane + dir)) as 0 | 1 | 2;
    };
    const jump = () => {
      if (g.jumpY <= 0.001) {
        g.jumpV = JUMP_INITIAL_V * g.jumpMult;
      }
    };
    const crouch = () => {
      g.crouching = 600;
    };
    const dash = () => {
      if (g.dashCD <= 0 && g.dashT <= 0) {
        g.dashT = DASH_DURATION_MS;
        g.dashCD = DASH_COOLDOWN_MS * g.dashCDFactor;
        g.invuln = Math.max(g.invuln, 500);
        g.dashesRun += 1;
        sfxDash();
        haptics.dodge();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (viewRef.current !== "playing") {
        if (e.key === "Escape" && viewRef.current === "paused") setGameView("playing");
        return;
      }
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        setGameView("paused");
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a") moveLane(-1);
      else if (e.key === "ArrowRight" || e.key === "d") moveLane(1);
      else if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") jump();
      else if (e.key === "ArrowDown" || e.key === "s") crouch();
      else if (e.key === "Shift") dash();
    };
    window.addEventListener("keydown", onKey);

    const canvas = canvasRef.current;
    if (!canvas) return () => window.removeEventListener("keydown", onKey);
    let startX = 0,
      startY = 0,
      tracking = false;
    const onStart = (e: TouchEvent | MouseEvent) => {
      if (viewRef.current !== "playing") return;
      tracking = true;
      const p = "touches" in e ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
    };
    const onEnd = (e: TouchEvent | MouseEvent) => {
      if (!tracking || viewRef.current !== "playing") return;
      tracking = false;
      const p = "changedTouches" in e ? e.changedTouches[0] : (e as MouseEvent);
      const dx = p.clientX - startX;
      const dy = p.clientY - startY;
      const adx = Math.abs(dx),
        ady = Math.abs(dy);
      const SWIPE = 28;
      if (adx > SWIPE && adx > ady) {
        moveLane(dx > 0 ? 1 : -1);
      } else if (ady > SWIPE && ady > adx) {
        if (dy < 0) jump();
        else crouch();
      } else if (adx < 15 && ady < 15) {
        const now = performance.now();
        if (now - g.lastTap < 280) {
          dash();
          g.lastTap = 0;
        } else {
          g.lastTap = now;
        }
      }
    };
    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchend", onEnd);
    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mouseup", onEnd);
    return () => {
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mouseup", onEnd);
    };
  }, [view, setGameView]);

  // ─── Game Loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (runId <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const g = gameRef.current;
    g.obstacles = [];
    g.pickups = [];
    g.buildings = [];
    g.floats = [];
    g.particles.clear();
    g.combo = newCombo();
    g.hearts = HEART_MAX;
    g.score = 0;
    g.coins = 0;
    g.distance = 0;
    g.metersRun = 0;
    g.speed = 0.0022;
    g.lane = 1;
    g.targetLane = 1;
    g.laneShift = 0;
    g.jumpY = 0;
    g.jumpV = 0;
    g.crouching = 0;
    g.dashT = 0;
    g.dashCD = 0;
    g.invuln = 0;
    g.shield = false;
    g.shieldT = 0;
    g.coffeeT = 0;
    g.magnetT = 0;
    g.shadesT = 0;
    g.scooterT = 0;
    g.zoneIndex = 0;
    g.zonesVisitedSet = new Set([0]);
    g.zoneBannerT = 4200;
    g.zoneBannerName = ZONES[0].hebrew;
    g.zoneBannerSub = ZONES[0].subtitle;
    g.spawnCooldown = 1800;
    g.coinCooldown = 1500;
    g.powerupCooldown = 5000;
    g.buildingCooldown = 0;
    g.iceCreamsRun = 0;
    g.dodgedRun = 0;
    g.dashesRun = 0;
    g.nearMissRun = 0;
    g.powerupsRun = 0;
    g.hitsRun = 0;
    g.highestCombo = 0;
    g.beachMs = 0;
    g.unhitMs = 0;
    g.longestUnhitMs = 0;
    g.shakeT = 0;
    g.shakeStrength = 0;
    g.hudAccum = 0;

    // apply skin perks
    const skin = getSkin(selectedSkinRef.current);
    g.jumpMult = skin.perk.kind === "high_jump" ? skin.perk.multiplier : 1;
    g.dashCDFactor = skin.perk.kind === "dash_cooldown" ? skin.perk.multiplier : 1;
    g.coinMult = skin.perk.kind === "more_coins" ? skin.perk.multiplier : 1;
    g.coffeeMult = skin.perk.kind === "long_coffee" ? skin.perk.multiplier : 1;
    if (skin.perk.kind === "start_shield") g.shield = true;

    setHearts(HEART_MAX);
    setScore(0);
    setCoinsHUD(0);
    setZoneName(ZONES[0].hebrew);
    setComboDisplay({ count: 0, multiplier: 1, kind: null });
    setPowerHUD({ shield: g.shield, coffee: 0, magnet: 0, shades: 0, scooter: 0, dashCD: 0 });

    for (let i = 0; i < 8; i++) {
      g.buildings.push({
        side: i % 2 === 0 ? -1 : 1,
        z: i / 8,
        height: 0.35 + Math.random() * 0.45,
        width: 0.6 + Math.random() * 0.3,
        color: ZONES[0].buildingPalette[i % ZONES[0].buildingPalette.length],
        isAmPm: false,
        seed: Math.random(),
        windowSeed: Math.random(),
      });
    }

    const obstructedLanes = (): Set<Lane> => {
      const s = new Set<Lane>();
      for (const o of g.obstacles) {
        if (!o.passed && o.z > -0.4 && o.z < 0.9) s.add(o.lane);
      }
      return s;
    };
    const safeObstacleLanes = (): Lane[] => {
      const lanes: Lane[] = [0, 1, 2];
      return lanes.filter(
        (l) =>
          !g.obstacles.some((o) => o.lane === l && o.z < OBSTACLE_SPAWN_Z + OBSTACLE_MIN_LANE_GAP),
      );
    };
    const safePickupLanes = (): Lane[] => {
      const lanes: Lane[] = [0, 1, 2];
      return lanes.filter(
        (l) =>
          !g.obstacles.some(
            (o) => o.lane === l && Math.abs(o.z - PICKUP_SPAWN_Z) < PICKUP_OBSTACLE_MIN_GAP + 0.2,
          ),
      );
    };

    const spawn = () => {
      const zone = ZONES[g.zoneIndex];
      const all: ObstacleKind[] = [
        "wolt",
        "wolt",
        "street_person",
        "ac",
        "scooter",
        "car",
        "dog",
        "tourist",
        "trash",
      ];
      if (zone.id === "beach") all.push("matkot", "matkot");
      const safe = safeObstacleLanes();
      if (safe.length === 0) return;
      const blocked = obstructedLanes();
      const valid = safe.filter((l) => {
        const next = new Set(blocked);
        next.add(l);
        return next.size < 3;
      });
      const pool = valid.length > 0 ? valid : safe;
      const kind = all[Math.floor(Math.random() * all.length)];
      const lane = pool[Math.floor(Math.random() * pool.length)];
      g.obstacles.push({ kind, lane, z: OBSTACLE_SPAWN_Z, seed: Math.random() });
    };

    const spawnBuilding = (forceAmPm = false) => {
      const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
      const zone = ZONES[g.zoneIndex];
      const palette = zone.buildingPalette;
      const color = palette[Math.floor(Math.random() * palette.length)];
      // ~1 in 7 buildings becomes an iconic landmark, when the zone offers any.
      let landmark: LandmarkKind | undefined;
      if (!forceAmPm && Math.random() < 0.16) {
        landmark = pickLandmarkFor(zone.id) ?? undefined;
      }
      const info = landmark ? LANDMARKS[landmark] : null;
      g.buildings.push({
        side,
        z: 0,
        height: (0.35 + Math.random() * 0.45) * (info ? info.heightScale : 1),
        width: (0.55 + Math.random() * 0.35) * (info ? info.widthScale : 1),
        color,
        isAmPm: forceAmPm,
        seed: Math.random(),
        windowSeed: Math.random(),
        landmark,
      });
    };

    const spawnCoinTrail = () => {
      const safe = safePickupLanes();
      if (safe.length === 0) return;
      const lane = safe[Math.floor(Math.random() * safe.length)];
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        g.pickups.push({
          kind: "coin",
          lane,
          z: PICKUP_SPAWN_Z - i * 0.12,
          seed: Math.random(),
        });
      }
    };

    const spawnPowerup = () => {
      const kinds: PickupKind[] = [
        "coffee",
        "helmet",
        "ravkav",
        "sunglasses",
        "shield",
        "scooter_boost",
      ];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const safe = safePickupLanes();
      if (safe.length === 0) return;
      const lane = safe[Math.floor(Math.random() * safe.length)];
      g.pickups.push({ kind, lane, z: PICKUP_SPAWN_Z, seed: Math.random() });
    };

    const endGame = () => {
      cancelAnimationFrame(raf);
      stopMusic();
      sfxGameOver();
      haptics.gameOver();
      const finalScore = Math.floor(g.score);
      const finalMeters = Math.floor(g.metersRun);
      const finalIce = g.iceCreamsRun;
      const finalCoins = g.coins;
      const finalZones = g.zonesVisitedSet.size;

      setScore(finalScore);
      const prevBest = bestRef.current;
      const newBest = Math.max(finalScore, prevBest);
      const isRecord = finalScore > prevBest;
      setBest(newBest);
      bestRef.current = newBest;
      writeNumber(storageKeys.best, newBest);
      setIsNewBest(isRecord);
      if (isRecord) {
        sfxNewRecord();
        haptics.newRecord();
      }

      const newWallet = walletRef.current + finalCoins;
      setWalletCoins(newWallet);
      walletRef.current = newWallet;
      writeNumber(storageKeys.coins, newWallet);

      const { state: nextMissions, newlyCompleted } = applyRunStats(missionsRef.current, {
        meters: finalMeters,
        coins: finalCoins,
        iceCreams: finalIce,
        dodgedCouriers: g.dodgedRun,
        dashes: g.dashesRun,
        longestUnhitSeconds: g.longestUnhitMs / 1000,
        zonesVisited: finalZones,
        nearMisses: g.nearMissRun,
        highestCombo: g.highestCombo,
        beachSurvivedSeconds: g.beachMs / 1000,
        powerupsCollected: g.powerupsRun,
        hitsThisRun: g.hitsRun,
      });
      saveMissions(nextMissions);
      missionsRef.current = nextMissions;
      setMissions({ ...nextMissions });
      setMissionsProgressed(newlyCompleted.length);
      setRunCharacter(selectedSkinRef.current);

      const achState = loadAchievements();
      const { newlyUnlocked, state: nextAch } = applyRunForAchievements(achState, {
        coinsThisRun: finalCoins,
        iceCreamsThisRun: finalIce,
        dashesThisRun: g.dashesRun,
        highestCombo: g.highestCombo,
        nearMissesThisRun: g.nearMissRun,
        zonesVisited: finalZones,
        longestUnhitMs: g.longestUnhitMs,
        score: finalScore,
      });
      saveAchievements(nextAch);
      setNewAchievements(newlyUnlocked);

      setRunStats({
        meters: finalMeters,
        iceCreams: finalIce,
        coins: finalCoins,
        zonesVisited: finalZones,
        score: finalScore,
        highestCombo: g.highestCombo,
        nearMisses: g.nearMissRun,
        zoneId: ZONES[g.zoneIndex].id,
      });
      setShareCopied(false);
      setView("over");
    };

    const update = (dt: number) => {
      const diff = difficultyFor(g.distance);
      g.speed =
        diff.baseSpeed *
        (g.coffeeT > 0 ? 2 : 1) *
        (g.dashT > 0 ? 1.8 : 1) *
        (g.scooterT > 0 ? 1.45 : 1);
      g.distance += g.speed * dt;
      g.metersRun += g.speed * dt * 8;
      g.score += dt * 0.01 * (1 + g.speed * 30) * (g.shadesT > 0 ? 2 : 1) * g.combo.multiplier;
      g.runCycle += dt * 0.02 * (g.coffeeT > 0 ? 1.7 : 1) * (g.scooterT > 0 ? 1.4 : 1);

      if (g.invuln > 0) g.invuln -= dt;
      if (g.flash > 0) g.flash -= dt;
      if (g.pickupFlash > 0) g.pickupFlash -= dt;
      if (g.coffeeT > 0) g.coffeeT -= dt;
      if (g.magnetT > 0) g.magnetT -= dt;
      if (g.shadesT > 0) g.shadesT -= dt;
      if (g.scooterT > 0) g.scooterT -= dt;
      if (g.shieldT > 0) g.shieldT -= dt;
      if (g.dashT > 0) g.dashT -= dt;
      if (g.dashCD > 0) g.dashCD -= dt;
      if (g.crouching > 0) g.crouching -= dt;
      g.unhitMs += dt;
      if (g.unhitMs > g.longestUnhitMs) g.longestUnhitMs = g.unhitMs;

      tickCombo(g.combo, dt);

      // jump physics
      if (g.jumpY > 0 || g.jumpV > 0) {
        g.jumpY += g.jumpV * dt * 0.012;
        g.jumpV -= dt * 0.011;
        if (g.jumpY < 0) {
          g.jumpY = 0;
          g.jumpV = 0;
        }
      }

      for (const f of g.floats) {
        f.t -= dt;
        f.y -= dt * 0.05;
      }
      g.floats = g.floats.filter((f) => f.t > 0);

      // particles
      g.particles.update(dt);

      // zone transitions (cycling)
      const { index: newZone } = zoneForDistance(g.distance);
      if (newZone !== g.zoneIndex) {
        g.zoneIndex = newZone;
        g.zonesVisitedSet.add(newZone);
        const z = ZONES[newZone];
        setZoneName(z.hebrew);
        g.pickupFlash = 500;
        g.zoneBannerT = 4200;
        g.zoneBannerName = z.hebrew;
        g.zoneBannerSub = z.subtitle;
        sfxZoneChange();
        haptics.zone();
      }
      if (g.zoneBannerT > 0) g.zoneBannerT -= dt;
      if (ZONES[g.zoneIndex].id === "beach") g.beachMs += dt;

      // lane interpolation
      g.laneShift += (g.targetLane - (g.lane + g.laneShift)) * 0.25;
      if (Math.abs(g.laneShift) > 0.999 || Math.abs(g.targetLane - g.lane) < 0.01) {
        g.lane = g.targetLane;
        g.laneShift = 0;
      }

      // spawns (difficulty-aware)
      g.spawnCooldown -= dt;
      if (g.spawnCooldown <= 0) {
        spawn();
        g.spawnCooldown = jitter(diff.obstacleSpawnMs, 0.3);
      }
      g.coinCooldown -= dt;
      if (g.coinCooldown <= 0) {
        spawnCoinTrail();
        g.coinCooldown = jitter(diff.coinSpawnMs, 0.4);
      }
      g.powerupCooldown -= dt;
      if (g.powerupCooldown <= 0) {
        spawnPowerup();
        g.powerupCooldown = jitter(diff.powerupSpawnMs, 0.5);
      }
      g.buildingCooldown -= dt;
      if (g.buildingCooldown <= 0) {
        const ampm = Math.random() < 0.18;
        spawnBuilding(ampm);
        if (ampm) {
          const safe = safePickupLanes();
          if (safe.length > 0) {
            const lane = safe[Math.floor(Math.random() * safe.length)];
            g.pickups.push({ kind: "icecream", lane, z: PICKUP_SPAWN_Z, seed: Math.random() });
          }
        }
        g.buildingCooldown = 900 + Math.random() * 600;
      }

      const baseStep = g.speed * dt * 0.18;
      for (const o of g.obstacles) o.z += baseStep * (0.55 + o.z * 1.15);
      for (const p of g.pickups) p.z += baseStep * (0.55 + p.z * 1.15);
      for (const b of g.buildings) {
        b.z += g.speed * dt * 0.12 * (0.6 + b.z * 0.9);
        if (b.landmark && !b.announced && b.z >= 0.55) {
          b.announced = true;
          const info = LANDMARKS[b.landmark];
          g.floats.push({ x: 0, y: -40, text: info.toast, color: "#22d3ee", t: 1800 });
        }
      }

      // magnet pulls coins
      if (g.magnetT > 0) {
        const playerLane = g.lane + g.laneShift;
        for (const p of g.pickups) {
          if (p.kind !== "coin" || p.collected) continue;
          if (p.z > 0.4 && p.z < 1.05) {
            const cur = (p.lateralOffset ?? 0) + p.lane;
            const pull = (playerLane - cur) * 0.08;
            p.lateralOffset = (p.lateralOffset ?? 0) + pull;
          }
        }
      }

      const playerLane = g.lane + g.laneShift;

      // near-miss detection: obstacles still ahead but very close, in player lane
      for (const o of g.obstacles) {
        if (o.passed || o.nearMissed) continue;
        if (o.z > 0.78 && o.z < 0.92) {
          if (Math.abs(playerLane - o.lane) < NEAR_MISS_LANE_DIST) {
            const behavior = OBSTACLE_BEHAVIOR[o.kind];
            const above = behavior === "jump" && g.jumpY > 0.25;
            const below = behavior === "duck" && g.crouching > 0;
            if (above || below) {
              o.nearMissed = true;
              g.nearMissRun += 1;
              bumpCombo(g.combo, "near");
              if (g.combo.count > g.highestCombo) g.highestCombo = g.combo.count;
              const bonus = nearMissBonus() * g.combo.multiplier;
              g.score += bonus;
              g.floats.push({
                x: 0,
                y: 0,
                text: `Near Miss! +${Math.floor(bonus)}`,
                color: "#a3e635",
                t: 1200,
              });
              sfxNearMiss();
              haptics.combo();
            }
          }
        }
      }

      // collisions: obstacles
      for (const o of g.obstacles) {
        if (o.passed) continue;
        if (o.z > 0.92 && o.z < 1.05) {
          if (Math.abs(playerLane - o.lane) < 0.45) {
            const behavior = OBSTACLE_BEHAVIOR[o.kind];
            const dodgedByJump = behavior === "jump" && g.jumpY > 0.35;
            const dodgedByCrouch = behavior === "duck" && g.crouching > 0;
            if (dodgedByJump || dodgedByCrouch || g.dashT > 0) {
              o.passed = true;
              if (o.kind === "wolt" && !o.counted) {
                g.dodgedRun += 1;
                o.counted = true;
              }
              bumpCombo(g.combo, "perfect");
              if (g.combo.count > g.highestCombo) g.highestCombo = g.combo.count;
              const bonus = perfectDodgeBonus() * g.combo.multiplier;
              g.score += bonus;
              g.floats.push({
                x: 0,
                y: 0,
                text: `Perfect! +${Math.floor(bonus)}`,
                color: "#fbbf24",
                t: 1200,
              });
              g.dodgePulse = g.dodgePulseMax;
              g.dodgePulseKind = dodgedByJump ? "jump" : "duck";
              if (dodgedByJump) sfxJumpDodge();
              else if (dodgedByCrouch) sfxDuckDodge();
              haptics.dodge();
              if (g.combo.count >= 3 && g.combo.count % 3 === 0) sfxCombo(g.combo.count);
              continue;
            }
            // hit
            if (g.invuln > 0) continue;
            if (g.shieldT > 0) continue;
            o.passed = true;
            if (g.shield) {
              g.shield = false;
              g.invuln = 800;
              g.flash = 200;
              g.floats.push({ x: 0, y: 0, text: "🛡 ניצל!", color: "#22d3ee", t: 1600 });
              g.dodgePulse = g.dodgePulseMax;
              g.dodgePulseKind = "shield";
              sfxShield();
              haptics.pickup();
              continue;
            }
            g.hearts -= 1;
            g.hitsRun += 1;
            g.invuln = 1200;
            g.flash = 280;
            g.shakeT = 320;
            g.shakeStrength = 10;
            g.unhitMs = 0;
            breakCombo(g.combo);
            setHearts(g.hearts);
            g.dodgePulse = g.dodgePulseMax;
            g.dodgePulseKind = "hit";
            sfxHit();
            haptics.hit();
            if (g.hearts <= 0) {
              endGame();
              return;
            }
          }
        } else if (o.z > 1.05 && !o.counted) {
          if (o.kind === "wolt") {
            g.dodgedRun += 1;
            o.counted = true;
          }
        }
      }

      // collisions: pickups
      for (const p of g.pickups) {
        if (p.collected) continue;
        if (p.z > 0.88 && p.z < 1.05) {
          const effLane = p.lane + (p.lateralOffset ?? 0);
          if (Math.abs(playerLane - effLane) < 0.55) {
            p.collected = true;
            const screenX = canvas.clientWidth / 2;
            const screenY = canvas.clientHeight * 0.78;
            switch (p.kind) {
              case "coin": {
                const gained = Math.round(1 * g.coinMult);
                g.coins += gained;
                g.score += scoreWithCombo(5, g.combo);
                setCoinsHUD(g.coins);
                g.floats.push({ x: 0, y: 0, text: `+${gained}🪙`, color: "#fbbf24", t: 1400 });
                g.particles.coinBurst(screenX, screenY);
                sfxCoin();
                haptics.coin();
                break;
              }
              case "icecream":
                g.iceCreamsRun += 1;
                if (g.hearts < HEART_MAX) {
                  g.hearts += 1;
                  setHearts(g.hearts);
                  g.floats.push({ x: 0, y: 0, text: "+❤", color: "#ef4444", t: 1600 });
                } else {
                  g.score += 100;
                  g.floats.push({ x: 0, y: 0, text: "+100 גלידה!", color: "#ef4444", t: 1600 });
                }
                g.pickupFlash = 400;
                g.particles.heartBurst(screenX, screenY);
                haptics.heart();
                break;
              case "coffee":
                g.coffeeT = POWERUP_MS.coffee * g.coffeeMult;
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "☕ x2 מהירות!", color: "#a3e635", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#a3e635");
                sfxPowerup();
                haptics.pickup();
                break;
              case "helmet":
                g.shield = true;
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "🪖 מגן!", color: "#22d3ee", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#22d3ee");
                sfxPowerup();
                haptics.pickup();
                break;
              case "shield":
                g.shieldT = 6000;
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "🛡 Shield עתידני!", color: "#7dd3fc", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#7dd3fc");
                sfxShield();
                haptics.pickup();
                break;
              case "ravkav":
                g.magnetT = POWERUP_MS.magnet;
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "🚌 רב-קו!", color: "#60a5fa", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#60a5fa");
                sfxPowerup();
                haptics.pickup();
                break;
              case "sunglasses":
                g.shadesT = POWERUP_MS.shades;
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "😎 x2 ניקוד!", color: "#fde047", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#fde047");
                sfxPowerup();
                haptics.pickup();
                break;
              case "scooter_boost":
                g.scooterT = POWERUP_MS.scooter;
                g.invuln = Math.max(g.invuln, POWERUP_MS.scooter);
                g.powerupsRun += 1;
                g.floats.push({ x: 0, y: 0, text: "🛴 Boost!", color: "#fb923c", t: 1600 });
                g.particles.powerupBurst(screenX, screenY, "#fb923c");
                sfxDash();
                haptics.pickup();
                break;
            }
            g.pickupFlash = Math.max(g.pickupFlash, 250);
          }
        }
      }

      g.obstacles = g.obstacles.filter((o) => o.z < 1.2);
      g.pickups = g.pickups.filter((p) => p.z < 1.2 && !p.collected);
      g.buildings = g.buildings.filter((b) => b.z < 1.15);

      if (g.shakeT > 0) g.shakeT -= dt;
      if (g.dodgePulse > 0) g.dodgePulse -= dt;

      g.hudAccum += dt;
      if (g.hudAccum >= HUD_UPDATE_INTERVAL_MS) {
        g.hudAccum = 0;
        setScore(Math.floor(g.score));
        setComboDisplay({
          count: g.combo.count,
          multiplier: g.combo.multiplier,
          kind: g.combo.lastKind,
        });
        setPowerHUD({
          shield: g.shield || g.shieldT > 0,
          coffee: Math.max(0, Math.ceil(g.coffeeT / 1000)),
          magnet: Math.max(0, Math.ceil(g.magnetT / 1000)),
          shades: Math.max(0, Math.ceil(g.shadesT / 1000)),
          scooter: Math.max(0, Math.ceil(g.scooterT / 1000)),
          dashCD: Math.max(0, Math.ceil(g.dashCD / 1000)),
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const zone = ZONES[g.zoneIndex];
      const horizonY = h * 0.42;
      const roadBottomW = w * 1.4;
      const roadTopW = w * 0.18;

      let shakeDX = 0;
      let shakeDY = 0;
      if (g.shakeT > 0) {
        const k = Math.max(0, g.shakeT / 320) * g.shakeStrength;
        shakeDX = Math.sin(g.runCycle * 47) * k;
        shakeDY = Math.cos(g.runCycle * 53) * k;
      }
      ctx.save();
      ctx.translate(shakeDX, shakeDY);

      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      sky.addColorStop(0, zone.sky[0]);
      sky.addColorStop(1, zone.sky[1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // sun (or neon glow for cyber)
      if (zone.effect === "cyber") {
        const cyberGrad = ctx.createRadialGradient(
          w * 0.5,
          h * 0.35,
          0,
          w * 0.5,
          h * 0.35,
          w * 0.45,
        );
        cyberGrad.addColorStop(0, "rgba(124,58,237,0.45)");
        cyberGrad.addColorStop(0.5, "rgba(34,211,238,0.18)");
        cyberGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cyberGrad;
        ctx.fillRect(0, 0, w, h * 0.7);
      } else {
        const sunGrad = ctx.createRadialGradient(
          w * 0.72,
          h * 0.22,
          0,
          w * 0.72,
          h * 0.22,
          w * 0.18,
        );
        sunGrad.addColorStop(0, "rgba(255,240,200,0.95)");
        sunGrad.addColorStop(1, "rgba(255,240,200,0)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, w, h * 0.5);
      }

      // distant skyline
      const skylineDark =
        zone.effect === "night" || zone.effect === "cyber"
          ? 0.75
          : zone.id === "rothschild"
            ? 0.55
            : 0.25;
      ctx.fillStyle = `rgba(0,0,0,${skylineDark})`;
      const sky2 = h * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, sky2);
      for (let x = 0; x <= w; x += 18) {
        const hh = 30 + Math.abs(Math.sin(x * 0.013 + g.distance * 0.05)) * 60;
        ctx.lineTo(x, sky2 - hh);
        ctx.lineTo(x + 9, sky2 - hh + (Math.sin(x) > 0 ? 10 : -10));
      }
      ctx.lineTo(w, sky2);
      ctx.closePath();
      ctx.fill();

      // ground
      const ground = ctx.createLinearGradient(0, horizonY, 0, h);
      ground.addColorStop(0, zone.effect === "cyber" ? "#0a0a1a" : "#3b3a3a");
      ground.addColorStop(1, zone.effect === "cyber" ? "#000010" : "#1a1a1c");
      ctx.fillStyle = ground;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // sidewalks
      ctx.fillStyle = zone.effect === "cyber" ? "#1a1a3a" : "#6b6b70";
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo((w - roadBottomW) / 2, h);
      ctx.lineTo((w - roadTopW) / 2, horizonY);
      ctx.lineTo(0, horizonY);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, h);
      ctx.lineTo((w + roadBottomW) / 2, h);
      ctx.lineTo((w + roadTopW) / 2, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.closePath();
      ctx.fill();

      // road
      ctx.beginPath();
      ctx.moveTo((w - roadBottomW) / 2, h);
      ctx.lineTo((w + roadBottomW) / 2, h);
      ctx.lineTo((w + roadTopW) / 2, horizonY);
      ctx.lineTo((w - roadTopW) / 2, horizonY);
      ctx.closePath();
      ctx.fillStyle = zone.road;
      ctx.fill();

      // lane dashes (neon for cyber)
      ctx.strokeStyle = zone.roadLine;
      if (zone.neon) {
        ctx.shadowColor = zone.roadLine;
        ctx.shadowBlur = 12;
      }
      const dashes = 14;
      const offset = (g.distance * 30) % 1;
      for (let lane = 1; lane <= 2; lane++) {
        for (let i = 0; i < dashes; i++) {
          const t1 = (i + offset) / dashes;
          const t2 = (i + 0.5 + offset) / dashes;
          if (t1 > 1 || t2 > 1) continue;
          const p1 = roadPoint(lane / 3, t1);
          const p2 = roadPoint(lane / 3, t2);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineWidth = 2 + t1 * 4;
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;

      const sortedB = [...g.buildings].sort((a, b) => a.z - b.z);
      for (const b of sortedB) drawBuilding(b);

      type Drawable = { z: number; fn: () => void };
      const drawables: Drawable[] = [];
      for (const o of g.obstacles) drawables.push({ z: o.z, fn: () => drawObstacle(o) });
      for (const p of g.pickups) drawables.push({ z: p.z, fn: () => drawPickup(p) });
      drawables.push({ z: 0.97, fn: () => drawPlayer() });
      drawables.sort((a, b) => a.z - b.z);
      for (const d of drawables) d.fn();

      // motion lines on speed boost / dash / scooter
      if (g.coffeeT > 0 || g.dashT > 0 || g.scooterT > 0) {
        const tint =
          g.scooterT > 0
            ? "rgba(251,146,60,0.65)"
            : g.dashT > 0
              ? "rgba(34,211,238,0.6)"
              : "rgba(255,255,255,0.55)";
        ctx.strokeStyle = tint;
        ctx.lineWidth = 2;
        const count = g.scooterT > 0 || g.dashT > 0 ? 18 : 12;
        for (let i = 0; i < count; i++) {
          const yy = (Math.sin(i * 13 + g.runCycle) * 0.5 + 0.5) * h;
          const len = 40 + (Math.sin(i * 7.1 + g.runCycle * 2.3) * 0.5 + 0.5) * 80;
          const xx = ((g.distance * 250 + i * 90) % (w + 200)) - 100;
          ctx.beginPath();
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx + len, yy);
          ctx.stroke();
        }
      }

      // particles on top of world, under HUD
      g.particles.draw(ctx);

      // floats
      for (const f of g.floats) {
        const alpha = Math.min(1, f.t / 600);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.font = `bold ${Math.floor(w * 0.05)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        const baseY = h * 0.55 + f.y;
        ctx.fillText(f.text, w / 2, baseY);
        ctx.globalAlpha = 1;
      }

      if (g.flash > 0) {
        ctx.fillStyle = `rgba(255,40,40,${g.flash / 600})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (g.pickupFlash > 0) {
        ctx.fillStyle = `rgba(255,220,120,${g.pickupFlash / 1200})`;
        ctx.fillRect(0, 0, w, h);
      }

      // zone banner with subtitle
      if (g.zoneBannerT > 0) {
        const total = 4200;
        const fadeIn = 350;
        const fadeOut = 700;
        const tElapsed = total - g.zoneBannerT;
        let a = 1;
        if (tElapsed < fadeIn) a = tElapsed / fadeIn;
        else if (g.zoneBannerT < fadeOut) a = g.zoneBannerT / fadeOut;
        a = Math.max(0, Math.min(1, a));
        const cx = w / 2;
        const cy = h * 0.28;
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`;
        const bw = Math.min(w * 0.86, 540);
        const bh = Math.floor(w * 0.22);
        roundRect(ctx, cx - bw / 2, cy - bh * 0.55, bw, bh, 16);
        ctx.fill();
        // accent line
        ctx.fillStyle = `rgba(${zone.accent === "#22d3ee" ? "34,211,238" : "251,191,36"},${a})`;
        ctx.fillRect(cx - bw / 2 + 12, cy - bh * 0.55, 4, bh);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.font = `bold ${Math.floor(w * 0.085)}px system-ui, sans-serif`;
        ctx.fillText(g.zoneBannerName, cx, cy);
        ctx.fillStyle = `rgba(253,224,71,${0.85 * a})`;
        ctx.font = `${Math.floor(w * 0.035)}px system-ui, sans-serif`;
        ctx.fillText(g.zoneBannerSub, cx, cy + Math.floor(w * 0.055));
        ctx.restore();
      }

      function roadPoint(laneFrac: number, t: number) {
        t = Math.max(TRACK_VISUAL_START_Z, t);
        const y = horizonY + (h - horizonY) * t;
        const widthAtT = roadTopW + (roadBottomW - roadTopW) * t;
        const leftX = w / 2 - widthAtT / 2;
        return { x: leftX + widthAtT * laneFrac, y };
      }
      function laneCenter(lane: number, t: number) {
        return roadPoint((lane + 0.5) / 3, t);
      }

      function drawBuilding(b: Building) {
        const t = b.z;
        if (t < 0.02) return;
        const horizonX = w / 2 + b.side * (roadTopW / 2);
        const groundX = w / 2 + b.side * (roadBottomW / 2);
        const x = horizonX + (groundX - horizonX) * t;
        const buildingH = b.height * h * 0.9 * (0.2 + t * 1.2);
        const buildingW = b.width * w * 0.5 * (0.2 + t * 1.1);
        const buildingTop = horizonY - buildingH * 0.4 + (h - horizonY) * t - buildingH;
        const left = b.side === -1 ? x - buildingW : x;
        const top = buildingTop;
        if (b.landmark) {
          drawLandmark(b, left, top, buildingW, buildingH);
          return;
        }
        ctx.fillStyle = b.color;
        ctx.fillRect(left, top, buildingW, buildingH + 100);
        const shade = ctx.createLinearGradient(left, 0, left + buildingW, 0);
        shade.addColorStop(0, b.side === -1 ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0)");
        shade.addColorStop(1, b.side === -1 ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.25)");
        ctx.fillStyle = shade;
        ctx.fillRect(left, top, buildingW, buildingH + 100);
        if (b.isAmPm) {
          ctx.fillStyle = "#0b1d4f";
          ctx.fillRect(left, top + buildingH * 0.55, buildingW, buildingH * 0.18);
          ctx.fillStyle = "#ffd23f";
          ctx.font = `bold ${Math.max(10, buildingW * 0.18)}px system-ui`;
          ctx.textAlign = "center";
          ctx.fillText("AM:PM", left + buildingW / 2, top + buildingH * 0.68);
          ctx.fillStyle = "rgba(255,230,150,0.55)";
          ctx.fillRect(
            left + buildingW * 0.08,
            top + buildingH * 0.78,
            buildingW * 0.84,
            buildingH * 0.18,
          );
        } else if (zone.effect === "graffiti" && t > 0.4) {
          const colors = ["#ffd23f", "#ff5fa2", "#3a7ca5", "#7fb069"];
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[(i + Math.floor(b.seed * 4)) % colors.length];
            const gx = left + ((b.seed * 31 + i * 17) % buildingW);
            const gy = top + buildingH * 0.3 + ((b.seed * 13 + i * 23) % (buildingH * 0.5));
            ctx.globalAlpha = 0.55;
            ctx.fillRect(gx, gy, buildingW * 0.25, buildingH * 0.08);
          }
          ctx.globalAlpha = 1;
        } else if (zone.effect === "market" && t > 0.3) {
          // market stall awning
          ctx.fillStyle = ["#dc2626", "#f59e0b", "#84cc16"][Math.floor(b.seed * 3) % 3];
          ctx.fillRect(left - 4, top + buildingH * 0.85, buildingW + 8, buildingH * 0.12);
        } else if (zone.effect === "cyber" && t > 0.3) {
          // neon strip
          ctx.shadowColor = "#22d3ee";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#22d3ee";
          ctx.fillRect(left, top + buildingH * 0.3, buildingW, 2);
          ctx.fillStyle = "#f0abfc";
          ctx.fillRect(left, top + buildingH * 0.6, buildingW, 2);
          ctx.shadowBlur = 0;
        }
        // windows
        if (!b.isAmPm) {
          ctx.fillStyle = zone.litWindows ? "rgba(255,220,120,0.85)" : "rgba(255,235,180,0.7)";
          const cols = 3;
          const rows = Math.max(2, Math.floor(buildingH / 25));
          const wW = buildingW / (cols * 2);
          const wH = Math.max(4, buildingH / (rows * 2.2));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const seed = b.windowSeed * 100 + r * 7 + c * 3;
              const lit = (seed | 0) % 3 !== 0;
              if (!lit) continue;
              ctx.fillRect(
                left + wW + c * (wW * 2),
                top + buildingH * 0.1 + r * (wH * 2.2),
                wW,
                wH,
              );
            }
          }
        }
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, buildingW, buildingH + 100);
      }

      function landmarkLitWindows(
        left: number,
        top: number,
        bw: number,
        bh: number,
        seed: number,
        cols: number,
      ) {
        ctx.fillStyle = "rgba(255,220,140,0.85)";
        const rows = Math.max(3, Math.floor(bh / 22));
        const wW = bw / (cols * 2);
        const wH = Math.max(3, bh / (rows * 2.3));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const sd = seed * 100 + r * 7 + c * 3;
            if ((sd | 0) % 3 === 0) continue;
            ctx.fillRect(left + wW + c * (wW * 2), top + bh * 0.08 + r * (wH * 2.2), wW, wH);
          }
        }
      }

      function drawLandmark(b: Building, left: number, top: number, bw: number, bh: number) {
        const cx = left + bw / 2;
        const groundY = top + bh + 100;
        switch (b.landmark) {
          case "azrieli_round": {
            // Cylindrical glass tower with curved top
            const grad = ctx.createLinearGradient(left, 0, left + bw, 0);
            grad.addColorStop(0, "#7ea1c9");
            grad.addColorStop(0.5, "#dbe7f5");
            grad.addColorStop(1, "#5b7fa8");
            ctx.fillStyle = grad;
            roundRect(ctx, left, top, bw, bh + 100, bw * 0.45);
            ctx.fill();
            // Vertical mullions
            ctx.strokeStyle = "rgba(0,0,0,0.25)";
            ctx.lineWidth = 1;
            for (let i = 1; i < 6; i++) {
              ctx.beginPath();
              ctx.moveTo(left + (bw * i) / 6, top + bh * 0.1);
              ctx.lineTo(left + (bw * i) / 6, groundY);
              ctx.stroke();
            }
            landmarkLitWindows(
              left + bw * 0.08,
              top + bh * 0.2,
              bw * 0.84,
              bh * 0.7,
              b.windowSeed,
              4,
            );
            // Crown spire
            ctx.fillStyle = "#c4d4e8";
            ctx.fillRect(cx - 2, top - bh * 0.06, 4, bh * 0.08);
            break;
          }
          case "azrieli_triangle": {
            // Triangular tower (peak top)
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(left, groundY);
            ctx.lineTo(cx, top);
            ctx.lineTo(left + bw, groundY);
            ctx.closePath();
            ctx.fillStyle = "#5b7fa8";
            ctx.fill();
            // Glass sheen
            const g2 = ctx.createLinearGradient(left, top, left + bw, top);
            g2.addColorStop(0, "rgba(255,255,255,0.0)");
            g2.addColorStop(0.5, "rgba(255,255,255,0.25)");
            g2.addColorStop(1, "rgba(0,0,0,0.2)");
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.moveTo(left, groundY);
            ctx.lineTo(cx, top);
            ctx.lineTo(left + bw, groundY);
            ctx.closePath();
            ctx.fill();
            // Window strips
            ctx.strokeStyle = "rgba(255,220,140,0.55)";
            ctx.lineWidth = 1;
            const steps = 10;
            for (let i = 1; i < steps; i++) {
              const yy = top + (bh * i) / steps;
              const half = ((cx - left) * (steps - i)) / steps;
              ctx.beginPath();
              ctx.moveTo(cx - half * 0.85, yy);
              ctx.lineTo(cx + half * 0.85, yy);
              ctx.stroke();
            }
            break;
          }
          case "azrieli_square": {
            // Rectangular glass tower with crown
            ctx.fillStyle = "#6f93bc";
            ctx.fillRect(left, top, bw, bh + 100);
            const g3 = ctx.createLinearGradient(left, 0, left + bw, 0);
            g3.addColorStop(0, "rgba(255,255,255,0.0)");
            g3.addColorStop(0.5, "rgba(255,255,255,0.25)");
            g3.addColorStop(1, "rgba(0,0,0,0.25)");
            ctx.fillStyle = g3;
            ctx.fillRect(left, top, bw, bh + 100);
            // Crown
            ctx.fillStyle = "#3a536e";
            ctx.fillRect(left - 2, top, bw + 4, 6);
            landmarkLitWindows(
              left + bw * 0.08,
              top + bh * 0.15,
              bw * 0.84,
              bh * 0.75,
              b.windowSeed,
              5,
            );
            break;
          }
          case "migdal_shalom": {
            // Classic boxy skyscraper, beige with strong verticals
            ctx.fillStyle = "#d8c9a8";
            ctx.fillRect(left, top, bw, bh + 100);
            ctx.strokeStyle = "rgba(0,0,0,0.35)";
            ctx.lineWidth = 1.5;
            const verts = 6;
            for (let i = 1; i < verts; i++) {
              ctx.beginPath();
              ctx.moveTo(left + (bw * i) / verts, top);
              ctx.lineTo(left + (bw * i) / verts, groundY);
              ctx.stroke();
            }
            // Top antenna
            ctx.fillStyle = "#7c6a4f";
            ctx.fillRect(cx - 1.5, top - bh * 0.12, 3, bh * 0.12);
            landmarkLitWindows(
              left + bw * 0.05,
              top + bh * 0.18,
              bw * 0.9,
              bh * 0.7,
              b.windowSeed,
              6,
            );
            break;
          }
          case "dizengoff_center": {
            // Multi-tone irregular mall with signage
            ctx.fillStyle = "#3a3a44";
            ctx.fillRect(left, top + bh * 0.25, bw, bh * 0.75 + 100);
            // Upper block
            ctx.fillStyle = "#5b5b6a";
            ctx.fillRect(left + bw * 0.1, top, bw * 0.55, bh * 0.4);
            // Glass strip
            ctx.fillStyle = "#22d3ee";
            ctx.globalAlpha = 0.55;
            ctx.fillRect(left, top + bh * 0.55, bw, bh * 0.12);
            ctx.globalAlpha = 1;
            // Signage
            ctx.fillStyle = "#fde047";
            ctx.font = `bold ${Math.max(8, bw * 0.12)}px system-ui`;
            ctx.textAlign = "center";
            ctx.fillText("Dizengoff", cx, top + bh * 0.3);
            ctx.fillStyle = "#f472b6";
            ctx.fillText("Center", cx, top + bh * 0.42);
            // Storefront lights
            for (let i = 0; i < 5; i++) {
              ctx.fillStyle = ["#fde047", "#22d3ee", "#f472b6"][i % 3];
              ctx.fillRect(
                left + 6 + (i * (bw - 12)) / 5,
                top + bh * 0.78,
                (bw - 12) / 8,
                bh * 0.06,
              );
            }
            break;
          }
          case "menorah_hall": {
            // Rounded arena dome
            ctx.fillStyle = "#5e6770";
            ctx.beginPath();
            ctx.ellipse(cx, top + bh, bw * 0.55, bh * 0.65, 0, Math.PI, 0);
            ctx.fill();
            // Base
            ctx.fillRect(left, top + bh, bw, 100);
            // Highlights
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1;
            for (let i = 1; i < 6; i++) {
              const a = Math.PI + (Math.PI * i) / 6;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * bw * 0.55, top + bh + Math.sin(a) * bh * 0.65);
              ctx.lineTo(cx, top + bh);
              ctx.stroke();
            }
            // Marquee
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(left + bw * 0.15, top + bh - 4, bw * 0.7, 8);
            break;
          }
          case "kirya": {
            // Cluster of clean modern boxes
            ctx.fillStyle = "#7a8794";
            ctx.fillRect(left, top + bh * 0.15, bw * 0.55, bh * 0.85 + 100);
            ctx.fillStyle = "#8e9aa6";
            ctx.fillRect(left + bw * 0.55, top + bh * 0.35, bw * 0.45, bh * 0.65 + 100);
            ctx.fillStyle = "#5b6773";
            ctx.fillRect(left + bw * 0.4, top, bw * 0.25, bh * 0.6);
            landmarkLitWindows(
              left + bw * 0.02,
              top + bh * 0.3,
              bw * 0.5,
              bh * 0.65,
              b.windowSeed,
              4,
            );
            landmarkLitWindows(
              left + bw * 0.57,
              top + bh * 0.45,
              bw * 0.4,
              bh * 0.5,
              b.windowSeed * 1.3,
              3,
            );
            break;
          }
          case "yafo_clock": {
            // Stone tower with clock face
            ctx.fillStyle = "#d4b896";
            ctx.fillRect(left, top + bh * 0.05, bw, bh + 95);
            ctx.fillStyle = "#a8916f";
            // Stone courses
            for (let i = 0; i < 6; i++) {
              ctx.fillRect(left, top + bh * 0.05 + i * (bh / 6), bw, 1);
            }
            // Clock face
            ctx.fillStyle = "#fef3c7";
            ctx.beginPath();
            ctx.arc(cx, top + bh * 0.3, bw * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#3a2418";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Clock hands
            ctx.beginPath();
            ctx.moveTo(cx, top + bh * 0.3);
            ctx.lineTo(cx, top + bh * 0.18);
            ctx.moveTo(cx, top + bh * 0.3);
            ctx.lineTo(cx + bw * 0.18, top + bh * 0.3);
            ctx.stroke();
            // Dome top
            ctx.fillStyle = "#3a7ca5";
            ctx.beginPath();
            ctx.arc(cx, top + bh * 0.05, bw * 0.35, Math.PI, 0);
            ctx.fill();
            break;
          }
        }
        // Edge outline shared by all
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        if (b.landmark !== "menorah_hall" && b.landmark !== "azrieli_triangle") {
          ctx.strokeRect(left, top, bw, bh + 100);
        }
      }

      function drawPlayer() {
        const laneF = g.lane + g.laneShift;
        const p = laneCenter(laneF, 0.97);
        const bob = Math.sin(g.runCycle) * 4;
        const jumpOffset = g.jumpY * 80;
        const crouchScale = g.crouching > 0 ? 0.7 : 1;
        const flicker = g.invuln > 0 && Math.floor(g.invuln / 100) % 2 === 0;
        if (flicker) ctx.globalAlpha = 0.45;
        drawPersonSkin(p.x, p.y + bob - jumpOffset, 0.97 * 1.05 * crouchScale, skin, g.runCycle);
        // helmet shield (one-hit)
        if (g.shield) {
          ctx.strokeStyle = "rgba(34,211,238,0.85)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 35 - jumpOffset, 50, 0, Math.PI * 2);
          ctx.stroke();
        }
        // futuristic shield aura
        if (g.shieldT > 0) {
          const a = 0.45 + Math.sin(g.runCycle * 6) * 0.2;
          ctx.strokeStyle = `rgba(125,211,252,${a})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 35 - jumpOffset, 58, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(168,85,247,${a * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 35 - jumpOffset, 66, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (g.magnetT > 0) {
          ctx.strokeStyle = `rgba(96,165,250,${0.4 + Math.sin(g.runCycle * 4) * 0.3})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 30 - jumpOffset, 70, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (g.scooterT > 0) {
          ctx.fillStyle = "rgba(251,146,60,0.65)";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - 4, 38, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (g.dodgePulse > 0) {
          const k = g.dodgePulse / g.dodgePulseMax;
          const grow = 1 - k;
          const radius = 40 + grow * 90;
          const alpha = k * 0.9;
          let color = "251,191,36";
          if (g.dodgePulseKind === "duck") color = "34,211,238";
          else if (g.dodgePulseKind === "shield") color = "125,211,252";
          else if (g.dodgePulseKind === "hit") color = "239,68,68";
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = 4 + grow * 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 35 - jumpOffset, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${color},${alpha * 0.18})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 35 - jumpOffset, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      function drawObstacle(o: Obstacle) {
        const visualZ = Math.max(TRACK_VISUAL_START_Z, o.z);
        const p = laneCenter(o.lane, visualZ);
        const scale = Math.max(0.08, visualZ);
        const behavior = OBSTACLE_BEHAVIOR[o.kind];
        const ramp: Record<
          "jump" | "duck" | "lane",
          [[number, number, number], [number, number, number]]
        > = {
          jump: [
            [120, 70, 30],
            [253, 224, 71],
          ],
          duck: [
            [20, 50, 90],
            [34, 211, 238],
          ],
          lane: [
            [80, 20, 40],
            [239, 68, 68],
          ],
        };
        const [farRGB, nearRGB] = ramp[behavior];
        const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
        const rampColor = (t: number) => {
          const k = Math.max(0, Math.min(1, t));
          return `rgb(${lerp(farRGB[0], nearRGB[0], k)},${lerp(farRGB[1], nearRGB[1], k)},${lerp(farRGB[2], nearRGB[2], k)})`;
        };
        const markerColor = rampColor(1);
        const ringR = scale * 42;
        ctx.save();
        const TRAIL_STEPS = 6;
        for (let i = 1; i <= TRAIL_STEPS; i++) {
          const spacing = 0.04 + i * 0.025;
          const trailZ = o.z - spacing;
          if (trailZ <= TRACK_VISUAL_START_Z) break;
          const tp = laneCenter(o.lane, trailZ);
          const tScale = Math.max(0.06, trailZ);
          const depthK = Math.max(
            0,
            Math.min(
              1,
              (trailZ - TRACK_VISUAL_START_Z) / (visualZ - TRACK_VISUAL_START_Z + 0.0001),
            ),
          );
          const tR = tScale * 42 * (0.55 + depthK * 0.45);
          const a = Math.pow(depthK, 1.6) * Math.pow(1 - i / (TRAIL_STEPS + 1), 1.8) * 0.7;
          if (a < 0.02) continue;
          const blur = (1 - depthK) * 6 + (i / TRAIL_STEPS) * 4;
          ctx.filter = `blur(${blur.toFixed(2)}px)`;
          ctx.globalAlpha = a;
          ctx.fillStyle = rampColor(depthK);
          ctx.beginPath();
          ctx.ellipse(tp.x, tp.y + 2, tR, tR * (0.22 + depthK * 0.12), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.filter = "none";
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = Math.min(1, 0.35 + visualZ * 0.7);
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, ringR, ringR * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = Math.max(1.5, scale * 3);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, ringR, ringR * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const trailZ = o.z - 0.05 - i * 0.045;
          if (trailZ <= TRACK_VISUAL_START_Z) break;
          const tp = laneCenter(o.lane, trailZ);
          const depthK = Math.max(
            0,
            Math.min(
              1,
              (trailZ - TRACK_VISUAL_START_Z) / (visualZ - TRACK_VISUAL_START_Z + 0.0001),
            ),
          );
          const a = Math.pow(depthK, 1.4) * (1 - i / 5) * 0.6;
          if (a < 0.03) continue;
          const len = scale * 22 * (0.4 + depthK * 0.8);
          ctx.lineWidth = Math.max(0.8, scale * 2.2 * depthK);
          ctx.filter = `blur(${(1 - depthK) * 4 + i * 0.6}px)`;
          ctx.globalAlpha = a;
          ctx.strokeStyle = rampColor(depthK);
          ctx.beginPath();
          ctx.moveTo(tp.x - len * 0.5, tp.y - scale * 18 * depthK);
          ctx.lineTo(tp.x + len * 0.5, tp.y - scale * 18 * depthK);
          ctx.stroke();
        }
        ctx.filter = "none";
        ctx.restore();
        switch (o.kind) {
          case "wolt":
            drawWolt(p.x, p.y, scale);
            break;
          case "street_person":
            drawStreetPerson(p.x, p.y, scale);
            break;
          case "ac":
            drawAC(p.x, p.y, scale, visualZ);
            break;
          case "scooter":
            drawScooter(p.x, p.y, scale);
            break;
          case "car":
            drawCar(p.x, p.y, scale);
            break;
          case "dog":
            drawDog(p.x, p.y, scale);
            break;
          case "tourist":
            drawTourist(p.x, p.y, scale);
            break;
          case "trash":
            drawTrash(p.x, p.y, scale);
            break;
          case "matkot":
            drawMatkot(p.x, p.y, scale);
            break;
        }
      }

      function drawPickup(p: Pickup) {
        const lateral = p.lateralOffset ?? 0;
        const visualZ = Math.max(TRACK_VISUAL_START_Z, p.z);
        const pt = laneCenter(p.lane + lateral, visualZ);
        const scale = Math.max(0.08, visualZ);
        switch (p.kind) {
          case "coin":
            drawCoin(pt.x, pt.y, scale);
            break;
          case "icecream":
            drawIceCream(pt.x, pt.y, scale);
            break;
          case "coffee":
            drawCoffee(pt.x, pt.y, scale);
            break;
          case "helmet":
            drawHelmet(pt.x, pt.y, scale);
            break;
          case "ravkav":
            drawRavKav(pt.x, pt.y, scale);
            break;
          case "sunglasses":
            drawShades(pt.x, pt.y, scale);
            break;
          case "shield":
            drawShieldOrb(pt.x, pt.y, scale);
            break;
          case "scooter_boost":
            drawScooterBoost(pt.x, pt.y, scale);
            break;
        }
      }

      function drawShadow(cx: number, feetY: number, s: number) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(cx, feetY + 2, s * 0.55, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawPersonSkin(cx: number, feetY: number, scale: number, skin: SkinDef, cycle = 0) {
        const s = scale * 75;
        const bodyW = s * 0.55;
        const bodyH = s * 0.7;
        const headR = s * 0.22;
        const legSwing = Math.sin(cycle) * s * 0.15;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = skin.colors.pants;
        ctx.fillRect(cx - bodyW * 0.35, feetY - s * 0.4, bodyW * 0.3, s * 0.4 + legSwing);
        ctx.fillRect(cx + bodyW * 0.05, feetY - s * 0.4, bodyW * 0.3, s * 0.4 - legSwing);
        ctx.fillStyle = "#111";
        ctx.fillRect(cx - bodyW * 0.36, feetY - 2 + legSwing, bodyW * 0.34, 4);
        ctx.fillRect(cx + bodyW * 0.04, feetY - 2 - legSwing, bodyW * 0.34, 4);
        ctx.fillStyle = skin.colors.shirt;
        roundRect(
          ctx,
          cx - bodyW / 2,
          feetY - s * 0.4 - bodyH * 0.55,
          bodyW,
          bodyH * 0.55,
          s * 0.08,
        );
        ctx.fill();
        const sh = ctx.createLinearGradient(cx - bodyW / 2, 0, cx + bodyW / 2, 0);
        sh.addColorStop(0, "rgba(0,0,0,0.2)");
        sh.addColorStop(0.5, "rgba(255,255,255,0.15)");
        sh.addColorStop(1, "rgba(0,0,0,0.2)");
        ctx.fillStyle = sh;
        roundRect(
          ctx,
          cx - bodyW / 2,
          feetY - s * 0.4 - bodyH * 0.55,
          bodyW,
          bodyH * 0.55,
          s * 0.08,
        );
        ctx.fill();
        ctx.fillStyle = skin.colors.shirt;
        ctx.save();
        ctx.translate(cx - bodyW / 2, feetY - s * 0.4 - bodyH * 0.5);
        ctx.rotate(Math.sin(cycle + Math.PI) * 0.4);
        ctx.fillRect(-s * 0.12, 0, s * 0.14, s * 0.4);
        ctx.restore();
        ctx.save();
        ctx.translate(cx + bodyW / 2, feetY - s * 0.4 - bodyH * 0.5);
        ctx.rotate(Math.sin(cycle) * 0.4);
        ctx.fillRect(0, 0, s * 0.14, s * 0.4);
        ctx.restore();
        const headY = feetY - s * 0.4 - bodyH * 0.55 - headR * 0.7;
        ctx.fillStyle = skin.colors.skin;
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.fillRect(cx - headR * 0.45, headY - headR * 0.15, headR * 0.18, headR * 0.18);
        ctx.fillRect(cx + headR * 0.27, headY - headR * 0.15, headR * 0.18, headR * 0.18);
        ctx.strokeStyle = "#7a3b3b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, headY + headR * 0.2, headR * 0.25, 0, Math.PI);
        ctx.stroke();
        if (skin.hat === "cap") {
          ctx.fillStyle = skin.colors.accent;
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.2, headR * 1.05, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(cx - headR * 0.2, headY - headR * 0.25, headR * 1.4, headR * 0.25);
        } else if (skin.hat === "beanie") {
          ctx.fillStyle = skin.colors.hair;
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.3, headR * 1, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(cx - headR, headY - headR * 0.4, headR * 2, headR * 0.4);
        } else if (skin.hat === "sun") {
          ctx.fillStyle = skin.colors.accent;
          ctx.fillRect(cx - headR * 1.4, headY - headR * 0.3, headR * 2.8, headR * 0.18);
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.4, headR * 0.8, Math.PI, 0);
          ctx.fill();
        } else if (skin.hat === "visor") {
          ctx.fillStyle = "#22d3ee";
          ctx.fillRect(cx - headR * 1.1, headY - headR * 0.05, headR * 2.2, headR * 0.15);
          ctx.fillStyle = skin.colors.hair;
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.3, headR * 0.9, Math.PI, 0);
          ctx.fill();
        } else if (skin.hat === "crown") {
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.moveTo(cx - headR, headY - headR * 0.5);
          ctx.lineTo(cx - headR * 0.6, headY - headR);
          ctx.lineTo(cx - headR * 0.2, headY - headR * 0.55);
          ctx.lineTo(cx + headR * 0.2, headY - headR * 1.05);
          ctx.lineTo(cx + headR * 0.6, headY - headR * 0.55);
          ctx.lineTo(cx + headR, headY - headR);
          ctx.lineTo(cx + headR * 1.05, headY - headR * 0.4);
          ctx.lineTo(cx - headR * 1.05, headY - headR * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.7, headR * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = skin.colors.hair;
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.3, headR * 0.95, Math.PI, 0);
          ctx.fill();
        }
        if (skin.prop === "headphones") {
          ctx.fillStyle = skin.colors.accent;
          ctx.fillRect(cx - headR * 1.05, headY - headR * 0.1, headR * 0.3, headR * 0.5);
          ctx.fillRect(cx + headR * 0.75, headY - headR * 0.1, headR * 0.3, headR * 0.5);
          ctx.strokeStyle = skin.colors.accent;
          ctx.lineWidth = headR * 0.18;
          ctx.beginPath();
          ctx.arc(cx, headY - headR * 0.4, headR * 0.95, Math.PI, 0);
          ctx.stroke();
        } else if (skin.prop === "coffee") {
          ctx.fillStyle = "#fff";
          roundRect(ctx, cx + bodyW * 0.45, feetY - s * 0.55, s * 0.18, s * 0.2, 3);
          ctx.fill();
          ctx.fillStyle = "#7c2d12";
          ctx.fillRect(cx + bodyW * 0.5, feetY - s * 0.5, s * 0.1, s * 0.06);
        } else if (skin.prop === "camera") {
          ctx.fillStyle = "#111";
          roundRect(ctx, cx - s * 0.16, feetY - s * 0.6, s * 0.32, s * 0.2, 3);
          ctx.fill();
          ctx.fillStyle = "#333";
          ctx.beginPath();
          ctx.arc(cx, feetY - s * 0.5, s * 0.07, 0, Math.PI * 2);
          ctx.fill();
        } else if (skin.prop === "surfboard") {
          ctx.save();
          ctx.translate(cx - bodyW * 0.6, feetY - s * 0.45);
          ctx.rotate(-0.3);
          ctx.fillStyle = skin.colors.accent;
          roundRect(ctx, -s * 0.1, -s * 0.7, s * 0.2, s * 1.4, s * 0.1);
          ctx.fill();
          ctx.fillStyle = "#fb923c";
          ctx.fillRect(-s * 0.04, -s * 0.4, s * 0.08, s * 0.8);
          ctx.restore();
        } else if (skin.prop === "bag") {
          ctx.fillStyle = "#00c2e0";
          roundRect(ctx, cx - bodyW * 0.55, feetY - s * 0.7, s * 0.2, s * 0.3, s * 0.04);
          ctx.fill();
        } else if (skin.prop === "neon") {
          ctx.shadowColor = "#22d3ee";
          ctx.shadowBlur = 8;
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - bodyW / 2, feetY - s * 0.7);
          ctx.lineTo(cx - bodyW / 2, feetY - s * 0.35);
          ctx.moveTo(cx + bodyW / 2, feetY - s * 0.7);
          ctx.lineTo(cx + bodyW / 2, feetY - s * 0.35);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      function drawWolt(cx: number, feetY: number, scale: number) {
        const s = scale * 85;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(cx - s * 0.32, feetY - s * 0.08, s * 0.13, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.32, feetY - s * 0.08, s * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#444";
        ctx.lineWidth = Math.max(2, s * 0.04);
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.32, feetY - s * 0.08);
        ctx.lineTo(cx, feetY - s * 0.35);
        ctx.lineTo(cx + s * 0.32, feetY - s * 0.08);
        ctx.moveTo(cx, feetY - s * 0.35);
        ctx.lineTo(cx + s * 0.4, feetY - s * 0.5);
        ctx.stroke();
        const riderCx = cx + s * 0.05;
        const riderFeet = feetY - s * 0.3;
        ctx.fillStyle = "#0a1f44";
        roundRect(ctx, riderCx - s * 0.22, riderFeet - s * 0.45, s * 0.44, s * 0.5, s * 0.06);
        ctx.fill();
        ctx.fillStyle = "#00c2e0";
        roundRect(ctx, riderCx - s * 0.34, riderFeet - s * 0.7, s * 0.38, s * 0.34, s * 0.05);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(9, s * 0.13)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("wolt", riderCx - s * 0.15, riderFeet - s * 0.48);
        const headY = riderFeet - s * 0.58;
        ctx.fillStyle = "#e0b48c";
        ctx.beginPath();
        ctx.arc(riderCx + s * 0.05, headY, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1f2937";
        ctx.beginPath();
        ctx.arc(riderCx + s * 0.05, headY - s * 0.04, s * 0.17, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.fillRect(riderCx - s * 0.06, headY - s * 0.18, s * 0.08, s * 0.04);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.6 - i * 6, feetY - s * 0.2 - i * 8);
          ctx.lineTo(cx - s * 0.3 - i * 6, feetY - s * 0.2 - i * 8);
          ctx.stroke();
        }
      }

      function drawStreetPerson(cx: number, feetY: number, scale: number) {
        const s = scale * 75;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(cx - s * 0.18, feetY - s * 0.35, s * 0.14, s * 0.35);
        ctx.fillRect(cx + s * 0.04, feetY - s * 0.35, s * 0.14, s * 0.35);
        ctx.fillStyle = "#111";
        ctx.fillRect(cx - s * 0.2, feetY - 3, s * 0.18, 4);
        ctx.fillRect(cx + s * 0.02, feetY - 3, s * 0.18, 4);
        ctx.fillStyle = "#475569";
        roundRect(ctx, cx - s * 0.27, feetY - s * 0.75, s * 0.54, s * 0.42, s * 0.08);
        ctx.fill();
        ctx.fillStyle = "#334155";
        roundRect(ctx, cx - s * 0.27, feetY - s * 0.78, s * 0.54, s * 0.1, s * 0.05);
        ctx.fill();
        ctx.fillStyle = "#475569";
        ctx.fillRect(cx + s * 0.05, feetY - s * 0.72, s * 0.18, s * 0.08);
        ctx.fillRect(cx + s * 0.18, feetY - s * 0.72, s * 0.08, s * 0.22);
        ctx.fillStyle = "#d6b48a";
        ctx.fillRect(cx + s * 0.16, feetY - s * 0.52, s * 0.12, s * 0.1);
        ctx.fillStyle = "#111";
        roundRect(ctx, cx + s * 0.12, feetY - s * 0.62, s * 0.2, s * 0.14, s * 0.02);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(cx + s * 0.14, feetY - s * 0.6, s * 0.16, s * 0.1);
        ctx.fillStyle = "#d6b48a";
        ctx.beginPath();
        ctx.arc(cx - s * 0.02, feetY - s * 0.85, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath();
        ctx.arc(cx - s * 0.02, feetY - s * 0.9, s * 0.17, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.1, feetY - s * 0.82);
        ctx.quadraticCurveTo(cx + s * 0.15, feetY - s * 0.68, cx + s * 0.18, feetY - s * 0.6);
        ctx.stroke();
      }

      function drawAC(cx: number, feetY: number, scale: number, z: number) {
        const s = scale * 95;
        const acX = cx;
        const acY = horizonY + (h - horizonY) * z - s * 1.7;
        ctx.fillStyle = "#dcdcdc";
        roundRect(ctx, acX - s * 0.35, acY, s * 0.7, s * 0.35, s * 0.04);
        ctx.fill();
        ctx.strokeStyle = "#888";
        ctx.strokeRect(acX - s * 0.35, acY, s * 0.7, s * 0.35);
        ctx.strokeStyle = "#aaa";
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(acX - s * 0.3, acY + s * 0.08 + i * s * 0.06);
          ctx.lineTo(acX + s * 0.3, acY + s * 0.08 + i * s * 0.06);
          ctx.stroke();
        }
        ctx.fillStyle = "#5fb7e6";
        const dripBase = acY + s * 0.4;
        const dripEnd = feetY - s * 0.1;
        const dripPhase = (g.runCycle * 2) % 1;
        for (let i = 0; i < 3; i++) {
          const t = (i / 3 + dripPhase) % 1;
          const dy = dripBase + (dripEnd - dripBase) * t;
          ctx.beginPath();
          ctx.moveTo(acX, dy);
          ctx.bezierCurveTo(
            acX - s * 0.06,
            dy + s * 0.08,
            acX + s * 0.06,
            dy + s * 0.08,
            acX,
            dy + s * 0.16,
          );
          ctx.fill();
        }
        ctx.fillStyle = "rgba(95,183,230,0.6)";
        ctx.beginPath();
        ctx.ellipse(acX, feetY, s * 0.3, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawScooter(cx: number, feetY: number, scale: number) {
        const s = scale * 70;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#1f2937";
        roundRect(ctx, cx - s * 0.4, feetY - s * 0.12, s * 0.8, s * 0.08, s * 0.03);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(cx - s * 0.32, feetY - s * 0.04, s * 0.09, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.32, feetY - s * 0.04, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = s * 0.06;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.32, feetY - s * 0.12);
        ctx.lineTo(cx + s * 0.5, feetY - s * 0.55);
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(cx + s * 0.32, feetY - s * 0.58, s * 0.36, s * 0.06);
      }

      function drawCar(cx: number, feetY: number, scale: number) {
        const s = scale * 100;
        drawShadow(cx, feetY, s * 1.2);
        ctx.fillStyle = "#475569";
        roundRect(ctx, cx - s * 0.55, feetY - s * 0.4, s * 1.1, s * 0.35, s * 0.08);
        ctx.fill();
        ctx.fillStyle = "#1f2937";
        roundRect(ctx, cx - s * 0.4, feetY - s * 0.6, s * 0.7, s * 0.25, s * 0.06);
        ctx.fill();
        ctx.fillStyle = "rgba(135,206,235,0.5)";
        ctx.fillRect(cx - s * 0.35, feetY - s * 0.55, s * 0.6, s * 0.18);
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(cx - s * 0.38, feetY - s * 0.04, s * 0.1, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.38, feetY - s * 0.04, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.fillRect(cx + s * 0.5, feetY - s * 0.25, s * 0.06, s * 0.08);
      }

      function drawDog(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#a16207";
        roundRect(ctx, cx - s * 0.45, feetY - s * 0.3, s * 0.8, s * 0.25, s * 0.08);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.4, feetY - s * 0.35, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.35, feetY - s * 0.5);
        ctx.lineTo(cx + s * 0.45, feetY - s * 0.6);
        ctx.lineTo(cx + s * 0.5, feetY - s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#a16207";
        ctx.fillRect(cx - s * 0.4, feetY - s * 0.1, s * 0.08, s * 0.1);
        ctx.fillRect(cx + s * 0.25, feetY - s * 0.1, s * 0.08, s * 0.1);
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.4, feetY - s * 0.5);
        ctx.lineTo(cx - s * 0.8, feetY - s * 0.7);
        ctx.stroke();
      }

      function drawTourist(cx: number, feetY: number, scale: number) {
        const s = scale * 75;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#f97316";
        roundRect(ctx, cx - s * 0.25, feetY - s * 0.65, s * 0.5, s * 0.5, s * 0.08);
        ctx.fill();
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(cx - s * 0.2, feetY - s * 0.15, s * 0.15, s * 0.15);
        ctx.fillRect(cx + s * 0.05, feetY - s * 0.15, s * 0.15, s * 0.15);
        ctx.fillStyle = "#e7c4a3";
        ctx.beginPath();
        ctx.arc(cx, feetY - s * 0.75, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(cx - s * 0.3, feetY - s * 0.85, s * 0.6, s * 0.05);
        ctx.beginPath();
        ctx.arc(cx, feetY - s * 0.9, s * 0.18, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "#e7c4a3";
        ctx.lineWidth = s * 0.1;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.2, feetY - s * 0.55);
        ctx.lineTo(cx + s * 0.45, feetY - s * 0.85);
        ctx.stroke();
        ctx.fillStyle = "#111";
        roundRect(ctx, cx + s * 0.35, feetY - s * 1.0, s * 0.18, s * 0.25, 3);
        ctx.fill();
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(cx + s * 0.38, feetY - s * 0.97, s * 0.12, s * 0.18);
      }

      function drawTrash(cx: number, feetY: number, scale: number) {
        const s = scale * 60;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#166534";
        roundRect(ctx, cx - s * 0.3, feetY - s * 0.55, s * 0.6, s * 0.55, s * 0.06);
        ctx.fill();
        ctx.fillStyle = "#14532d";
        ctx.fillRect(cx - s * 0.32, feetY - s * 0.62, s * 0.64, s * 0.08);
        ctx.strokeStyle = "#052e16";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.28, feetY - s * 0.4 + i * s * 0.13);
          ctx.lineTo(cx + s * 0.28, feetY - s * 0.4 + i * s * 0.13);
          ctx.stroke();
        }
      }

      function drawMatkot(cx: number, feetY: number, scale: number) {
        const s = scale * 50;
        drawShadow(cx, feetY, s);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(cx, feetY - s * 0.4 + Math.sin(g.runCycle * 3) * 6, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
          cx - s * 0.08,
          feetY - s * 0.45 + Math.sin(g.runCycle * 3) * 6,
          s * 0.06,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      function drawCoin(cx: number, feetY: number, scale: number) {
        const s = scale * 40;
        const cy = feetY - s * 0.6 + Math.sin(g.runCycle * 3 + cx) * 4;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
        grad.addColorStop(0, "rgba(255,235,150,0.85)");
        grad.addColorStop(1, "rgba(255,235,150,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        const wobble = Math.abs(Math.sin(g.runCycle * 4));
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 0.3 * (0.4 + wobble * 0.6), s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#92400e";
        ctx.font = `bold ${Math.max(8, s * 0.28)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("₪", cx, cy + s * 0.1);
      }

      function drawIceCream(cx: number, feetY: number, scale: number) {
        const s = scale * 60;
        const cy = feetY - s * 0.4 + Math.sin(g.runCycle * 2) * 4;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s);
        grad.addColorStop(0, "rgba(255,220,120,0.7)");
        grad.addColorStop(1, "rgba(255,220,120,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c98f4b";
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.22, cy);
        ctx.lineTo(cx + s * 0.22, cy);
        ctx.lineTo(cx, cy + s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff9ec7";
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.1, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.3, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e63946";
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.45, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      function powerupGlow(cx: number, cy: number, s: number, color: string) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, s, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawCoffee(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s, "rgba(163,230,53,0.7)");
        ctx.fillStyle = "#a3e635";
        roundRect(ctx, cx - s * 0.22, cy - s * 0.3, s * 0.44, s * 0.55, s * 0.08);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(9, s * 0.16)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("ICE", cx, cy);
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(cx - s * 0.05, cy - s * 0.5, s * 0.1, s * 0.2);
      }

      function drawHelmet(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s, "rgba(34,211,238,0.7)");
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.35, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#0e7490";
        ctx.fillRect(cx - s * 0.35, cy - s * 0.02, s * 0.7, s * 0.08);
      }

      function drawRavKav(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s, "rgba(96,165,250,0.7)");
        ctx.fillStyle = "#60a5fa";
        roundRect(ctx, cx - s * 0.3, cy - s * 0.18, s * 0.6, s * 0.38, s * 0.05);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(7, s * 0.13)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("רב-קו", cx, cy + s * 0.04);
      }

      function drawShades(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s, "rgba(253,224,71,0.7)");
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(cx - s * 0.15, cy, s * 0.16, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.15, cy, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - s * 0.05, cy - s * 0.02, s * 0.1, s * 0.04);
      }

      function drawShieldOrb(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s * 1.1, "rgba(125,211,252,0.8)");
        ctx.save();
        ctx.shadowColor = "#7dd3fc";
        ctx.shadowBlur = 12;
        // shield shape
        ctx.fillStyle = "#7dd3fc";
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.35);
        ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.25, cx + s * 0.3, cy);
        ctx.quadraticCurveTo(cx + s * 0.25, cy + s * 0.3, cx, cy + s * 0.4);
        ctx.quadraticCurveTo(cx - s * 0.25, cy + s * 0.3, cx - s * 0.3, cy);
        ctx.quadraticCurveTo(cx - s * 0.3, cy - s * 0.25, cx, cy - s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      function drawScooterBoost(cx: number, feetY: number, scale: number) {
        const s = scale * 55;
        const cy = feetY - s * 0.5 + Math.sin(g.runCycle * 2) * 4;
        powerupGlow(cx, cy, s, "rgba(251,146,60,0.8)");
        // lightning bolt
        ctx.fillStyle = "#fb923c";
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.05, cy - s * 0.4);
        ctx.lineTo(cx - s * 0.2, cy + s * 0.05);
        ctx.lineTo(cx - s * 0.02, cy + s * 0.05);
        ctx.lineTo(cx - s * 0.1, cy + s * 0.4);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.05);
        ctx.lineTo(cx + s * 0.02, cy - s * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (t: number) => {
      const v = viewRef.current;
      if (v === "playing") {
        const dt = Math.min(48, t - last);
        last = t;
        update(dt);
        draw();
      } else if (v === "paused") {
        last = t;
        draw();
      } else {
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [runId]);

  const buySkin = (id: SkinId) => {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || ownedSkins.includes(id) || walletCoins < skin.price) return;
    const nextWallet = walletCoins - skin.price;
    const nextOwned = [...ownedSkins, id];
    setWalletCoins(nextWallet);
    setOwnedSkins(nextOwned);
    setSelectedSkin(id);
    writeNumber(storageKeys.coins, nextWallet);
    writeJSON(storageKeys.ownedSkins, nextOwned);
    writeString(storageKeys.selectedSkin, id);
  };

  const selectSkin = (id: SkinId) => {
    if (!ownedSkins.includes(id)) return;
    setSelectedSkin(id);
    writeString(storageKeys.selectedSkin, id);
  };

  const claimMission = (id: MissionId) => {
    const { state, coins } = claimReward({ ...missions }, id);
    if (coins > 0) {
      const nextWallet = walletCoins + coins;
      setWalletCoins(nextWallet);
      writeNumber(storageKeys.coins, nextWallet);
    }
    saveMissions(state);
    setMissions({ ...state });
  };

  const claimDailyChallenge = () => {
    const { state, coins } = claimChallenge({ ...missions });
    if (coins > 0) {
      const nextWallet = walletCoins + coins;
      setWalletCoins(nextWallet);
      writeNumber(storageKeys.coins, nextWallet);
    }
    saveMissions(state);
    setMissions({ ...state });
  };

  const handleShare = async () => {
    if (!runStats) return;
    const text = `רצתי ${runStats.meters} מטר ב-TLV Rush. שיא ${runStats.score}. נראה אותך עוקף אותי!`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        setShareCopied(false);
      }
    }
  };

  const actuallyStartRun = useCallback(() => {
    setRunId((r) => r + 1);
    viewRef.current = "playing";
    setView("playing");
    startMusic();
  }, []);

  // From the menu Start button: detour to character select on first ever run.
  const handlePlayPressed = useCallback(() => {
    if (!characterChosen) {
      setView("character");
    } else {
      actuallyStartRun();
    }
  }, [characterChosen, actuallyStartRun]);

  const openCharacterSelect = useCallback(() => {
    setView("character");
  }, []);

  const confirmCharacter = useCallback(
    (id: SkinId) => {
      setSelectedSkin(id);
      writeString(storageKeys.selectedSkin, id);
      writeString(storageKeys.selectedCharacter, id);
      if (!characterChosen) {
        setCharacterChosen(true);
        writeString(storageKeys.characterChosen, "1");
      }
      actuallyStartRun();
    },
    [actuallyStartRun, characterChosen],
  );

  const cancelCharacterSelect = useCallback(() => {
    setView("menu");
  }, []);

  const finishTutorial = useCallback(() => {
    writeString(storageKeys.tutorialDone, "1");
    setShowTutorial(false);
  }, []);

  useEffect(() => {
    if (view === "playing") startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [view]);

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none select-none" />

      {(view === "playing" || view === "paused") && (
        <GameHUD
          hearts={hearts}
          score={score}
          coinsHUD={coinsHUD}
          zoneName={zoneName}
          power={powerHUD}
          combo={comboDisplay}
          onPause={() => setGameView("paused")}
        />
      )}

      {view === "menu" && (
        <GameMenu
          selectedSkin={selectedSkin}
          walletCoins={walletCoins}
          best={best}
          missions={missions}
          onPlay={handlePlayPressed}
          onChangeCharacter={openCharacterSelect}
          onShop={() => setView("shop")}
          onMissions={() => setView("missions")}
          onLegend={() => setShowLegend(true)}
        />
      )}

      {view === "character" && (
        <CharacterSelect
          current={characterChosen ? selectedSkin : null}
          hasPicked={characterChosen}
          onConfirm={confirmCharacter}
          onCancel={cancelCharacterSelect}
        />
      )}

      {view === "paused" && (
        <GamePause
          onResume={() => setGameView("playing")}
          onRestart={actuallyStartRun}
          onMenu={() => setView("menu")}
          onLegend={() => setShowLegend(true)}
        />
      )}

      {view === "over" && runStats && (
        <GameOver
          runStats={runStats}
          best={best}
          isNewBest={isNewBest}
          shareCopied={shareCopied}
          character={runCharacter}
          missionsProgressed={missionsProgressed}
          newAchievements={
            newAchievements.map((id) => achievementById(id)).filter(Boolean) as {
              id: string;
              label: string;
              emoji: string;
            }[]
          }
          onReplay={actuallyStartRun}
          onShare={handleShare}
          onMenu={() => setView("menu")}
          onMissions={() => setView("missions")}
          onShop={() => setView("shop")}
        />
      )}

      {view === "shop" && (
        <Shop
          coins={walletCoins}
          ownedSkins={ownedSkins}
          selectedSkin={selectedSkin}
          onBuy={buySkin}
          onSelect={selectSkin}
          onClose={() => setView("menu")}
        />
      )}

      {view === "missions" && (
        <MissionsPanel
          state={missions}
          onClaim={claimMission}
          onClaimChallenge={claimDailyChallenge}
          onClose={() => setView("menu")}
        />
      )}

      {view === "menu" && showTutorial && <Tutorial onDone={finishTutorial} />}

      {showLegend && <LegendPanel onClose={() => setShowLegend(false)} />}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}
