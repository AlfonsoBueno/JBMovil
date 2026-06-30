// === Metadatos de assets (generados por tools/slice.py e items.py) ===
const SPRITES = {
  tigre: {
    cellW: 185, cellH: 170,
    anims: { idle: 5, right: 7, left: 7, jump: 8, claw: 7 },
  },
  bea: {
    cellW: 164, cellH: 252,
    anims: { idle: 4, right: 6, left: 6, jump: 4 },
  },
};

// Dimensiones de diseño (se escalan con FIT)
const GAME_W = 960;
const GAME_H = 540;

// === RUNNER (estilo Dino de Chrome) ===
const RUN = {
  startSpeed: 360,     // px/s iniciales del mundo
  maxSpeed: 1000,      // tope de velocidad
  accel: 7.5,          // px/s que se suma por segundo (aceleración)
  playerX: 250,        // x fija del Tigretón en pantalla
  floorY: 470,         // línea del suelo (pies)
  gravity: 2400,       // gravedad manual del salto
  jumpV: 760,          // impulso de salto
  coyote: 110,         // ms de margen de salto tras dejar el suelo
  buffer: 130,         // ms de buffer de salto
  duckScaleY: 0.58,    // achatamiento al agacharse
  scale: 0.8,          // escala del Tigretón
};

// Persecución de Bea — mecánica de "gap numérico" (no posición física)
const CHASE = {
  beaScale: 0.52,
  maxGap: 360,         // gap inicial (distancia abstracta)
  drainRate: 11,       // gap que pierde por segundo solo
  obstacleDrain: 85,   // gap que pierde al chocar con obstáculo
  coinRefill: 4,       // gap que recupera por moneda
  lifeLostRefill: 240, // gap que recupera al perder vida
  lifeLostInvuln: 2200,// ms invulnerable tras perder vida
};

