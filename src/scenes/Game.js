function setScaleToHeight(obj, h) { obj.setScale(h / obj.height); return obj; }

class Game extends Phaser.Scene {
  constructor() { super("Game"); }

  create() {
    const W = GAME_W, H = GAME_H;
    this.groundY = RUN.floorY;

    // ---------- FONDO PARALLAX ----------
    this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(W, H).setScrollFactor(0);
    this.bgFar  = this.add.tileSprite(0, H - 300, W, 300, "bg_far").setOrigin(0).setAlpha(0.7);
    this.bgMid  = this.add.tileSprite(0, H - 270, W, 270, "bg_mid").setOrigin(0).setAlpha(0.85);
    this.bgNear = this.add.tileSprite(0, H - 240, W, 240, "bg_near").setOrigin(0);

    // ---------- SUELO ----------
    this.surf = this.add.tileSprite(0, this.groundY, W, 48, "tile_top").setOrigin(0).setDepth(5);
    this.surf.tileScaleX = this.surf.tileScaleY = 1.5;
    this.fill = this.add.tileSprite(0, this.groundY + 48, W, H - this.groundY - 48, "tile_fill").setOrigin(0).setDepth(5);
    this.fill.tileScaleX = this.fill.tileScaleY = 1.5;

    // ---------- JUGADOR ----------
    this.playerBaseY = this.groundY + 8;
    this.player = this.add.sprite(RUN.playerX, this.playerBaseY, "tigre_idle")
      .setOrigin(0.5, 1).setScale(RUN.scale).setDepth(20);
    this.player.play("tigre-right");
    this.vy = 0; this.onGround = true; this.ducking = false;

    // sombra del jugador
    this.shadow = this.add.ellipse(RUN.playerX, this.groundY + 6, 70, 16, 0x000000, 0.25).setDepth(19);
    this.shieldFx = this.add.circle(RUN.playerX, this.groundY - 50, 70, 0x66ccff, 0.0).setDepth(18);

    // ---------- BEA (persecución) ----------
    this.beaX = CHASE.startX;
    this.bea = this.add.sprite(this.beaX, this.groundY + 6, "bea_idle")
      .setOrigin(0.5, 1).setScale(CHASE.beaScale).setDepth(15);
    this.bea.play("bea-right");

    // ---------- ESTADO ----------
    this.speed = RUN.startSpeed;
    this.distance = 0;
    this.points = 0;
    this.coinCount = 0;
    this.mult = 1;
    this.alive = true;
    this.objects = [];
    this.shieldUntil = 0; this.boostUntil = 0; this.slowUntil = 0;
    this.stumbleSlowUntil = 0; this.invulnUntil = 0;
    this.coyoteUntil = 0; this.jumpBufferUntil = 0;
    this.spawnTimer = 1.2;
    this.best = +(localStorage.getItem("tigreton_best") || 0);

    // textura de chispa generada en Preload
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      jump: "SPACE", up: "UP", duck: "DOWN", duckS: "S",
    });
    this.touch = this.sys.game.device.input.touch ? new TouchControls(this) : null;

    this.buildUI();
    this.cameras.main.fadeIn(300);
    this.flash("¡Corre, Tigretón!  Bea te persigue →", 1800);
  }

  buildUI() {
    const st = { fontFamily: "monospace", stroke: "#000", strokeThickness: 4 };
    this.distText = this.add.text(GAME_W - 16, 14, "0 m", { ...st, fontSize: "26px", color: "#ffffff" })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(900);
    this.bestText = this.add.text(GAME_W - 16, 44, "récord " + Math.floor(this.best) + " m", { ...st, fontSize: "15px", color: "#ffe082" })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(900);
    this.coinText = this.add.text(16, 14, "🪙 0", { ...st, fontSize: "22px", color: "#ffd54f" })
      .setOrigin(0, 0).setScrollFactor(0).setDepth(900);
    this.multText = this.add.text(16, 44, "", { ...st, fontSize: "18px", color: "#7CFC00" })
      .setOrigin(0, 0).setScrollFactor(0).setDepth(900);
    // iconos de power-up activos
    this.pwBar = this.add.container(GAME_W / 2, 20).setScrollFactor(0).setDepth(900);

    this.hint = this.add.text(GAME_W / 2, 84, "", { ...st, fontSize: "17px", color: "#fff" })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(900);

    this.muteBtn = this.add.text(GAME_W - 16, 70, SFX.muted ? "🔇" : "🔊", { fontSize: "22px" })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(900).setInteractive({ useHandCursor: true });
    const tg = () => { SFX.toggle(); this.muteBtn.setText(SFX.muted ? "🔇" : "🔊"); };
    this.muteBtn.on("pointerup", tg);
    this.input.keyboard.on("keydown-M", tg);
  }

  // ================= BUCLE =================
  update(time, delta) {
    if (!this.alive) return;
    const dt = Math.min(delta, 50) / 1000;

    // aceleración progresiva
    this.speed = Math.min(RUN.maxSpeed, this.speed + RUN.accel * dt);
    let ws = this.speed;
    const slow = time < this.slowUntil, boost = time < this.boostUntil;
    if (slow) ws *= 0.5;
    if (boost) ws *= 1.6;
    if (time < this.stumbleSlowUntil) ws *= 0.55;
    this.worldSpeed = ws;

    this.distance += ws * dt * 0.05;

    // parallax + suelo
    this.bgFar.tilePositionX  += ws * dt * 0.15;
    this.bgMid.tilePositionX  += ws * dt * 0.35;
    this.bgNear.tilePositionX += ws * dt * 0.6;
    this.surf.tilePositionX += (ws * dt) / 1.5;
    this.fill.tilePositionX += (ws * dt) / 1.5 * 0.6;

    this.handlePlayer(time, dt);
    this.handleSpawns(dt, ws);
    this.updateObjects(dt, ws, time);
    this.updateChase(dt, time);
    this.updateUI(time, boost, slow);

    if (this.touch) this.touch.consume();
  }

  handlePlayer(time, dt) {
    const p = this.player;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                 Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
                 Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                 (this.touch && this.touch.state.jump);
    const duckHeld = this.cursors.down.isDown || this.keys.duck.isDown || this.keys.duckS.isDown ||
                     (this.touch && this.touch.state.duck);

    if (this.onGround) this.coyoteUntil = time + RUN.coyote;
    if (jump) this.jumpBufferUntil = time + RUN.buffer;
    if (time < this.jumpBufferUntil && time < this.coyoteUntil && this.onGround) {
      this.vy = -RUN.jumpV; this.onGround = false;
      this.jumpBufferUntil = 0; this.coyoteUntil = 0;
      SFX.jump();
    }

    // gravedad manual
    this.vy += RUN.gravity * dt;
    p.y += this.vy * dt;
    if (p.y >= this.playerBaseY) { p.y = this.playerBaseY; this.vy = 0; this.onGround = true; }

    this.ducking = duckHeld && this.onGround;

    // achatamiento suave al agachar
    const tSY = this.ducking ? RUN.scale * RUN.duckScaleY : RUN.scale;
    p.scaleY = Phaser.Math.Linear(p.scaleY, tSY, 0.45);
    p.scaleX = RUN.scale;

    // animación
    const cur = p.anims.currentAnim?.key;
    if (!this.onGround) { if (cur !== "tigre-jump") p.play("tigre-jump", true); }
    else { if (cur !== "tigre-right") p.play("tigre-right", true); }

    this.shadow.x = p.x; this.shadow.setScale(this.onGround ? 1 : 0.7, 1);
    this.shieldFx.y = p.y - 55;
    this.shieldFx.setFillStyle(0x66ccff, time < this.shieldUntil ? 0.18 + 0.06 * Math.sin(time / 80) : 0);
  }

  // ---------------- aparición de elementos ----------------
  handleSpawns(dt, ws) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnOne();
    const gapPx = Phaser.Math.Between(300, 540);
    this.spawnTimer = gapPx / ws; // separación espacial constante (justa al acelerar)
  }

  spawnOne() {
    const r = Math.random();
    if (r < 0.28) this.addObstacle("crate");
    else if (r < 0.45) this.addObstacle("rock");
    else if (r < 0.62) this.addObstacle("beam");
    else if (r < 0.85) this.addCoins();
    else this.addPowerUp();
  }

  addObstacle(kind) {
    const x = GAME_W + 80;
    let o;
    if (kind === "beam") {
      o = this.add.image(x, this.groundY - 92, "beam").setOrigin(0.5, 1).setDepth(16);
      this.objects.push({ sprite: o, type: "beam", world: true });
    } else {
      const tex = kind === "rock" ? "rock" : "crate";
      o = this.add.image(x, this.groundY + 6, tex).setOrigin(0.5, 1).setDepth(16);
      this.objects.push({ sprite: o, type: "obstacle", world: true });
    }
  }

  addCoins() {
    const n = Phaser.Math.Between(3, 6);
    const baseY = this.groundY - Phaser.Math.Between(40, 150);
    const gem = Math.random() < 0.18;
    for (let i = 0; i < n; i++) {
      const x = GAME_W + 60 + i * 42;
      const y = baseY - Math.sin((i / (n - 1)) * Math.PI) * 46; // arco
      const isGem = gem && i === Math.floor(n / 2);
      const o = this.add.image(x, y, isGem ? "gem" : "coin").setDepth(14);
      setScaleToHeight(o, isGem ? 34 : 28);
      this.tweens.add({ targets: o, angle: 360, duration: 1200, repeat: -1 });
      this.objects.push({ sprite: o, type: "coin", gem: isGem, world: true });
    }
  }

  addPowerUp() {
    const kinds = ["shield", "coffee", "clock", "heart"];
    const k = kinds[Phaser.Math.Between(0, kinds.length - 1)];
    const o = this.add.image(GAME_W + 70, this.groundY - Phaser.Math.Between(70, 140), k).setDepth(14);
    setScaleToHeight(o, 40);
    this.tweens.add({ targets: o, y: o.y - 12, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    // halo
    const halo = this.add.circle(o.x, o.y, 30, 0xffffff, 0.18).setDepth(13);
    this.objects.push({ sprite: o, type: "power", kind: k, halo, world: true });
  }

  // ---------------- mover / colisiones ----------------
  updateObjects(dt, ws, time) {
    const pB = this.player.getBounds();
    Phaser.Geom.Rectangle.Inflate(pB, -10, -6);
    const shield = time < this.shieldUntil;

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      const s = obj.sprite;
      s.x -= ws * dt;
      if (obj.halo) { obj.halo.x = s.x; obj.halo.y = s.y; }

      if (s.x < -120) { this.removeObj(i); continue; }
      if (obj.dead) continue;

      const oB = s.getBounds();
      if (!Phaser.Geom.Intersects.RectangleToRectangle(pB, oB)) continue;

      if (obj.type === "coin") { this.collectCoin(obj, i); }
      else if (obj.type === "power") { this.collectPower(obj, i); }
      else {
        if (!shield && time > this.invulnUntil) this.stumble(obj, time);
        else if (shield && !obj.dead) { obj.dead = true; this.burst(s.x, s.y, 0x66ccff, 10); this.fadeOut(s, obj); }
      }
    }
  }

  stumble(obj, time) {
    obj.dead = true;
    this.invulnUntil = time + 800;
    this.stumbleSlowUntil = time + 320;
    this.beaX += CHASE.stumblePush;
    this.mult = 1;
    SFX.hurt();
    this.cameras.main.shake(220, 0.014);
    // golpe visual al obstáculo / sartén
    if (obj.type === "pan") { obj.sprite.setTint(0xff8888); this.fadeOut(obj.sprite, obj); }
    else { this.tweens.add({ targets: obj.sprite, y: obj.sprite.y - 30, angle: 90, alpha: 0, duration: 350,
      onComplete: () => obj.sprite.destroy() }); obj.gone = true; }
    this.burst(this.player.x, this.player.y - 50, 0xff5555, 12);
    this.tweens.add({ targets: this.player, alpha: 0.35, duration: 90, yoyo: true, repeat: 4,
      onComplete: () => this.player.setAlpha(1) });
  }

  collectCoin(obj, i) {
    this.coinCount++;
    this.score(obj.gem ? 150 : 20);
    if (this.coinCount % 8 === 0) this.mult = Math.min(9, this.mult + 1);
    SFX.coin();
    this.burst(obj.sprite.x, obj.sprite.y, obj.gem ? 0x66e0ff : 0xffd54f, obj.gem ? 14 : 7);
    this.removeObj(i);
  }

  collectPower(obj, i) {
    const t = this.time.now, k = obj.kind;
    if (k === "shield") { this.shieldUntil = t + 6000; this.flash("🛡️ ¡Escudo!", 1200); }
    else if (k === "coffee") { this.boostUntil = t + 3500; this.beaX -= 80; this.beaX = Math.max(this.beaX, CHASE.startX); this.flash("☕ ¡Turbo!", 1200); }
    else if (k === "clock") { this.slowUntil = t + 4500; this.flash("⏰ Cámara lenta", 1200); }
    else if (k === "heart") { this.beaX -= 140; this.beaX = Math.max(this.beaX, CHASE.startX); this.score(50); this.flash("❤️ ¡Aire! Bea retrocede", 1200); }
    SFX.coin();
    this.burst(obj.sprite.x, obj.sprite.y, 0x9bd1ff, 16);
    this.removeObj(i);
  }

  removeObj(i) {
    const o = this.objects[i];
    if (o.halo) o.halo.destroy();
    if (!o.gone) o.sprite.destroy();
    this.objects.splice(i, 1);
  }
  fadeOut(s, obj) {
    obj.gone = true;
    this.tweens.add({ targets: s, alpha: 0, duration: 250, onComplete: () => s.destroy() });
  }

  // ---------------- persecución ----------------
  updateChase(dt, time) {
    // Bea avanza sola despacio; la velocidad aumenta ligeramente con el mundo
    const speedMult = 1 + (this.speed - RUN.startSpeed) / (RUN.maxSpeed - RUN.startSpeed) * 0.5;
    this.beaX += CHASE.gainRate * speedMult * dt;
    // nunca supera al jugador
    this.beaX = Math.min(this.beaX, RUN.playerX - CHASE.caughtGap - 1);
    this.bea.x = this.beaX;
    if (this.bea.anims.currentAnim?.key !== "bea-right") this.bea.play("bea-right", true);

    // peligro: tinte rojizo cuanto más cerca (empieza a notarse al 50% del camino)
    const gap = RUN.playerX - this.beaX;
    const maxGap = RUN.playerX - CHASE.startX;
    const danger = Phaser.Math.Clamp(1 - (gap - CHASE.caughtGap) / (maxGap * 0.5), 0, 1);
    this.bea.setTint(Phaser.Display.Color.GetColor(255, (255 - danger * 190) | 0, (255 - danger * 190) | 0));

    if (gap <= CHASE.caughtGap) this.gameOver();
  }

  // ---------------- UI / utilidades ----------------
  score(n) { this.points += n * this.mult; }
  updateUI(time, boost, slow) {
    this.distText.setText(Math.floor(this.distance) + " m");
    this.coinText.setText("🪙 " + this.coinCount);
    this.multText.setText(this.mult > 1 ? "x" + this.mult : "");
    // iconos power-up
    let s = "";
    if (time < this.shieldUntil) s += "🛡️";
    if (boost) s += "☕";
    if (slow) s += "⏰";
    if (!this._pwTxt) { this._pwTxt = this.add.text(0, 0, "", { fontSize: "22px" }).setOrigin(0.5, 0); this.pwBar.add(this._pwTxt); }
    this._pwTxt.setText(s);
  }

  flash(msg, ms) {
    this.hint.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.hint);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: ms, duration: 350 });
  }

  burst(x, y, color, qty) {
    const e = this.add.particles(x, y, "spark", {
      speed: { min: 70, max: 230 }, angle: { min: 0, max: 360 },
      lifespan: 350, scale: { start: 1, end: 0 }, tint: color, quantity: qty, emitting: false,
    }).setDepth(30);
    e.explode(qty);
    this.time.delayedCall(400, () => e.destroy());
  }

  gameOver() {
    if (!this.alive) return;
    this.alive = false;
    SFX.lose();
    const finalScore = Math.floor(this.distance) + this.points;
    if (this.distance > this.best) localStorage.setItem("tigreton_best", Math.floor(this.distance));
    // Bea da el alcance
    this.tweens.add({ targets: this.bea, x: this.player.x - 6, duration: 260, ease: "Quad.in" });
    this.tweens.add({ targets: this.bea, scaleX: CHASE.beaScale * 1.2, scaleY: CHASE.beaScale * 1.2, duration: 200, yoyo: true });
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.fade(650, 0, 0, 0);
    this.time.delayedCall(720, () => this.scene.start("End", {
      distance: Math.floor(this.distance), coins: this.coinCount, score: finalScore,
    }));
  }
}
