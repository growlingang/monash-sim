# 🧪 Testing the Tileset System

Your tileset system is now integrated into your game! Here's how to test it.

## Quick Test (2 minutes)

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Navigate to Your Game
1. Open http://localhost:5175 (or whatever port Vite shows)
2. Select a major in character creation
3. You'll be in the bedroom scene

### Step 3: Run the Tileset Test
**Press the `T` key** in the bedroom scene

This will load the **Tileset Test Scene** which demonstrates:
- ✅ Creating procedural tilesets (no image files needed!)
- ✅ Loading tilesets with the `Tileset` class
- ✅ Drawing individual tiles
- ✅ Creating tilemaps from 2D arrays
- ✅ Creating tilemaps from ASCII patterns
- ✅ Integration with your existing sprite system

### Step 4: Review the Results
The test scene shows:
- **Top row**: 8 individual tiles drawn using `tileset.drawTile()`
- **Left side**: A tilemap rendered from a 2D array (nested squares pattern)
- **Right side**: A tilemap rendered from an ASCII pattern (room with center design)
- **Status messages**: Step-by-step test results showing what passed

Click **"← Back to Bedroom"** to return to the game.

---

## What This Proves

✅ **Tilesets work** - You can create and load tilesets  
✅ **Tilemaps work** - You can render full levels from 2D arrays  
✅ **ASCII patterns work** - You can design levels with text  
✅ **Integration works** - Sprites and tilesets work together  
✅ **No files needed** - Test creates tiles procedurally (but you can use image files)

---

## Next Steps

### Option 1: Use Real Tileset Images
1. Create or download a tileset image (e.g., from Kenney.nl)
2. Save it to `public/sprites/tiles/terrain.png`
3. Update the test to load it:
   ```typescript
   const tileset = new Tileset({
     imagePath: '/sprites/tiles/terrain.png',
     tileWidth: 32,
     tileHeight: 32,
     columns: 8,
     rows: 4,
   });
   ```

### Option 2: Convert Bedroom to Use Tilesets
Instead of drawing rectangles for walls/furniture, use a tilemap:
- See `TILESET_GUIDE.md` for full example
- The bedroom is already 20×12 tiles (matches `ROOM_WIDTH` × `ROOM_HEIGHT`)
- Just need to create/find a room tileset image

### Option 3: Use Tilesets in Minigames
- Drive minigame: Use road tile patterns
- Walk minigame: Use crosswalk/street tiles
- Bus minigame: Use bus interior tiles

---

## Keyboard Shortcuts

While in the **bedroom**:
- **W/A/S/D** or **Arrow Keys** - Move player
- **P** - Open phone
- **T** - Open tileset test scene ⭐

While in the **tileset test**:
- **"← Back to Bedroom"** button - Return to bedroom

---

## Troubleshooting

### "Failed to load player sprite"
- This is expected if you haven't added the player sprite yet
- The test will still work, just without the player overlay
- Tilesets use their own procedural tiles, so they always work

### Canvas is blank
- Check browser console (F12) for errors
- Make sure you're in the tileset test scene (press T in bedroom)

### Test doesn't open
- Make sure you're in the bedroom scene first
- Press T (not t - should work with either, but try uppercase)
- Check that the dev server is running

---

## Technical Details

### What the Test Does
1. **Creates a procedural tileset** - 8 colored tiles with numbers (no file needed)
2. **Converts to data URL** - Loads it like a regular image
3. **Tests Tileset class** - Verifies tile indexing and drawing
4. **Tests Tilemap class** - Verifies 2D array rendering
5. **Tests ASCII patterns** - Verifies pattern-to-tilemap conversion
6. **Tests integration** - Loads your player sprite on top of tilemap

### Files Involved
- `src/scenes/tilesetTest.ts` - The test scene
- `src/utils/tilesetLoader.ts` - Tileset/Tilemap classes
- `src/utils/spriteLoader.ts` - Base sprite loading (supports tiles via `drawSubSprite`)
- `src/scenes/bedroom.ts` - Added T key shortcut
- `src/core/types.ts` - Added 'tileset-test' scene ID

---

## What's Next?

Once you've confirmed the test works, you can:
1. Replace rectangle rendering with tilesets in any scene
2. Use real tileset images from asset packs
3. Design levels with ASCII art (super fast prototyping!)
4. Add animated tiles (water, fire, etc.)
5. Implement procedural tile generation

**Full documentation:** See `TILESET_GUIDE.md` for comprehensive examples and API reference.
