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

// Mundo / nivel
const WORLD_W = 3600;
const GROUND_TOP = 496; // y de la superficie del suelo

// Jugabilidad
const TIGER = {
  speed: 230,
  jump: 560,
  scale: 0.80,    // igualado al tamaño de Bea
  clawCooldown: 360,   // ms entre zarpazos
  clawActive: 300,     // ms con la garra "viva"
  invuln: 1100,        // ms de invulnerabilidad tras recibir golpe
  startHearts: 3,
};

const BEA = {
  scale: 0.48,
  walk: 100,
  throwEvery: 1500,    // ms entre sartenes (fase normal)
  throwEveryBoss: 950, // ms en fase jefe
  stun: 1300,          // ms aturdida tras recibir su propia sartén
  hitsToDefeat: 3,     // sartenes devueltas para vencerla
  bossX: 3250,         // posición donde planta cara junto al móvil
};

const PAN = { speed: 360, scale: 0.12, reflectSpeed: 620 };
