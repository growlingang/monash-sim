import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';

const TILE_SIZE = 32;
const ROOM_WIDTH = 20; // tiles
const ROOM_HEIGHT = 12; // tiles
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

export const renderBedroom = (root: HTMLElement, store: GameStore) => {
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
  statusBar.innerHTML = 'Explore your room. Press <strong>P</strong> for phone.';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

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

    // Draw floor pattern
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
      for (let x = 1; x < ROOM_WIDTH - 1; x++) {
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw walls
    ctx.fillStyle = '#555';
    for (let x = 0; x < ROOM_WIDTH; x++) {
      ctx.fillRect(x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillRect(x * TILE_SIZE, (ROOM_HEIGHT - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
      ctx.fillRect(0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.fillRect((ROOM_WIDTH - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // Draw bed
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(2 * TILE_SIZE, 9 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(2 * TILE_SIZE + 4, 9 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);

    // Draw desk
    ctx.fillStyle = '#654321';
    ctx.fillRect(14 * TILE_SIZE, 5 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(14 * TILE_SIZE + 4, 5 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 2 * TILE_SIZE - 8);

    // Draw wardrobe
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(16 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 3 * TILE_SIZE);
    ctx.fillStyle = '#654321';
    ctx.fillRect(16 * TILE_SIZE + 4, 2 * TILE_SIZE + 4, 3 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);

    // Draw bookshelf
    ctx.fillStyle = '#654321';
    ctx.fillRect(2 * TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(2 * TILE_SIZE + 4, 2 * TILE_SIZE + 8 + i * 16, 3 * TILE_SIZE - 8, 12);
    }

    // Draw player
    ctx.fillStyle = '#4a8c2a';
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

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
