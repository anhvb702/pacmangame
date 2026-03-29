/**
 * sound.js — Web Audio API synthesized sound effects
 *
 * All sounds are generated procedurally — no external files.
 */

const SFX = {
  ctx: null,
  muted: false,
  sirenOsc: null,
  sirenGain: null,
  wakaToggle: false,

  /** Create / resume the AudioContext (must be called after user gesture). */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  // ── Utility: schedule a single tone ────────────
  _tone(freq, duration, type = 'square', vol = 0.10, delay = 0) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start(this.ctx.currentTime + delay);
    o.stop(this.ctx.currentTime + delay + duration + 0.01);
  },

  // ── Waka-waka (alternating pitch) ──────────────
  waka() {
    this.wakaToggle = !this.wakaToggle;
    this._tone(this.wakaToggle ? 260 : 330, 0.08, 'sine', 0.12);
  },

  // ── Power pellet collected ─────────────────────
  powerPellet() {
    for (let i = 0; i < 6; i++) {
      this._tone(200 + i * 80, 0.12, 'square', 0.08, i * 0.06);
    }
  },

  // ── Ghost eaten ────────────────────────────────
  eatGhost() {
    for (let i = 0; i < 8; i++) {
      this._tone(300 + i * 120, 0.06, 'sawtooth', 0.08, i * 0.04);
    }
  },

  // ── Pac-Man death ──────────────────────────────
  death() {
    for (let i = 0; i < 12; i++) {
      this._tone(800 - i * 50, 0.12, 'sawtooth', 0.08, i * 0.1);
    }
  },

  // ── Game Over jingle ───────────────────────────
  gameOver() {
    const notes = [392, 330, 262, 220, 196, 165];
    notes.forEach((n, i) => this._tone(n, 0.25, 'square', 0.07, i * 0.22));
  },

  // ── Level complete fanfare ─────────────────────
  levelUp() {
    const notes = [523, 587, 659, 784, 880, 988, 1047];
    notes.forEach((n, i) => this._tone(n, 0.12, 'square', 0.07, i * 0.08));
  },

  // ── Win fanfare ────────────────────────────────
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => this._tone(n, 0.18, 'square', 0.07, i * 0.12));
  },

  // ── Intro jingle (classic-inspired) ────────────
  introJingle() {
    if (!this.ctx || this.muted) return;
    const melody = [
      [262, 0.14], [294, 0.14], [330, 0.14], [262, 0.14],
      [330, 0.14], [349, 0.14], [330, 0.28],
      [262, 0.14], [294, 0.14], [330, 0.14], [262, 0.14],
      [196, 0.42],
      [196, 0.14], [262, 0.14], [196, 0.14], [165, 0.28],
    ];
    let t = 0;
    melody.forEach(([freq, dur]) => {
      this._tone(freq, dur * 0.9, 'square', 0.08, t);
      t += dur;
    });
  },

  // ── Background siren (continuous sweep) ────────
  startSiren(frightened = false) {
    this.stopSiren();
    if (!this.ctx || this.muted) return;
    this.sirenOsc  = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();
    this.sirenOsc.type = 'sine';
    this.sirenGain.gain.value = 0.03;
    this.sirenOsc.connect(this.sirenGain).connect(this.ctx.destination);
    if (frightened) {
      this.sirenOsc.frequency.value = 110;
      this._scheduleSiren(110, 140, 0.25);
    } else {
      this.sirenOsc.frequency.value = 200;
      this._scheduleSiren(200, 360, 0.4);
    }
    this.sirenOsc.start();
  },

  _scheduleSiren(low, high, period) {
    if (!this.sirenOsc) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 150; i++) {
      this.sirenOsc.frequency.setValueAtTime(low, now + i * period * 2);
      this.sirenOsc.frequency.linearRampToValueAtTime(high, now + i * period * 2 + period);
      this.sirenOsc.frequency.linearRampToValueAtTime(low, now + (i + 1) * period * 2);
    }
  },

  stopSiren() {
    if (this.sirenOsc) {
      try { this.sirenOsc.stop(); } catch (e) { /* already stopped */ }
      this.sirenOsc = null;
    }
  },

  /** Toggle mute and update the UI button. */
  toggle() {
    this.muted = !this.muted;
    if (this.muted) this.stopSiren();
    document.getElementById('muteBtn').textContent = this.muted ? '\u{1F507}' : '\u{1F50A}';
  }
};
