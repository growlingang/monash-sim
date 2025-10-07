import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { loadSprite, drawSprite } from '../utils/spriteLoader';
import { Tileset, Tilemap } from '../utils/tilesetLoader';

const TILE_SIZE = 32;
const ROOM_WIDTH = 20; // tiles
const ROOM_HEIGHT = 12; // tiles
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

export const renderBedroom = async (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'bedroom';
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 800px; margin: 0 auto;';

  const header = document.createElement('div');
  header.className = 'bedroom__header';
  header.style.cssText = 'margin-bottom: 10px; font-size: 14px; text-align: center; width: 100%;';
  header.innerHTML = '<h2>Your Room</h2><p>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move. Press <strong>P</strong> to open your phone.</p>';

  // Add stats bar
  const statsBar = createStatsBar(store.getState());

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

  const statusBar = document.createElement('div');
  statusBar.className = 'bedroom__status';
  statusBar.style.cssText = 'margin-top: 10px; font-family: monospace; font-size: 12px; color: #999;';
  statusBar.innerHTML = 'Explore your room. Press <strong>P</strong> for phone. Press <strong>T</strong> to test tilesets.';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Load sprites
  let playerSprite: HTMLImageElement | null = null;
  try {
    playerSprite = await loadSprite('/sprites/player/player-idle.png');
    console.log('✅ Player sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load player sprite, using rectangle fallback', error);
  }

  // Load or create room tileset
  let roomTileset: Tileset;
  let roomMap: Tilemap;
  
  try {
    // Try to load tileset image first
    roomTileset = new Tileset({
      imagePath: '/sprites/tiles/room-tileset.png',
      tileWidth: 32,
      tileHeight: 32,
      columns: 8,
      rows: 2,
    });
    await roomTileset.load();
    console.log('✅ Room tileset loaded from image!');
  } catch (error) {
    console.warn('⚠️ Tileset image not found, generating procedural tileset...');
    
    // Fallback: create procedural tileset
    const tilesetCanvas = document.createElement('canvas');
    tilesetCanvas.width = 8 * TILE_SIZE;
    tilesetCanvas.height = 2 * TILE_SIZE;
    const tileCtx = tilesetCanvas.getContext('2d')!;

    const colors = [
      '#3a3a3a', '#555555', '#8B4513', '#654321',
      '#8B4513', '#654321', '#c94444', '#87ceeb',
      '#8B4513', '#4ac94a', '#FFD700', '#654321',
      '#654321', '#8B7355', '#2a2a2a', '#777777',
    ];

    colors.forEach((color, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      tileCtx.fillStyle = color;
      tileCtx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      tileCtx.strokeStyle = 'rgba(0,0,0,0.3)';
      tileCtx.lineWidth = 1;
      tileCtx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    roomTileset = new Tileset({
      imagePath: tilesetCanvas.toDataURL(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      columns: 8,
      rows: 2,
    });
    await roomTileset.load();
    console.log('✅ Procedural tileset created');
  }

  // Define room layout using tile indices
  // Tile layout guide from your tileset:
  // Row 1: 0=Floor, 1=Wall, 2=Bed, 3=Desk, 4=Wardrobe, 5=Bookshelf, 6=Carpet, 7=Window
  // Row 2: 8=Door, 9=Plant, 10=Lamp, 11=Rug, 12=Chair, 13=Table, 14=Dark Floor, 15=Light Wall
  
  const roomData = [
    // Top wall with windows for natural light
    [1, 1, 1, 1, 1, 1, 7, 7, 1, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1],
    // Study corner (left) with bookshelf, desk area (right) with wardrobe
    [1, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 1],
    [1, 0, 5, 5, 5, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 1],
    [1, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 1],
    // Open floor space with decorative rug in center
    [1, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 12, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 3, 3, 3, 0, 10, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 3, 3, 3, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 3, 3, 3, 0, 0, 1],
    // Comfortable sleeping area with plants
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 9, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 1],
    [1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 0, 0, 0, 1],
    // Bottom wall with door for exit
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  roomMap = new Tilemap({
    tileset: roomTileset,
    data: roomData,
    tileSize: TILE_SIZE,
  });

  // Player state
  let playerX = 5 * TILE_SIZE;
  let playerY = 9 * TILE_SIZE;
  const playerSize = TILE_SIZE;
  let lastTime = performance.now();
  let gameActive = true;

  // Input handling
  const keys: Record<string, boolean> = {};

  const handleKeyDown = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;

    // Test shortcut: Press T to open tileset test scene
    if (e.key.toLowerCase() === 't') {
      cleanup();
      store.setState((prev) => ({ ...prev, currentScene: 'tileset-test' }));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  const cleanup = () => {
    gameActive = false;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  // Collision detection
  const isWalkable = (x: number, y: number): boolean => {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Room boundaries
    if (tileX < 1 || tileX >= ROOM_WIDTH - 1 || tileY < 1 || tileY >= ROOM_HEIGHT - 1) {
      return false;
    }

    // Bed (bottom left)
    if (tileX >= 2 && tileX <= 4 && tileY >= 9 && tileY <= 11) {
      return false;
    }

    // Desk (right side)
    if (tileX >= 14 && tileX <= 16 && tileY >= 5 && tileY <= 7) {
      return false;
    }

    // Wardrobe (top right)
    if (tileX >= 16 && tileX <= 18 && tileY >= 2 && tileY <= 4) {
      return false;
    }

    // Bookshelf (top left)
    if (tileX >= 2 && tileX <= 4 && tileY >= 2 && tileY <= 3) {
      return false;
    }

    return true;
  };

  const update = (deltaTime: number) => {
    if (!gameActive) return;

    const moveSpeed = 150 * deltaTime;
    let newX = playerX;
    let newY = playerY;

    if (keys['arrowup'] || keys['w']) {
      newY -= moveSpeed;
    }
    if (keys['arrowdown'] || keys['s']) {
      newY += moveSpeed;
    }
    if (keys['arrowleft'] || keys['a']) {
      newX -= moveSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
      newX += moveSpeed;
    }

    // Check collision for all 4 corners of player
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

  const render = () => {
    if (!ctx || !gameActive) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render the entire room using tilemap
    roomMap.render(ctx)

    // Draw player
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

    // Player face
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(playerX + 8, playerY + 8, 6, 6);
    ctx.fillRect(playerX + 18, playerY + 8, 6, 6);
    ctx.fillRect(playerX + 8, playerY + 18, 16, 4);
  };

  const gameLoop = (currentTime: number) => {
    if (!gameActive) return;

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
};
