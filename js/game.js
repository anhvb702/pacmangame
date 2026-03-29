/**
 * game.js — Core game logic: state machine, collisions, mode switching, game loop
 *
 * Depends on globals from: constants.js, sound.js, pacman.js, ghost.js, renderer.js
 */

// ── Canvas setup ─────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;

// ── Game state ───────────────────────────────────
let map, score, lives, level, totalDots, dotsEaten;
let pacman, ghosts;
let frightTimer, frightActive;
let ghostsEatenCombo;
let gameState;            // start | intro | playing | freeze | dying | gameover | win | levelup
let dyingTimer, levelUpTimer;
let highScoreVal = parseInt(localStorage.getItem('pacman_hs') || '0');
let animFrame = 0;

// Freeze state (ghost-eat pause)
let freezeTimer = 0;
let freezeScorePopup = null;   // { x, y, score }

// Mode switching
let modeTimer = 0;
let modeIndex = 0;

// ── Map helpers ──────────────────────────────────
function cloneMap() { return MAP_TEMPLATE.map(r => [...r]); }

function tileCenter(t) { return t * TILE + TILE / 2; }

function isWalkable(col, row) {
  if (col < 0 || col >= COLS) return true;   // tunnel edges
  if (row < 0 || row >= ROWS) return false;
  const t = map[row][col];
  return t !== 0 && t !== 1 && t !== 4;
}

function isWalkableForGhost(col, row, canUseDoor) {
  if (col < 0 || col >= COLS) return true;
  if (row < 0 || row >= ROWS) return false;
  const t = map[row][col];
  if (t === 0 || t === 1 || t === 4) return false;
  if (t === 5 && !canUseDoor)        return false;
  return true;
}

// ── Init / reset ─────────────────────────────────
function initGame() {
  score = 0; lives = 3; level = 1; gameState = 'start';
  initLevel();
}

function initLevel() {
  map = cloneMap();
  pacman = new Pacman();
  ghosts = [new Ghost(0), new Ghost(1), new Ghost(2), new Ghost(3)];
  frightActive = false; frightTimer = 0; ghostsEatenCombo = 0;
  totalDots = 0; dotsEaten = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r][c] === 2 || map[r][c] === 3) totalDots++;
  updateHUD();
}

function resetPositions() {
  pacman.reset();
  ghosts.forEach(g => g.reset());
  frightActive = false; frightTimer = 0;
}

// ── Collision: dots & power pellets ──────────────
function checkDotCollision() {
  const { col, row } = pacman.getTile();
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const t = map[row][col];
  if (t === 2) {
    map[row][col] = 6; score += DOT_SCORE; dotsEaten++;
    SFX.waka(); updateHUD();
  } else if (t === 3) {
    map[row][col] = 6; score += POWER_SCORE; dotsEaten++;
    SFX.powerPellet(); SFX.startSiren(true);
    activateFrightened(); updateHUD();
  }
  // Win check
  if (dotsEaten >= totalDots) {
    if (level >= TOTAL_LEVELS) {
      gameState = 'win'; SFX.stopSiren(); SFX.win();
      document.getElementById('winScore').textContent = score;
      document.getElementById('winScreen').classList.remove('hidden');
      saveHighScore();
    } else {
      gameState = 'levelup'; SFX.stopSiren(); SFX.levelUp();
      levelUpTimer = 90; level++;
    }
  }
}

function activateFrightened() {
  frightActive = true;
  frightTimer  = Date.now() + FRIGHT_DURATION;
  ghostsEatenCombo = 0;
  ghosts.forEach(g => {
    if (g.mode !== 'eaten' && !g.inHouse) {
      g.mode = 'frightened';
      g.dir  = { x: -g.dir.x, y: -g.dir.y };
    }
  });
}

// ── Collision: ghosts ────────────────────────────
function checkGhostCollision() {
  const pr = TILE / 2 - 3;
  for (const g of ghosts) {
    const dist = Math.sqrt((pacman.x - g.x) ** 2 + (pacman.y - g.y) ** 2);
    if (dist < pr + TILE / 2 - 4) {
      if (g.mode === 'frightened') {
        g.mode = 'eaten'; ghostsEatenCombo++;
        const earned = GHOST_SCORE_BASE * Math.pow(2, ghostsEatenCombo - 1);
        score += earned; SFX.eatGhost(); updateHUD();
        gameState = 'freeze'; freezeTimer = 60;
        freezeScorePopup = { x: g.x, y: g.y, score: earned };
        if (frightActive) frightTimer += 1000;
        return;
      } else if (g.mode !== 'eaten') {
        lives--; SFX.stopSiren(); SFX.death(); updateHUD();
        if (lives <= 0) {
          gameState = 'gameover'; SFX.gameOver();
          document.getElementById('finalScore').textContent = score;
          saveHighScore();
          document.getElementById('highScore').textContent = highScoreVal;
          document.getElementById('gameOverScreen').classList.remove('hidden');
        } else {
          gameState = 'dying'; dyingTimer = 60;
        }
        return;
      }
    }
  }
}

function saveHighScore() {
  if (score > highScoreVal) {
    highScoreVal = score;
    localStorage.setItem('pacman_hs', highScoreVal);
  }
}

// ── Ghost mode switching (scatter ↔ chase) ───────
function updateGhostModes() {
  if (frightActive) {
    if (Date.now() > frightTimer) {
      frightActive = false;
      SFX.startSiren(false);
      ghosts.forEach(g => { if (g.mode === 'frightened') g.mode = MODE_SEQUENCE[modeIndex].mode; });
    }
    return;
  }
  modeTimer++;
  if (modeTimer >= MODE_SEQUENCE[modeIndex].duration) {
    modeTimer = 0;
    modeIndex = Math.min(modeIndex + 1, MODE_SEQUENCE.length - 1);
    const newMode = MODE_SEQUENCE[modeIndex].mode;
    ghosts.forEach(g => {
      if (g.mode !== 'eaten' && !g.inHouse) {
        g.mode = newMode;
        g.dir = { x: -g.dir.x, y: -g.dir.y };
      }
    });
  }
}

// ══════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════
function gameLoop() {
  animFrame++;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── State machine ───────────────────────────────
  switch (gameState) {
    case 'playing':
      pacman.update();
      checkDotCollision();
      updateGhostModes();
      ghosts.forEach(g => g.update());
      checkGhostCollision();
      break;

    case 'freeze':
      freezeTimer--;
      if (freezeTimer <= 0) {
        freezeScorePopup = null;
        gameState = 'playing';
        SFX.startSiren(frightActive);
      }
      break;

    case 'dying':
      dyingTimer--;
      if (dyingTimer <= 0) { resetPositions(); gameState = 'playing'; SFX.startSiren(); }
      break;

    case 'levelup':
      levelUpTimer--;
      if (levelUpTimer <= 0) { initLevel(); modeIndex = 0; modeTimer = 0; gameState = 'playing'; SFX.startSiren(); }
      break;
  }

  // ── Render ──────────────────────────────────────
  drawMap();

  if (gameState === 'freeze') {
    pacman.draw();
    ghosts.forEach(g => {
      if (freezeScorePopup && Math.abs(g.x - freezeScorePopup.x) < 2 &&
          Math.abs(g.y - freezeScorePopup.y) < 2 && g.mode === 'eaten') {
        /* skip — score popup replaces this ghost */
      } else { g.draw(); }
    });
    drawScorePopup();
  } else {
    if (gameState !== 'dying' || dyingTimer % 6 < 3) pacman.draw();
    ghosts.forEach(g => g.draw());
  }

  if (gameState === 'levelup' && Math.floor(animFrame / 8) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(gameLoop);
}
