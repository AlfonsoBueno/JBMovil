class Preload extends Phaser.Scene {
  constructor() { super("Preload"); }

  preload() {
    // barra de carga
    const w = this.scale.width, h = this.scale.height;
    this.add.text(w / 2, h / 2 - 40, "Cargando...", { fontFamily: "monospace", fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 150, h / 2, 0, 18, 0xffa726).setOrigin(0, 0.5);
    this.add.rectangle(w / 2, h / 2, 304, 22, 0x000000).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    bar.setDepth(1);
    this.load.on("progress", (p) => { bar.width = 300 * p; });

    // fondos
    this.load.image("sky", "assets/bg/sky.png");
    this.load.image("bg_far", "assets/bg/far.png");
    this.load.image("bg_mid", "assets/bg/mid.png");
    this.load.image("bg_near", "assets/bg/near.png");
    this.load.image("tile_top", "assets/bg/tile_top.png");
    this.load.image("tile_fill", "assets/bg/tile_fill.png");
    this.load.image("tile_bridge", "assets/bg/tile_bridge.png");

    // objetos
    this.load.image("mobile", "assets/items/mobile.png");
    this.load.image("pan", "assets/items/pan.png");
    this.load.image("heart", "assets/items/heart.png");
    this.load.image("coin", "assets/items/coin.png");
    this.load.image("gem", "assets/items/gem.png");

    // sprite-sheets de personajes
    for (const [who, info] of Object.entries(SPRITES)) {
      const fw = info.cellW, fh = info.cellH;
      for (const key of Object.keys(info.anims)) {
        this.load.spritesheet(`${who}_${key}`, `assets/sprites/${who}_${key}.png`,
          { frameWidth: fw, frameHeight: fh });
      }
    }
  }

  create() {
    // crear animaciones
    const mk = (who, key, rate, repeat) => {
      const n = SPRITES[who].anims[key];
      this.anims.create({
        key: `${who}-${key}`,
        frames: this.anims.generateFrameNumbers(`${who}_${key}`, { start: 0, end: n - 1 }),
        frameRate: rate,
        repeat: repeat,
      });
    };
    mk("tigre", "idle", 6, -1);
    mk("tigre", "right", 14, -1);
    mk("tigre", "left", 14, -1);
    mk("tigre", "jump", 12, 0);
    mk("tigre", "claw", 22, 0);
    mk("bea", "idle", 5, -1);
    mk("bea", "right", 12, -1);
    mk("bea", "left", 12, -1);
    mk("bea", "jump", 8, 0);

    this.scene.start("Menu");
  }
}
