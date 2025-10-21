import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { loadSprite, drawSprite, drawSubSprite } from '../utils/spriteLoader';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
// import { drawCharacter } from '../sprites/playerRenderer';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { Tileset } from '../utils/tilesetLoader';
import { createPhoneOverlay } from '../ui/phoneOverlay';
import { custom } from 'zod';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

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
  header.style.cssText = 'margin-bottom: 10px; font-size: 11px; text-align: center; width: 100%; background: #8b6f47; padding: 12px; border: 3px solid #5a4a35; color: #fbe9cf; font-family: "Press Start 2P", monospace; line-height: 1.8;';
  header.innerHTML = '<h2 style="margin: 0 0 8px 0; font-size: 14px; color: #fbe9cf;">Your Room</h2><p style="margin: 0; color: #d4a574;">Arrow Keys/WASD = Move | P = Phone</p>';

  // Add stats bar
  const statsBar = createStatsBar(store.getState());

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

  const statusBar = document.createElement('div');
  statusBar.className = 'bedroom__status';
  statusBar.style.cssText = 'margin-top: 10px; font-family: "Press Start 2P", monospace; font-size: 10px; color: #fbe9cf; background: #8b6f47; padding: 8px; border: 3px solid #5a4a35;';
  statusBar.innerHTML = 'P = Phone | T = Tilesets';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Load sprites
  let playerSprite: HTMLImageElement | null = null;
  let plantSprite: HTMLImageElement | null = null;
  let entrywaySprite: HTMLImageElement | null = null;
  let openWindowSprite: HTMLImageElement | null = null;
  let bedSprite: HTMLImageElement | null = null;
  
  try {
    playerSprite = await loadSprite('/sprites/player/player-idle.png');
    console.log('✅ Player sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load player sprite, using rectangle fallback', error);
  }

  // If there's a custom player sprite in the game state, try to build its composite
  let customSprite = store.getState().playerSprite;

  if (!customSprite) {
    console.log('⚠️ No custom player sprite found in game state, using default.');
    customSprite = DEFAULT_PLAYER;

    // Optional but recommended: store it so future logic sees it
    store.setState(prev => ({
      ...prev,
      playerSprite: DEFAULT_PLAYER,
    }));
  }

  await buildCompositeSprite(customSprite, 32, 32);

  

  try {
    plantSprite = await loadSprite('/sprites/tiles/plant.png');
    console.log('✅ Plant sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load plant sprite, using rectangle fallback', error);
  }

  try {
    bedSprite = await loadSprite('/sprites/tiles/bed.png');
    console.log('✅ Bed sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load bed sprite, using rectangle fallback', error);
  }

  try {
    openWindowSprite = await loadSprite('/sprites/tiles/openWindow.png');
    console.log('✅ Window sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load window sprite, using rectangle fallback', error);
  }

  try {
    entrywaySprite = await loadSprite('/sprites/tiles/entryway.png');
    console.log('✅ Entryway sprite loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Failed to load entryway sprite, using rectangle fallback', error);
  }

  // Load or create room tileset
  let roomTileset: Tileset;
  let hardwoodTileset: Tileset;
  let wallTileset: Tileset;
  
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

  // Load hardwood tileset
  try {
    hardwoodTileset = new Tileset({
      imagePath: '/sprites/tiles/hardwood-tiles.png',
      tileWidth: 32,
      tileHeight: 32,
      columns: 3,
      rows: 2,
    });
    await hardwoodTileset.load();
    console.log('✅ Hardwood tileset loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Hardwood tileset not found, using fallback floor tile');
    // Create a simple fallback hardwood tile
    const hardwoodCanvas = document.createElement('canvas');
    hardwoodCanvas.width = 3 * TILE_SIZE;
    hardwoodCanvas.height = 2 * TILE_SIZE;
    const hardwoodCtx = hardwoodCanvas.getContext('2d')!;
    
    // Create a simple wood pattern
    hardwoodCtx.fillStyle = '#8B4513';
    hardwoodCtx.fillRect(0, 0, 3 * TILE_SIZE, 2 * TILE_SIZE);
    
    // Add wood grain lines
    hardwoodCtx.strokeStyle = '#654321';
    hardwoodCtx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const x = i * TILE_SIZE;
        const y = j * TILE_SIZE;
        hardwoodCtx.beginPath();
        hardwoodCtx.moveTo(x, y + TILE_SIZE / 2);
        hardwoodCtx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
        hardwoodCtx.stroke();
      }
    }
    
    hardwoodTileset = new Tileset({
      imagePath: hardwoodCanvas.toDataURL(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      columns: 3,
      rows: 2,
    });
    await hardwoodTileset.load();
    console.log('✅ Fallback hardwood tileset created');
  }

  // Load wall tileset
  try {
    wallTileset = new Tileset({
      imagePath: '/sprites/tiles/basic-walls.png',
      tileWidth: 32,
      tileHeight: 32,
      columns: 8, // Assuming 4 columns for different wall orientations
      rows: 7,    // Assuming 3 rows for different wall heights/contexts
    });
    await wallTileset.load();
    console.log('✅ Wall tileset loaded successfully!');
  } catch (error) {
    console.warn('⚠️ Wall tileset not found, using fallback wall tiles');
    // Create a simple fallback wall tileset
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 4 * TILE_SIZE;
    wallCanvas.height = 3 * TILE_SIZE;
    const wallCtx = wallCanvas.getContext('2d')!;
    
    // Create different wall tile variations
    const wallColors = [
      '#8B7355', '#654321', '#4a3c2a', '#2d1f0f', // Row 1: Different wall textures
      '#8B7355', '#654321', '#4a3c2a', '#2d1f0f', // Row 2: Wall corners and edges
      '#8B7355', '#654321', '#4a3c2a', '#2d1f0f', // Row 3: Wall tops and special cases
    ];
    
    wallColors.forEach((color, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      
      wallCtx.fillStyle = color;
      wallCtx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      
      // Add some texture
      wallCtx.strokeStyle = 'rgba(0,0,0,0.3)';
      wallCtx.lineWidth = 1;
      wallCtx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      
      // Add brick pattern for some tiles
      if (i % 2 === 0) {
        wallCtx.strokeStyle = 'rgba(0,0,0,0.2)';
        wallCtx.beginPath();
        wallCtx.moveTo(x + TILE_SIZE/2, y);
        wallCtx.lineTo(x + TILE_SIZE/2, y + TILE_SIZE);
        wallCtx.stroke();
      }
    });
    
    wallTileset = new Tileset({
      imagePath: wallCanvas.toDataURL(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      columns: 4,
      rows: 3,
    });
    await wallTileset.load();
    console.log('✅ Fallback wall tileset created');
  }

  // Define room layout using tile indices
  // Tile layout guide from your tileset:
  // Row 1: 0=Floor, 1=Wall, 2=Bed, 3=Desk, 4=Wardrobe, 5=Bookshelf, 6=Carpet, 7=Window
  // Row 2: 8=Door, 9=Plant, 10=Lamp, 11=Rug, 12=Chair, 13=Table, 14=Dark Floor, 15=Light Wall
  
  const roomData = [
    // Top 2: wall
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // Empty room with hardwood floors
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    [1, 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 1],
    // Bottom wall with door for exit
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  // Function to determine which wall tile to use based on 3D context
  const getWallTileIndex = (x: number, y: number): number => {
    // Check surrounding tiles to understand the wall's 3D context
    const isLeftSideWall = x === 0;
    const isRightSideWall = x === roomData[y].length - 1;
    const isTopWall = y === 0;
    const isBottomWall = y === roomData.length - 1;
    const hasWallAbove = y > 0 && roomData[y - 1][x] === 1;
    const hasWallBelow = y < roomData.length - 1 && roomData[y + 1][x] === 1;
    const hasWallLeft = x > 0 && roomData[y][x - 1] === 1;
    const hasWallRight = x < roomData[y].length - 1 && roomData[y][x + 1] === 1;
    const hasWallDiagonalUpLeft = y > 0 && x > 0 && roomData[y - 1][x - 1] === 1;
    const hasWallDiagonalUpRight = y > 0 && x < roomData[y].length - 1 && roomData[y - 1][x + 1] === 1;
    const hasWallDiagonalDownLeft = y < roomData.length - 1 && x > 0 && roomData[y + 1][x - 1] === 1;
    const hasWallDiagonalDownRight = y < roomData.length - 1 && x < roomData[y].length - 1 && roomData[y + 1][x + 1] === 1;
    // Determine wall type based on 3D context
    // fill corners first
    if (!hasWallAbove && hasWallBelow && !hasWallLeft && hasWallRight) { 
      return 9; 
    } else if (hasWallAbove && hasWallBelow && !hasWallLeft && hasWallRight && hasWallDiagonalDownRight) { 
      return 1; 
    } else if (hasWallAbove && hasWallBelow && hasWallLeft && !hasWallRight && hasWallDiagonalDownLeft) { 
      return 6; 
    } else if (hasWallAbove && hasWallBelow && !hasWallLeft && hasWallRight && !hasWallDiagonalDownRight) { 
      return 10;
    } else if (hasWallAbove && hasWallBelow && hasWallLeft && !hasWallRight && !hasWallDiagonalDownLeft) { 
      return 13;
    } else if (!hasWallAbove && hasWallBelow && hasWallLeft && !hasWallRight) { 
      return 14; 
    } else if (isLeftSideWall &&hasWallAbove && hasWallBelow && !hasWallLeft && !hasWallRight) { 
        return 18;
    } else if (isRightSideWall &&hasWallAbove && hasWallBelow && !hasWallLeft && !hasWallRight) { 
      return 21;
    } else if (!hasWallAbove && hasWallBelow && hasWallLeft && hasWallRight) {
      return 20
    } else if (isBottomWall && !hasWallLeft && hasWallRight) {
      return 11;
    } else if (isBottomWall && hasWallLeft && !hasWallRight) {
      return 12;
    } else if (isBottomWall) { 
      return 36;
    } else { 
      return 27;
    }
  };

  // Function to determine which hardwood tile to use based on surrounding wall tiles
  const getHardwoodTileIndex = (x: number, y: number): number => {
    // Check surrounding tiles for wall tiles only (tile type 1)
    const hasWallAbove = y > 0 && roomData[y - 1][x] === 1;
    const hasWallBelow = y < roomData.length - 1 && roomData[y + 1][x] === 1;
    const hasWallLeft = x > 0 && roomData[y][x - 1] === 1;
    const hasWallRight = x < roomData[y].length - 1 && roomData[y][x + 1] === 1;
    const hasWallDiagonalUpLeft = y > 0 && x > 0 && roomData[y - 1][x - 1] === 1;

    // Apply shadow logic based on your requirements
    if (hasWallAbove && hasWallLeft) {
      // Case 4: Wall on top and left - use row 1 col 1 (index 0)
      return 0;
    } else if (hasWallAbove && hasWallBelow && hasWallLeft && hasWallRight) {
      // Case 5: Walls on all sides - use row 2 col 3 (index 5)
      return 5;
    } else if (hasWallAbove) {
      // Case 1: Only wall on top - use row 1 col 2 (index 1)
      return 1;
    } else if (hasWallDiagonalUpLeft && !hasWallLeft) {
      // Case 2: Only wall diagonal up-left - use row 1 col 3 (index 2)
      return 2;
    } else if (hasWallLeft) {
      // Case 3: Only wall to the left - use row 2 col 1 (index 3)
      return 3;
    } else {
      // Default: use row 2 col 2 (index 4)
      return 4;
    }
  };

  // Custom render function to handle hardwood floors and smart walls
  const renderRoomWithSmartTiles = (ctx: CanvasRenderingContext2D) => {
    for (let y = 0; y < roomData.length; y++) {
      for (let x = 0; x < roomData[y].length; x++) {
        const tileValue = roomData[y][x];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;
        
        if (tileValue === 'H') {
          // Determine which hardwood tile to use based on surrounding tiles
          const hardwoodTileIndex = getHardwoodTileIndex(x, y);
          hardwoodTileset.drawTile(ctx, hardwoodTileIndex, screenX, screenY);
        } else if (tileValue === 1) {
          // Determine which wall tile to use based on 3D context
          const wallTileIndex = getWallTileIndex(x, y);
          wallTileset.drawTile(ctx, wallTileIndex, screenX, screenY);
        } else {
          // Render regular tile (doors, etc.)
          roomTileset.drawTile(ctx, tileValue as number, screenX, screenY);
        }
      }
    }
  };

  // Player state
  // Player state
  // Player sprite occupies 2x tile height by default; compute size first so
  // we can position the player centered in the room.
  const playerSize = TILE_SIZE * 2;
  // Tile-centered spawn: place the player's center on the room's center tile.
  // For ROOM_WIDTH=20 and ROOM_HEIGHT=12 this will pick tile (10, 6) (0-indexed).
  const spawnTileX = Math.floor(ROOM_WIDTH / 2);
  const spawnTileY = Math.floor(ROOM_HEIGHT / 2);
  const spawnCenterX = spawnTileX * TILE_SIZE + TILE_SIZE / 2;
  const spawnCenterY = spawnTileY * TILE_SIZE + TILE_SIZE / 2;
  // Subtract half the player size so the player's top-left coordinates align
  // such that the player's center sits directly over the tile center.
  let playerX = spawnCenterX - (playerSize / 2);
  let playerY = spawnCenterY - (playerSize / 2);
  let lastTime = performance.now();
  let gameActive = true;
  let phoneOpen = false;


  let frameIndex = 0;
  let currentAnimation: keyof typeof ANIMATION_FRAMES = 'idle_forward';
  let playerFrames = ANIMATION_FRAMES[currentAnimation];
  let lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';
  let wasMoving = false;
  // Animation frame timing
  let frameTimer = 0;
  const FRAME_DURATION = 0.15; // seconds per frame (e.g., 0.15s = ~6.7 FPS)

  const drawPlayer = () => {
    if (!customSprite || !customSprite.compositedImage) return;
    const frame = playerFrames[frameIndex];
    drawSubSprite(ctx, customSprite.compositedImage, {
      x: playerX,
      y: playerY,
      width: playerSize,
      height: playerSize,
      sourceX: (frame.col - 1) * 32,
      sourceY: (frame.row - 1) * 32,
      sourceWidth: 32,
      sourceHeight: 32,
    });
    // frameIndex is now advanced in update()
  };

  // Input handling
  const keys: Record<string, boolean> = {};

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    
    // Prevent arrow keys from scrolling the page
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
    }
    
    keys[key] = true;

    // Press P to open evening activities phone
    if (key === 'p' && !phoneOpen) {
      phoneOpen = true;
      createPhoneOverlay(root, store, () => {
        phoneOpen = false;
      });
    }

    // Test shortcut: Press T to open tileset test scene
    if (key === 't') {
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
    // Treat x,y as the player's top-left coordinates.
    // We only consider the bottom middle "feet" area for collisions: bottom 4px and the central ~50% width.
    const footHeight = 4; // pixels tall region at the bottom considered for collisions
    const footWidth = Math.max(8, Math.floor(playerSize * 0.5)); // ensure a minimum width
    const footOffsetX = Math.floor((playerSize - footWidth) / 2);
    const footTop = y + (playerSize - footHeight);
    const footBottom = y + playerSize - 1;
    const footLeft = x + footOffsetX;
    const footRight = footLeft + footWidth - 1;

    // Convert to tile coordinates
    const leftTile = Math.floor(footLeft / TILE_SIZE);
    const rightTile = Math.floor(footRight / TILE_SIZE);
    const topTile = Math.floor(footTop / TILE_SIZE);
    const bottomTile = Math.floor(footBottom / TILE_SIZE);

    // Bounds check: if foot area is outside the room, it's not walkable
    if (leftTile < 0 || rightTile >= ROOM_WIDTH || topTile < 0 || bottomTile >= ROOM_HEIGHT) {
      return false;
    }

    // If any tile that the foot area overlaps is a wall (1), block movement.
    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        const val = roomData[ty][tx];
        if (val === 1) return false;
      }
    }

    return true;
  };


  const update = (deltaTime: number) => {
    if (!gameActive) return;

    const moveSpeed = 150 * deltaTime;
    let newX = playerX;
    let newY = playerY;

    let moving = false;
    let newDirection = lastDirection;

    if (keys['arrowup'] || keys['w']) {
      newY -= moveSpeed;
      newDirection = 'backward';
      moving = true;
    } else if (keys['arrowdown'] || keys['s']) {
      newY += moveSpeed;
      newDirection = 'forward';
      moving = true;
    }
    if (keys['arrowleft'] || keys['a']) {
      newX -= moveSpeed;
      newDirection = 'left';
      moving = true;
    } else if (keys['arrowright'] || keys['d']) {
      newX += moveSpeed;
      newDirection = 'right';
      moving = true;
    }

  // Collide based on the bottom-middle "feet" area only
  const canMove = isWalkable(newX, newY);

    if (canMove) {
      playerX = newX;
      playerY = newY;
    }

    // Animation switching
    let desiredAnimation: keyof typeof ANIMATION_FRAMES;
    if (moving) {
      if (newDirection === 'forward') desiredAnimation = 'walk_forward';
      else if (newDirection === 'backward') desiredAnimation = 'walk_backward';
      else if (newDirection === 'left') desiredAnimation = 'walk_left';
      else desiredAnimation = 'walk_right';
    } else {
      if (lastDirection === 'forward') desiredAnimation = 'idle_forward';
      else if (lastDirection === 'backward') desiredAnimation = 'idle_backward';
      else if (lastDirection === 'left') desiredAnimation = 'idle_left';
      else desiredAnimation = 'idle_right';
    }
    if (desiredAnimation !== currentAnimation) {
      currentAnimation = desiredAnimation;
      playerFrames = ANIMATION_FRAMES[currentAnimation];
      frameIndex = 0;
      frameTimer = 0;
    }
    lastDirection = newDirection;
    wasMoving = moving;

    // Animation frame timing
    frameTimer += deltaTime;
    if (playerFrames.length > 1 && frameTimer >= FRAME_DURATION) {
      frameIndex = (frameIndex + 1) % playerFrames.length;
      frameTimer = 0;
    }
  };

  const render = () => {
    if (!ctx || !gameActive) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render the entire room using smart tile generation
    renderRoomWithSmartTiles(ctx);

    
    //Draw entryway
    if (entrywaySprite) {
      drawSprite(ctx, entrywaySprite, {
        x: 8 * TILE_SIZE,
        y: 10 * TILE_SIZE,
        width: entrywaySprite.width,
        height: entrywaySprite.height,
      });
    }
    //Draw window
    if (openWindowSprite) {
      drawSprite(ctx, openWindowSprite, {
        x: 6 * TILE_SIZE,
        y: 0.4 * TILE_SIZE,
        width: openWindowSprite.width,
        height: openWindowSprite.height,
      });
    }
    if (openWindowSprite) {
      drawSprite(ctx, openWindowSprite, {
        x: 12 * TILE_SIZE,
        y: 0.4 * TILE_SIZE,
        width: openWindowSprite.width,
        height: openWindowSprite.height,
      });
    }
    // Draw plant as cute decor item (top-left corner) - keeping original pixel size
    if (plantSprite) {
      drawSprite(ctx, plantSprite, {
        x: 5 * TILE_SIZE,
        y: 0.7 * TILE_SIZE,
        width: plantSprite.width,
        height: plantSprite.height,
      });
    }

    if (bedSprite) {
      drawSprite(ctx, bedSprite, {
        x: 0.9 * TILE_SIZE,
        y: 0.9 * TILE_SIZE,
        width: bedSprite.width,
        height: bedSprite.height,
      });
    }
    // Draw player
    if (customSprite) {
      drawPlayer();
        } else {
          ctx.fillStyle = '#4a8c2a';
          ctx.fillRect(playerX, playerY, playerSize, playerSize);
    };
};

  //   // Player face
  //   ctx.fillStyle = '#2d5016';
  //   ctx.fillRect(playerX + 8, playerY + 8, 6, 6);
  //   ctx.fillRect(playerX + 18, playerY + 8, 6, 6);
  //   ctx.fillRect(playerX + 8, playerY + 18, 16, 4);
  // };

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
