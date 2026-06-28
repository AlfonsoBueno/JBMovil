// Controles táctiles en pantalla (multitouch). Devuelve un estado leído por el Game.
class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.state = { left: false, right: false, jump: false, claw: false };
    scene.input.addPointer(3); // permitir varios dedos

    const h = scene.scale.height, w = scene.scale.width;
    const r = 46;
    const mk = (x, y, label, color) => {
      const c = scene.add.circle(x, y, r, color, 0.35)
        .setStrokeStyle(3, 0xffffff, 0.7).setScrollFactor(0).setDepth(1000).setInteractive();
      const t = scene.add.text(x, y, label, { fontFamily: "monospace", fontSize: "30px", color: "#ffffff" })
        .setOrigin(0.5).setScrollFactor(0).setDepth(1001);
      return c;
    };

    const bLeft  = mk(70, h - 70, "←", 0x2196f3);
    const bRight = mk(180, h - 70, "→", 0x2196f3);
    const bJump  = mk(w - 180, h - 70, "⤒", 0x4caf50);
    const bClaw  = mk(w - 70, h - 80, "✦", 0xff5252);

    const hold = (btn, key) => {
      btn.on("pointerdown", () => { this.state[key] = true; btn.setFillStyle(btn.fillColor, 0.6); });
      btn.on("pointerup",   () => { this.state[key] = false; btn.setFillStyle(btn.fillColor, 0.35); });
      btn.on("pointerout",  () => { this.state[key] = false; btn.setFillStyle(btn.fillColor, 0.35); });
    };
    hold(bLeft, "left");
    hold(bRight, "right");

    // jump y claw como "edge" (un toque = una acción)
    bJump.on("pointerdown", () => { this.state.jump = true; bJump.setFillStyle(bJump.fillColor, 0.6); });
    bJump.on("pointerup",   () => { bJump.setFillStyle(bJump.fillColor, 0.35); });
    bClaw.on("pointerdown", () => { this.state.claw = true; bClaw.setFillStyle(bClaw.fillColor, 0.6); });
    bClaw.on("pointerup",   () => { bClaw.setFillStyle(bClaw.fillColor, 0.35); });
  }

  // se llama al final de cada update para consumir las acciones de un toque
  consume() { this.state.jump = false; this.state.claw = false; }
}
