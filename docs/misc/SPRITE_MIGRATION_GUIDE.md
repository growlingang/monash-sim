# Sprite Migration Guide

This guide shows you exactly how to replace the colored rectangles in your game with actual sprite images.

## Table of Contents
1. [Setup](#setup)
2. [Creating/Finding Sprites](#creating-sprites)
3. [Example Conversions](#example-conversions)
4. [Best Practices](#best-practices)
5. [Tile/Tileset Support](#tileset-support) ⭐ NEW

---

## Setup

### 1. Install the Sprite Loader (Already Done ✅)
The sprite loading system is in `/src/utils/spriteLoader.ts`

### 2. Create Sprite Folders (Already Done ✅)
```bash
mkdir -p public/sprites/player
mkdir -p public/sprites/furniture
mkdir -p public/sprites/vehicles
mkdir -p public/sprites/ui
```

### 3. Add Your Sprite Images (One has been added and linked for you to check.)
Place PNG files in the appropriate folders:
- `public/sprites/player/idle.png` - Player character
- `public/sprites/furniture/bed.png` - Bed sprite
- `public/sprites/vehicles/car-blue.png` - Player car
- `public/sprites/vehicles/car-red.png` - Traffic car
- etc.

---

## Creating Sprites

### Recommended Sizes
Based on your current code:
- **Player**: 32x48px (PLAYER_WIDTH x PLAYER_HEIGHT from busMinigame)
- **Bedroom player**: 32x32px (playerSize in bedroom)
- **Furniture**: 96x96px (3 tiles × 32px)
- **Cars**: 50x70px (CAR_WIDTH x CAR_HEIGHT from driveMinigame)

---

## Example Conversions

### Example 1: Bedroom Player Character (you can literally just ask cursor to do this once you've dragged in the sprite.)

**Before (Rectangle):**
```typescript
// In bedroom.ts render function
ctx.fillStyle = '#4a8c2a';
ctx.fillRect(playerX, playerY, playerSize, playerSize);
```

**After (Sprite):**
```typescript
import { loadSprite, drawSprite } from '../utils/spriteLoader';

// At the top of renderBedroom function, load sprites
let playerSprite: HTMLImageElement | null = null;

const initSprites = async () => {
  try {
    playerSprite = await loadSprite('/sprites/player/idle.png');
  } catch (error) {
    console.warn('Failed to load sprites, falling back to rectangles', error);
  }
};

// Call before starting game loop
await initSprites();

// In render function, replace fillRect with:
if (playerSprite) {
  drawSprite(ctx, playerSprite, {
    x: playerX,
    y: playerY,
    width: playerSize,
    height: playerSize,
  });
} else {
  // Fallback to rectangle if sprite failed to load
  ctx.fillStyle = '#4a8c2a';
  ctx.fillRect(playerX, playerY, playerSize, playerSize);
}
```

---

### Example 2: Bus Minigame Player (with rotation)

**Before (Rectangle with rotation):**
```typescript
// Player body (tilting based on balance)
ctx.save();
ctx.translate(playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT);
ctx.rotate(balance * 0.3);

// Body
ctx.fillStyle = '#4a8c2a';
ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);

// Face
ctx.fillStyle = '#2d5016';
ctx.fillRect(-PLAYER_WIDTH / 2 + 6, -PLAYER_HEIGHT + 8, 6, 6);
ctx.fillRect(-PLAYER_WIDTH / 2 + 20, -PLAYER_HEIGHT + 8, 6, 6);

ctx.restore();
```

**After (Sprite with rotation):**
```typescript
import { loadSprite, drawSprite } from '../utils/spriteLoader';

// Load at start of minigame
const busPlayerSprite = await loadSprite('/sprites/player/standing.png');

// In render function:
if (busPlayerSprite) {
  drawSprite(ctx, busPlayerSprite, {
    x: playerX,
    y: playerY,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    rotation: balance * 0.3, // Sprite helper handles rotation for you
  });
} else {
  // Fallback...
}
```

---

### Example 3: Drive Minigame Cars

**Before (Rectangle cars):**
```typescript
// Traffic cars
trafficCars.forEach((car) => {
  ctx.fillStyle = '#c94444';
  ctx.fillRect(car.x, car.y, CAR_WIDTH, CAR_HEIGHT);
  
  // Car details (windows)
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(car.x + 5, car.y + 10, CAR_WIDTH - 10, 20);
  ctx.fillRect(car.x + 5, car.y + 40, CAR_WIDTH - 10, 20);
});

// Player car
const playerX = roadX + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
ctx.fillStyle = '#4444c9';
ctx.fillRect(playerX, playerY, CAR_WIDTH, CAR_HEIGHT);

ctx.fillStyle = '#87ceeb';
ctx.fillRect(playerX + 5, playerY + 10, CAR_WIDTH - 10, 20);
ctx.fillRect(playerX + 5, playerY + 50, CAR_WIDTH - 10, 20);
```

**After (Sprite cars):**
```typescript
import { loadSprites, drawSprite } from '../utils/spriteLoader';

// Load at start of minigame
const carSprites = await loadSprites([
  '/sprites/vehicles/car-red.png',
  '/sprites/vehicles/car-blue.png',
]);

const redCarSprite = carSprites.get('/sprites/vehicles/car-red.png')!;
const blueCarSprite = carSprites.get('/sprites/vehicles/car-blue.png')!;

// In render function:
// Traffic cars
trafficCars.forEach((car) => {
  if (redCarSprite) {
    drawSprite(ctx, redCarSprite, {
      x: car.x,
      y: car.y,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
    });
  } else {
    // Fallback to rectangle
  }
});

// Player car
const playerX = roadX + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
if (blueCarSprite) {
  drawSprite(ctx, blueCarSprite, {
    x: playerX,
    y: playerY,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
  });
} else {
  // Fallback to rectangle
}
```

---

### Example 4: Bedroom Furniture

**Before (Rectangle bed):**
```typescript
// Draw bed
ctx.fillStyle = '#8B4513';
ctx.fillRect(2 * TILE_SIZE, 9 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
ctx.fillStyle = '#D2691E';
ctx.fillRect(2 * TILE_SIZE + 4, 9 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);
```

**After (Sprite bed):**
```typescript
import { loadSprite, drawSprite } from '../utils/spriteLoader';

// Load furniture sprites
const bedSprite = await loadSprite('/sprites/furniture/bed.png');

// In render:
if (bedSprite) {
  drawSprite(ctx, bedSprite, {
    x: 2 * TILE_SIZE,
    y: 9 * TILE_SIZE,
    width: 3 * TILE_SIZE,
    height: 3 * TILE_SIZE,
  });
} else {
  // Fallback to rectangle
}
```

---

## Best Practices

### 1. Always Use Fallbacks
Always keep the rectangle drawing code as a fallback in case sprites fail to load:
```typescript
if (sprite) {
  drawSprite(ctx, sprite, options);
} else {
  // Original rectangle code
  ctx.fillStyle = '#4a8c2a';
  ctx.fillRect(x, y, width, height);
}
```

### 2. Load Sprites Once
Load sprites at the start of your scene/minigame, not in the render loop:
```typescript
// ✅ Good - load once
export const renderBedroom = async (root: HTMLElement, store: GameStore) => {
  const sprites = await loadSprites([...]);
  
  const gameLoop = () => {
    render(); // Uses already-loaded sprites
    requestAnimationFrame(gameLoop);
  };
};

// ❌ Bad - loading every frame
const render = async () => {
  const sprite = await loadSprite(...); // DON'T DO THIS
  drawSprite(ctx, sprite, ...);
};
```

### 3. Handle Errors Gracefully
```typescript
try {
  const sprites = await loadSprites([...]);
} catch (error) {
  console.warn('Some sprites failed to load:', error);
  // Game continues with rectangle fallbacks
}
```

### 4. Use Sprite Sheets for Animation
If you want animated sprites (walking, driving, etc.):
```typescript
import { drawSubSprite } from '../utils/spriteLoader';

// Sprite sheet with 4 frames in a row
const frameWidth = 32;
const frameHeight = 48;
const currentFrame = Math.floor(Date.now() / 200) % 4; // Animate at 5 FPS

drawSubSprite(ctx, spriteSheet, {
  sourceX: currentFrame * frameWidth,
  sourceY: 0,
  sourceWidth: frameWidth,
  sourceHeight: frameHeight,
  x: playerX,
  y: playerY,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
});
```

### 5. Organize Your Assets
```
public/
  sprites/
    player/
      idle.png
      walk.png
      worried.png
    furniture/
      bed.png
      desk.png
      wardrobe.png
      bookshelf.png
    vehicles/
      car-blue.png
      car-red.png
      bus.png
    ui/
      balance-bar.png
      indicator.png
```

---

## Tileset Support

**Yes! The sprite loader natively supports tiles and tilesets!** 🎉

### Quick Overview
- Use **`drawSubSprite()`** to draw individual tiles from a sprite sheet
- Use **`Tileset` class** (in `/src/utils/tilesetLoader.ts`) for organized tile management
- Use **`Tilemap` class** for full tile-based level rendering with 2D arrays

### Example: Draw a Single Tile
```typescript
import { loadSprite, drawSubSprite } from '../utils/spriteLoader';

const tileset = await loadSprite('/sprites/tiles/terrain.png');

// Draw tile #3 from a tileset (32x32 tiles in a row)
drawSubSprite(ctx, tileset, {
  sourceX: 3 * 32,  // Tile index × tile size
  sourceY: 0,
  sourceWidth: 32,
  sourceHeight: 32,
  x: 100,
  y: 100,
  width: 32,
  height: 32,
});
```

### Example: Using Tileset Class
```typescript
import { Tileset, Tilemap } from '../utils/tilesetLoader';

const tiles = new Tileset({
  imagePath: '/sprites/tiles/room.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,
  rows: 4,
});

await tiles.load();

// Draw tile by index
tiles.drawTile(ctx, 5, x, y);

// Or create a tilemap from 2D array
const map = new Tilemap({
  tileset: tiles,
  data: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, -1, 1, 0],
    [0, 0, 0, 0, 0],
  ],
  tileSize: 32,
});

map.render(ctx);
```

**📖 Full tileset documentation:** See [`TILESET_GUIDE.md`](./TILESET_GUIDE.md)

---

## Quick Migration Checklist

1. ✅ Create sprite loader utility (done)
2. ✅ Create `public/sprites/` folder structure (done)
3. ✅ Tileset/tilemap utilities added (done)
4. ⬜ Find or create sprite images (PNG with transparency)
5. ⬜ Update `bedroom.ts` to load and use sprites
6. ⬜ Update `busMinigame.ts` to load and use sprites
7. ⬜ Update `driveMinigame.ts` to load and use sprites
8. ⬜ Update `walkMinigame.ts` (if needed)
9. ⬜ Test all scenes with sprites
10. ⬜ Verify fallbacks work when sprites missing

---

## Need Help?

If you want me to:
- Create placeholder sprite images for you
- Update specific files to use sprites
- Set up sprite animations
- Create a sprite sheet/tileset system
- Convert levels to use tilemaps

Just let me know which part you'd like help with!
