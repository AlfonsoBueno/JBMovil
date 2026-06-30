const config = {
  type: Phaser.AUTO,
  backgroundColor: "#bfe3ef",
  parent: "game",
  pixelArt: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 760 }, debug: false },
  },
  scene: [Preload, Menu, Game, End],
};

window.addEventListener("load", () => {
  const game = new Phaser.Game(config);
  // reanudar audio tras primera interacción (políticas de navegador)
  const resume = () => { SFX.init(); window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); };
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
});
