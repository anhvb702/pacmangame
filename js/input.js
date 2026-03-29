/**
 * input.js — Keyboard & mobile touch input handling
 *
 * Depends on globals from game.js: gameState, pacman, SFX, initGame
 */

// ── Keyboard ─────────────────────────────────────
document.addEventListener('keydown', e => {
  // Start screen → play intro jingle
  if (gameState === 'start') {
    SFX.init();
    document.getElementById('startScreen').classList.add('hidden');
    SFX.introJingle();
    gameState = 'intro';
    setTimeout(() => {
      if (gameState === 'intro') { gameState = 'playing'; SFX.startSiren(); }
    }, 2800);
    return;
  }

  // Restart from game-over
  if (gameState === 'gameover') {
    SFX.init();
    document.getElementById('gameOverScreen').classList.add('hidden');
    initGame(); gameState = 'playing'; SFX.startSiren();
    return;
  }

  // Restart from win
  if (gameState === 'win') {
    SFX.init();
    document.getElementById('winScreen').classList.add('hidden');
    initGame(); gameState = 'playing'; SFX.startSiren();
    return;
  }

  // Movement
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': pacman.setDirection(0, -1); e.preventDefault(); break;
    case 'ArrowDown':  case 's': case 'S': pacman.setDirection(0,  1); e.preventDefault(); break;
    case 'ArrowLeft':  case 'a': case 'A': pacman.setDirection(-1, 0); e.preventDefault(); break;
    case 'ArrowRight': case 'd': case 'D': pacman.setDirection( 1, 0); e.preventDefault(); break;
  }
});

// ── Mobile D-pad buttons ─────────────────────────
function setupMobileBtn(id, dx, dy) {
  const btn = document.getElementById(id);

  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameState === 'start') {
      SFX.init();
      document.getElementById('startScreen').classList.add('hidden');
      gameState = 'playing'; SFX.startSiren();
    }
    if (gameState === 'gameover') {
      document.getElementById('gameOverScreen').classList.add('hidden');
      initGame(); gameState = 'playing'; SFX.startSiren();
    }
    if (gameState === 'win') {
      document.getElementById('winScreen').classList.add('hidden');
      initGame(); gameState = 'playing'; SFX.startSiren();
    }
    pacman.setDirection(dx, dy);
  });

  btn.addEventListener('mousedown', () => {
    if (gameState === 'start') {
      SFX.init();
      document.getElementById('startScreen').classList.add('hidden');
      gameState = 'playing'; SFX.startSiren();
    }
    pacman.setDirection(dx, dy);
  });
}

setupMobileBtn('btnUp',    0, -1);
setupMobileBtn('btnDown',  0,  1);
setupMobileBtn('btnLeft', -1,  0);
setupMobileBtn('btnRight', 1,  0);

// ── Bootstrap ────────────────────────────────────
initGame();
gameLoop();
