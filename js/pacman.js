/**
 * pacman.js — Pac-Man entity
 *
 * Depends on globals: TILE, PACMAN_SPEED, COLS, ctx, isWalkable, tileCenter
 */

class Pacman {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = tileCenter(14);
    this.y = tileCenter(23);
    this.dir     = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.mouthAngle = 0.25;
    this.mouthDir   = 1;
    this.angle      = 0;          // radians for visual direction
  }

  setDirection(dx, dy) {
    this.nextDir = { x: dx, y: dy };
  }

  update() {
    // Try queued direction first
    if (this.nextDir.x !== 0 || this.nextDir.y !== 0) {
      if (this.canMove(this.nextDir.x, this.nextDir.y)) {
        this.dir = { ...this.nextDir };
      }
    }

    // Move in current direction
    if (this.dir.x !== 0 || this.dir.y !== 0) {
      if (this.canMove(this.dir.x, this.dir.y)) {
        this.x += this.dir.x * PACMAN_SPEED;
        this.y += this.dir.y * PACMAN_SPEED;
      }
    }

    // Tunnel wrap
    if (this.x < -TILE / 2)           this.x = COLS * TILE + TILE / 2;
    if (this.x > COLS * TILE + TILE / 2) this.x = -TILE / 2;

    // Snap to grid (smooth alignment)
    const col = Math.round((this.x - TILE / 2) / TILE);
    const row = Math.round((this.y - TILE / 2) / TILE);
    if (this.dir.x !== 0) this.y += (tileCenter(row) - this.y) * 0.3;
    if (this.dir.y !== 0) this.x += (tileCenter(col) - this.x) * 0.3;

    // Mouth animation
    this.mouthAngle += 0.04 * this.mouthDir;
    if (this.mouthAngle > 0.35) this.mouthDir = -1;
    if (this.mouthAngle < 0.02) this.mouthDir =  1;

    // Facing angle
    if (this.dir.x ===  1) this.angle = 0;
    if (this.dir.x === -1) this.angle = Math.PI;
    if (this.dir.y === -1) this.angle = -Math.PI / 2;
    if (this.dir.y ===  1) this.angle =  Math.PI / 2;
  }

  canMove(dx, dy) {
    const nx = this.x + dx * PACMAN_SPEED;
    const ny = this.y + dy * PACMAN_SPEED;
    const r  = TILE / 2 - 2;
    const corners = [
      { x: nx - r, y: ny - r },
      { x: nx + r, y: ny - r },
      { x: nx - r, y: ny + r },
      { x: nx + r, y: ny + r },
    ];
    for (const c of corners) {
      if (!isWalkable(Math.floor(c.x / TILE), Math.floor(c.y / TILE))) return false;
    }
    return true;
  }

  getTile() {
    return { col: Math.floor(this.x / TILE), row: Math.floor(this.y / TILE) };
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.arc(0, 0, TILE / 2 - 1, this.mouthAngle * Math.PI, (2 - this.mouthAngle) * Math.PI);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    ctx.restore();
  }
}
