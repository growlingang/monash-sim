import { playBackgroundMusic, stopBackgroundMusic } from '../utils/audioManager';
import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { Tileset } from '../utils/tilesetLoader';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';
import { drawSubSprite } from '../utils/spriteLoader';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 12;
const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

type Hotspot = {
    id: 'cafeteria' | 'library' | 'entrance' | 'group-room';
    x: number; y: number; w: number; h: number;
    label: string;
    interactable: boolean;
};

type Env = 'outside' | 'inside';

export const renderCampusLTB = async (root: HTMLElement, store: GameStore) => {
    // Play campus ambience
    await playBackgroundMusic('/audio/ambience/Outdoor_ambience_loop.mp3', { loop: true, volume: 0.7 });
    root.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'campus-ltb';
    container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 16px; max-width: 900px; margin: 0 auto;';

    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 10px; text-align: center; width: 100%;';
    header.innerHTML = `
    <h2>Learning & Teaching Building (LTB)</h2>
    <p>Use Arrow Keys or WASD to move. Press E to interact. Explore outside, then enter LTB to meet your team.</p>
  `;

    const statsBar = createStatsBar(store.getState());

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

    const status = document.createElement('div');
    status.style.cssText = 'margin-top: 8px; font-family: monospace; font-size: 12px; color: #bbb; text-align: center;';
    status.textContent = 'Find the entrance to LTB or visit the Cafeteria/Library.';

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(canvas);
    container.appendChild(status);
    root.appendChild(container);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // LTB image rectangle (computed after image load)
    let ltbRectX = 0;
    let ltbRectY = 0;
    let ltbRectW = 0;
    let ltbRectH = 0;

    // Load road.png tileset
    const roadImage = new Image();
    roadImage.src = '/sprites/cargame/road.png';
    await new Promise((resolve, reject) => {
        roadImage.onload = resolve;
        roadImage.onerror = reject;
    });
    
    // Load pavement image
    const pavementImage = new Image();
    pavementImage.src = '/sprites/ltb_scene/LTB PAVEMENT.png';
    await new Promise((resolve, reject) => {
        pavementImage.onload = resolve;
        pavementImage.onerror = reject;
    });
    
    // Load LTB building image
    const ltbImage = new Image();
    ltbImage.src = '/sprites/ltb_scene/ltb.png';
    await new Promise((resolve, reject) => {
        ltbImage.onload = resolve;
        ltbImage.onerror = reject;
    });
    // Compute and cache LTB rectangle for rendering and collision
    ltbRectW = ltbImage.width;
    ltbRectH = ltbImage.height;
    ltbRectX = (CANVAS_WIDTH - ltbRectW) / 2;
    ltbRectY = 0;
    
    // Create tileset from road.png (assuming it's a single tile that we'll use for everything)
    const tileset = new Tileset({ 
        imagePath: '/sprites/cargame/road.png', 
        tileWidth: TILE_SIZE, 
        tileHeight: TILE_SIZE, 
        columns: 1, 
        rows: 1 
    });
    await tileset.load();

    // Maps: use chars => tileIndex mapping (all use road tile)
    const T = {
        G: 0, // grass -> road
        P: 0, // pavement -> road
        X: 0, // building exterior wall -> road
        D: 0, // entrance door -> road
        F: 0, // interior floor -> road
        W: 0, // interior wall -> road
        S: 0, // sign/accent -> road
        L: 0, // glass -> road
    } as const;

    const outsidePattern = [
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        // Open a walkway directly below the door so the player can reach it
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
    ];

    const insidePattern = [
        'WWWWWWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFFFFFW',
        'WFFFWFFFFFWFFFFFWFFW',
        'WFFFWFFFFFWFFFFFWFFW',
        'WFFFFFFFFDFFFFFFFFFW',
        'WFFFWFFFFFWFFFFFWFFW',
        'WFFFWFFFFFWFFFFFWFFW',
        'WFFFFFFFFFFFFFFFFFFW',
        'WFFFFFWWWWWWWWFFFFFW',
        'WFFFFFWWWWWWWWFFFFFW',
        'WFFFFFFFFSFFFFFFFFFW',
        'WWWWWWWWWWWWWWWWWWWW',
    ];

    const mapFrom = (pattern: string[]) => pattern.map(row => row.split('').map(ch => (T as any)[ch] ?? -1));
    // Restore previous scene state if present (prevents remount resets)
    let env: Env = 'outside';
    let mapData = mapFrom(outsidePattern);

    const hotspotsOutside: Hotspot[] = [
        { id: 'cafeteria', x: 6, y: 3, w: 3, h: 2, label: 'Cafeteria', interactable: true },
        { id: 'library', x: 12, y: 3, w: 2, h: 2, label: 'Library', interactable: true },
        // Entrance at bottom middle, directly below LTB (converted to tile coordinates)
        { id: 'entrance', x: 9, y: 9, w: 2, h: 1, label: 'Enter LTB', interactable: true },
    ];
    const hotspotsInside: Hotspot[] = [
        { id: 'group-room', x: 9, y: 4, w: 1, h: 1, label: 'Group Room', interactable: true },
    ];

    // Player state (restored from window if present)
    const playerSize = TILE_SIZE * 2; // Match bedroom size (2 tiles tall)
    // Default spawn: bottom of 3rd left column (col index 2) of the second last row
    const spawnCol = 2;
    const spawnRow = MAP_HEIGHT - 2; // second last row (0-based)
    let playerX = spawnCol * TILE_SIZE + (TILE_SIZE - playerSize) / 2;
    let playerY = (spawnRow + 1) * TILE_SIZE - playerSize;
    let running = true;
    let last = performance.now();
    const keys: Record<string, boolean> = {};
    let interactionCooldownUntil = 0;
    
    // Animation state
    let frameIndex = 0;
    let currentAnimation: keyof typeof ANIMATION_FRAMES = 'idle_forward';
    let playerFrames = ANIMATION_FRAMES[currentAnimation];
    let lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';
    let frameTimer = 0;
    const FRAME_DURATION = 0.15; // seconds per frame (match bedroom)
    
    // Get custom sprite from game state
    let customSprite = store.getState().playerSprite;
    if (!customSprite) {
        console.log('⚠️ No custom player sprite found in game state, using default.');
        customSprite = DEFAULT_PLAYER;
        store.setState(prev => ({
            ...prev,
            playerSprite: DEFAULT_PLAYER,
        }));
    }
    await buildCompositeSprite(customSprite, 32, 32);

    const saved = (window as any).__ltb_state as { env: Env; x: number; y: number } | undefined;
    if (saved) {
        env = saved.env;
        mapData = mapFrom(env === 'outside' ? outsidePattern : insidePattern);
        playerX = saved.x;
        playerY = saved.y;
    }

    const setStatus = (msg: string) => { status.textContent = msg; };

    const currentHotspots = () => (env === 'outside' ? hotspotsOutside : hotspotsInside);
    const isWall = (gx: number, gy: number) => {
        // Only check for border collisions, no internal walls
        return gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT;
    };
    const isWalkable = (nx: number, ny: number) => {
        const gx1 = Math.floor(nx / TILE_SIZE);
        const gy1 = Math.floor(ny / TILE_SIZE);
        const gx2 = Math.floor((nx + playerSize) / TILE_SIZE);
        const gy2 = Math.floor((ny + playerSize) / TILE_SIZE);
        return ![[gx1, gy1], [gx2, gy1], [gx1, gy2], [gx2, gy2]].some(([gx, gy]) => isWall(gx, gy));
    };

    const handleInteraction = () => {
        if (performance.now() < interactionCooldownUntil) return;
        const px = Math.floor((playerX + playerSize / 2) / TILE_SIZE);
        const py = Math.floor((playerY + playerSize / 2) / TILE_SIZE);
        const hs = currentHotspots().find(h => px >= h.x && px < h.x + h.w && py >= h.y && py < h.y + h.h && h.interactable);
        if (!hs) return;

        const state = store.getState();
        switch (hs.id) {
            case 'entrance': {
                interactionCooldownUntil = performance.now() + 250;
                store.setState((prev) => transitionScene(prev, 'ltb-inside'));
                break;
            }
            case 'cafeteria': {
                const canAfford = state.money >= 8;
                const needsFood = state.hunger < 10;
                if (!canAfford || !needsFood) {
                    alert(!canAfford ? 'Not enough money for a meal ($8).' : 'You are already full.');
                    return;
                }
                const deltas = { stats: { A: 1 }, hunger: 10 - state.hunger, money: -8, time: 20 };
                let next = applyDeltas(state, deltas);
                next = logActivity(next, { segment: 'campus-ltb', choiceId: 'cafeteria-meal', summary: 'Ate at the cafeteria (+Aura)', deltas });
                // Persist before setState so remount keeps position
                (window as any).__ltb_state = { env, x: playerX, y: playerY };
                store.setState(next);
                setStatus('Meal enjoyed. Aura +1.');
                break;
            }
            case 'library': {
                const firstVisitKey = '__ltb_lib_visited';
                const already = (window as any)[firstVisitKey];
                const deltas = { stats: already ? {} : { O: 1 }, time: 10 } as any;
                let next = applyDeltas(state, deltas);
                next = logActivity(next, { segment: 'campus-ltb', choiceId: 'library-visit', summary: already ? 'Browsed the library' : 'First library visit (+Organisation)', deltas });
                // Persist before setState so remount keeps position
                (window as any).__ltb_state = { env, x: playerX, y: playerY };
                store.setState(next);
                (window as any)[firstVisitKey] = true;
                setStatus('Quiet time at the library.');
                break;
            }
            case 'group-room': {
                // Only trigger from inside and avoid double-trigger
                if (env !== 'inside') break;
                interactionCooldownUntil = performance.now() + 250;
                // Clear saved scene state when leaving this scene
                delete (window as any).__ltb_state;
                store.setState((prev) => transitionScene(prev, 'group-meeting'));
                break;
            }
        }
    };

    const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        keys[k] = true;
        if (k === 'e') handleInteraction();
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const cleanup = () => {
        running = false;
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    };

    const update = (dt: number) => {
        const speed = 150 * dt;
        let nx = playerX, ny = playerY;
        let moving = false;
        let newDirection = lastDirection;
        if (keys['arrowup'] || keys['w']) {
            ny -= speed;
            newDirection = 'backward';
            moving = true;
        } else if (keys['arrowdown'] || keys['s']) {
            ny += speed;
            newDirection = 'forward';
            moving = true;
        }
        if (keys['arrowleft'] || keys['a']) {
            nx -= speed;
            newDirection = 'left';
            moving = true;
        } else if (keys['arrowright'] || keys['d']) {
            nx += speed;
            newDirection = 'right';
            moving = true;
        }
        // Middle of feet collision against LTB image
        const feetOverlapLTB = (px: number, py: number) => {
            const feetCenterX = px + playerSize / 2; // center of player horizontally
            const feetCenterY = py + playerSize - 2; // middle of bottom 4px (2px from bottom)
            return (
                feetCenterX >= ltbRectX &&
                feetCenterX <= ltbRectX + ltbRectW &&
                feetCenterY >= ltbRectY &&
                feetCenterY <= ltbRectY + ltbRectH
            );
        };

        // Helper: is player box inside any hotspot (in pixels)?
        const isInsideHotspot = (px: number, py: number) => {
            const hsList = currentHotspots();
            const boxLeft = px;
            const boxTop = py;
            const boxRight = px + playerSize;
            const boxBottom = py + playerSize;
            return hsList.some(h => {
                const left = h.x * TILE_SIZE;
                const top = h.y * TILE_SIZE;
                const right = (h.x + h.w) * TILE_SIZE;
                const bottom = (h.y + h.h) * TILE_SIZE;
                // Overlap test between player box and hotspot rect
                return boxLeft < right && boxRight > left && boxTop < bottom && boxBottom > top;
            });
        };

        // First apply world walkability (borders only)
        if (isWalkable(nx, ny)) {
            // If inside a hotspot, ignore collisions for free movement
            if (isInsideHotspot(nx, ny)) {
                playerX = nx;
                playerY = ny;
            } else {
                // Only prevent movement if the center of feet would be inside LTB image
                if (feetOverlapLTB(nx, ny)) {
                    // Try allowing partial movement if possible
                    if (!feetOverlapLTB(nx, playerY)) {
                        // Allow horizontal movement
                        playerX = nx;
                    } else if (!feetOverlapLTB(playerX, ny)) {
                        // Allow vertical movement
                        playerY = ny;
                    }
                    // If both directions would cause collision, don't move
                } else {
                    // No collision, allow full movement
                    playerX = nx;
                    playerY = ny;
                }
            }
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

        // Animation frame timing (match bedroom speed)
        frameTimer += dt;
        if (playerFrames.length > 1 && frameTimer >= FRAME_DURATION) {
            frameIndex = (frameIndex + 1) % playerFrames.length;
            frameTimer = 0;
        }

        // Auto-enter if the center of the player's feet overlaps the entrance hotspot (outside only)
        if (env === 'outside') {
            const feetCenterX = playerX + playerSize / 2;
            const feetCenterY = playerY + playerSize - 2; // middle of bottom 4px
            const entrance = hotspotsOutside.find(h => h.id === 'entrance' && h.interactable);
            if (entrance) {
                const left = entrance.x * TILE_SIZE;
                const top = entrance.y * TILE_SIZE;
                const right = (entrance.x + entrance.w) * TILE_SIZE;
                const bottom = (entrance.y + entrance.h) * TILE_SIZE;
                const inEntrance = feetCenterX >= left && feetCenterX < right && feetCenterY >= top && feetCenterY < bottom;
                if (inEntrance && performance.now() >= interactionCooldownUntil) {
                    interactionCooldownUntil = performance.now() + 250;
                    store.setState((prev) => transitionScene(prev, 'ltb-inside'));
                }
            }
        }

        // Show tooltip if near hotspot
        const px = Math.floor((playerX + playerSize / 2) / TILE_SIZE);
        const py = Math.floor((playerY + playerSize / 2) / TILE_SIZE);
        const hs = currentHotspots().find(h => px >= h.x && px < h.x + h.w && py >= h.y && py < h.y + h.h && h.interactable);
        if (hs) setStatus(`${hs.label} — Press E to interact`);
        else setStatus(env === 'outside' ? 'Explore LTB surroundings. Visit Cafeteria or Library, or enter LTB.' : 'Inside LTB. Find the Group Room (Door in middle hallway).');

        // Persist scene state each frame to survive remounts
        (window as any).__ltb_state = { env, x: playerX, y: playerY };
    };

    const render = () => {
        if (!ctx) return;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Render tilemap
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const idx = mapData[y][x];
                if (idx >= 0) tileset.drawTile(ctx, idx, x * TILE_SIZE, y * TILE_SIZE);
            }
        }

        // Render pavement layer (aligned to top, centered vertically)
        const pavementWidth = pavementImage.width;
        const pavementHeight = pavementImage.height;
        const pavementX = (CANVAS_WIDTH - pavementWidth) / 2; // Center horizontally
        const pavementY = 0; // Align to top
        ctx.drawImage(pavementImage, pavementX, pavementY, pavementWidth, pavementHeight);

        // Render LTB building (centered on canvas)
        ctx.drawImage(ltbImage, ltbRectX, ltbRectY, ltbRectW, ltbRectH);

    // Hotspots are intentionally invisible here; no visual outlines are drawn.

        // Draw player
        if (customSprite?.compositedImage) {
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
            // frameIndex is now advanced in update() with proper timing
        } else {
            // Fallback to rectangle if sprite not loaded
            ctx.fillStyle = '#4ac94a';
            ctx.fillRect(playerX, playerY, playerSize, playerSize);
            ctx.fillStyle = '#1a3f1a';
            ctx.fillRect(playerX + 6, playerY + 6, 6, 6);
            ctx.fillRect(playerX + playerSize - 12, playerY + 6, 6, 6);
            ctx.fillRect(playerX + 6, playerY + playerSize - 10, playerSize - 12, 4);
        }

        // Labels
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(6, 6, 210, 52);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(env === 'outside' ? 'Outside LTB' : 'Inside LTB', 12, 20);
        ctx.fillStyle = '#ccc';
        if (env === 'inside') ctx.fillText('Hotspot: Group Room', 12, 52);
    };

    const loop = (now: number) => {
        if (!running) return;
        const dt = (now - last) / 1000; last = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Ensure cleanup if scene changes
    store.subscribe((next, prev) => {
        if (next.currentScene !== prev.currentScene) {
            cleanup();
            // Stop ambience and restore default background music
            stopBackgroundMusic();
            playBackgroundMusic('/audio/music/background.mp3', { loop: true, volume: 0.6, autoplay: true });
        }
    });
};
