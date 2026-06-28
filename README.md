# 🐯 El Tigretón vs Bea — ¡Recupera el móvil! 📱

Juego 2D de acción/plataformas hecho con **Phaser 3**. El protagonista (El Tigretón)
debe cruzar la ciudad y llegar al móvil que defiende Bea lanzándole sartenes.

## 🎮 Mecánica original

- **Avanza** hacia la derecha recogiendo monedas 🪙 y gemas 💎.
- Bea **retrocede** hacia el móvil, **salta para esquivar** y te lanza **sartenes** en arco.
- Hay **dos formas de vencerla**:
  - **Devolver sus sartenes** con el **ZARPAZO** en pleno vuelo (más puntos) — ¡pero
    Bea intentará saltarlas!
  - **Zarpazo cuerpo a cuerpo**: acércate y atízale directamente (más arriesgado,
    de cerca te acierta con la sartén).
- Aturde a Bea **3 veces** para que huya y deja libre el camino al móvil.
- Si una sartén te golpea pierdes un ❤️ (tienes 3). Si pierdes los tres: Game Over.

> No basta con esquivar: hay que **cronometrar el zarpazo** para reflejar las
> sartenes. Ese es el corazón divertido del juego.

## ⌨️ Controles

**Teclado**
- `←` `→` : moverse
- `Espacio` o `↑` : saltar
- `X` o `Z` : ZARPAZO (devolver sartenes / atacar)

**Móvil / táctil** (aparecen botones en pantalla automáticamente)
- `←` `→` abajo-izquierda : moverse
- `⤒` abajo-derecha : saltar
- `✦` abajo-derecha : ZARPAZO

Se recomienda jugar en **horizontal** (sale un aviso si estás en vertical).

## ▶️ Cómo ejecutarlo

El juego carga imágenes, así que necesita servirse por HTTP (no abrir el `.html`
directamente por `file://`). Desde esta carpeta `game/`:

```bash
# Opción A: Python
python -m http.server 8000

# Opción B: Node
npx http-server -p 8000
```

Luego abre **http://localhost:8000** en el navegador (o en el móvil usando la IP
del ordenador en la misma red Wi-Fi, p.ej. http://192.168.1.50:8000).

## 📁 Estructura

```
game/
├── index.html            # punto de entrada
├── vendor/phaser.min.js  # Phaser 3 (local, sin internet)
├── src/
│   ├── config.js         # constantes y metadatos de sprites
│   ├── sfx.js            # efectos de sonido procedurales (Web Audio)
│   ├── controls.js       # controles táctiles móvil
│   ├── main.js           # arranque y configuración de Phaser
│   └── scenes/           # Preload, Menu, Game, End
├── assets/
│   ├── sprites/          # tigre_*.png y bea_*.png (tiras de animación)
│   ├── items/            # mobile, pan, heart, coin, gem
│   └── bg/               # capas de parallax + tiles del suelo
└── tools/                # scripts Python que recortan los sprites originales
    ├── slice.py          # recorta tigre/bea en tiras de animación
    └── items.py          # extrae iconos de Objetos.png
```

## 🛠️ Regenerar sprites (opcional)

Los sprites limpios se generan a partir de los originales en `../Assets/`:

```bash
python tools/slice.py    # recorta personajes (quita fondo, alinea pies)
python tools/items.py    # extrae objetos sueltos
```

Créditos del tileset de ciudad: *GandalfHardcore City Tiles* (ver
`../Assets/Ciudad_extracted/.../READ ME.txt`).
