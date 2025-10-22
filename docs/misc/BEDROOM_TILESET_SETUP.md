# ✅ Bedroom Now Uses Tileset Images!

Your bedroom has been updated to use a tileset image system. Here's what changed and how to use it:

---

## What Changed

✅ **Bedroom now uses tilemaps** instead of individual rectangles  
✅ **Automatic fallback** to procedural tiles if image not found  
✅ **Easy to customize** by editing tile indices in array  

---

## Quick Start (3 steps)

### Step 1: Generate the Tileset Image

1. Open `room-tileset-generator.html` in your browser:
   ```bash
   open room-tileset-generator.html
   ```

2. Click **"⬇️ Download Tileset"** button

3. Save the file as `room-tileset.png`

### Step 2: Place the Tileset

Move the downloaded file to:
```
public/sprites/tiles/room-tileset.png
```

### Step 3: Test It!

1. Refresh your game in the browser
2. Go to the bedroom scene
3. You should see the tileset-based room!

Check the browser console - you should see:
```
✅ Room tileset loaded from image!
```

---

## How It Works

### The Tileset Image

The generated tileset is **256×64 pixels** (8×2 tiles):

```
Row 1: [0: Floor] [1: Wall] [2: Bed] [3: Desk] [4: Wardrobe] [5: Bookshelf] [6: Carpet] [7: Window]
Row 2: [8: Door] [9: Plant] [10: Lamp] [11: Rug] [12: Chair] [13: Table] [14: Dark Floor] [15: Light Wall]
```

Each tile is **32×32 pixels**.

### The Room Layout

The bedroom is defined as a **20×12 tile grid** in `bedroom.ts`:

```typescript
const roomData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Top wall
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],  // Bookshelf (5) left, Wardrobe (4) right
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],  // Desk (3) on right
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Bed (2) bottom left
  [1,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Bottom wall
];
```

---

## Customizing Your Room

### Option 1: Change the Layout

Edit the `roomData` array in `src/scenes/bedroom.ts`:

```typescript
// Example: Add a carpet in the center
const roomData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],
  // ...
  [1,0,0,0,0,0,0,0,0,6,6,6,0,0,0,0,0,0,0,1], // Add carpet (tile 6)
  // ...
];
```

### Option 2: Use Different Tiles

The tileset has 16 tiles (0-15). Mix and match:

```typescript
[1,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // Add plant (tile 9)
```

### Option 3: Create Your Own Tileset

1. Create a custom tileset image in any image editor
2. Make sure it's organized as a grid (8 columns × 2 rows recommended)
3. Each tile should be **32×32 pixels**
4. Save to `public/sprites/tiles/room-tileset.png`
5. Update the `columns` and `rows` in bedroom.ts if needed:

```typescript
roomTileset = new Tileset({
  imagePath: '/sprites/tiles/room-tileset.png',
  tileWidth: 32,
  tileHeight: 32,
  columns: 8,  // ← Change if your tileset has different columns
  rows: 2,     // ← Change if your tileset has different rows
});
```

---

## Fallback Behavior

If the tileset image is not found, the bedroom will:

1. **Auto-generate procedural tiles** with similar colors
2. Still work perfectly - just with simpler graphics
3. Log a warning in console: `⚠️ Tileset image not found, generating procedural tileset...`

This means **your game never breaks** - it gracefully degrades!

---

## Where to Get Better Tilesets

### Free Resources

1. **Kenney.nl** - https://kenney.nl/assets/rpg-urban-pack
   - High-quality top-down room tiles
   - Free to use, even commercially

2. **OpenGameArt** - https://opengameart.org/content/lpc-room-and-furniture
   - Community-created tilesets
   - Check licenses

3. **itch.io** - https://itch.io/game-assets/free/tag-tileset
   - Tons of free and paid options

### Tips for Using External Tilesets

1. **Check the tile size** - adjust `tileWidth` and `tileHeight` in code
2. **Count columns/rows** - update the Tileset config
3. **Note the tile order** - map the indices to your room layout
4. **Watch for spacing** - some tilesets have gaps between tiles:
   ```typescript
   roomTileset = new Tileset({
     imagePath: '/sprites/tiles/room-tileset.png',
     tileWidth: 32,
     tileHeight: 32,
     columns: 8,
     rows: 2,
     spacing: 1,  // ← 1px gap between tiles
     margin: 1,   // ← 1px outer margin
   });
   ```

---

## Debugging

### Check if tileset loaded

Open browser console (F12) and look for:
- ✅ `Room tileset loaded from image!` = Success!
- ⚠️ `Tileset image not found...` = Using procedural fallback

### Common Issues

**Problem:** Tileset not showing / using fallback  
**Solution:** Check that `room-tileset.png` is in `public/sprites/tiles/`

**Problem:** Tiles look weird / stretched  
**Solution:** Verify tile size matches (should be 32×32)

**Problem:** Wrong tiles showing  
**Solution:** Check tile indices in `roomData` array

**Problem:** Collision still works with old rectangles  
**Solution:** Collision code is still there - it works with tileindices (not visual)

---

## Next Steps

✅ **Done:** Bedroom uses tileset images  
⬜ Add more decorative tiles (plants, posters, etc.)  
⬜ Create different room variations  
⬜ Apply tilesets to other scenes (minigames)  
⬜ Add animated tiles (blinking lights, etc.)

---

## Benefits You Now Have

✅ **Easy room editing** - Change layout by editing array  
✅ **Consistent art style** - All tiles from one source  
✅ **Reusable system** - Use same tileset for multiple rooms  
✅ **Graceful fallback** - Works even without image files  
✅ **Professional look** - Real sprite-based graphics  

Enjoy your new tileset-powered bedroom! 🏠✨
