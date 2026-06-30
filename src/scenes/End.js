class End extends Phaser.Scene {
  constructor() { super("End"); }
  init(data) { this.distance = data.distance || 0; this.coins = data.coins || 0; this.score = data.score || 0; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const best = +(localStorage.getItem("tigreton_best") || 0);
    const isRecord = this.distance >= best && this.distance > 0;

    this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(w, h);
    this.add.image(0, h - 200, "bg_near").setOrigin(0).setDisplaySize(w, 220).setAlpha(0.5);
    this.add.rectangle(0, 0, w, h, 0x000000, 0.35).setOrigin(0);

    // Bea ha pillado al Tigretón
    const groundY = h * 0.62;
    const bea = this.add.sprite(w / 2 - 70, groundY, "bea_idle").setOrigin(0.5, 1).setScale(0.75).play("bea-idle");
    const tigre = this.add.sprite(w / 2 + 70, groundY, "tigre_idle").setOrigin(0.5, 1).setScale(0.9).setFlipX(true).play("tigre-idle");

    this.add.text(w / 2, h * 0.17, "¡TE PILLÓ BEA!", {
      fontFamily: "Impact, monospace", fontSize: "58px", color: "#ff5252", stroke: "#3b0000", strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.70, `Distancia:  ${this.distance} m`, {
      fontFamily: "monospace", fontSize: "30px", color: "#ffffff", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.77, `🪙 ${this.coins}    ·    Puntos: ${this.score}`, {
      fontFamily: "monospace", fontSize: "20px", color: "#ffe082", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5);

    const recTxt = this.add.text(w / 2, h * 0.84, isRecord ? "🏆 ¡NUEVO RÉCORD!" : "récord: " + best + " m", {
      fontFamily: "monospace", fontSize: isRecord ? "22px" : "16px",
      color: isRecord ? "#7CFC00" : "#cccccc", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5);
    if (isRecord) this.tweens.add({ targets: recTxt, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });

    const btn = this.add.text(w / 2, h * 0.92, "↻  OTRA VEZ", {
      fontFamily: "monospace", fontSize: "26px", color: "#0a0a0a",
      backgroundColor: "#ffcc33", padding: { x: 22, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btn, scale: 1.06, duration: 600, yoyo: true, repeat: -1 });

    const again = () => { SFX.init(); this.scene.start("Game"); };
    btn.on("pointerup", again);
    this.input.keyboard.once("keydown-SPACE", again);
    this.input.keyboard.once("keydown-ENTER", again);

    const menuBtn = this.add.text(w / 2, h * 0.985, "menú", {
      fontFamily: "monospace", fontSize: "15px", color: "#cccccc",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on("pointerup", () => this.scene.start("Menu"));
  }
}
