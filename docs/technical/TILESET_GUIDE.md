# Tileset/Tilemap Guide

Your sprite loader **already supports tiles** through the `drawSubSprite` function! I've also added dedicated tileset utilities to make tile-based rendering even easier.

## What's Supported

### ✅ Built-in (Already Available)
- **`drawSubSprite()`** - Draw individual tiles from a sprite sheet
- Supports sprite sheets with any layout
- Full transformation support (rotation, flip, alpha)

### ✅ New Utilities (Just Added)
- **`Tileset`** class - Manages tilesets with automatic tile indexing
- **`Tilemap`** class - Renders tile-based levels from 2D arrays
- **Pattern-based maps** - Create levels from ASCII art
- **Viewport culling** - Only renders visible tiles (performance)

---

## Quick Start Examples

### Example 1: Using drawSubSprite Directly (Simple)

```typescript
import { loadSprite, drawSubSprite } from '../utils/spriteLoader';

// Load a tileset image (e.g., 8 tiles in a row, 32x32 each)
const tileset = await loadSprite('/sprites/tiles/terrain.png');

// Draw tile #3 (4th tile) at position (100, 100)
const tileIndex = 3;
const tileSize = 32;

drawSubSprite(ctx, tileset, {
  sourceX: tileIndex * tileSize,  // Column position in sprite sheet
  sourceY: 0,                      // Row position (0 for single row)
  sourceWidth: tileSize,
  sourceHeight: tileSize,
  x: 100,                          // Destination X
  y: 100,                          // Destination Y
  width: tileSize,                 // Render size
  height: tileSize,
});
```

### Example 2: Using Tileset Class (Recommended)

```typescript
import { Tileset } from '../utils/tilesetLoader';

// Create a tileset (8 columns x 4 rows, 32x32 tiles)
const terrain = new Tileset({
  imagePath: '/sprites/tiles/terrain.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 4,
  spacing: 1,  // Optional: 1px gap between tiles
  margin: 0,   // Optional: outer margin
});

// Load the tileset
await terrain.load();

// Draw tile by index (0-31 for 8x4 tileset)
// Index 0 = top-left, Index 7 = top-right, Index 8 = second row left
terrain.drawTile(ctx, 0, 100, 100);      // Tile 0 at (100, 100)
terrain.drawTile(ctx, 5, 132, 100, 2);   // Tile 5 at (132, 100), 2x scale
```

### Example 3: Using Tilemap for Levels

```typescript
import { Tileset, Tilemap } from '../utils/tilesetLoader';

// Create tileset
const tiles = new Tileset({
  imagePath: '/sprites/tiles/dungeon.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 8,
});

await tiles.load();

// Define a level using 2D array (-1 = empty)
const levelData = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, -1, -1, -1, -1, 1, 0],
  [0, 1, -1, 2, 2, -1, 1, 0],
  [0, 1, -1, -1, -1, -1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Create tilemap
const map = new Tilemap({
  tileset: tiles,
  data: levelData,
  tileSize: 32,
});

// Render entire map
map.render(ctx, 0, 0);

// Or render only visible portion (optimized for large maps)
map.renderVisible(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
```

### Example 4: ASCII Pattern Maps

```typescript
import { Tileset, createTilemapFromPattern } from '../utils/tilesetLoader';

const tiles = new Tileset({
  imagePath: '/sprites/tiles/terrain.png',
  tileWidth: 16,
  tileHeight: 16,
  columns: 8,
  rows: 8,
});

await tiles.load();

// Define level with ASCII art
const pattern = `
##########
#........#
#..####..#
#..#..#..#
#..#..#..#
#..####..#
#........#
##########
`;

// Map characters to tile indices
const mapping = {
  '#': 0,  // Wall tile
  '.': 1,  // Floor tile
  ' ': -1, // Empty
};

const map = createTilemapFromPattern(tiles, pattern, 16, mapping);
map.render(ctx);
```

---

## Converting Your Bedroom to Use Tilesets

Here's how to convert the bedroom scene to use a tileset:

### Step 1: Create a Tileset Image

Create `/public/sprites/tiles/room.png` with:
- Tile 0: Floor
- Tile 1: Wall
- Tile 2: Bed (top-left)
- Tile 3: Bed (top-right)
- Tile 4: Bed (bottom-left)
- Tile 5: Bed (bottom-right)
- Tile 6: Desk
- etc.

### Step 2: Update bedroom.ts

```typescript
import { Tileset, createTilemapFromPattern } from '../utils/tilesetLoader';

export const renderBedroom = async (root: HTMLElement, store: GameStore) => {
  // ... setup code ...

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Load tileset
  const roomTiles = new Tileset({
    imagePath: '/sprites/tiles/room.png',
    tileWidth: 32,
    tileHeight: 32,
    columns: 8,
    rows: 4,
  });

  await roomTiles.load();

  // Define room layout (20x12 tiles to match current ROOM_WIDTH x ROOM_HEIGHT)
  const roomLayout = `
11111111111111111111
1..................1
1BB...........WW...1
1BB...........WW...1
1..................1
1..................1
1..................1
1..................1
1..................1
1BBB..........DDDD.1
1BBB..........DDDD.1
11111111111111111111
  `.trim();

  const tileMapping = {
    '1': 1,   // Wall
    '.': 0,   // Floor
    'B': 2,   // Bed
    'W': 6,   // Wardrobe
    'D': 7,   // Desk
    ' ': -1,  // Empty
  };

  const map = createTilemapFromPattern(roomTiles, roomLayout, TILE_SIZE, tileMapping);

  // In render loop
  const render = () => {
    if (!ctx || !gameActive) return;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render tilemap
    map.render(ctx);

    // Draw player sprite on top
    if (playerSprite) {
      drawSprite(ctx, playerSprite, {
        x: playerX,
        y: playerY,
        width: playerSize,
        height: playerSize,
      });
    }
  };
};
```

---

## Performance Tips

### 1. Use Viewport Culling for Large Maps
```typescript
// Only renders tiles visible in camera view
map.renderVisible(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
```

### 2. Cache Tileset Coordinates
```typescript
// Pre-calculate tile coords if drawing same tiles repeatedly
const tileCoords = tileset.getTileCoords(tileIndex);
// Use coords multiple times
```

### 3. Use Layers
```typescript
// Separate static and dynamic tiles
const backgroundMap = new Tilemap({ ... }); // Static terrain
const foregroundMap = new Tilemap({ ... }); // Decorations

// Render background once to offscreen canvas, reuse
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d')!;
backgroundMap.render(bgCtx);

// In game loop, just draw the cached background
ctx.drawImage(bgCanvas, 0, 0);
foregroundMap.render(ctx); // Only render dynamic layer
```

---

## Common Tileset Layouts

### Single Row (Simple)
```
[0][1][2][3][4][5][6][7]
```
```typescript
const tileset = new Tileset({
  imagePath: '/sprites/tiles/simple.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 1,
});
```

### Grid (Most Common)
```
[0 ][1 ][2 ][3 ][4 ][5 ][6 ][7 ]
[8 ][9 ][10][11][12][13][14][15]
[16][17][18][19][20][21][22][23]
```
```typescript
const tileset = new Tileset({
  imagePath: '/sprites/tiles/terrain.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 3,
});
```

### With Spacing (Tilesets from tools like Tiled)
```
[ 0 ] [ 1 ] [ 2 ]
  1px gap between tiles
```
```typescript
const tileset = new Tileset({
  imagePath: '/sprites/tiles/spaced.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 8,
  spacing: 1,  // Gap between tiles
  margin: 1,   // Outer margin
});
```

---

## Tileset Resources

### Free Tilesets
- **Kenney.nl** - https://kenney.nl/assets?q=2d (tons of free tilesets)
- **OpenGameArt** - https://opengameart.org/art-search-advanced?keys=tileset
- **itch.io** - https://itch.io/game-assets/free/tag-tileset

### Creating Tilesets
- **Tiled** - https://www.mapeditor.org/ (free tilemap editor, exports to JSON)
- **Aseprite** - Great for pixel art tilesets
- **Piskel** - Free browser-based

### Recommended Sizes
- **16x16** - Retro style, large maps
- **32x32** - Good balance (matches your current TILE_SIZE!)
- **64x64** - Detailed, smaller maps

---

## API Reference

### Tileset Class

```typescript
class Tileset {
  constructor(config: TilesetConfig)
  async load(): Promise<void>
  getTileCount(): number
  getTileCoords(tileIndex: number): { x, y, width, height }
  drawTile(ctx, tileIndex, x, y, scale?): void
  isLoaded(): boolean
}
```

### Tilemap Class

```typescript
class Tilemap {
  constructor(config: TilemapConfig)
  getDimensions(): { width, height }
  getTileAt(gridX, gridY): number
  setTileAt(gridX, gridY, tileIndex): void
  render(ctx, offsetX?, offsetY?): void
  renderVisible(ctx, cameraX, cameraY, viewportW, viewportH): void
}
```

### Helper Functions

```typescript
createTilemapFromPattern(
  tileset: Tileset,
  pattern: string,
  tileSize: number,
  mapping: Record<string, number>
): Tilemap
```

---

## Summary

**Yes, your sprite loader natively supports tiles!** 

You have three options:

1. **Direct method** - Use `drawSubSprite()` for manual tile drawing
2. **Tileset class** - For organized tile management with auto-indexing
3. **Tilemap class** - For full tile-based levels with 2D arrays

The tilemap system is perfect for:
- Room layouts (like your bedroom)
- Dungeon levels
- Overworld maps
- Any grid-based game

Want me to convert your bedroom scene to use a tileset system?
