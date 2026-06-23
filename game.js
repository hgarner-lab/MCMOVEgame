"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;
const GRID_COLS = 13;
const GRID_ROWS = 15;
const TILE_W = CANVAS_WIDTH / GRID_COLS;
const TILE_H = CANVAS_HEIGHT / GRID_ROWS;
const PLAYER_SIZE = 30;

const STATES = {
  START: "start",
  PLAYING: "playing",
  LEVEL_COMPLETE: "levelComplete",
  GAME_OVER: "gameOver",
  SUMMARY: "summary",
};

const LEVELS = [
  {
    name: "Supplier Payment",
    goal: 1,
    speedScale: 0.78,
    frictionBonus: 0,
    railBonus: 0,
    bonus: 1200,
  },
  {
    name: "Marketplace Payout",
    goal: 2,
    speedScale: 1,
    frictionBonus: 1,
    railBonus: 0,
    bonus: 2200,
  },
  {
    name: "Month-End Run",
    goal: 3,
    speedScale: 1.22,
    frictionBonus: 1,
    railBonus: -1,
    bonus: 3600,
  },
];

const BASE_LANES = [
  {
    row: 2,
    type: "friction",
    label: "Settlement Risk",
    icon: "warning",
    color: "#ff3131",
    speed: 96,
    direction: 1,
    count: 3,
    widthTiles: 0.78,
  },
  {
    row: 3,
    type: "friction",
    label: "FX Volatility",
    icon: "currency",
    color: "#e767ff",
    speed: 86,
    direction: -1,
    count: 3,
    widthTiles: 0.76,
  },
  {
    row: 4,
    type: "friction",
    label: "Cut-Off Time",
    icon: "clock",
    color: "#ffc400",
    speed: 104,
    direction: 1,
    count: 4,
    widthTiles: 0.7,
  },
  {
    row: 5,
    type: "friction",
    label: "Compliance Check",
    icon: "shield",
    color: "#1caeff",
    speed: 82,
    direction: 1,
    count: 3,
    widthTiles: 0.74,
  },
  {
    row: 6,
    type: "friction",
    label: "Missing Data",
    icon: "document",
    color: "#ff8a00",
    speed: 92,
    direction: 1,
    count: 3,
    widthTiles: 0.72,
  },
  {
    row: 8,
    type: "rail",
    label: "Approved Corridor",
    color: "#7dff2d",
    speed: 72,
    direction: 1,
    count: 3,
    widthTiles: 1.55,
  },
  {
    row: 9,
    type: "rail",
    label: "Real-Time Rail",
    color: "#75ff37",
    speed: 84,
    direction: -1,
    count: 3,
    widthTiles: 1.45,
  },
  {
    row: 10,
    type: "rail",
    label: "Bank Partner Route",
    color: "#99ff4d",
    speed: 66,
    direction: 1,
    count: 3,
    widthTiles: 1.35,
  },
];

const POWER_UPS = {
  trail: {
    name: "Transparency Trail",
    short: "S",
    color: "#1ee9ff",
  },
  shield: {
    name: "Risk Shield",
    short: "[]",
    color: "#36b6ff",
  },
  rail: {
    name: "24/7 Rail",
    short: "24",
    color: "#7dff2d",
  },
};

const SAFE_ROWS = [1, 7, 11, 12, 13];
const START_ROW = 14;
const START_X = CANVAS_WIDTH / 2;
const ARCADE_NATURAL_WIDTH = 1584;
const ARCADE_NATURAL_HEIGHT = 960;

const ui = {
  levelLabel: document.getElementById("levelLabel"),
  scoreValue: document.getElementById("scoreValue"),
  visibilityMeter: document.getElementById("visibilityMeter"),
  visibilityText: document.getElementById("visibilityText"),
  processingWindows: document.getElementById("processingWindows"),
  objectiveText: document.getElementById("objectiveText"),
  deliveryText: document.getElementById("deliveryText"),
  powerupIcon: document.getElementById("powerupIcon"),
  powerupName: document.getElementById("powerupName"),
  powerupHint: document.getElementById("powerupHint"),
  recentEvent: document.getElementById("recentEvent"),
  recentEffect: document.getElementById("recentEffect"),
  businessSignal: document.getElementById("businessSignal"),
  exceptionText: document.getElementById("exceptionText"),
};

const game = {
  mode: STATES.START,
  levelIndex: 0,
  lanes: [],
  player: null,
  score: 0,
  visibility: 0,
  processingWindows: 3,
  levelDelivered: 0,
  totalDelivered: 0,
  exceptions: 0,
  visibilityGained: 0,
  recentEvent: "Press Enter to start",
  recentEffect: "",
  heldPowerUp: null,
  shieldActive: false,
  timers: {
    transparency: 0,
    slow: 0,
  },
  trackingPings: [],
  powerUps: [],
  trackingSpawnTimer: 0,
  powerSpawnTimer: 12,
  currentPaymentHadException: false,
  visibilityAutoTriggered: false,
  lastTime: 0,
  railTrailClock: 0,
};

function setup() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx.imageSmoothingEnabled = false;
  fitArcadeShell();
  buildStaticUi();
  prepareStartScreen();
  bindInput();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", fitArcadeShell);
  }
  requestAnimationFrame(gameLoop);
}

function fitArcadeShell() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const shell = document.querySelector(".arcade-shell");
  if (!shell) return;

  const margin = 10;
  const widthScale = (window.innerWidth - margin * 2) / ARCADE_NATURAL_WIDTH;
  const heightScale = (window.innerHeight - margin * 2) / ARCADE_NATURAL_HEIGHT;
  const scale = clamp(Math.min(1, widthScale, heightScale), 0.1, 1);
  const fittedWidth = ARCADE_NATURAL_WIDTH * scale;
  const fittedHeight = ARCADE_NATURAL_HEIGHT * scale;

  document.body.classList.add("fit-arcade");
  document.documentElement.style.setProperty("--arcade-scale", String(scale));
  shell.style.left = `${Math.max(margin, (window.innerWidth - fittedWidth) / 2)}px`;
  shell.style.top = `${Math.max(margin, (window.innerHeight - fittedHeight) / 2)}px`;
  document.body.style.minHeight = `${Math.ceil(fittedHeight + margin * 2)}px`;
}

function buildStaticUi() {
  ui.visibilityMeter.innerHTML = "";
  for (let index = 0; index < 10; index += 1) {
    const segment = document.createElement("span");
    ui.visibilityMeter.appendChild(segment);
  }

  ui.processingWindows.innerHTML = "";
  for (let index = 0; index < 3; index += 1) {
    const windowEl = document.createElement("span");
    ui.processingWindows.appendChild(windowEl);
  }
}

function prepareStartScreen() {
  resetRunStats();
  loadLevel(0);
  game.mode = STATES.START;
  setRecentEvent("Press Enter to start", "Move payments. Power business.");
  updateHud();
}

function resetRunStats() {
  game.levelIndex = 0;
  game.score = 0;
  game.visibility = 0;
  game.processingWindows = 3;
  game.levelDelivered = 0;
  game.totalDelivered = 0;
  game.exceptions = 0;
  game.visibilityGained = 0;
  game.heldPowerUp = null;
  game.shieldActive = false;
  game.timers.transparency = 0;
  game.timers.slow = 0;
  game.visibilityAutoTriggered = false;
  game.currentPaymentHadException = false;
}

function startNewRun() {
  resetRunStats();
  loadLevel(0);
  game.mode = STATES.PLAYING;
  setRecentEvent("Payment packet initiated", "Reach the Supplier Zone");
  updateHud();
  canvas.focus();
}

function loadLevel(levelIndex) {
  game.levelIndex = levelIndex;
  game.levelDelivered = 0;
  game.lanes = BASE_LANES.map((lane) => createLane(lane, LEVELS[levelIndex]));
  game.trackingPings = [];
  game.powerUps = [];
  game.trackingSpawnTimer = 1.2;
  game.powerSpawnTimer = randomBetween(10, 15);
  game.currentPaymentHadException = false;
  resetPlayer();

  for (let index = 0; index < 5; index += 1) {
    spawnTrackingPing();
  }
}

function createLane(baseLane, level) {
  const countOffset = baseLane.type === "friction" ? level.frictionBonus : level.railBonus;
  const count = Math.max(2, baseLane.count + countOffset);
  const width = baseLane.widthTiles * TILE_W;
  const speed = baseLane.speed * level.speedScale * baseLane.direction;
  const spacing = (CANVAS_WIDTH + width * 2) / count;
  const phase = (baseLane.row * 43) % spacing;

  const actors = Array.from({ length: count }, (_, index) => ({
    x: index * spacing - width + phase,
    y: baseLane.row * TILE_H + TILE_H * 0.21,
    width,
    height: TILE_H * 0.58,
    speed,
  }));

  return {
    ...baseLane,
    count,
    width,
    speed,
    actors,
  };
}

function resetPlayer() {
  game.player = {
    x: START_X,
    row: START_ROW,
    trail: [],
  };
  game.railTrailClock = 0;
}

function bindInput() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const movementKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
    if (movementKeys.includes(key) || key === " " || key === "enter") {
      event.preventDefault();
    }

    if (event.repeat && movementKeys.includes(key)) {
      return;
    }

    if (key === "enter") {
      handleEnter();
      return;
    }

    if (key === " ") {
      useHeldPowerUp();
      return;
    }

    if (game.mode !== STATES.PLAYING) {
      return;
    }

    if (key === "arrowup" || key === "w") movePlayer(0, -1);
    if (key === "arrowdown" || key === "s") movePlayer(0, 1);
    if (key === "arrowleft" || key === "a") movePlayer(-1, 0);
    if (key === "arrowright" || key === "d") movePlayer(1, 0);
  });
}

function handleEnter() {
  if (game.mode === STATES.START || game.mode === STATES.GAME_OVER || game.mode === STATES.SUMMARY) {
    startNewRun();
    return;
  }

  if (game.mode === STATES.LEVEL_COMPLETE) {
    const nextLevel = game.levelIndex + 1;
    loadLevel(nextLevel);
    game.mode = STATES.PLAYING;
    setRecentEvent("Next processing run opened", LEVELS[nextLevel].name);
    updateHud();
  }
}

function movePlayer(dx, dy) {
  const previousRow = game.player.row;
  const nextRow = clamp(game.player.row + dy, 0, GRID_ROWS - 1);
  const nextX = clamp(game.player.x + dx * TILE_W, TILE_W * 0.5, CANVAS_WIDTH - TILE_W * 0.5);

  if (nextRow === game.player.row && nextX === game.player.x) {
    return;
  }

  game.player.row = nextRow;
  game.player.x = nextX;
  addPlayerTrail();

  if (dy < 0 && nextRow < previousRow) {
    addScore(10);
  }
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - game.lastTime) / 1000 || 0, 0.05);
  game.lastTime = timestamp;

  if (game.mode === STATES.PLAYING) {
    updateGame(delta);
  }

  drawGame(timestamp / 1000);
  updateHud();
  requestAnimationFrame(gameLoop);
}

function updateGame(delta) {
  updateTimers(delta);
  updateLanes(delta);
  updatePlayerTrail(delta);
  updateCollectibles(delta);

  if (game.player.row === 0) {
    deliverPayment();
    return;
  }

  const lane = getLaneForRow(game.player.row);
  if (!lane) {
    return;
  }

  if (lane.type === "friction") {
    const hit = lane.actors.some((actor) => rectsOverlap(getPlayerRect(0.85), actor));
    if (hit) {
      processException("Payment sent to exception queue");
    }
    return;
  }

  const rail = lane.actors.find((actor) => rectsOverlap(getPlayerRect(0.95), actor));
  if (!rail) {
    processException("Payment sent to exception queue");
    return;
  }

  game.player.x += rail.currentSpeed * delta;
  game.railTrailClock += delta;
  if (game.railTrailClock > 0.08) {
    addPlayerTrail();
    game.railTrailClock = 0;
  }

  if (game.player.x < PLAYER_SIZE / 2 || game.player.x > CANVAS_WIDTH - PLAYER_SIZE / 2) {
    processException("Payment sent to exception queue");
  }
}

function updateTimers(delta) {
  game.timers.transparency = Math.max(0, game.timers.transparency - delta);
  game.timers.slow = Math.max(0, game.timers.slow - delta);
}

function updateLanes(delta) {
  const slowFactor = game.timers.slow > 0 ? 0.48 : 1;
  for (const lane of game.lanes) {
    for (const actor of lane.actors) {
      actor.currentSpeed = lane.speed * slowFactor;
      actor.x += actor.currentSpeed * delta;

      if (actor.currentSpeed > 0 && actor.x > CANVAS_WIDTH + TILE_W) {
        actor.x = -actor.width - randomBetween(20, 120);
      }

      if (actor.currentSpeed < 0 && actor.x + actor.width < -TILE_W) {
        actor.x = CANVAS_WIDTH + randomBetween(20, 120);
      }
    }
  }
}

function updatePlayerTrail(delta) {
  for (const dot of game.player.trail) {
    dot.life -= delta * 2.6;
  }
  game.player.trail = game.player.trail.filter((dot) => dot.life > 0);
}

function updateCollectibles(delta) {
  game.trackingSpawnTimer -= delta;
  if (game.trackingSpawnTimer <= 0) {
    if (game.trackingPings.length < 7) {
      spawnTrackingPing();
    }
    game.trackingSpawnTimer = randomBetween(3.2, 5.4);
  }

  game.powerSpawnTimer -= delta;
  if (game.powerSpawnTimer <= 0) {
    if (!game.heldPowerUp && !hasActivePowerEffect() && game.powerUps.length === 0) {
      spawnPowerUp();
    }
    game.powerSpawnTimer = randomBetween(10, 15);
  }

  collectTrackingPings();
  collectPowerUps();
}

function spawnTrackingPing() {
  const spot = getOpenSafeSpot();
  if (!spot) return;
  game.trackingPings.push({
    x: spot.x,
    row: spot.row,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnPowerUp() {
  const keys = Object.keys(POWER_UPS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const spot = getOpenSafeSpot();
  if (!spot) return;
  game.powerUps.push({
    key,
    x: spot.x,
    row: spot.row,
    pulse: Math.random() * Math.PI * 2,
  });
}

function getOpenSafeSpot() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const row = SAFE_ROWS[Math.floor(Math.random() * SAFE_ROWS.length)];
    const col = Math.floor(randomBetween(1, GRID_COLS - 1));
    const x = col * TILE_W + TILE_W * 0.5;
    const occupied = [...game.trackingPings, ...game.powerUps].some(
      (item) => item.row === row && Math.abs(item.x - x) < TILE_W * 0.75,
    );
    const playerNear = game.player && game.player.row === row && Math.abs(game.player.x - x) < TILE_W;
    if (!occupied && !playerNear) {
      return { row, x };
    }
  }
  return null;
}

function collectTrackingPings() {
  const before = game.trackingPings.length;
  game.trackingPings = game.trackingPings.filter((ping) => {
    const collected = ping.row === game.player.row && Math.abs(ping.x - game.player.x) < TILE_W * 0.42;
    if (collected) {
      addScore(100);
      game.visibility = Math.min(100, game.visibility + 12);
      game.visibilityGained += 12;
      setRecentEvent("Tracking Ping collected", "+ Visibility");
      if (game.visibility >= 100 && !game.visibilityAutoTriggered) {
        game.visibilityAutoTriggered = true;
        activatePowerUp("trail", true);
      }
    }
    return !collected;
  });

  if (before !== game.trackingPings.length) {
    spawnTrackingPing();
  }
}

function collectPowerUps() {
  if (game.heldPowerUp || hasActivePowerEffect()) return;
  game.powerUps = game.powerUps.filter((power) => {
    const collected = power.row === game.player.row && Math.abs(power.x - game.player.x) < TILE_W * 0.46;
    if (collected) {
      game.heldPowerUp = power.key;
      setRecentEvent(`${POWER_UPS[power.key].name} ready`, "Press SPACE to use");
    }
    return !collected;
  });
}

function hasActivePowerEffect() {
  return game.timers.transparency > 0 || game.timers.slow > 0 || game.shieldActive;
}

function useHeldPowerUp() {
  if (game.mode !== STATES.PLAYING || !game.heldPowerUp) {
    return;
  }

  const key = game.heldPowerUp;
  game.heldPowerUp = null;
  activatePowerUp(key, false);
}

function activatePowerUp(key, automatic) {
  if (key === "trail") {
    game.timers.transparency = 5;
    setRecentEvent("Transparency Trail active", automatic ? "Visibility reached 100%" : "Guide line opened");
  }

  if (key === "shield") {
    game.shieldActive = true;
    setRecentEvent("Risk Shield armed", "One exception protected");
  }

  if (key === "rail") {
    game.timers.slow = 5;
    setRecentEvent("24/7 Rail active", "Route friction slowed");
  }
}

function processException(message) {
  if (game.mode !== STATES.PLAYING) {
    return;
  }

  if (game.shieldActive) {
    game.shieldActive = false;
    setRecentEvent("Risk Shield absorbed exception", "Processing window preserved");
    resetPlayer();
    return;
  }

  game.exceptions += 1;
  game.processingWindows -= 1;
  game.currentPaymentHadException = true;
  setRecentEvent(message, `${game.processingWindows} processing window${game.processingWindows === 1 ? "" : "s"} remaining`);

  if (game.processingWindows <= 0) {
    game.mode = STATES.GAME_OVER;
    setRecentEvent("Payment failed", "Processing windows closed");
    return;
  }

  resetPlayer();
}

function deliverPayment() {
  addScore(1000);
  let effect = "+1000 delivered";
  if (!game.currentPaymentHadException) {
    addScore(500);
    effect = "+1000 delivered, +500 clean run";
  }

  game.levelDelivered += 1;
  game.totalDelivered += 1;
  game.currentPaymentHadException = false;
  setRecentEvent("Payment delivered", effect);

  const level = LEVELS[game.levelIndex];
  if (game.levelDelivered >= level.goal) {
    addScore(level.bonus);
    if (game.levelIndex === LEVELS.length - 1) {
      game.mode = STATES.SUMMARY;
      setRecentEvent("Month-End Run Complete", "Business outcome summary ready");
      return;
    }
    game.mode = STATES.LEVEL_COMPLETE;
    return;
  }

  resetPlayer();
}

function addScore(points) {
  game.score += points;
}

function setRecentEvent(eventText, effectText) {
  game.recentEvent = eventText;
  game.recentEffect = effectText || "";
}

function getLaneForRow(row) {
  return game.lanes.find((lane) => lane.row === row);
}

function getPlayerRect(scale = 1) {
  const size = PLAYER_SIZE * scale;
  return {
    x: game.player.x - size / 2,
    y: game.player.row * TILE_H + TILE_H / 2 - size / 2,
    width: size,
    height: size,
  };
}

function addPlayerTrail() {
  game.player.trail.push({
    x: game.player.x,
    y: game.player.row * TILE_H + TILE_H / 2,
    life: 1,
  });

  if (game.player.trail.length > 16) {
    game.player.trail.shift();
  }
}

function updateHud() {
  const level = LEVELS[game.levelIndex] || LEVELS[0];
  ui.levelLabel.textContent = `Level ${game.levelIndex + 1}: ${level.name}`;
  ui.scoreValue.textContent = game.score.toLocaleString("en-US");
  ui.visibilityText.textContent = `${Math.round(game.visibility)}%`;
  ui.objectiveText.textContent = `Deliver ${level.goal} payment${level.goal === 1 ? "" : "s"} to suppliers`;
  ui.deliveryText.textContent = `${game.levelDelivered} / ${level.goal}`;
  ui.recentEvent.textContent = game.recentEvent;
  ui.recentEffect.textContent = game.recentEffect;
  ui.exceptionText.textContent = String(game.exceptions);
  ui.businessSignal.textContent = getBusinessSignal();

  const activeSegments = Math.ceil(game.visibility / 10);
  [...ui.visibilityMeter.children].forEach((segment, index) => {
    segment.classList.toggle("active", index < activeSegments);
  });

  [...ui.processingWindows.children].forEach((windowEl, index) => {
    windowEl.classList.toggle("used", index >= game.processingWindows);
  });

  updatePowerUpUi();
}

function updatePowerUpUi() {
  let key = game.heldPowerUp;
  let name = "None";
  let icon = "--";
  let color = "#aeb9c6";
  let hint = "Collect a power-up";

  if (game.timers.transparency > 0) {
    key = "trail";
    hint = `${Math.ceil(game.timers.transparency)}s guide active`;
  } else if (game.shieldActive) {
    key = "shield";
    hint = "Protecting one exception";
  } else if (game.timers.slow > 0) {
    key = "rail";
    hint = `${Math.ceil(game.timers.slow)}s route easing`;
  } else if (game.heldPowerUp) {
    hint = "Press SPACE to use";
  }

  if (key && key !== game.heldPowerUp && game.heldPowerUp) {
    hint = `${POWER_UPS[game.heldPowerUp].name} held; ${hint}`;
  }

  if (key) {
    name = POWER_UPS[key].name;
    icon = POWER_UPS[key].short;
    color = POWER_UPS[key].color;
  }

  ui.powerupName.textContent = name;
  ui.powerupHint.textContent = hint;
  ui.powerupIcon.textContent = icon;
  ui.powerupIcon.style.color = color;
}

function getBusinessSignal() {
  if (game.mode === STATES.START) return "Route visibility awaiting start";
  if (game.mode === STATES.SUMMARY) return "Suppliers paid, cash flow visible";
  if (game.processingWindows <= 1) return "Exception pressure increasing";
  if (game.visibility >= 72) return "Route visibility improving";
  if (game.totalDelivered > 0) return "Supplier delivery momentum building";
  return "Payment route in progress";
}

function drawGame(time) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground(time);
  drawZones();
  drawLanes(time);
  drawCollectibles(time);
  drawTransparencyTrail(time);
  drawPlayer(time);

  if (game.mode === STATES.START) drawStartScreen(time);
  if (game.mode === STATES.LEVEL_COMPLETE) drawLevelComplete();
  if (game.mode === STATES.GAME_OVER) drawGameOver();
  if (game.mode === STATES.SUMMARY) drawSummary();
}

function drawBackground(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#041328");
  gradient.addColorStop(0.48, "#020815");
  gradient.addColorStop(1, "#04101f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#0b5f92";
  ctx.lineWidth = 1;
  for (let col = 0; col <= GRID_COLS; col += 1) {
    const x = Math.round(col * TILE_W) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let row = 0; row <= GRID_ROWS; row += 1) {
    const y = Math.round(row * TILE_H) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  drawCityline(0, 1, time);
  drawCityline(CANVAS_HEIGHT - TILE_H * 1.7, -1, time);
}

function drawCityline(baseY, direction, time) {
  ctx.save();
  ctx.globalAlpha = 0.52;
  for (let index = 0; index < 34; index += 1) {
    const width = 18 + (index % 4) * 8;
    const height = 18 + ((index * 13) % 56);
    const x = index * 31 - 16;
    const y = direction > 0 ? baseY + TILE_H * 0.9 - height : baseY + height * 0.15;
    ctx.fillStyle = "#061b33";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#0a74b7";
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
    ctx.fillStyle = (index + Math.floor(time * 2)) % 5 === 0 ? "#ffc400" : "#13caff";
    for (let dot = 0; dot < 4; dot += 1) {
      ctx.fillRect(x + 5 + (dot % 2) * 8, y + 7 + Math.floor(dot / 2) * 11, 3, 4);
    }
  }
  ctx.restore();
}

function drawZones() {
  drawZoneBand(0, 1.65, "#7dff2d", "SUPPLIER ZONE", "FUNDS RECEIVED");
  drawZoneBand(13.25, 1.75, "#1ee9ff", "BUYER / TREASURY", "PAYMENT INITIATED");
}

function drawZoneBand(rowStart, rowSpan, color, title, subtitle) {
  const y = rowStart * TILE_H;
  const height = rowSpan * TILE_H;
  ctx.save();
  ctx.fillStyle = hexToRgba(color, 0.08);
  ctx.fillRect(0, y, CANVAS_WIDTH, height);
  ctx.strokeStyle = hexToRgba(color, 0.78);
  ctx.setLineDash([9, 5]);
  ctx.strokeRect(8.5, y + 8.5, CANVAS_WIDTH - 17, height - 17);
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.font = "700 24px Courier New";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(title, CANVAS_WIDTH / 2, y + height * 0.45);
  ctx.font = "700 17px Courier New";
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, y + height * 0.72);

  for (let index = 0; index < 3; index += 1) {
    const flagX = CANVAS_WIDTH / 2 - 150 + index * 150;
    drawFinishFlag(flagX, y + height * 0.26, color);
  }
  ctx.restore();
}

function drawFinishFlag(x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 25, y + 6);
  ctx.lineTo(x, y + 13);
  ctx.stroke();
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(x + 4 + col * 6, y + 3 + row * 5, 5, 5);
      }
    }
  }
  ctx.restore();
}

function drawLanes(time) {
  for (const lane of game.lanes) {
    drawLaneBackground(lane);
    drawLaneLabel(lane);
    for (const actor of lane.actors) {
      if (lane.type === "rail") drawRail(actor, lane, time);
      if (lane.type === "friction") drawObstacle(actor, lane, time);
    }
  }
}

function drawLaneBackground(lane) {
  const y = lane.row * TILE_H;
  ctx.save();
  ctx.fillStyle = hexToRgba(lane.color, lane.type === "rail" ? 0.08 : 0.055);
  ctx.fillRect(0, y, CANVAS_WIDTH, TILE_H);
  ctx.strokeStyle = lane.type === "rail" ? "rgba(125, 255, 45, 0.34)" : "rgba(255, 255, 255, 0.22)";
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(CANVAS_WIDTH, y + 0.5);
  ctx.moveTo(0, y + TILE_H + 0.5);
  ctx.lineTo(CANVAS_WIDTH, y + TILE_H + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawLaneLabel(lane) {
  const y = lane.row * TILE_H + TILE_H / 2;
  ctx.save();
  const labelWidth = lane.label.length > 15 ? 180 : 150;
  ctx.fillStyle = "rgba(2, 7, 16, 0.82)";
  ctx.fillRect(0, lane.row * TILE_H + 5, labelWidth, TILE_H - 10);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "700 14px Courier New";
  ctx.fillStyle = lane.color;
  ctx.shadowColor = lane.color;
  ctx.shadowBlur = 8;
  ctx.fillText(lane.label.toUpperCase(), 12, y);
  ctx.restore();
}

function drawObstacle(actor, lane, time) {
  ctx.save();
  ctx.translate(actor.x, actor.y);
  ctx.shadowColor = lane.color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = lane.color;
  ctx.fillStyle = hexToRgba(lane.color, 0.2);
  ctx.lineWidth = 3;

  drawMotionBits(actor.width, actor.height, lane, time);

  if (lane.icon === "warning") drawWarningIcon(actor.width, actor.height, lane.color);
  if (lane.icon === "currency") drawCurrencyIcon(actor.width, actor.height, lane.color);
  if (lane.icon === "clock") drawClockIcon(actor.width, actor.height, lane.color);
  if (lane.icon === "shield") drawShieldIcon(actor.width, actor.height, lane.color);
  if (lane.icon === "document") drawDocumentIcon(actor.width, actor.height, lane.color);
  ctx.restore();
}

function drawMotionBits(width, height, lane, time) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = lane.color;
  const trailDirection = lane.direction > 0 ? -1 : 1;
  for (let index = 0; index < 9; index += 1) {
    const x = trailDirection > 0 ? width + 8 + index * 9 : -14 - index * 9;
    const flicker = (index + Math.floor(time * 8)) % 3 === 0 ? 1 : 0.38;
    ctx.globalAlpha = flicker * 0.45;
    ctx.fillRect(x, height * 0.44, 5, 4);
  }
  ctx.restore();
}

function drawWarningIcon(width, height, color) {
  ctx.beginPath();
  ctx.moveTo(width / 2, 4);
  ctx.lineTo(width - 7, height - 5);
  ctx.lineTo(7, height - 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "900 22px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", width / 2, height * 0.58);
}

function drawCurrencyIcon(width, height, color) {
  ctx.fillRect(5, 4, width - 10, height - 8);
  ctx.strokeRect(5.5, 4.5, width - 11, height - 9);
  ctx.fillStyle = color;
  ctx.font = "900 24px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", width / 2, height / 2 + 1);
}

function drawClockIcon(width, height, color) {
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(width / 2, height / 2);
  ctx.lineTo(width / 2, height / 2 - 9);
  ctx.moveTo(width / 2, height / 2);
  ctx.lineTo(width / 2 + 9, height / 2 + 5);
  ctx.stroke();
}

function drawShieldIcon(width, height, color) {
  ctx.beginPath();
  ctx.moveTo(width / 2, 4);
  ctx.lineTo(width - 8, 10);
  ctx.lineTo(width - 12, height - 9);
  ctx.lineTo(width / 2, height - 3);
  ctx.lineTo(8, height - 9);
  ctx.lineTo(8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(width * 0.34, height * 0.52);
  ctx.lineTo(width * 0.47, height * 0.66);
  ctx.lineTo(width * 0.7, height * 0.35);
  ctx.stroke();
}

function drawDocumentIcon(width, height, color) {
  ctx.fillRect(9, 3, width - 18, height - 6);
  ctx.strokeRect(9.5, 3.5, width - 19, height - 7);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(width - 21, 3);
  ctx.lineTo(width - 21, 14);
  ctx.lineTo(width - 10, 14);
  ctx.moveTo(18, height * 0.45);
  ctx.lineTo(width - 18, height * 0.45);
  ctx.moveTo(18, height * 0.62);
  ctx.lineTo(width - 26, height * 0.62);
  ctx.stroke();
}

function drawRail(actor, lane, time) {
  ctx.save();
  ctx.translate(actor.x, actor.y + 3);
  ctx.shadowColor = lane.color;
  ctx.shadowBlur = 13;
  ctx.fillStyle = hexToRgba(lane.color, 0.25);
  ctx.strokeStyle = lane.color;
  ctx.lineWidth = 3;
  ctx.fillRect(0, 0, actor.width, actor.height - 6);
  ctx.strokeRect(0.5, 0.5, actor.width - 1, actor.height - 7);

  ctx.fillStyle = lane.color;
  const arrow = lane.direction > 0 ? ">>" : "<<";
  ctx.font = "900 18px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(arrow, actor.width / 2, actor.height / 2 - 3);

  ctx.globalAlpha = 0.62 + Math.sin(time * 8 + actor.x * 0.01) * 0.25;
  for (let index = 0; index < actor.width; index += 14) {
    ctx.fillRect(index, actor.height - 9, 7, 4);
  }
  ctx.restore();
}

function drawCollectibles(time) {
  for (const ping of game.trackingPings) {
    drawTrackingPing(ping, time);
  }

  for (const power of game.powerUps) {
    drawPowerUp(power, time);
  }
}

function drawTrackingPing(ping, time) {
  const x = ping.x;
  const y = ping.row * TILE_H + TILE_H / 2;
  const pulse = 1 + Math.sin(time * 5 + ping.pulse) * 0.18;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#1ee9ff";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#1ee9ff";
  ctx.fillStyle = "rgba(30, 233, 255, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 10 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d9fbff";
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();
}

function drawPowerUp(power, time) {
  const def = POWER_UPS[power.key];
  const x = power.x;
  const y = power.row * TILE_H + TILE_H / 2;
  const lift = Math.sin(time * 4 + power.pulse) * 3;
  ctx.save();
  ctx.translate(x, y + lift);
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = def.color;
  ctx.fillStyle = hexToRgba(def.color, 0.22);
  ctx.lineWidth = 3;
  ctx.fillRect(-17, -17, 34, 34);
  ctx.strokeRect(-17.5, -17.5, 35, 35);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 15px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.short, 0, 1);
  ctx.restore();
}

function drawTransparencyTrail(time) {
  if (game.timers.transparency <= 0 || game.mode !== STATES.PLAYING) {
    return;
  }

  const pulse = 0.5 + Math.sin(time * 7) * 0.25;
  ctx.save();
  ctx.globalAlpha = 0.45 + pulse;
  ctx.strokeStyle = "#1ee9ff";
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 10]);
  ctx.shadowColor = "#1ee9ff";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(game.player.x, game.player.row * TILE_H + TILE_H / 2);
  ctx.lineTo(game.player.x, TILE_H * 0.9);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPlayer(time) {
  if (!game.player) return;

  for (const dot of game.player.trail) {
    ctx.save();
    ctx.globalAlpha = dot.life * 0.58;
    ctx.fillStyle = "#ffb000";
    ctx.shadowColor = "#ff8a00";
    ctx.shadowBlur = 10;
    ctx.fillRect(dot.x - 5, dot.y - 5, 10, 10);
    ctx.restore();
  }

  const x = game.player.x;
  const y = game.player.row * TILE_H + TILE_H / 2;
  const bob = game.mode === STATES.PLAYING ? Math.sin(time * 8) * 1.5 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.shadowColor = game.shieldActive ? "#36b6ff" : "#ff8a00";
  ctx.shadowBlur = game.shieldActive ? 24 : 18;
  ctx.fillStyle = "#ff8a00";
  ctx.fillRect(-16, -16, 32, 32);
  ctx.fillStyle = "#ffd75a";
  ctx.fillRect(-10, -10, 20, 20);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-5, -5, 10, 10);
  ctx.strokeStyle = game.shieldActive ? "#36b6ff" : "#fff2a6";
  ctx.lineWidth = 3;
  ctx.strokeRect(-17.5, -17.5, 35, 35);

  if (game.shieldActive) {
    ctx.strokeStyle = "#36b6ff";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStartScreen(time) {
  drawOverlayPanel();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#f7fbff";
  ctx.font = "900 30px Courier New";
  ctx.fillText("CROSS-BORDER", CANVAS_WIDTH / 2, 238);
  ctx.fillStyle = "#ff8a00";
  ctx.shadowColor = "#ff8a00";
  ctx.shadowBlur = 14;
  ctx.font = "900 54px Courier New";
  ctx.fillText("CROSSING", CANVAS_WIDTH / 2, 294);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1ee9ff";
  ctx.font = "700 20px Courier New";
  ctx.fillText("Move payments. Power business.", CANVAS_WIDTH / 2, 338);
  ctx.fillStyle = Math.sin(time * 5) > 0 ? "#ffc400" : "#ffffff";
  ctx.font = "900 24px Courier New";
  ctx.fillText("PRESS ENTER TO START", CANVAS_WIDTH / 2, 405);
  ctx.fillStyle = "#aeb9c6";
  ctx.font = "16px Courier New";
  ctx.fillText("Arrows / WASD move one tile. SPACE uses a power-up.", CANVAS_WIDTH / 2, 448);
  ctx.restore();
}

function drawLevelComplete() {
  const nextLevel = LEVELS[game.levelIndex + 1];
  drawOverlayPanel();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#7dff2d";
  ctx.shadowColor = "#7dff2d";
  ctx.shadowBlur = 12;
  ctx.font = "900 34px Courier New";
  ctx.fillText("Payment delivered", CANVAS_WIDTH / 2, 282);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px Courier New";
  ctx.fillText(`${LEVELS[game.levelIndex].name} complete`, CANVAS_WIDTH / 2, 328);
  ctx.fillStyle = "#ffc400";
  ctx.fillText(`Next: ${nextLevel.name}`, CANVAS_WIDTH / 2, 374);
  ctx.fillStyle = "#1ee9ff";
  ctx.font = "900 22px Courier New";
  ctx.fillText("PRESS ENTER TO CONTINUE", CANVAS_WIDTH / 2, 430);
  ctx.restore();
}

function drawGameOver() {
  drawOverlayPanel();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff3131";
  ctx.shadowColor = "#ff3131";
  ctx.shadowBlur = 15;
  ctx.font = "900 42px Courier New";
  ctx.fillText("Payment failed", CANVAS_WIDTH / 2, 288);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px Courier New";
  ctx.fillText("Processing windows closed", CANVAS_WIDTH / 2, 342);
  ctx.fillStyle = "#1ee9ff";
  ctx.font = "900 22px Courier New";
  ctx.fillText("PRESS ENTER TO RESTART", CANVAS_WIDTH / 2, 410);
  ctx.restore();
}

function drawSummary() {
  drawOverlayPanel(620, 430);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffc400";
  ctx.shadowColor = "#ffc400";
  ctx.shadowBlur = 12;
  ctx.font = "900 34px Courier New";
  ctx.fillText("Month-End Run Complete", CANVAS_WIDTH / 2, 202);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#7dff2d";
  ctx.font = "900 22px Courier New";
  ctx.fillText("Suppliers paid", CANVAS_WIDTH / 2, 256);
  ctx.fillText("Exceptions reduced", CANVAS_WIDTH / 2, 292);
  ctx.fillText("Cash flow visible", CANVAS_WIDTH / 2, 328);

  ctx.fillStyle = "#ffffff";
  ctx.font = "17px Courier New";
  const lines = [
    `Total score: ${game.score.toLocaleString("en-US")}`,
    `Payments delivered: ${game.totalDelivered}`,
    `Exceptions triggered: ${game.exceptions}`,
    `Final visibility: ${Math.round(game.visibility)}%`,
    `Processing windows remaining: ${Math.max(0, game.processingWindows)}`,
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 384 + index * 29);
  });

  ctx.fillStyle = "#1ee9ff";
  ctx.font = "900 21px Courier New";
  ctx.fillText("PRESS ENTER TO RUN AGAIN", CANVAS_WIDTH / 2, 565);
  ctx.restore();
}

function drawOverlayPanel(width = 620, height = 310) {
  const x = (CANVAS_WIDTH - width) / 2;
  const y = (CANVAS_HEIGHT - height) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(2, 7, 16, 0.9)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "rgba(3, 12, 25, 0.94)";
  ctx.strokeStyle = "#0d76b6";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#0d76b6";
  ctx.shadowBlur = 20;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.restore();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

setup();
