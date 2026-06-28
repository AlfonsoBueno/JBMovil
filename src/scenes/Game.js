function setScaleToHeight(obj, h) { obj.setScale(h / obj.height); return obj; }

class Game extends Phaser.Scene {
  constructor() { super("Game"); }

  create() {
    const W = WORLD_W, H = GAME_H;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    // ---------- FONDO PARALLAX ----------
    this.add.image(0, 0, "sky").setOrigin(0).setScrollFactor(0).setDisplaySize(GAME_W, H);
    this.bgFar  = this.add.tileSprite(0, H - 300, GAME_W, 300, "bg_far").setOrigin(0).setScrollFactor(0).setAlpha(0.7);
    this.bgMid  = this.add.tileSprite(0, H - 270, GAME_W, 270, "bg_mid").setOrigin(0).setScrollFactor(0).setAlpha(0.85);
    this.bgNear = this.add.tileSprite(0, H - 240, GAME_W, 240, "bg_near").setOrigin(0).setScrollFactor(0);

    // ---------- SUELO ----------
    const surfH = 48, fillTop = GROUND_TOP + surfH;
    const surf = this.add.tileSprite(0, GROUND_TOP, W, surfH, "tile_top").setOrigin(0);
    surf.tileScaleX = surf.tileScaleY = 1.5;
    const fill = this.add.tileSprite(0, fillTop, W, H - fillTop, "tile_fill").setOrigin(0);
    fill.tileScaleX = fill.tileScaleY = 1.5;

    this.solids = this.physics.add.staticGroup();
    const ground = this.add.rectangle(W / 2, GROUND_TOP + (H - GROUND_TOP) / 2, W, H - GROUND_TOP, 0, 0);
    this.physics.add.existing(ground, true);
    this.solids.add(ground);

    // plataformas flotantes (rutas opcionales con monedas)
    this.makePlatform(620, 392, 4);
    this.makePlatform(1180, 340, 3);
    this.makePlatform(1750, 392, 4);
    this.makePlatform(2380, 356, 3);

    // ---------- MONEDAS / GEMAS ----------
    this.coins = this.physics.add.group({ allowGravity: false });
    const coinXs = [380, 520, 620, 720, 1180, 1500, 1750, 1820, 2100, 2380, 2700, 2950];
    coinXs.forEach((x, i) => {
      const y = [620, 1180, 1750, 2380].includes(x) ? 0 : GROUND_TOP - 40;
      const c = this.coins.create(x, GROUND_TOP - 40 - (i % 3) * 6, "coin");
      setScaleToHeight(c, 30); c.body.setCircle(c.width * 0.45);
      this.tweens.add({ targets: c, y: c.y - 8, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut", delay: i * 60 });
    });
    // gemas sobre plataformas (más puntos)
    [[620, 360], [1180, 308], [1750, 360], [2380, 324]].forEach(([x, y]) => {
      const g = this.coins.create(x, y, "gem"); g.isGem = true;
      setScaleToHeight(g, 34);
      this.tweens.add({ targets: g, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    });

    // ---------- MÓVIL (meta) ----------
    const pedX = 3470;
    this.add.rectangle(pedX, GROUND_TOP - 4, 70, 48, 0x6b4a2b).setStrokeStyle(3, 0x3a2715);
    this.mobile = this.physics.add.staticImage(pedX, GROUND_TOP - 60, "mobile");
    setScaleToHeight(this.mobile, 96); this.mobile.refreshBody();
    this.tweens.add({ targets: this.mobile, y: this.mobile.y - 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.mobileGlow = this.add.circle(pedX, GROUND_TOP - 60, 50, 0x66ccff, 0.18);
    this.tweens.add({ targets: this.mobileGlow, scale: 1.3, alpha: 0.05, duration: 1000, yoyo: true, repeat: -1 });

    // muro invisible que bloquea el paso hasta vencer a Bea
    this.wall = this.add.rectangle(BEA.bossX + 90, H / 2, 24, H, 0xff0000, 0);
    this.physics.add.existing(this.wall, true);

    // ---------- JUGADOR ----------
    this.player = this.physics.add.sprite(120, GROUND_TOP - 120, "tigre_idle");
    this.player.setScale(TIGER.scale).setCollideWorldBounds(true);
    this.player.body.setSize(58, 140).setOffset(64, 20);
    this.facing = 1;
    this.player.play("tigre-idle");

    // ---------- BEA ----------
    this.bea = this.physics.add.sprite(1050, GROUND_TOP - 180, "bea_idle");
    this.bea.setScale(BEA.scale);
    this.bea.body.setSize(66, 180).setOffset(49, 62);
    this.bea.play("bea-idle");
    this.beaState = "retreat"; // retreat | fight | stunned | defeated
    this.beaHits = 0;
    this.beaStunUntil = 0;
    this.lastThrow = 0;

    // ---------- PROYECTILES ----------
    this.pans = this.physics.add.group();

    // ---------- COLISIONES ----------
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.bea, this.solids);
    this.playerWallCol = this.physics.add.collider(this.player, this.wall, () => {
      if (this.beaState !== "defeated" && this.time.now > (this.lastWallHint || 0) + 1800) {
        this.lastWallHint = this.time.now;
        this.flashHint("¡Bea bloquea el paso! Aturdela " + (BEA.hitsToDefeat - this.beaHits) + " vez/veces con el ZARPAZO ✦");
      }
    });
    this.physics.add.collider(this.pans, this.solids, (pan) => this.landPan(pan));
    this.physics.add.overlap(this.player, this.coins, (pl, c) => this.collectCoin(c));
    this.physics.add.overlap(this.pans, this.player, (a, b) => {
      const pan = (a === this.player) ? b : a; this.panHitsPlayer(pan);
    });
    this.physics.add.overlap(this.pans, this.bea, (a, b) => {
      const pan = (a === this.bea) ? b : a; this.panHitsBea(pan);
    });
    this.physics.add.overlap(this.player, this.mobile, () => this.reachMobile());

    // ---------- CÁMARA ----------
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(0, 30);

    // ---------- ESTADO ----------
    this.hearts = TIGER.startHearts;
    this.score = 0;
    this.invulnUntil = 0;
    this.clawReadyAt = 0;
    this.clawActiveUntil = 0;
    this.gameEnded = false;
    this.coyoteUntil = 0;       // margen para saltar justo tras dejar el suelo
    this.jumpBufferUntil = 0;   // memoriza el salto pulsado un instante antes de tocar suelo

    // partículas
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); g.generateTexture("spark", 8, 8); g.destroy();

    // ---------- INPUT ----------
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ jump: "SPACE", claw: "X", clawZ: "Z" });
    this.touch = this.sys.game.device.input.touch ? new TouchControls(this) : null;

    this.buildUI();
    this.cameras.main.fadeIn(400);
  }

  // ---------------- construcción ----------------
  makePlatform(cx, topY, tiles) {
    const tw = 48, width = tiles * tw, hgt = 28;
    const ts = this.add.tileSprite(cx - width / 2, topY, width, hgt, "tile_top").setOrigin(0);
    ts.tileScaleX = ts.tileScaleY = 1.5;
    const body = this.add.rectangle(cx, topY + hgt / 2, width, hgt, 0, 0);
    this.physics.add.existing(body, true);
    this.solids.add(body);
  }

  buildUI() {
    this.heartIcons = [];
    for (let i = 0; i < TIGER.startHearts; i++) {
      const hI = this.add.image(28 + i * 36, 28, "heart").setScrollFactor(0).setDepth(900);
      setScaleToHeight(hI, 30); this.heartIcons.push(hI);
    }
    this.scoreText = this.add.text(GAME_W - 16, 16, "0", {
      fontFamily: "monospace", fontSize: "26px", color: "#ffe082", stroke: "#000", strokeThickness: 4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(900);

    // "aguante" de Bea
    this.add.text(GAME_W / 2, 14, "BEA", { fontFamily: "monospace", fontSize: "16px", color: "#fff", stroke: "#000", strokeThickness: 3 })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(900);
    this.beaDots = [];
    for (let i = 0; i < BEA.hitsToDefeat; i++) {
      const d = this.add.circle(GAME_W / 2 - 24 + i * 24, 44, 9, 0xff5252).setStrokeStyle(2, 0xffffff)
        .setScrollFactor(0).setDepth(900);
      this.beaDots.push(d);
    }
    this.hint = this.add.text(GAME_W / 2, 70, "¡Avanza hacia la derecha!", {
      fontFamily: "monospace", fontSize: "15px", color: "#fff", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(900).setAlpha(0.9);

    // botón de silencio (clic/toque o tecla M)
    this.muteBtn = this.add.text(GAME_W - 16, 50, SFX.muted ? "🔇" : "🔊", { fontSize: "24px" })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(900).setInteractive({ useHandCursor: true });
    const toggleMute = () => { SFX.toggle(); this.muteBtn.setText(SFX.muted ? "🔇" : "🔊"); };
    this.muteBtn.on("pointerup", toggleMute);
    this.input.keyboard.on("keydown-M", toggleMute);
  }

  // ---------------- bucle ----------------
  update(time) {
    if (this.gameEnded) return;
    this.handlePlayer(time);
    this.handleClawDeflect(time);
    this.handleBea(time);
    this.cleanupPans();

    // parallax
    const sx = this.cameras.main.scrollX;
    this.bgFar.tilePositionX  = sx * 0.15;
    this.bgMid.tilePositionX  = sx * 0.35;
    this.bgNear.tilePositionX = sx * 0.6;

    if (this.touch) this.touch.consume();
  }

  handlePlayer(time) {
    const p = this.player, b = p.body;
    const onGround = b.blocked.down || b.touching.down;
    const left  = this.cursors.left.isDown  || (this.touch && this.touch.state.left);
    const right = this.cursors.right.isDown || (this.touch && this.touch.state.right);
    const jump  = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                  Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                  Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
                  (this.touch && this.touch.state.jump);
    const claw  = Phaser.Input.Keyboard.JustDown(this.keys.claw) ||
                  Phaser.Input.Keyboard.JustDown(this.keys.clawZ) ||
                  (this.touch && this.touch.state.claw);

    let vx = 0;
    if (left)  { vx = -TIGER.speed; this.facing = -1; }
    else if (right) { vx = TIGER.speed; this.facing = 1; }
    b.setVelocityX(vx);

    // salto con coyote-time + buffer (respuesta más fina, sobre todo en táctil)
    if (onGround) this.coyoteUntil = time + 110;
    if (jump) this.jumpBufferUntil = time + 130;
    if (time < this.jumpBufferUntil && time < this.coyoteUntil) {
      b.setVelocityY(-TIGER.jump);
      SFX.jump();
      this.jumpBufferUntil = 0;
      this.coyoteUntil = 0;
    }
    if (claw && time > this.clawReadyAt) {
      this.clawReadyAt = time + TIGER.clawCooldown;
      this.clawActiveUntil = time + TIGER.clawActive;
      this.player.play("tigre-claw", true);
      SFX.claw();
    }

    const clawing = time < this.clawActiveUntil;
    // selección de animación
    if (clawing) {
      if (this.player.anims.currentAnim?.key !== "tigre-claw") this.player.play("tigre-claw", true);
      this.player.setFlipX(this.facing === -1);
    } else if (!onGround) {
      if (this.player.anims.currentAnim?.key !== "tigre-jump") this.player.play("tigre-jump", true);
      this.player.setFlipX(this.facing === -1);
    } else if (vx !== 0) {
      const key = vx > 0 ? "tigre-right" : "tigre-left";
      if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
      this.player.setFlipX(false);
    } else {
      if (this.player.anims.currentAnim?.key !== "tigre-idle") this.player.play("tigre-idle", true);
      this.player.setFlipX(this.facing === -1);
    }
  }

  handleClawDeflect(time) {
    if (time >= this.clawActiveUntil) return;
    const p = this.player;
    const reach = 115, halfH = 70;
    const rx = this.facing === 1 ? p.x : p.x - reach;
    const clawRect = new Phaser.Geom.Rectangle(rx, p.y - halfH, reach, halfH * 2);
    // devolver sartenes en vuelo
    this.pans.getChildren().forEach((pan) => {
      if (!pan.active || pan.reflected) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(clawRect, pan.getBounds())) {
        this.reflectPan(pan);
      }
    });
    // zarpazo directo a Bea (vía cuerpo a cuerpo para vencerla)
    if (this.beaState !== "stunned" && this.beaState !== "defeated" &&
        this.bea.body && this.bea.body.enable &&
        Phaser.Geom.Intersects.RectangleToRectangle(clawRect, this.bea.getBounds())) {
      if (this.stunBea("¡Zarpazo!")) {
        this.bea.setVelocityX(this.facing * 180);
        this.bea.setVelocityY(-160);
        SFX.deflect();
        this.burst(this.bea.x, this.bea.y - 50, 0xffaa33, 12);
      }
    }
  }

  reflectPan(pan) {
    pan.reflected = true;
    pan.body.setAllowGravity(false);
    const ang = Phaser.Math.Angle.Between(pan.x, pan.y, this.bea.x, this.bea.y - 40);
    this.physics.velocityFromRotation(ang, PAN.reflectSpeed, pan.body.velocity);
    pan.setAngularVelocity(900);
    pan.setTint(0xffcc66);
    this.score += 50; this.updateScore();
    SFX.deflect();
    this.burst(pan.x, pan.y, 0xfff0a0, 14);
    this.cameras.main.shake(90, 0.006);
  }

  // ---------------- Bea IA ----------------
  handleBea(time) {
    const bea = this.bea;
    if (this.beaState === "defeated") {
      // huye corriendo hacia la izquierda
      if (bea.anims.currentAnim?.key !== "bea-left") this.bea.play("bea-left", true);
      bea.setFlipX(false);
      if (bea.x < this.cameras.main.scrollX - 150) { bea.setVisible(false); bea.body.enable = false; }
      return;
    }

    if (this.beaState === "stunned") {
      if (time > this.beaStunUntil) { this.beaState = bea.x >= BEA.bossX - 5 ? "fight" : "retreat"; bea.clearTint(); bea.setAngle(0); }
      else { bea.setVelocityX(0); if (bea.anims.currentAnim?.key !== "bea-idle") bea.play("bea-idle", true); }
      return;
    }

    const dist = this.player.x - bea.x; // <0 jugador a su izquierda
    const gap = 330, leftBound = 700;
    // huye manteniendo distancia: a la derecha si la persiguen por la izquierda,
    // a la izquierda si el jugador la rebasa.
    let move = 0;
    if (dist < 0) {
      if (-dist < gap && bea.x < BEA.bossX) move = 1;
    } else {
      if (dist < gap && bea.x > leftBound) move = -1;
    }

    const onGround = bea.body.blocked.down || bea.body.touching.down;
    bea.setVelocityX(BEA.walk * move);

    // animación: en el aire usa su sprite de salto
    if (!onGround) {
      if (bea.anims.currentAnim?.key !== "bea-jump") bea.play("bea-jump", true);
      bea.setFlipX(this.player.x < bea.x);
    } else if (move !== 0) {
      const key = move > 0 ? "bea-right" : "bea-left"; // sprites con su propia dirección
      if (bea.anims.currentAnim?.key !== key) bea.play(key, true);
      bea.setFlipX(false);
    } else {
      if (bea.anims.currentAnim?.key !== "bea-idle") bea.play("bea-idle", true);
      bea.setFlipX(this.player.x < bea.x); // se gira para mirar al jugador
    }
    if (bea.x >= BEA.bossX) { bea.x = BEA.bossX; if (this.beaState === "retreat") this.beaState = "fight"; }

    // salto-esquiva: si una sartén devuelta viene hacia ella, intenta saltarla
    if (onGround && time > (this.beaNextHop || 0)) {
      const incoming = this.pans.getChildren().some((pan) =>
        pan.active && pan.reflected && Math.abs(pan.x - bea.x) < 240 &&
        Math.sign(bea.x - pan.x) === Math.sign(pan.body.velocity.x)); // viene hacia ella
      if (incoming && Math.random() < 0.6) {
        bea.setVelocityY(-430);
        this.beaNextHop = time + 700;
      }
    }

    // lanzar sartenes si el jugador está a tiro (a cualquier lado)
    const interval = this.beaState === "fight" ? BEA.throwEveryBoss : BEA.throwEvery;
    if (time - this.lastThrow > interval && Math.abs(dist) < 760) {
      this.throwPan();
      this.lastThrow = time;
      // de vez en cuando da un saltito al lanzar (más viva)
      if (onGround && this.beaState === "fight" && Math.random() < 0.35) {
        bea.setVelocityY(-360);
        this.beaNextHop = time + 700;
      }
    }
  }

  throwPan() {
    const bea = this.bea;
    const pan = this.pans.create(bea.x - 36, bea.y - 70, "pan");
    setScaleToHeight(pan, 44);
    pan.reflected = false;
    pan.body.setAllowGravity(true);
    pan.body.setCircle(pan.width * 0.42, pan.width * 0.08, pan.height * 0.2);
    const dir = Math.sign(this.player.x - bea.x) || -1;
    pan.setVelocityX(dir * PAN.speed + Phaser.Math.Between(-40, 40));
    pan.setVelocityY(Phaser.Math.Between(-300, -220));
    pan.setAngularVelocity(-600);
    // pequeño "punch" al lanzar
    this.tweens.add({ targets: bea, scaleX: BEA.scale * 1.08, duration: 90, yoyo: true });
    SFX.throwPan();
  }

  panHitsPlayer(pan) {
    if (!pan.active || pan.reflected) return;
    if (this.time.now < this.invulnUntil) return;
    pan.destroy();
    this.hearts--;
    this.updateHearts();
    SFX.hurt();
    this.cameras.main.shake(180, 0.012);
    this.invulnUntil = this.time.now + TIGER.invuln;
    // empuje
    const dir = this.bea.x > this.player.x ? -1 : 1;
    this.player.setVelocityX(dir * 240);
    this.player.setVelocityY(-260);
    // parpadeo
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => this.player.setAlpha(1) });
    if (this.hearts <= 0) this.endGame(false);
  }

  panHitsBea(pan) {
    if (!pan.active || !pan.reflected) return;
    if (this.beaState === "stunned" || this.beaState === "defeated") return;
    pan.destroy();
    this.stunBea("¡Toma sartén!");
  }

  // aturde a Bea (lo usan tanto las sartenes devueltas como el zarpazo cuerpo a cuerpo)
  stunBea(msg) {
    if (this.beaState === "stunned" || this.beaState === "defeated") return false;
    this.beaHits++;
    this.score += 200; this.updateScore();
    this.updateBeaDots();
    SFX.stun();
    this.burst(this.bea.x, this.bea.y - 60, 0x88ccff, 20);
    this.cameras.main.shake(160, 0.01);
    this.tweens.add({ targets: this.bea, angle: { from: -10, to: 10 }, duration: 80, yoyo: true, repeat: 4,
      onComplete: () => this.bea.setAngle(0) });

    if (this.beaHits >= BEA.hitsToDefeat) {
      this.defeatBea();
    } else {
      this.beaState = "stunned";
      this.beaStunUntil = this.time.now + BEA.stun;
      this.bea.setVelocityX(0);
      this.bea.setTint(0x88aaff);
      this.flashHint((msg || "¡Toma!") + " Aguante de Bea: " + (BEA.hitsToDefeat - this.beaHits));
    }
    return true;
  }

  defeatBea() {
    this.beaState = "defeated";
    this.bea.clearTint();
    this.bea.setVelocityX(-260);
    this.bea.body.setAllowGravity(true);
    // abrir el paso
    if (this.playerWallCol) this.physics.world.removeCollider(this.playerWallCol);
    this.wall.destroy();
    this.flashHint("¡Bea huye! ¡Corre a por el móvil! →");
  }

  // ---------------- objetos / sartenes ----------------
  collectCoin(c) {
    if (!c.active) return;
    this.score += c.isGem ? 75 : 10;
    this.updateScore();
    SFX.coin();
    this.burst(c.x, c.y, c.isGem ? 0x66e0ff : 0xffd54f, 8);
    c.destroy();
  }

  landPan(pan) {
    if (!pan.active) return;
    this.burst(pan.x, pan.y + 10, 0xaaaaaa, 6);
    pan.destroy();
  }

  cleanupPans() {
    this.pans.getChildren().forEach((pan) => {
      if (!pan.active) return;
      if (pan.x < -60 || pan.x > WORLD_W + 60 || pan.y > GAME_H + 80) pan.destroy();
    });
  }

  reachMobile() {
    if (this.beaState !== "defeated") return;
    this.endGame(true);
  }

  // ---------------- UI / utilidades ----------------
  burst(x, y, color, qty) {
    const e = this.add.particles(x, y, "spark", {
      speed: { min: 70, max: 230 }, angle: { min: 0, max: 360 },
      lifespan: 350, scale: { start: 1, end: 0 }, tint: color, quantity: qty, emitting: false,
    });
    e.explode(qty);
    this.time.delayedCall(400, () => e.destroy());
  }

  updateScore() { this.scoreText.setText(String(this.score)); }
  updateHearts() {
    this.heartIcons.forEach((h, i) => h.setVisible(i < this.hearts));
  }
  updateBeaDots() {
    this.beaDots.forEach((d, i) => d.setFillStyle(i < BEA.hitsToDefeat - this.beaHits ? 0xff5252 : 0x444444));
  }
  flashHint(msg) {
    this.hint.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.hint);
    this.tweens.add({ targets: this.hint, alpha: 0.9, duration: 200 });
  }

  endGame(win) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    if (win) SFX.win(); else SFX.lose();
    this.cameras.main.fade(550, 0, 0, 0);
    // temporizador del reloj de escena (fiable, independiente de la física)
    this.time.delayedCall(600, () => this.scene.start("End", { win, score: this.score }));
  }
}
