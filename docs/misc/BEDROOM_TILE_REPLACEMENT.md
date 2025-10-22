# How to Replace Bedroom Tiles/Graphics

You have **3 options** to change your bedroom graphics from rectangles to tiles:

---

## Option 1: Quick & Easy - Use Procedural Tiles (No Images Needed)

This creates colorful tiles in code - perfect for prototyping or if you don't have tile images yet.

### Step-by-step:

1. **Open `src/scenes/bedroom.ts`**

2. **Add imports at the top:**
```typescript
import { Tileset, Tilemap } from '../utils/tilesetLoader';
```

3. **After loading the player sprite, add this tile generation code:**
```typescript
// Create procedural tileset
const tilesetCanvas = document.createElement('canvas');
const tileSize = 32;
const tilesInSet = 8;
tilesetCanvas.width = tilesInSet * tileSize;
tilesetCanvas.height = tileSize;
const tileCtx = tilesetCanvas.getContext('2d')!;

// Define tile colors
const tileColors = {
  floor: '#3a3a3a',
  wall: '#555555',
  bedMain: '#8B4513',
  bedSheet: '#D2691E',
  desk: '#654321',
  deskTop: '#8B7355',
  wardrobe: '#8B4513',
  bookshelf: '#654321',
};

// Draw tiles 0-7 with different colors
const colors = [
  tileColors.floor,     // 0: Floor
  tileColors.wall,      // 1: Wall
  tileColors.bedMain,   // 2: Bed
  tileColors.desk,      // 3: Desk
  tileColors.wardrobe,  // 4: Wardrobe  
  tileColors.bookshelf, // 5: Bookshelf
  '#2d5016',            // 6: Dark accent
  '#4a8c2a',            // 7: Green accent
];

colors.forEach((color, i) => {
  tileCtx.fillStyle = color;
  tileCtx.fillRect(i * tileSize, 0, tileSize, tileSize);
  // Add subtle border
  tileCtx.strokeStyle = 'rgba(0,0,0,0.3)';
  tileCtx.lineWidth = 1;
  tileCtx.strokeRect(i * tileSize, 0, tileSize, tileSize);
});

// Create tileset from the canvas
const roomTileset = new Tileset({
  imagePath: tilesetCanvas.toDataURL(),
  tileWidth: tileSize,
  tileHeight: tileSize,
  columns: tilesInSet,
  rows: 1,
});

await roomTileset.load();

// Define room layout (20x12 to match ROOM_WIDTH x ROOM_HEIGHT)
const roomData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const roomMap = new Tilemap({
  tileset: roomTileset,
  data: roomData,
  tileSize: TILE_SIZE,
});
```

4. **Replace the entire `render()` function with:**
```typescript
const render = () => {
  if (!ctx || !gameActive) return;

  // Clear
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Render tilemap (replaces all the rectangle drawing!)
  roomMap.render(ctx);

  // Draw player sprite on top
  if (playerSprite) {
    drawSprite(ctx, playerSprite, {
      x: playerX,
      y: playerY,
      width: playerSize,
      height: playerSize,
    });
  } else {
    // Fallback to rectangle
    ctx.fillStyle = '#4a8c2a';
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
  }

  // Player face (if you want to keep it over the sprite)
  ctx.fillStyle = '#2d5016';
  ctx.fillRect(playerX + 8, playerY + 8, 6, 6);
  ctx.fillRect(playerX + 18, playerY + 8, 6, 6);
  ctx.fillRect(playerX + 8, playerY + 18, 16, 4);
};
```

**Done!** Your bedroom now uses a tilemap instead of individual rectangles.

---

## Option 2: Use a Tileset Image File

If you have or can create a tileset image:

### Step 1: Get a Tileset Image

**Download a free tileset:**
- Kenney.nl: https://kenney.nl/assets/rpg-urban-pack (top-down room tiles)
- OpenGameArt: https://opengameart.org/content/lpc-room-and-furniture (furniture tiles)

**Or use the sprite generator:**
- Open `sprite-generator.html` in your browser
- Download individual sprites
- Combine them into a single image with a tool like Photoshop/GIMP

### Step 2: Save Tileset
Save your tileset image to:
```
public/sprites/tiles/room-tileset.png
```

Make sure it's organized in a grid (e.g., 8 columns × 4 rows, 32×32 tiles each)

### Step 3: Update bedroom.ts

```typescript
import { Tileset, Tilemap } from '../utils/tilesetLoader';

// In renderBedroom, after loading player sprite:
const roomTileset = new Tileset({
  imagePath: '/sprites/tiles/room-tileset.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,  // Adjust based on your image
  rows: 4,     // Adjust based on your image
  spacing: 0,  // Gap between tiles (if any)
  margin: 0,   // Outer margin (if any)
});

await roomTileset.load();

// Map tile indices to your tileset
// (Check your tileset to see which index is which tile)
const roomData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,8,8,8,1],
  // ... use actual tile indices from your tileset
];

const roomMap = new Tilemap({
  tileset: roomTileset,
  data: roomData,
  tileSize: TILE_SIZE,
});

// In render():
roomMap.render(ctx);
```

---

## Option 3: Use ASCII Pattern (Super Fast!)

Perfect for quick level design - draw your room with text!

```typescript
import { Tileset, createTilemapFromPattern } from '../utils/tilesetLoader';

// Create or load tileset (same as above)
const roomTileset = new Tileset({ ... });
await roomTileset.load();

// Design room with ASCII art
const roomPattern = `
####################
#BBBBB............W#
#BBBBB............W#
#.................W#
#..................#
#..........DDDDDD..#
#..........DDDDDD..#
#..........DDDDDD..#
#..................#
#BBBB..............#
#BBBB..............#
####################
`;

const tileMapping = {
  '#': 1,  // Wall tile index
  '.': 0,  // Floor tile index
  'B': 2,  // Bed tile index
  'D': 3,  // Desk tile index
  'W': 4,  // Wardrobe tile index
  ' ': -1, // Empty (transparent)
};

const roomMap = createTilemapFromPattern(
  roomTileset,
  roomPattern,
  TILE_SIZE,
  tileMapping
);

// In render():
roomMap.render(ctx);
```

---

## Complete Example File

I can create a complete replacement `bedroom.ts` file for you using any of these methods. Which would you prefer?

1. **Procedural tiles** (colorful, no images needed)
2. **Tileset image** (I'll show you where to get free ones)
3. **ASCII pattern** (fastest to edit/prototype)

Or I can create all three as separate example files you can switch between!

---

## Benefits of Using Tiles

✅ **Easy to modify** - Change room layout by editing array/pattern  
✅ **Reusable** - Use same tileset across multiple rooms  
✅ **Performance** - Tilemaps can be cached/optimized  
✅ **Consistency** - All furniture/walls use same art style  
✅ **Scalable** - Easy to add new room types  

---

## Quick Decision Guide

- **Just want to see it work?** → Option 1 (Procedural)
- **Want nice graphics?** → Option 2 (Tileset image)
- **Want to quickly design levels?** → Option 3 (ASCII pattern)
- **Not sure yet?** → Start with Option 1, upgrade later

Let me know which option you want, and I'll implement it for you right now!
