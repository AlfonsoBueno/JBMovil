// Controles táctiles del runner (multitouch). Saltar = toque derecha; agacharse = mantener izquierda.
class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.state = { jump: false, duck: false };
    scene.input.addPointer(2);

    const H = scene.scale.height, W = scene.scale.width;
    const R = Math.max(56, H * 0.13);
    const pad = R * 1.1;
    const rowY = H - pad;

    const mk = (x, y, r, label, color) => {
      const c = scene.add.circle(x, y, r, color, 0.35)
        .setStrokeStyle(4, 0xffffff, 0.85).setScrollFactor(0).setDepth(1000).setInteractive();
      c.input.hitArea = new Phaser.Geom.Circle(r, r, r * 1.3);
      c.input.hitAreaCallback = Phaser.Geom.Circle.Contains;
      scene.add.text(x, y, label, {
        fontFamily: "monospace", fontSize: Math.round(r * 0.72) + "px",
        color: "#ffffff", stroke: "#0005", strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
      return c;
    };

    const mkLbl = (x, y, txt) => scene.add.text(x, y, txt, {
      fontFamily: "monospace", fontSize: "12px", color: "#ffffffaa",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    const bDuck = mk(pad, rowY, R, "▼", 0x1565c0);
    const bJump = mk(W - pad, rowY, R, "⤒", 0x2e7d32);
    mkLbl(pad,     rowY + R + 12, "AGACHAR");
    mkLbl(W - pad, rowY + R + 12, "SALTAR");

    bDuck.on("pointerdown", () => { this.state.duck = true;  bDuck.setFillStyle(0x1565c0, 0.65); });
    bDuck.on("pointerup",   () => { this.state.duck = false; bDuck.setFillStyle(0x1565c0, 0.35); });
    bDuck.on("pointerout",  () => { this.state.duck = false; bDuck.setFillStyle(0x1565c0, 0.35); });

    bJump.on("pointerdown", () => { this.state.jump = true;  bJump.setFillStyle(0x2e7d32, 0.65); });
    bJump.on("pointerup",   () => {                          bJump.setFillStyle(0x2e7d32, 0.35); });
    bJump.on("pointerout",  () => {                          bJump.setFillStyle(0x2e7d32, 0.35); });
  }

  consume() { this.state.jump = false; }
}
