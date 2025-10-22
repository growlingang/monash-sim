
// import type { GameStore } from '../core/store';
// import { createStatsBar } from '../ui/statsBar';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { NpcId } from '../core/types';
import { drawSubSprite } from '../utils/spriteLoader';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

/**
 * EXAMPLE: Group Meeting with Custom NPC Sprites & Background Tileset
 * 
 * This file shows how to integrate:
 * 1. NPC sprite images instead of circles
 * 2. Background tileset instead of procedural graphics
 * 3. Portraits in dialogue bubbles
 * 
 * To use this example:
 * 1. Place NPC sprites in public/sprites/npcs/{npcId}.png
 * 2. Place tileset in public/sprites/tiles/meeting-room-tileset.png
 * 3. Replace the rendering code in groupMeeting.ts with this logic
 */

// Image cache to avoid reloading
const imageCache = {
    npcs: new Map<NpcId, HTMLImageElement>(),
    tileset: null as HTMLImageElement | null,
    playerSprite: null as HTMLImageElement | null,
};

// Preload images (now async to support composite sprite)
export const preloadMeetingAssets = async (gameStore?: any) => {
    // Load NPC sprites
    const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];
    npcIds.forEach(id => {
        const img = new Image();
        img.src = `/sprites/npcs/${id}.png`;
        img.onerror = () => console.warn(`Failed to load sprite for ${id}`);
        imageCache.npcs.set(id, img);
    });

    // Load tileset
    const tileset = new Image();
    tileset.src = '/sprites/tiles/meeting-room-tileset.png';
    tileset.onerror = () => console.warn('Failed to load meeting room tileset');
    imageCache.tileset = tileset;

    // Composite player sprite
    let customSprite = gameStore?.getState?.().playerSprite;
    if (!customSprite) customSprite = DEFAULT_PLAYER;
    await buildCompositeSprite(customSprite, 32, 32);
    imageCache.playerSprite = customSprite.compositedImage;
};

// Example: Render NPC with sprite
export const renderNpcSprite = (
    ctx: CanvasRenderingContext2D,
    npcId: NpcId,
    x: number,
    y: number,
    talked: boolean
) => {
    const img = imageCache.npcs.get(npcId);
    const size = 48; // display size in pixels

    if (img && img.complete && img.naturalWidth > 0) {
        // Image loaded successfully - draw sprite
        ctx.save();

        // Shadow
        ctx.shadowColor = talked ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = talked ? 6 : 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Draw sprite centered
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);

        // Gray overlay if already talked
        if (talked) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Optional: Border around sprite
        ctx.strokeStyle = talked ? '#9ca3af' : '#60a5fa';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        ctx.restore();
    } else {
        // Fallback: Draw circle if image not loaded
        const avatarGradient = ctx.createRadialGradient(x, y - 2, 4, x, y, 16);
        if (talked) {
            avatarGradient.addColorStop(0, '#94a3b8');
            avatarGradient.addColorStop(1, '#64748b');
        } else {
            avatarGradient.addColorStop(0, '#38bdf8');
            avatarGradient.addColorStop(1, '#0284c7');
        }

        ctx.fillStyle = avatarGradient;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = talked ? '#e2e8f0' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Label
    const def = NPC_DEFINITIONS[npcId];
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = talked ? '#cbd5e1' : '#f1f5f9';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(def.name.split(' ')[0], x, y + size / 2 + 16);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
};

// Example: Render background with tileset
export const renderTilesetBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
) => {
    const tileset = imageCache.tileset;
    const tileSize = 32;

    if (tileset && tileset.complete && tileset.naturalWidth > 0) {
        // Example tile map (20x12 grid for 640x360 canvas)
        // Each number is the tile index from your tileset
        const tileMap = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
            [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
            [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0],
            [0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2, 1, 0],
            [0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2, 1, 0],
            [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0],
            [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
            [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        const tilesPerRow = 8; // Adjust based on your tileset layout

        for (let row = 0; row < tileMap.length; row++) {
            for (let col = 0; col < tileMap[row].length; col++) {
                const tileIndex = tileMap[row][col];

                // Calculate source position in tileset
                const srcX = (tileIndex % tilesPerRow) * tileSize;
                const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize;

                // Draw tile
                ctx.drawImage(
                    tileset,
                    srcX,
                    srcY,
                    tileSize,
                    tileSize, // source rect
                    col * tileSize,
                    row * tileSize,
                    tileSize,
                    tileSize // dest rect
                );
            }
        }
    } else {
        // Fallback: gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#1e293b');
        bgGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Simple floor pattern
        ctx.fillStyle = '#2a3347';
        for (let x = 0; x < width; x += 16) {
            for (let y = 0; y < height; y += 16) {
                if ((x / 16 + y / 16) % 2 === 0) {
                    ctx.fillRect(x, y, 16, 16);
                }
            }
        }
    }
};

// Example: Add portrait to dialogue bubble
export const createDialogueBubbleWithPortrait = (
    npcId: NpcId,
    npcName: string
): HTMLDivElement => {
    const bubble = document.createElement('div');
    bubble.className = 'meeting__bubble';
    bubble.style.display = 'flex';
    bubble.style.gap = '12px';
    bubble.style.alignItems = 'flex-start';

    const img = imageCache.npcs.get(npcId);

    if (img && img.complete && img.naturalWidth > 0) {
        // Add portrait image
        const portrait = document.createElement('img');
        portrait.src = img.src;
        portrait.style.cssText = `
            width: 64px;
            height: 64px;
            border-radius: 8px;
            object-fit: cover;
            border: 2px solid #6ee7b7;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        bubble.appendChild(portrait);
    }

    // Text content
    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';
    textWrap.style.minWidth = '0'; // Allow text to wrap

    const speakerSpan = document.createElement('span');
    speakerSpan.className = 'speaker';
    speakerSpan.textContent = npcName;

    const textSpan = document.createElement('span');

    textWrap.appendChild(speakerSpan);
    textWrap.appendChild(textSpan);
    bubble.appendChild(textWrap);

    return bubble;
};

// Example: Integration point in your render loop
export const exampleRenderLoop = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    meetingState: any
) => {
    // 1. Render background (tileset or fallback)
    renderTilesetBackground(ctx, canvas.width, canvas.height);

    // 2. Render table, whiteboard, etc. (keep your existing code)
    // ... your existing furniture rendering ...

    // 3. Render NPCs with sprites
    meetingState.npcs.forEach((npc: any) => {
        renderNpcSprite(ctx, npc.npcId, npc.x, npc.y, npc.talked);
    });

    // 4. Render player (composite sprite with animation frame)
    const playerImg = imageCache.playerSprite;
    const size = 32;
    const playerFrame = ANIMATION_FRAMES['idle_forward'][0];
    if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
        drawSubSprite(ctx, playerImg, {
            x: meetingState.playerX - size / 2,
            y: meetingState.playerY - size / 2,
            width: size,
            height: size,
            sourceX: (playerFrame.col - 1) * 32,
            sourceY: (playerFrame.row - 1) * 32,
            sourceWidth: 32,
            sourceHeight: 32,
        });
    } else {
        // Fallback: circle (keep your existing code)
    }
};

/**
 * Quick Start Checklist:
 * 
 * 1. Create sprites:
 *    - public/sprites/npcs/bonsen.png
 *    - public/sprites/npcs/zahir.png
 *    - public/sprites/npcs/jiun.png
 *    - public/sprites/npcs/anika.png
 *    - public/sprites/npcs/jiawen.png
 * 
 * 2. Optional: Create tileset
 *    - public/sprites/tiles/meeting-room-tileset.png
 * 
 * 3. Call preloadMeetingAssets() at scene start
 * 
 * 4. Replace NPC rendering with renderNpcSprite()
 * 
 * 5. Replace background with renderTilesetBackground()
 * 
 * 6. Use createDialogueBubbleWithPortrait() for dialogue
 */
