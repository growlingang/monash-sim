import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { Tileset } from '../utils/tilesetLoader';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';
import { drawSubSprite } from '../utils/spriteLoader';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

const TILE_SIZE = 32; // tiles
const ROOM_WIDTH = 20; // tiles
const ROOM_HEIGHT = 12; // tiles
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

type Hotspot = {
    id: 'group-room';
    x: number; y: number; w: number; h: number;
    label: string;
    interactable: boolean;
};

export const renderLTBinside = async (root: HTMLElement, store: GameStore) => {
    root.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'ltb-inside';
    container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 16px; max-width: 900px; margin: 0 auto;';

    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 10px; text-align: center; width: 100%;';
    header.innerHTML = `
    <h2>Inside LTB</h2>
    <p>Use Arrow Keys or WASD to move. Press E to interact. Find the Group Room.</p>
  `;

    const statsBar = createStatsBar(store.getState());

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';

    const status = document.createElement('div');
    status.style.cssText = 'margin-top: 8px; font-family: monospace; font-size: 12px; color: #bbb; text-align: center;';
    status.textContent = 'Inside LTB. Find the Group Room.';

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(canvas);
    container.appendChild(status);
    root.appendChild(container);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load simple road tileset (same as outside for now)
    const roadImage = new Image();
    roadImage.src = '/sprites/cargame/road.png';
    await new Promise((resolve, reject) => {
        roadImage.onload = resolve;
        roadImage.onerror = reject;
    });

    const tileset = new Tileset({ 
        imagePath: '/sprites/cargame/road.png', 
        tileWidth: TILE_SIZE, 
        tileHeight: TILE_SIZE, 
        columns: 1, 
        rows: 1 
    });
    await tileset.load();

    const T = { F: 0, W: 0, S: 0, D: 0 } as const;

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
    let mapData = mapFrom(insidePattern);

    const hotspots: Hotspot[] = [{ id: 'group-room', x: 9, y: 4, w: 1, h: 1, label: 'Group Room', interactable: true }];

    // Player state (match bedroom: 2 tiles tall)
    const playerSize = TILE_SIZE * 2;
    // Use the position the outside scene placed us at
    let playerX = 10 * TILE_SIZE;
    let playerY = 10 * TILE_SIZE;
    let running = true;
    let last = performance.now();
    const keys: Record<string, boolean> = {};
    let interactionCooldownUntil = 0;

    // Animation state
    let frameIndex = 0;
    let currentAnimation: keyof typeof ANIMATION_FRAMES = 'idle_forward';
    let playerFrames = ANIMATION_FRAMES[currentAnimation];
    let lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';

    // Get custom sprite
    let customSprite = store.getState().playerSprite;
    if (!customSprite) {
        customSprite = DEFAULT_PLAYER;
        store.setState(prev => ({ ...prev, playerSprite: DEFAULT_PLAYER }));
    }
    await buildCompositeSprite(customSprite, 32, 32);

    const setStatus = (msg: string) => { status.textContent = msg; };

    const isWall = (gx: number, gy: number) => {
        // Only canvas borders
        return gx < 0 || gx >= ROOM_WIDTH || gy < 0 || gy >= ROOM_HEIGHT;
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
        const hs = hotspots.find(h => px >= h.x && px < h.x + h.w && py >= h.y && py < h.y + h.h && h.interactable);
        if (!hs) return;

    switch (hs.id) {
            case 'group-room': {
                interactionCooldownUntil = performance.now() + 250;
                // Clear any saved outside/inside state and transition to meeting
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
        if (keys['arrowup'] || keys['w']) { ny -= speed; newDirection = 'backward'; moving = true; }
        else if (keys['arrowdown'] || keys['s']) { ny += speed; newDirection = 'forward'; moving = true; }
        if (keys['arrowleft'] || keys['a']) { nx -= speed; newDirection = 'left'; moving = true; }
        else if (keys['arrowright'] || keys['d']) { nx += speed; newDirection = 'right'; moving = true; }
        if (isWalkable(nx, ny)) { playerX = nx; playerY = ny; }

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
        }
        lastDirection = newDirection;

        // Tooltip
        const px = Math.floor((playerX + playerSize / 2) / TILE_SIZE);
        const py = Math.floor((playerY + playerSize / 2) / TILE_SIZE);
        const hs = hotspots.find(h => px >= h.x && px < h.x + h.w && py >= h.y && py < h.y + h.h && h.interactable);
        if (hs) setStatus(`${hs.label} — Press E to interact`);
        else setStatus('Inside LTB. Find the Group Room.');
    };

    const render = () => {
        if (!ctx) return;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Tilemap
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const idx = mapData[y][x];
                if (idx >= 0) tileset.drawTile(ctx, idx, x * TILE_SIZE, y * TILE_SIZE);
            }
        }

        // Hotspot outline
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        hotspots.forEach(h => {
            ctx.strokeRect(h.x * TILE_SIZE + 0.5, h.y * TILE_SIZE + 0.5, h.w * TILE_SIZE - 1, h.h * TILE_SIZE - 1);
        });

        // Player
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
            frameIndex = (frameIndex + 1) % playerFrames.length;
        } else {
            ctx.fillStyle = '#4ac94a';
            ctx.fillRect(playerX, playerY, playerSize, playerSize);
        }

        // Labels
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(6, 6, 210, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('Inside LTB', 12, 20);
        ctx.fillStyle = '#ccc';
        ctx.fillText('Hotspot: Group Room', 12, 36);
    };

    const loop = (now: number) => {
        if (!running) return;
        const dt = (now - last) / 1000; last = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    store.subscribe((next, prev) => { if (next.currentScene !== prev.currentScene) cleanup(); });
};


