import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { drawSubSprite } from '../utils/spriteLoader';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { Tileset } from '../utils/tilesetLoader';
import { createPhoneOverlay } from '../ui/phoneOverlay';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';
import { transitionScene } from '../core/gameState';
import type { SceneId } from '../core/types';

const TILE_SIZE = 32;
const ROOM_WIDTH = 20; // tiles
const ROOM_HEIGHT = 12; // tiles
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

export const renderLTBinside = async (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'ltb-inside';
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 900px; margin: 0 auto;';

  const header = document.createElement('div');
  header.className = 'ltb__header';
  header.style.cssText = 'margin-bottom: 10px; font-size: 11px; text-align: center; width: 100%; background: #8b6f47; padding: 12px; border: 3px solid #5a4a35; color: #fbe9cf; font-family: "Press Start 2P", monospace; line-height: 1.6;';
  header.innerHTML = '<h2 style="margin:0; font-size:14px;">Inside LTB</h2><p style="margin:0; font-size:11px;">Arrow Keys/WASD = Move | E = Interact | P = Phone</p>';

  const statsBar = createStatsBar(store.getState());

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

  const statusBar = document.createElement('div');
  statusBar.className = 'ltb__status';
  statusBar.style.cssText = 'margin-top: 10px; font-family: "Press Start 2P", monospace; font-size: 10px; color: #fbe9cf; background: #8b6f47; padding: 8px; border: 3px solid #5a4a35;';
  statusBar.innerHTML = 'P = Phone | E = Interact';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  root.appendChild(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Load sprites and tilesets similar to bedroom
  // unused individual sprites (we render via tilesets/composite sprite)

  // player image handled via composite sprite builder

  let customSprite = store.getState().playerSprite;
  if (!customSprite) {
    customSprite = DEFAULT_PLAYER;
    store.setState(prev => ({ ...prev, playerSprite: DEFAULT_PLAYER }));
  }
  await buildCompositeSprite(customSprite, 32, 32);

  // tilesets: room, hardwood, wall (fall back to procedural if missing)
  let roomTileset: Tileset;
  let hardwoodTileset: Tileset;
  let wallTileset: Tileset;

  try {
    roomTileset = new Tileset({ imagePath: '/sprites/tiles/room-tileset.png', tileWidth: 32, tileHeight: 32, columns: 8, rows: 2 });
    await roomTileset.load();
  } catch (error) {
    // minimal procedural fallback
    const c = document.createElement('canvas'); c.width = 8 * TILE_SIZE; c.height = 2 * TILE_SIZE; const t = c.getContext('2d')!;
    t.fillStyle = '#3a3a3a'; t.fillRect(0,0,c.width,c.height);
    roomTileset = new Tileset({ imagePath: c.toDataURL(), tileWidth: 32, tileHeight: 32, columns: 8, rows: 2 });
    await roomTileset.load();
  }

  try {
    hardwoodTileset = new Tileset({ imagePath: '/sprites/tiles/carpet.png', tileWidth: 32, tileHeight: 32, columns: 3, rows: 2 });
    await hardwoodTileset.load();
  } catch (err) {
    const c = document.createElement('canvas'); c.width = 3 * TILE_SIZE; c.height = 2 * TILE_SIZE; const t = c.getContext('2d')!;
    t.fillStyle = '#8B4513'; t.fillRect(0,0,c.width,c.height);
    hardwoodTileset = new Tileset({ imagePath: c.toDataURL(), tileWidth: 32, tileHeight: 32, columns: 3, rows: 2 });
    await hardwoodTileset.load();
  }

  try {
    wallTileset = new Tileset({ imagePath: '/sprites/tiles/creamy_walls.png', tileWidth: 32, tileHeight: 32, columns: 8, rows: 7 });
    await wallTileset.load();
  } catch (err) {
    const c = document.createElement('canvas'); c.width = 4 * TILE_SIZE; c.height = 3 * TILE_SIZE; const t = c.getContext('2d')!;
    t.fillStyle = '#8B7355'; t.fillRect(0,0,c.width,c.height);
    wallTileset = new Tileset({ imagePath: c.toDataURL(), tileWidth: 32, tileHeight: 32, columns: 4, rows: 3 });
    await wallTileset.load();
  }

  // Decorative door overlay for the top hotspot
  const doorImg = new Image();
  doorImg.src = '/sprites/tiles/door.png';

  // Decorative front overlay for the bottom hotspot (keeps natural resolution)
  const frontImg = new Image();
  frontImg.src = '/sprites/tiles/front_ltb.png';

  // Define room layout using tile indices (copied from bedroom.ts)
  // Tile layout guide from your tileset:
  // Row 1: 0=Floor, 1=Wall, 2=Bed, 3=Desk, 4=Wardrobe, 5=Bookshelf, 6=Carpet, 7=Window
  // Row 2: 8=Door, 9=Plant, 10=Lamp, 11=Rug, 12=Chair, 13=Table, 14=Dark Floor, 15=Light Wall
  // Define room layout using tile indices (copied from bedroom.ts) and place an 'E' hotspot at the center
  // Tile layout guide from your tileset:
  // Row 1: 0=Floor, 1=Wall, 2=Bed, 3=Desk, 4=Wardrobe, 5=Bookshelf, 6=Carpet, 7=Window
  // Row 2: 8=Door, 9=Plant, 10=Lamp, 11=Rug, 12=Chair, 13=Table, 14=Dark Floor, 15=Light Wall
  const roomData: (number | 'H' | 'E')[][] = [
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

  // Hotspots overlay (separate from roomData). Each hotspot is defined by tile coordinates and a target scene.
  const centerX = Math.floor(ROOM_WIDTH / 2);
  const bottomHotspotY = ROOM_HEIGHT - 2; // second-last row

  type Hotspot = { x: number; y: number; scene: SceneId; h?: number };
  // Make both hotspots normal tile-based hotspots (no visual offset or special logic)
  // Add a tiny top hotspot at row 2 (y=1) that transitions to group-meeting with custom pixel height
  const topHotspotY = 1; // second row (0-based)
  const hotspots: Hotspot[] = [
    { x: centerX, y: topHotspotY, scene: 'group-meeting', h: TILE_SIZE * 1.05 },
    { x: centerX, y: bottomHotspotY, scene: 'campus-ltb' },
  ];

  // Function to determine which wall tile to use based on 3D context (copied from bedroom.ts)
  const getWallTileIndex = (x: number, y: number): number => {
    // Check surrounding tiles to understand the wall's 3D context
    const isLeftSideWall = x === 0;
    const isRightSideWall = x === roomData[y].length - 1;
  const isBottomWall = y === roomData.length - 1;
  const hasWallAbove = y > 0 && roomData[y - 1][x] === 1;
  const hasWallBelow = y < roomData.length - 1 && roomData[y + 1][x] === 1;
  const hasWallLeft = x > 0 && roomData[y][x - 1] === 1;
  const hasWallRight = x < roomData[y].length - 1 && roomData[y][x + 1] === 1;
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
      return 11;
    } else if (hasWallAbove && hasWallBelow && hasWallLeft && !hasWallRight && !hasWallDiagonalDownLeft) { 
      return 12;
    } else if (!hasWallAbove && hasWallBelow && hasWallLeft && !hasWallRight) { 
      return 14; 
    } else if (isLeftSideWall &&hasWallAbove && hasWallBelow && !hasWallLeft && !hasWallRight) { 
        return 41;
    } else if (isRightSideWall &&hasWallAbove && hasWallBelow && !hasWallLeft && !hasWallRight) { 
      return 46;
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

  // Function to determine which hardwood tile to use based on surrounding wall tiles (copied from bedroom.ts)
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

  // Keep player 2 tiles tall like bedroom
  const playerSize = TILE_SIZE * 2;
  const spawnTileX = Math.floor(ROOM_WIDTH / 2);
  const spawnTileY = Math.floor(ROOM_HEIGHT / 2);
  const spawnCenterX = spawnTileX * TILE_SIZE + TILE_SIZE / 2;
  const spawnCenterY = spawnTileY * TILE_SIZE + TILE_SIZE / 2;
  let playerX = spawnCenterX - (playerSize / 2);
  let playerY = spawnCenterY - (playerSize / 2);
  let lastTime = performance.now();
  let gameActive = true;
  let phoneOpen = false;

  // ...existing code...

  let frameIndex = 0;
  let currentAnimation: keyof typeof ANIMATION_FRAMES = 'idle_forward';
  let playerFrames = ANIMATION_FRAMES[currentAnimation];
  let lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';
  let frameTimer = 0;
  const FRAME_DURATION = 0.15;

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
  };

  const keys: Record<string, boolean> = {};

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) e.preventDefault();
    keys[key] = true;
    if (key === 'p' && !phoneOpen) {
      phoneOpen = true;
      createPhoneOverlay(root, store, () => { phoneOpen = false; });
    }
    if (key === 'e') handleInteraction();
  };
  const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  const cleanup = () => {
    gameActive = false;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  // Foot collision: bottom 4px, middle ~50% width
  const isWalkable = (x: number, y: number): boolean => {
    const footHeight = 4;
    const footWidth = Math.max(8, Math.floor(playerSize * 0.5));
    const footOffsetX = Math.floor((playerSize - footWidth) / 2);
    const footTop = y + (playerSize - footHeight);
    const footBottom = y + playerSize - 1;
    const footLeft = x + footOffsetX;
    const footRight = footLeft + footWidth - 1;

    const leftTile = Math.floor(footLeft / TILE_SIZE);
    const rightTile = Math.floor(footRight / TILE_SIZE);
    const topTile = Math.floor(footTop / TILE_SIZE);
    const bottomTile = Math.floor(footBottom / TILE_SIZE);

    if (leftTile < 0 || rightTile >= ROOM_WIDTH || topTile < 0 || bottomTile >= ROOM_HEIGHT) return false;

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        const val = roomData[ty][tx];
        if (val === 1) return false;
      }
    }
    return true;
  };

  // Helper: check hotspot under player using feet-center detection (middle of bottom 4px)
  const hotspotUnderPlayer = (px: number, py: number) => {
    // px,py are top-left of player sprite
    const feetCenterX = px + playerSize / 2;
    const feetCenterY = py + playerSize - 2; // middle of bottom 4px
    return hotspots.find(h => {
      const left = h.x * TILE_SIZE;
      const top = h.y * TILE_SIZE;
      const hh = typeof h.h === 'number' ? h.h : TILE_SIZE;
      const right = left + TILE_SIZE;
      const bottom = top + hh;
      return feetCenterX >= left && feetCenterX < right && feetCenterY >= top && feetCenterY < bottom;
    });
  };

  const handleInteraction = () => {
  const hs = hotspotUnderPlayer(playerX, playerY);
  if (!hs) return;
  console.debug('[LTBinside] hotspot interact:', hs.scene, 'at', hs.x, hs.y);
    // If going back to campus, persist a sensible outside spawn so campusLTB can restore
    if (hs.scene === 'campus-ltb') {
      const spawnX = hs.x * TILE_SIZE + (TILE_SIZE - playerSize) / 2;
      const spawnY = hs.y * TILE_SIZE + (TILE_SIZE - playerSize) / 2;
      (window as any).__ltb_state = { env: 'outside', x: spawnX, y: spawnY };
    }
  if (hs.scene === 'group-meeting') (window as any).__justArrivedFromLTB = true;
  store.setState(prev => transitionScene(prev, hs.scene));
    cleanup();
  };

  const update = (deltaTime: number) => {
    if (!gameActive) return;
    const moveSpeed = 150 * deltaTime;
    let newX = playerX;
    let newY = playerY;
    let moving = false;
    let newDirection = lastDirection;

    if (keys['arrowup'] || keys['w']) { newY -= moveSpeed; newDirection = 'backward'; moving = true; }
    else if (keys['arrowdown'] || keys['s']) { newY += moveSpeed; newDirection = 'forward'; moving = true; }
    if (keys['arrowleft'] || keys['a']) { newX -= moveSpeed; newDirection = 'left'; moving = true; }
    else if (keys['arrowright'] || keys['d']) { newX += moveSpeed; newDirection = 'right'; moving = true; }

  // Allow movement if any part of the player's bounding box overlaps a hotspot even when roomData would block it
  const canMove = isWalkable(newX, newY) || Boolean(hotspotUnderPlayer(newX, newY));
  if (canMove) { playerX = newX; playerY = newY; }

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
    if (desiredAnimation !== currentAnimation) { currentAnimation = desiredAnimation; playerFrames = ANIMATION_FRAMES[currentAnimation]; frameIndex = 0; frameTimer = 0; }
    lastDirection = newDirection;

    // Animation frame timing
    frameTimer += deltaTime;
    if (playerFrames.length > 1 && frameTimer >= FRAME_DURATION) { frameIndex = (frameIndex + 1) % playerFrames.length; frameTimer = 0; }

    // auto-transition if standing on any hotspot (redundant with handleInteraction)
    // Use bounding-box overlap for all hotspots; respect optional per-hotspot pixel height `h`.
  // Use feet-center detection for auto-trigger as well
  const hsFeet = hotspotUnderPlayer(playerX, playerY);
    if (hsFeet) {
      console.debug('[LTBinside] hotspot auto-trigger:', hsFeet.scene, 'at', hsFeet.x, hsFeet.y);
      if (hsFeet.scene === 'campus-ltb') {
        const spawnX = hsFeet.x * TILE_SIZE + (TILE_SIZE - playerSize) / 2;
        const spawnY = hsFeet.y * TILE_SIZE + (TILE_SIZE - playerSize) / 2;
        (window as any).__ltb_state = { env: 'outside', x: spawnX, y: spawnY };
      } else if (hsFeet.scene === 'group-meeting') {
        delete (window as any).__ltb_state;
      }
  if (hsFeet.scene === 'group-meeting') (window as any).__justArrivedFromLTB = true;
  store.setState(prev => transitionScene(prev, hsFeet.scene));
      cleanup();
    }
  };

  // Custom render function to handle hardwood floors and smart walls (copied from bedroom.ts)
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

  const render = () => {
    if (!ctx || !gameActive) return;
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  renderRoomWithSmartTiles(ctx);

    // Draw decorative door image over the top hotspot (if loaded) at natural resolution
    const topHs = hotspots[0];
    if (topHs && doorImg.complete && doorImg.naturalWidth > 0) {
      const tileX = topHs.x * TILE_SIZE;
      const tileY = topHs.y * TILE_SIZE;
      const hh = typeof topHs.h === 'number' ? topHs.h : TILE_SIZE;
      const hotspotBottom = tileY + hh;
      const imgW = doorImg.naturalWidth;
      const imgH = doorImg.naturalHeight;
      // Center horizontally on the tile
      const drawX = tileX + (TILE_SIZE - imgW) / 2;
      // Align bottom of image with bottom of hotspot
      const drawY = hotspotBottom - imgH;
      ctx.drawImage(doorImg, drawX, drawY, imgW, imgH);
    }

  // Draw decorative front image over the bottom hotspot (natural resolution)
    const bottomHs = hotspots[1];
  // Draw background strip just behind the front image so the front appears in front of it
  const bottomRowsHeight = TILE_SIZE * 2;
  const stripPadding = 28; // total narrower width (pixels)
  const stripWidth = Math.max(0, CANVAS_WIDTH - stripPadding);
  const stripX = Math.floor((CANVAS_WIDTH - stripWidth) / 2);
  ctx.fillStyle = 'rgb(79,74,70)';
  ctx.fillRect(stripX, CANVAS_HEIGHT - bottomRowsHeight, stripWidth, bottomRowsHeight);
    if (bottomHs && frontImg.complete && frontImg.naturalWidth > 0) {
      const tileX = bottomHs.x * TILE_SIZE;
      const imgW = frontImg.naturalWidth;
      const imgH = frontImg.naturalHeight;
      // Center horizontally on the hotspot tile
      const drawX = tileX + (TILE_SIZE - imgW) / 2;
      // Align bottom of image with bottom of the canvas
      const drawY = CANVAS_HEIGHT - imgH;
      ctx.drawImage(frontImg, drawX, drawY, imgW, imgH);
    }

  

  // Hotspots are intentionally invisible; no visual overlay is drawn here.

  // entryway sprite omitted in this simplified LTB interior

    // Draw player
    if (customSprite) drawPlayer(); else { ctx.fillStyle = '#4a8c2a'; ctx.fillRect(playerX, playerY, playerSize, playerSize); }
  };

  const gameLoop = (currentTime: number) => {
    if (!gameActive) return;
    const deltaTime = (currentTime - lastTime) / 1000; lastTime = currentTime;
    update(deltaTime);
    render();
    requestAnimationFrame(gameLoop);
  };

  // Start the game loop
  requestAnimationFrame(gameLoop);

};


