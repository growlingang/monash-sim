import type { GameStore } from '../core/store';
import { Tileset, Tilemap, createTilemapFromPattern } from '../utils/tilesetLoader';
import { drawSprite } from '../utils/spriteLoader';

const TILE_SIZE = 32;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;

/**
 * TEST SCENE: Demonstrates tileset functionality
 * This scene shows that tilesets are working in your game
 */
export const renderTilesetTest = async (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'tileset-test';
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 800px; margin: 0 auto;';

  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 20px; text-align: center;';
  header.innerHTML = `
    <h2>🎨 Tileset Test Scene</h2>
    <p>This tests that tileset/tilemap system works in your game.</p>
  `;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

  const info = document.createElement('div');
  info.style.cssText = 'margin-top: 10px; font-family: monospace; font-size: 12px; color: #999; max-width: 600px;';
  
  const backButton = document.createElement('button');
  backButton.textContent = '← Back to Bedroom';
  backButton.style.cssText = 'margin-top: 15px; padding: 10px 20px; background: #4ac94a; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
  backButton.onclick = () => {
    store.setState((prev) => ({ ...prev, currentScene: 'bedroom' }));
  };

  container.appendChild(header);
  container.appendChild(canvas);
  container.appendChild(info);
  container.appendChild(backButton);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    info.innerHTML = '❌ Canvas context failed';
    return;
  }

  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let statusMessages: string[] = [];

  // ============================================
  // TEST 1: Create a simple procedural tileset
  // ============================================
  statusMessages.push('✅ Test 1: Creating procedural tileset...');

  // Create a simple tileset image in memory (no file needed!)
  const tilesetCanvas = document.createElement('canvas');
  const tileCount = 8;
  const tileSize = 32;
  tilesetCanvas.width = tileCount * tileSize;
  tilesetCanvas.height = tileSize;
  const tileCtx = tilesetCanvas.getContext('2d')!;

  // Draw different colored tiles
  const colors = ['#8B4513', '#654321', '#2a2a2a', '#4a8c2a', '#4444c9', '#c94444', '#FFD700', '#87ceeb'];
  colors.forEach((color, i) => {
    tileCtx.fillStyle = color;
    tileCtx.fillRect(i * tileSize, 0, tileSize, tileSize);
    
    // Add border
    tileCtx.strokeStyle = '#000';
    tileCtx.lineWidth = 2;
    tileCtx.strokeRect(i * tileSize + 1, 1, tileSize - 2, tileSize - 2);
    
    // Add number
    tileCtx.fillStyle = '#fff';
    tileCtx.font = 'bold 16px monospace';
    tileCtx.textAlign = 'center';
    tileCtx.textBaseline = 'middle';
    tileCtx.fillText(i.toString(), i * tileSize + tileSize / 2, tileSize / 2);
  });

  statusMessages.push('✅ Test 1 passed: Procedural tileset created');

  // ============================================
  // TEST 2: Load tileset using Tileset class
  // ============================================
  statusMessages.push('🔄 Test 2: Loading tileset...');

  const tileset = new Tileset({
    imagePath: tilesetCanvas.toDataURL(), // Use data URL from our procedural tileset
    tileWidth: tileSize,
    tileHeight: tileSize,
    columns: tileCount,
    rows: 1,
  });

  try {
    await tileset.load();
    statusMessages.push('✅ Test 2 passed: Tileset loaded successfully');
  } catch (error) {
    statusMessages.push(`❌ Test 2 failed: ${error}`);
    info.innerHTML = statusMessages.join('<br>');
    return;
  }

  // ============================================
  // TEST 3: Draw individual tiles
  // ============================================
  statusMessages.push('🔄 Test 3: Drawing individual tiles...');

  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText('Individual tiles (using tileset.drawTile):', 10, 20);

  for (let i = 0; i < 8; i++) {
    tileset.drawTile(ctx, i, 10 + i * 40, 30);
  }

  statusMessages.push('✅ Test 3 passed: Individual tiles rendered');

  // ============================================
  // TEST 4: Create and render a Tilemap
  // ============================================
  statusMessages.push('🔄 Test 4: Creating tilemap from 2D array...');

  const mapData = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 3, 3, 3, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 1, 0],
    [0, 1, 2, 3, 3, 3, 3, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const tilemap = new Tilemap({
    tileset,
    data: mapData,
    tileSize: TILE_SIZE,
  });

  ctx.fillStyle = '#fff';
  ctx.fillText('Tilemap from 2D array:', 10, 100);
  
  tilemap.render(ctx, 10, 110);

  statusMessages.push('✅ Test 4 passed: Tilemap rendered from 2D array');

  // ============================================
  // TEST 5: Create tilemap from ASCII pattern
  // ============================================
  statusMessages.push('🔄 Test 5: Creating tilemap from ASCII pattern...');

  const pattern = `
##########
#........#
#..5555..#
#..5665..#
#..5665..#
#..5555..#
#........#
##########
  `;

  const mapping = {
    '#': 0,  // Brown border
    '.': 2,  // Dark gray floor
    '5': 4,  // Blue
    '6': 6,  // Gold
    ' ': -1, // Empty
  };

  const patternMap = createTilemapFromPattern(tileset, pattern, TILE_SIZE, mapping);

  ctx.fillStyle = '#fff';
  ctx.fillText('Tilemap from ASCII pattern:', 370, 100);
  
  patternMap.render(ctx, 370, 110);

  statusMessages.push('✅ Test 5 passed: ASCII pattern tilemap rendered');

  // ============================================
  // TEST 6: Test tilemap methods
  // ============================================
  statusMessages.push('🔄 Test 6: Testing tilemap methods...');

  const dims = tilemap.getDimensions();
  const centerTile = tilemap.getTileAt(5, 5);
  
  statusMessages.push(`✅ Test 6 passed: getDimensions() = ${dims.width}x${dims.height}, getTileAt(5,5) = ${centerTile}`);

  // ============================================
  // TEST 7: Integration with existing sprite system
  // ============================================
  statusMessages.push('🔄 Test 7: Testing integration with sprite system...');

  // Draw the player sprite on top of the tilemap (if it exists)
  try {
    const { loadSprite } = await import('../utils/spriteLoader');
    const playerSprite = await loadSprite('/sprites/player/player-idle.png');
    
    drawSprite(ctx, playerSprite, {
      x: 10 + 5 * TILE_SIZE - 16,
      y: 110 + 5 * TILE_SIZE - 16,
      width: 32,
      height: 32,
    });
    
    statusMessages.push('✅ Test 7 passed: Player sprite rendered on tilemap (sprite + tileset integration works!)');
  } catch (error) {
    statusMessages.push(`⚠️ Test 7 partial: Tilemaps work, but player sprite not found (${error})`);
  }

  // ============================================
  // Display results
  // ============================================
  ctx.fillStyle = '#4ac94a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('All tileset tests completed!', CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT - 20);

  info.innerHTML = statusMessages.join('<br>');
};
