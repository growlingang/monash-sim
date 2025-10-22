# 🎮 Using Your Tileset - Quick Start Guide

## ✅ You've Already Done This:
- Added tileset to `public/sprites/tiles/room-tileset.png`

## 🚀 What to Do Now (2 steps):

### Step 1: Refresh Your Browser
Your game is already configured to load the tileset automatically!

1. Go to your browser where the game is running (http://localhost:5175)
2. **Hard refresh:** Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. Select a major and go to the bedroom

### Step 2: Check It Worked
Open the browser console (press `F12`) and look for:

✅ **Success message:**
```
✅ Room tileset loaded from image!
```

❌ **If you see this instead:**
```
⚠️ Tileset image not found, generating procedural tileset...
```
Then the file path is wrong - check that the file is exactly at:
`public/sprites/tiles/room-tileset.png`

---

## 🎨 Your Tileset is Now Live!

The bedroom scene will automatically:
1. Load your tileset image
2. Use it to render the room
3. Map tiles based on the layout defined in `bedroom.ts`

---

## 📊 Understanding Your Tileset Layout

Your tileset should be organized as a **grid of tiles**. The bedroom expects:
- **8 columns × 2 rows** = 16 tiles total
- Each tile should be **32×32 pixels**
- Total image size: **256×64 pixels**

### Tile Index Map:
```
Row 1:  [0] [1] [2] [3] [4] [5] [6] [7]
Row 2:  [8] [9] [10][11][12][13][14][15]
```

### How the Bedroom Uses Them:
- **Tile 0** = Floor (open walkable space)
- **Tile 1** = Wall (room borders)
- **Tile 2** = Bed (bottom-left, 3×2 tiles)
- **Tile 3** = Desk (right side, 3×3 tiles)
- **Tile 4** = Wardrobe (top-right, 3×3 tiles)
- **Tile 5** = Bookshelf (top-left, 3×3 tiles)
- **Tiles 6-15** = Extra (carpet, windows, decorations, etc.)

---

## 🔧 If Your Tileset Has a Different Layout

If your tileset has different dimensions or tile size, update `src/scenes/bedroom.ts`:

```typescript
roomTileset = new Tileset({
  imagePath: '/sprites/tiles/room-tileset.png',
  tileWidth: 32,    // ← Change if tiles are different size
  tileHeight: 32,   // ← Change if tiles are different size
  columns: 8,       // ← Change if different number of columns
  rows: 2,          // ← Change if different number of rows
});
```

---

## 🎯 Next Steps

### Want to Change Room Layout?
Edit the `roomData` array in `src/scenes/bedroom.ts`:

```typescript
const roomData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Top wall (tile 1)
  [1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,4,4,4,1],  // Floor + furniture
  // ... change these numbers to use different tiles
];
```

### Want to Add More Tiles?
Just use different tile indices (0-15) in your `roomData` array!

Example:
- Change `0` to `6` → use tile 6 (maybe carpet)
- Change some `1` to `7` → use tile 7 (maybe window)

---

## 🐛 Troubleshooting

### "I refreshed but still see old graphics"
- Try a **hard refresh**: `Cmd + Shift + R` or `Ctrl + F5`
- Clear browser cache
- Close and reopen the browser tab

### "Console says 'Tileset image not found'"
- Check file is at: `public/sprites/tiles/room-tileset.png`
- Check filename exactly (no spaces, no (1), correct extension)
- File should be **PNG format**

### "Room looks wrong/distorted"
Your tileset might have different dimensions. Check:
1. What size are your individual tiles? (should be 32×32)
2. How many columns? (should be 8)
3. How many rows? (should be 2)

Update the Tileset config in bedroom.ts to match your image.

### "Some tiles are in wrong places"
The bedroom layout expects specific tiles at specific indices:
- Make sure tile 0 in your image is the floor
- Make sure tile 1 in your image is the wall
- Etc.

Or, rearrange your roomData array to match your tileset!

---

## 📚 That's It!

Your tileset is now active in the game. Just refresh your browser and see it in action! 🎉

**Pro tip:** Press `T` in the bedroom to see the tileset test scene and verify all tiles are loading correctly.
