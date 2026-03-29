/**
 * ghost.js — Ghost entity with unique AI per type
 *
 * Depends on globals: TILE, GHOST_SPEED, GHOST_FRIGHT_SPEED, GHOST_RETURN_SPEED,
 *   COLS, GHOST_COLORS, GHOST_NAMES, SCATTER_TARGETS,
 *   ctx, animFrame, frightTimer, level,
 *   pacman, ghosts, isWalkableForGhost, tileCenter
 */

class Ghost {
  constructor(index) {
    this.index = index;
    this.color = GHOST_COLORS[index];
    this.name  = GHOST_NAMES[index];
    this.reset();
  }

  reset() {
    const startCols = [14, 12, 14, 16];
    const startRows = [11, 14, 14, 14];
    this.x = tileCenter(startCols[this.index]);
    this.y = tileCenter(startRows[this.index]);
    this.dir        = { x: 0, y: -1 };
    this.mode       = 'scatter';       // scatter | chase | frightened | eaten
    this.inHouse    = this.index !== 0; // Only Blinky starts outside
    this.houseTimer = this.index * 120; // stagger exits
    this.speed      = GHOST_SPEED;
    this.prevTile   = { col: -1, row: -1 };
  }

  getTile() {
    return { col: Math.floor(this.x / TILE), row: Math.floor(this.y / TILE) };
  }

  // ── AI target selection ────────────────────────
  getTarget() {
    if (this.mode === 'frightened') return null;
    if (this.mode === 'eaten')     return { col: 14, row: 11 };
    if (this.mode === 'scatter')   return SCATTER_TARGETS[this.index];

    // Chase mode — unique per ghost
    const pt = pacman.getTile();
    switch (this.index) {
      case 0: return pt;                          // Blinky → directly targets Pac-Man
      case 1: return {                             // Pinky  → 4 tiles ahead
        col: pt.col + pacman.dir.x * 4,
        row: pt.row + pacman.dir.y * 4,
      };
      case 2: {                                    // Inky   → double vector from Blinky
        const ahead  = { col: pt.col + pacman.dir.x * 2, row: pt.row + pacman.dir.y * 2 };
        const blinky = ghosts[0].getTile();
        return { col: ahead.col + (ahead.col - blinky.col), row: ahead.row + (ahead.row - blinky.row) };
      }
      case 3: {                                    // Clyde  → chase if far, scatter if close
        const dist = Math.abs(this.getTile().col - pt.col) + Math.abs(this.getTile().row - pt.row);
        return dist > 8 ? pt : SCATTER_TARGETS[3];
      }
    }
  }

  // ── Movement update (once per frame) ───────────
  update() {
    if (this.inHouse) { this._updateInHouse(); return; }

    // Speed selection
    if      (this.mode === 'frightened') this.speed = GHOST_FRIGHT_SPEED;
    else if (this.mode === 'eaten')      this.speed = GHOST_RETURN_SPEED;
    else                                 this.speed = GHOST_SPEED + (level - 1) * 0.15;

    this.x += this.dir.x * this.speed;
    this.y += this.dir.y * this.speed;

    // Tunnel wrap
    if (this.x < -TILE / 2)             this.x = COLS * TILE + TILE / 2;
    if (this.x > COLS * TILE + TILE / 2) this.x = -TILE / 2;

    // Direction decision at each new tile
    const tile = this.getTile();
    const cx = tileCenter(tile.col);
    const cy = tileCenter(tile.row);
    if (Math.abs(this.x - cx) + Math.abs(this.y - cy) < this.speed + 0.5 &&
        (tile.col !== this.prevTile.col || tile.row !== this.prevTile.row)) {
      this.x = cx;
      this.y = cy;
      this.prevTile = { ...tile };

      if (this.mode === 'eaten' && tile.col === 14 && tile.row === 11) {
        this.mode = 'scatter'; this.inHouse = true; this.houseTimer = 60; return;
      }

      this._chooseDirection(tile);
    }

    // Align perpendicular axis
    if (this.dir.x !== 0) this.y += (tileCenter(tile.row) - this.y) * 0.4;
    if (this.dir.y !== 0) this.x += (tileCenter(tile.col) - this.x) * 0.4;
  }

  _updateInHouse() {
    this.houseTimer--;
    if (this.houseTimer <= 0) {
      const doorX = tileCenter(14), doorY = tileCenter(11);
      const dx = doorX - this.x, dy = doorY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        this.inHouse = false; this.x = doorX; this.y = doorY; this.dir = { x: 0, y: -1 };
      } else {
        this.x += (dx / dist) * 2; this.y += (dy / dist) * 2;
      }
    } else {
      this.y += Math.sin(animFrame * 0.1) * 0.5;  // bob up and down
    }
  }

  _chooseDirection(tile) {
    const canUseDoor = this.mode === 'eaten' || this.inHouse;
    const dirs    = [{ x:0,y:-1 }, { x:-1,y:0 }, { x:0,y:1 }, { x:1,y:0 }];
    const reverse = { x: -this.dir.x, y: -this.dir.y };
    const possible = dirs.filter(d => {
      if (d.x === reverse.x && d.y === reverse.y) return false;
      return isWalkableForGhost(tile.col + d.x, tile.row + d.y, canUseDoor);
    });

    if (possible.length === 0) {
      this.dir = reverse;
    } else if (this.mode === 'frightened') {
      this.dir = possible[Math.floor(Math.random() * possible.length)];
    } else {
      const target = this.getTarget();
      let best = possible[0], bestDist = Infinity;
      for (const d of possible) {
        const dist = (tile.col + d.x - target.col) ** 2 + (tile.row + d.y - target.row) ** 2;
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
      this.dir = best;
    }
  }

  // ── Drawing ────────────────────────────────────
  draw() {
    const x = this.x, y = this.y, r = TILE / 2 - 1;
    ctx.save();

    if (this.mode === 'eaten') { this._drawEyes(x, y); ctx.restore(); return; }

    // Body color
    let bodyColor = this.color;
    if (this.mode === 'frightened') {
      const remaining = frightTimer - Date.now();
      bodyColor = (remaining < 2000 && Math.floor(remaining / 200) % 2 === 0) ? '#ffffff' : '#2121de';
    }

    // Body shape (rounded top + wavy bottom)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(x, y - 2, r, Math.PI, 0, false);
    const waveY = y + r - 3;
    ctx.lineTo(x + r, waveY);
    const segW = (r * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const sx = x + r - i * segW;
      ctx.quadraticCurveTo(sx - segW * 0.5, waveY + 3 + Math.sin(animFrame * 0.15 + i) * 1.5, sx - segW, waveY);
    }
    ctx.closePath();
    ctx.fill();

    // Face
    if (this.mode === 'frightened') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 4, y - 4, 3, 3);
      ctx.fillRect(x + 2, y - 4, 3, 3);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 5, y + 3);
      for (let i = 0; i < 5; i++) ctx.lineTo(x - 5 + i * 2.5, y + 3 + (i % 2 === 0 ? 0 : -2));
      ctx.stroke();
    } else {
      this._drawEyes(x, y);
    }
    ctx.restore();
  }

  _drawEyes(x, y) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 4, y - 3, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4, y - 3, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2121de';
    const px = this.dir.x * 2, py = this.dir.y * 2;
    ctx.beginPath(); ctx.arc(x - 4 + px, y - 3 + py, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4 + px, y - 3 + py, 2, 0, Math.PI * 2); ctx.fill();
  }
}
