class Menu extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // fondo parallax estático del menú
    this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(w, h);
    this.add.image(0, h - 220, "bg_far").setOrigin(0).setDisplaySize(w, 220).setAlpha(0.6);
    this.add.image(0, h - 200, "bg_near").setOrigin(0).setDisplaySize(w, 220);

    // protagonista y enemiga
    const tigre = this.add.sprite(w * 0.30, h * 0.62, "tigre_idle").setScale(1.1);
    tigre.play("tigre-idle");
    const bea = this.add.sprite(w * 0.72, h * 0.58, "bea_idle").setScale(0.8).setFlipX(true);
    bea.play("bea-idle");
    const mobile = this.add.image(w * 0.5, h * 0.30, "mobile").setScale(0.45);
    this.tweens.add({ targets: mobile, y: mobile.y - 14, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // título
    const title = this.add.text(w / 2, h * 0.16, "EL TIGRETÓN  vs  BEA", {
      fontFamily: "Impact, monospace", fontSize: "50px", color: "#ffcc33",
      stroke: "#5a2b00", strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.16 + 46, "¡Recupera el móvil!", {
      fontFamily: "monospace", fontSize: "22px", color: "#ffffff", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.06, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // instrucciones
    const isTouch = this.sys.game.device.input.touch;
    const help = isTouch
      ? "Usa los botones en pantalla:\n← →  mover    ⤒ saltar    ✦ ZARPAZO\n\n¡Devuelve las sartenes con el ZARPAZO\npara aturdir a Bea!"
      : "← →  mover     ESPACIO / ↑  saltar     X  ZARPAZO\n\n¡Devuelve las sartenes con el ZARPAZO\npara aturdir a Bea y abrirte paso!";
    this.add.text(w / 2, h * 0.82, help, {
      fontFamily: "monospace", fontSize: "16px", color: "#e8f0ff", align: "center",
      stroke: "#000", strokeThickness: 3, lineSpacing: 4,
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
