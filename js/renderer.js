/**
 * renderer.js — Map & HUD drawing
 *
 * Depends on globals: TILE, ROWS, COLS, ctx, map, animFrame
 */

// ── Draw the entire maze ─────────────────────────
function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = map[r][c];
      const x = c * TILE;
      const y = r * TILE;

      if (t === 1 || t === 4) {
        // Wall tile
        ctx.fillStyle = '#1a1aff';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#0d0d80';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        // Connecting edges
        ctx.fillStyle = '#2222ff';
        if (r > 0      && (map[r-1][c] === 1 || map[r-1][c] === 4)) ctx.fillRect(x + 2, y, TILE - 4, 2);
        if (r < ROWS-1 && (map[r+1][c] === 1 || map[r+1][c] === 4)) ctx.fillRect(x + 2, y + TILE - 2, TILE - 4, 2);
        if (c > 0      && (map[r][c-1] === 1 || map[r][c-1] === 4)) ctx.fillRect(x, y + 2, 2, TILE - 4);
        if (c < COLS-1 && (map[r][c+1] === 1 || map[r][c+1] === 4)) ctx.fillRect(x + TILE - 2, y + 2, 2, TILE - 4);
      } else if (t === 5) {
        // Ghost-house door
        ctx.fillStyle = '#ffb8ff';
        ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
      } else if (t === 2) {
        // Dot
        ctx.fillStyle = '#ffb851';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 3) {
        // Power pellet (pulsing glow)
        const pulse = 3.5 + Math.sin(animFrame * 0.12) * 1.5;
        ctx.fillStyle = '#ffb851';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = '#ffb851';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

// ── Floating score popup (shown during freeze) ───
function drawScorePopup() {
  if (!freezeScorePopup) return;
  const p = freezeScorePopup;
  ctx.save();
  ctx.font = 'bold 12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00ffff';
  ctx.fillText(p.score, p.x, p.y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── HUD update ───────────────────────────────────
function updateHUD() {
  document.getElementById('scoreVal').textContent = score;
  document.getElementById('levelVal').textContent = level;
  const lc = document.getElementById('livesContainer');
  lc.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const d = document.createElement('div');
    d.className = 'life';
    lc.appendChild(d);
  }
}
