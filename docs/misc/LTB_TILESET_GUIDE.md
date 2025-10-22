# LTB Tileset & Tilemap Guide

This project uses a simple Tileset/Tilemap system in `src/utils/tilesetLoader.ts`. This guide shows how to build a proper tileset for the Learning & Teaching Building (LTB) and wire a tilemap for outside/inside navigation.

## Concepts
- Tileset: a single image (PNG) containing a grid of tiles. Each tile is the same size, e.g. 32x32.
- Tilemap: a 2D matrix of tile indices referencing the tileset. Index 0 is top-left tile, then left-to-right, top-to-bottom.

## Prepare your tileset image
1. Create a PNG at a multiple of 32 (e.g. 256x64 = 8 columns x 2 rows).
2. Place tiles in a grid. Recommended set for LTB:
   - Exterior: grass, pavement, exterior wall, glass, doorway, signage.
   - Interior: interior floor, interior wall, door, room accent.
3. Export to `public/sprites/tiles/ltb-tiles.png`.

Example layout (8x2):
- Row 1: 0=Grass, 1=Pavement, 2=Exterior wall, 3=Door, 4=Interior floor, 5=Interior wall, 6=Sign, 7=Glass
- Row 2: 8=Dark floor, 9=Dark wall, 10=Accent A, 11=Accent B, 12=Highlight, 13=Shadow top, 14=Concrete, 15=Slate

## Load the tileset
```ts
import { Tileset } from '../utils/tilesetLoader';

const tileset = new Tileset({
  imagePath: '/sprites/tiles/ltb-tiles.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 2,
});
await tileset.load();
```

## Build a tilemap
You can author maps as ASCII patterns and map characters to tile indices.

```ts
const T = { G: 0, P: 1, X: 2, D: 3, F: 4, W: 5, S: 6, L: 7 } as const;
const pattern = [
  'GGGGGGPPPP',
  'GGGGGGPPPP',
  'GGGGGGPPPP',
  'GGGPPPXPPG',
  'GGGPPPDPPG',
  'GGGPPPXPPG',
];
const map = pattern.map(row => row.split('').map(ch => (T as any)[ch] ?? -1));
```

Render it with `tileset.drawTile` per cell, or wrap in the `Tilemap` class.

## Collision, hotspots, and interaction
- Block movement on wall-like tiles (e.g., indices for exterior and interior walls, and glass).
- Define hotspots with rectangles `{ x, y, w, h, id }` and check if the player center overlaps to show prompts and handle actions.
- Use E to interact per convention in `campusLTB.ts`.

## Tips
- Keep the tile size consistent (32px) across your sprites.
- Use subtle outlines in the tileset image to guarantee grid separation.
- Start with solid colors to prototype quickly, then replace with art.
- You can layer multiple tilesets by simply drawing a background tileset first and then a detail tileset on top.

## Where the code lives
- Tileset utilities: `src/utils/tilesetLoader.ts`
- LTB scene example: `src/scenes/campusLTB.ts`
- Group meeting: `src/scenes/groupMeeting.ts`

Replace the procedural tiles in `campusLTB.ts` with `ltb-tiles.png` and adjust the character-to-index mapping when your tileset is ready.