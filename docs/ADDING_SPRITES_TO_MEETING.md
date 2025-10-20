# Adding Custom Sprites & Tileset to Group Meeting Scene

This guide shows you how to add your own NPC sprites and background tileset to the group meeting room.

## 📁 Step 1: Organize Your Assets

### Directory Structure
```
public/
  sprites/
    npcs/              ← NPC character sprites
      bonsen.png
      zahir.png
      jiun.png
      anika.png
      jiawen.png
    tiles/             ← Background tilesets
      meeting-room-tileset.png
```

### Asset Specifications

**NPC Sprites:**
- **Size**: 64x64 pixels (recommended) or 32x32, 128x128
- **Format**: PNG with transparency
- **Content**: Character portrait, bust, or full sprite
- **Style**: Consistent with your game's art style

**Meeting Room Tileset:**
- **Tile Size**: 32x32 pixels per tile
- **Grid Layout**: Arrange tiles in rows and columns
- **Example Layout** (8x8 grid = 256x256 image):
  ```
  Row 0: Floor tiles (4 variations)
  Row 1: Wall tiles (top, middle, bottom, corner)
  Row 2: Table parts (top-left, top, top-right, etc.)
  Row 3: Whiteboard parts
  Row 4: Door, window tiles
  Row 5-7: Additional furniture/props
  ```

## 🎨 Step 2: Create Your Artwork

### Option A: Create from Scratch
Use tools like:
- **Aseprite** (pixel art editor) - best for pixel art style
- **Photoshop/GIMP** - for any art style
- **Procreate** (iPad) - for hand-drawn style

### Option B: Use AI Generation
- **Midjourney/DALL-E** for character portraits
- **Scenario.gg** for game assets
- Export at correct size and format

### Option C: Commission/Download
- **itch.io** has free/paid sprite packs
- **OpenGameArt.org** has free assets
- Commission an artist on Fiverr/Upwork

## 💻 Step 3: Add Sprites to Code

### Loading NPC Sprites

Add sprite paths to your NPC definitions in `src/data/npcs.ts`:

```typescript
const rawNpcDefinitions = {
  bonsen: {
    id: 'bonsen',
    name: 'Bonsen',
    sprite: '/sprites/npcs/bonsen.png',  // ← Add this
    // ... rest of definition
  },
  zahir: {
    id: 'zahir',
    name: 'Zahir',
    sprite: '/sprites/npcs/zahir.png',  // ← Add this
    // ... rest of definition
  },
  // ... repeat for all NPCs
};
```

### Update NPC Schema

In `src/core/schema.ts`, add sprite field:

```typescript
export const npcDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  sprite: z.string().optional(),  // ← Add this line
  focus: z.string(),
  // ... rest of schema
});
```

## 🖼️ Step 4: Render Sprites in Meeting Scene

### Option A: Replace Circles with Image Sprites

In `src/scenes/groupMeeting.ts`, modify the NPC rendering:

```typescript
// At the top, create image cache
const npcImages = new Map<NpcId, HTMLImageElement>();

// In renderGroupMeeting function, preload images
meetingState.npcs.forEach(npcState => {
    const def = NPC_DEFINITIONS[npcState.npcId];
    if (def.sprite && !npcImages.has(npcState.npcId)) {
        const img = new Image();
        img.src = def.sprite;
        npcImages.set(npcState.npcId, img);
    }
});

// In the render loop, replace circle drawing with:
meetingState.npcs.forEach(npc => {
    const img = npcImages.get(npc.npcId);
    
    if (img && img.complete) {
        // Draw sprite image
        const size = 48; // sprite display size
        ctx.save();
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        // Draw image centered on position
        ctx.drawImage(img, npc.x - size/2, npc.y - size/2, size, size);
        
        // Gray overlay if talked
        if (npc.talked) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
            ctx.fillRect(npc.x - size/2, npc.y - size/2, size, size);
        }
        
        ctx.restore();
    } else {
        // Fallback to circle (existing code)
        // ... keep existing circle rendering
    }
    
    // Label (keep existing label code)
});
```

### Option B: Show Sprite in Dialogue Bubble

Add portrait next to dialogue text:

```typescript
const startDialogue = async (npcId: NpcId) => {
    const npc = NPC_DEFINITIONS[npcId];
    
    clearDialogue();
    const bubble = document.createElement('div');
    bubble.className = 'meeting__bubble';
    bubble.style.display = 'flex';
    bubble.style.gap = '12px';
    
    // Add portrait if available
    if (npc.sprite) {
        const portrait = document.createElement('img');
        portrait.src = npc.sprite;
        portrait.style.cssText = `
            width: 64px;
            height: 64px;
            border-radius: 8px;
            object-fit: cover;
            border: 2px solid #6ee7b7;
        `;
        bubble.appendChild(portrait);
    }
    
    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';
    
    const speakerSpan = document.createElement('span');
    speakerSpan.className = 'speaker';
    speakerSpan.textContent = npc.name;
    
    const textSpan = document.createElement('span');
    
    textWrap.appendChild(speakerSpan);
    textWrap.appendChild(textSpan);
    bubble.appendChild(textWrap);
    dialogueLayer.appendChild(bubble);
    
    // Typewriter greeting
    await typewriterEffect(textSpan, npc.greeting, 25);
    // ... rest of dialogue code
};
```

## 🗺️ Step 5: Add Background Tileset

### Load and Draw Tileset

```typescript
// At top of renderGroupMeeting
let tilesetImage: HTMLImageElement | null = null;
const tileSize = 32;

// Load tileset
const loadTileset = () => {
    tilesetImage = new Image();
    tilesetImage.src = '/sprites/tiles/meeting-room-tileset.png';
};
loadTileset();

// In render loop, replace floor drawing:
if (tilesetImage && tilesetImage.complete) {
    // Draw tilemap
    const map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        // ... define your tile map (tile indices from tileset)
    ];
    
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileIndex = map[row][col];
            const tilesPerRow = 8; // tiles in your tileset image
            
            const srcX = (tileIndex % tilesPerRow) * tileSize;
            const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize;
            
            ctx.drawImage(
                tilesetImage,
                srcX, srcY, tileSize, tileSize,  // source rect
                col * tileSize, row * tileSize, tileSize, tileSize  // dest rect
            );
        }
    }
} else {
    // Fallback to gradient background (existing code)
}
```

## 🎯 Quick Start: Minimal Changes

If you just want to see images quickly without full tileset:

1. **Add 5 NPC images** to `public/sprites/npcs/`
2. **Update one line** in render loop:

```typescript
// Find this section in groupMeeting.ts (around line 620):
meetingState.npcs.forEach(npc => {
    // ADD THIS BLOCK AT THE START:
    const npcImg = new Image();
    npcImg.src = `/sprites/npcs/${npc.npcId}.png`;
    if (npcImg.complete) {
        const size = 40;
        ctx.drawImage(npcImg, npc.x - size/2, npc.y - size/2, size, size);
        if (npc.talked) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
            ctx.fillRect(npc.x - size/2, npc.y - size/2, size, size);
        }
    } else {
        // KEEP EXISTING CIRCLE CODE AS FALLBACK
        // ... existing gradient/circle rendering
    }
});
```

## 🎨 Example Asset Creation Workflow

### For Pixel Art Style:
1. Open Aseprite
2. Create 64x64 canvas
3. Draw character bust/portrait
4. Export as PNG
5. Place in `public/sprites/npcs/bonsen.png`

### For Meeting Room Tileset:
1. Create 256x256 canvas (8x8 tiles @ 32px each)
2. Draw tiles in grid:
   - Tiles 0-3: Floor variations
   - Tiles 8-11: Wall top
   - Tiles 16-19: Table top
   - etc.
3. Export as PNG
4. Place in `public/sprites/tiles/meeting-room-tileset.png`

## 🔍 Troubleshooting

**Images not showing?**
- Check browser console for 404 errors
- Verify file paths are correct
- Ensure images are in `public/` folder (not `src/`)
- Try hard refresh (Ctrl+Shift+R)

**Images blurry?**
- Add `image-rendering: pixelated` CSS
- Or in canvas: set `ctx.imageSmoothingEnabled = false`

**Images loading slowly?**
- Preload images before rendering
- Use sprite sheets instead of individual files
- Optimize PNG file sizes

## 📦 Next Steps

1. Create placeholder sprites (can be simple shapes in an image editor)
2. Test with one NPC first
3. Expand to all NPCs once working
4. Add background tileset last
5. Polish and optimize

## 🎁 Free Asset Resources

- **OpenGameArt.org** - Free game sprites
- **itch.io** - Sprite packs (free & paid)
- **Kenney.nl** - Free game assets
- **Piskel** - Free online pixel art editor
- **Lospec** - Pixel art color palettes

---

Need help? Check the example implementation in the guide above or ask for specific assistance!
