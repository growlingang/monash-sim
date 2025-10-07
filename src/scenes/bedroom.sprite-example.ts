/**
 * EXAMPLE: Bedroom scene with sprite support
 * This shows how to modify bedroom.ts to use sprites instead of rectangles
 * Copy the patterns from this file to update your actual bedroom.ts
 */

import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { loadSprites, drawSprite } from '../utils/spriteLoader';

const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 12;
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

export const renderBedroomWithSprites = async (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'bedroom';
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 800px; margin: 0 auto;';

  const header = document.createElement('div');
  header.className = 'bedroom__header';
  header.style.cssText = 'margin-bottom: 10px; font-size: 14px; text-align: center; width: 100%;';
  header.innerHTML = '<h2>Your Room</h2><p>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move. Press <strong>P</strong> to open your phone.</p>';

  const statsBar = createStatsBar(store.getState());

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

  const statusBar = document.createElement('div');
  statusBar.className = 'bedroom__status';
  statusBar.style.cssText = 'margin-top: 10px; font-family: monospace; font-size: 12px; color: #999;';
  statusBar.innerHTML = 'Explore your room. Press <strong>P</strong> for phone.';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ==============================================
  // SPRITE LOADING - Load all sprites upfront
  // ==============================================
  let sprites: Map<string, HTMLImageElement> | null = null;
  
  try {
    sprites = await loadSprites([
      '/sprites/player/idle.png',
      '/sprites/furniture/bed.png',
      '/sprites/furniture/desk.png',
      '/sprites/furniture/wardrobe.png',
      '/sprites/furniture/bookshelf.png',
    ]);
    console.log('✅ Bedroom sprites loaded successfully');
  } catch (error) {
    console.warn('⚠️ Failed to load bedroom sprites, using rectangle fallbacks', error);
  }

  // Game state
  const playerSize = 32;
  let playerX = CANVAS_WIDTH / 2 - playerSize / 2;
  let playerY = CANVAS_HEIGHT / 2 - playerSize / 2;
  const moveSpeed = 3;

  const keys: Record<string, boolean> = {};
  let gameActive = true;

  // Collision map
  const isWalkable = (x: number, y: number): boolean => {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 1 || tileX >= ROOM_WIDTH - 1 || tileY < 1 || tileY >= ROOM_HEIGHT - 1) {
      return false;
    }

    // Bed collision
    if (tileX >= 2 && tileX <= 4 && tileY >= 9 && tileY <= 11) return false;
    // Desk collision
    if (tileX >= 14 && tileX <= 16 && tileY >= 5 && tileY <= 7) return false;
    // Wardrobe collision
    if (tileX >= 16 && tileX <= 18 && tileY >= 2 && tileY <= 4) return false;
    // Bookshelf collision
    if (tileX >= 2 && tileX <= 4 && tileY >= 2 && tileY <= 3) return false;

    return true;
  };

  // Input handling
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'p') {
      cleanup();
      store.setState((prev) => ({ ...prev, currentScene: 'phone' }));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  const cleanup = () => {
    gameActive = false;
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };

  // Game loop
  const update = () => {
    let newX = playerX;
    let newY = playerY;

    if (keys['arrowup'] || keys['w']) newY -= moveSpeed;
    if (keys['arrowdown'] || keys['s']) newY += moveSpeed;
    if (keys['arrowleft'] || keys['a']) newX -= moveSpeed;
    if (keys['arrowright'] || keys['d']) newX += moveSpeed;

    const canMove =
      isWalkable(newX, newY) &&
      isWalkable(newX + playerSize, newY) &&
      isWalkable(newX, newY + playerSize) &&
      isWalkable(newX + playerSize, newY + playerSize);

    if (canMove) {
      playerX = newX;
      playerY = newY;
    }
  };

  // ==============================================
  // RENDER - Use sprites if available, fallback to rectangles
  // ==============================================
  const render = () => {
    if (!ctx || !gameActive) return;

    // Clear
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw floor
    ctx.fillStyle = '#3a3a3a';
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
      for (let x = 1; x < ROOM_WIDTH - 1; x++) {
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw walls (keep as rectangles - could sprite these too)
    ctx.fillStyle = '#555';
    for (let x = 0; x < ROOM_WIDTH; x++) {
      ctx.fillRect(x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillRect(x * TILE_SIZE, (ROOM_HEIGHT - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
      ctx.fillRect(0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.fillRect((ROOM_WIDTH - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // ============================================
    // FURNITURE - Use sprites or fallback to rectangles
    // ============================================
    
    // Draw bed
    const bedSprite = sprites?.get('/sprites/furniture/bed.png');
    if (bedSprite) {
      drawSprite(ctx, bedSprite, {
        x: 2 * TILE_SIZE,
        y: 9 * TILE_SIZE,
        width: 3 * TILE_SIZE,
        height: 3 * TILE_SIZE,
      });
    } else {
      // Fallback: original rectangle bed
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2 * TILE_SIZE, 9 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(2 * TILE_SIZE + 4, 9 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);
    }

    // Draw desk
    const deskSprite = sprites?.get('/sprites/furniture/desk.png');
    if (deskSprite) {
      drawSprite(ctx, deskSprite, {
        x: 14 * TILE_SIZE,
        y: 5 * TILE_SIZE,
        width: 3 * TILE_SIZE,
        height: 3 * TILE_SIZE,
      });
    } else {
      // Fallback: original rectangle desk
      ctx.fillStyle = '#654321';
      ctx.fillRect(14 * TILE_SIZE, 5 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(14 * TILE_SIZE + 4, 5 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 2 * TILE_SIZE - 8);
    }

    // Draw wardrobe
    const wardrobeSprite = sprites?.get('/sprites/furniture/wardrobe.png');
    if (wardrobeSprite) {
      drawSprite(ctx, wardrobeSprite, {
        x: 16 * TILE_SIZE,
        y: 2 * TILE_SIZE,
        width: 3 * TILE_SIZE,
        height: 3 * TILE_SIZE,
      });
    } else {
      // Fallback: original rectangle wardrobe
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(16 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
      ctx.fillStyle = '#654321';
      ctx.fillRect(16 * TILE_SIZE + 4, 2 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);
    }

    // Draw bookshelf
    const bookshelfSprite = sprites?.get('/sprites/furniture/bookshelf.png');
    if (bookshelfSprite) {
      drawSprite(ctx, bookshelfSprite, {
        x: 2 * TILE_SIZE,
        y: 2 * TILE_SIZE,
        width: 3 * TILE_SIZE,
        height: 2 * TILE_SIZE,
      });
    } else {
      // Fallback: original rectangle bookshelf
      ctx.fillStyle = '#654321';
      ctx.fillRect(2 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(2 * TILE_SIZE + 4, 2 * TILE_SIZE + 8 + i * 16, 3 * TILE_SIZE - 8, 12);
      }
    }

    // ============================================
    // PLAYER - Use sprite or fallback to rectangle
    // ============================================
    const playerSprite = sprites?.get('/sprites/player/idle.png');
    if (playerSprite) {
      drawSprite(ctx, playerSprite, {
        x: playerX,
        y: playerY,
        width: playerSize,
        height: playerSize,
      });
    } else {
      // Fallback: original green rectangle
      ctx.fillStyle = '#4a8c2a';
      ctx.fillRect(playerX, playerY, playerSize, playerSize);
    }
  };

  const gameLoop = () => {
    if (!gameActive) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
  };

  gameLoop();
};
