class Preload extends Phaser.Scene {
  constructor() { super("Preload"); }

  preload() {
    const w = this.scale.width, h = this.scale.height;
    this.add.text(w / 2, h / 2 - 40, "Cargando...", { fontFamily: "monospace", fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 150, h / 2, 0, 18, 0xffa726).setOrigin(0, 0.5).setDepth(1);
    this.add.rectangle(w / 2, h / 2, 304, 22, 0x000000).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    this.load.on("progress", (p) => { bar.width = 300 * p; });

    // fondos
    this.load.image("sky", "assets/bg/sky.png");
    this.load.image("bg_far", "assets/bg/far.png");
    this.load.image("bg_mid", "assets/bg/mid.png");
    this.load.image("bg_near", "assets/bg/near.png");
    this.load.image("tile_top", "assets/bg/tile_top.png");
    this.load.image("tile_fill", "assets/bg/tile_fill.png");

    // objetos
    for (const it of ["mobile", "pan", "heart", "coin", "gem", "shield", "clock", "coffee"]) {
      this.load.image(it, `assets/items/${it}.png`);
    }

    // personajes
    for (const [who, info] of Object.entries(SPRITES)) {
      for (const key of Object.keys(info.anims)) {
        this.load.spritesheet(`${who}_${key}`, `assets/sprites/${who}_${key}.png`,
          { frameWidth: info.cellW, frameHeight: info.cellH });
      }
    }
  }

  create() {
    const mk = (who, key, rate, repeat) => {
      const n = SPRITES[who].anims[key];
      this.anims.create({
        key: `${who}-${key}`,
        frames: this.anims.generateFrameNumbers(`${who}_${key}`, { start: 0, end: n - 1 }),
        frameRate: rate, repeat,
      });
    };
    mk("tigre", "idle", 6, -1);
    mk("tigre", "right", 16, -1);
    mk("tigre", "left", 16, -1);
    mk("tigre", "jump", 12, 0);
    mk("tigre", "claw", 24, 0);
    mk("bea", "idle", 5, -1);
    mk("bea", "right", 13, -1);
    mk("bea", "left", 13, -1);
    mk("bea", "jump", 8, 0);

    this.makeTextures();
    this.scene.start("Menu");
  }

  // texturas generadas para obstáculos y partículas
  makeTextures() {
    // chispa
    let g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); g.generateTexture("spark", 8, 8); g.destroy();

    // cajón de madera (saltar)
    g = this.make.graphics({ add: false });
    g.fillStyle(0x8a5a2b, 1); g.fillRect(0, 0, 46, 46);
    g.fillStyle(0xa9713a, 1); g.fillRect(3, 3, 40, 40);
    g.lineStyle(3, 0x5b3617, 1); g.strokeRect(2, 2, 42, 42);
    g.lineBetween(2, 23, 44, 23); g.lineBetween(23, 2, 23, 44);
    g.generateTexture("crate", 46, 46); g.destroy();

    // roca alta (saltar bien)
    g = this.make.graphics({ add: false });
    g.fillStyle(0x6b7177, 1); g.fillRoundedRect(0, 8, 60, 58, 12);
    g.fillStyle(0x868d94, 1); g.fillRoundedRect(6, 4, 44, 40, 14);
    g.lineStyle(3, 0x3f4448, 1); g.strokeRoundedRect(1, 6, 58, 58, 12);
    g.generateTexture("rock", 60, 70); g.destroy();

    // viga con franjas de peligro (agacharse)
    g = this.make.graphics({ add: false });
    g.fillStyle(0x222831, 1); g.fillRect(0, 0, 96, 44);
    for (let i = -44; i < 96; i += 22) {
      g.fillStyle(0xffd02e, 1); g.fillTriangle(i, 0, i + 11, 0, i, 44);
      g.fillTriangle(i + 11, 0, i + 22, 0, i + 11, 44);
    }
    g.fillStyle(0x222831, 1);
    for (let i = -44; i < 96; i += 22) { g.fillTriangle(i + 11, 0, i + 22, 0, i + 22, 44); }
    g.lineStyle(3, 0x000000, 1); g.strokeRect(1, 1, 94, 42);
    g.generateTexture("beam", 96, 44); g.destroy();
  }
}
