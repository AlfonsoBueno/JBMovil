// Efectos de sonido procedurales con Web Audio (sin ficheros de audio)
const SFX = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  toggle() { this.muted = !this.muted; return this.muted; },
  tone(freq, dur, type = "square", vol = 0.15, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  },
  jump()    { this.tone(300, 0.18, "square", 0.12, 620); },
  claw()    { this.tone(820, 0.10, "sawtooth", 0.12, 200); },
  coin()    { this.tone(880, 0.07, "square", 0.12); setTimeout(() => this.tone(1320, 0.09, "square", 0.12), 70); },
  throwPan(){ this.tone(180, 0.15, "triangle", 0.10, 90); },
  deflect() { this.tone(1200, 0.08, "square", 0.18, 400); setTimeout(() => this.tone(700, 0.12, "sawtooth", 0.14), 40); },
  hurt()    { this.tone(200, 0.25, "sawtooth", 0.18, 70); },
  stun()    { this.tone(140, 0.4, "square", 0.18, 60); },
  win()     { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "square", 0.16), i * 130)); },
  lose()    { [400, 320, 240, 160].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, "sawtooth", 0.16), i * 150)); },
};
