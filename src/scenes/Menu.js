class Menu extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // fondo parallax estático del menú
    this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(w, h);
    this.add.image(0, h - 220, "bg_far").setOrigin(0).setDisplaySize(w, 220).setAlpha(0.6);
    this.add.image(0, h - 200, "bg_near").setOrigin(0).setDisplaySize(w, 220);

    // Bea persigue al Tigretón
    const groundY = h * 0.74;
    const bea = this.add.sprite(w * 0.30, groundY, "bea_idle").setOrigin(0.5, 1).setScale(0.62);
    bea.play("bea-right");
    const tigre = this.add.sprite(w * 0.52, groundY, "tigre_idle").setOrigin(0.5, 1).setScale(0.85);
    tigre.play("tigre-right");
    this.tweens.add({ targets: [tigre, bea], y: groundY - 8, duration: 260, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // título
    const title = this.add.text(w / 2, h * 0.17, "¡HUYE TIGRE, HUYE!", {
      fontFamily: "Impact, monospace", fontSize: "52px", color: "#ffcc33",
      stroke: "#5a2b00", strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.17 + 48, "Bea no perdona... ni el desayuno", {
      fontFamily: "monospace", fontSize: "18px", color: "#ffecb3", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.06, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // instrucciones
    const isTouch = this.sys.game.device.input.touch;
    const help = isTouch
      ? "⤒ SALTAR obstáculos    ▼ AGACHARTE bajo las vigas\n\nRecoge 🛡️escudo  ☕turbo  ⏰lenta  ❤️aire libre\n¡No dejes que Bea te atrape!"
      : "ESPACIO / ↑  SALTAR        ↓  AGACHARSE\n\nRecoge 🛡️escudo  ☕turbo  ⏰cámara lenta  ❤️aire libre\n¡No dejes que Bea te atrape!";
    this.add.text(w / 2, h * 0.86, help, {
      fontFamily: "monospace", fontSize: "15px", color: "#e8f0ff", align: "center",
      stroke: "#000", strokeThickness: 3, lineSpacing: 5,
    }).setOrigin(0.5);

    // botón jugar
    const btn = this.add.text(w / 2, h * 0.965, "▶  JUGAR", {
      fontFamily: "monospace", fontSize: "26px", color: "#0a0a0a",
      backgroundColor: "#ffcc33", padding: { x: 22, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btn, scale: 1.08, duration: 600, yoyo: true, repeat: -1 });

    const start = () => { SFX.init(); this.scene.start("Game"); };
    btn.on("pointerup", start);
    this.input.keyboard.once("keydown-SPACE", start);
    this.input.keyboard.once("keydown-ENTER", start);
  }
}
