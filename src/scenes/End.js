class End extends Phaser.Scene {
  constructor() { super("End"); }
  init(data) { this.win = data.win; this.score = data.score || 0; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(0, 0, w, h, this.win ? 0x10331a : 0x331010).setOrigin(0);
    this.add.image(0, h - 200, "bg_near").setOrigin(0).setDisplaySize(w, 220).setAlpha(0.4);

    if (this.win) {
      const tigre = this.add.sprite(w / 2 - 90, h * 0.55, "tigre_idle").setScale(1.3).play("tigre-idle");
      const mob = this.add.image(w / 2 + 90, h * 0.5, "mobile").setScale(0.6);
      this.tweens.add({ targets: mob, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1 });
      this.add.text(w / 2, h * 0.22, "¡VICTORIA!", {
        fontFamily: "Impact, monospace", fontSize: "64px", color: "#7CFC00", stroke: "#063b00", strokeThickness: 8,
      }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.32, "El Tigretón recuperó el móvil 🐯📱", {
        fontFamily: "monospace", fontSize: "20px", color: "#ffffff", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
    } else {
      const bea = this.add.sprite(w / 2, h * 0.55, "bea_idle").setScale(1.0).play("bea-idle");
      this.add.text(w / 2, h * 0.22, "GAME OVER", {
        fontFamily: "Impact, monospace", fontSize: "64px", color: "#ff5252", stroke: "#3b0000", strokeThickness: 8,
      }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.32, "Bea defendió el móvil con sus sartenes...", {
        fontFamily: "monospace", fontSize: "18px", color: "#ffffff", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
    }

    this.add.text(w / 2, h * 0.74, "Puntuación: " + this.score, {
      fontFamily: "monospace", fontSize: "28px", color: "#ffe082", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);

    const btn = this.add.text(w / 2, h * 0.86, "↻  JUGAR DE NUEVO", {
      fontFamily: "monospace", fontSize: "24px", color: "#0a0a0a",
      backgroundColor: "#ffcc33", padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btn, scale: 1.06, duration: 600, yoyo: true, repeat: -1 });

    const again = () => { SFX.init(); this.scene.start("Game"); };
    btn.on("pointerup", again);
    this.input.keyboard.once("keydown-SPACE", again);
    this.input.keyboard.once("keydown-ENTER", again);

    const menuBtn = this.add.text(w / 2, h * 0.95, "menú", {
      fontFamily: "monospace", fontSize: "16px", color: "#cccccc",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on("pointerup", () => this.scene.start("Menu"));
  }
}
