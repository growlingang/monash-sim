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

    // Simple procedural tileset for outdoor/indoor
    const tilesetCanvas = document.createElement('canvas');
    tilesetCanvas.width = 8 * TILE_SIZE;
    tilesetCanvas.height = 2 * TILE_SIZE;
    const tctx = tilesetCanvas.getContext('2d')!;
    const colors = [
        '#2d5a27', // 0 grass
        '#7d7d7d', // 1 pavement
        '#8B7355', // 2 exterior wall
        '#bfb06a', // 3 doorway
        '#3a3a3a', // 4 interior floor
        '#6b5b45', // 5 interior wall
        '#4ac94a', // 6 signage/accent
        '#87ceeb', // 7 glass
        '#2a2a2a', // 8 dark floor
        '#444444', // 9 darker wall
        '#c94444', // 10 warning accent
        '#25D366', // 11 success accent
        '#fbbf24', // 12 highlight
        '#1f2937', // 13 shadow wall top
        '#94a3b8', // 14 light concrete
        '#334155', // 15 slate
    ];
    colors.forEach((c, i) => {
        const col = i % 8; const row = Math.floor(i / 8);
        tctx.fillStyle = c; tctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        tctx.strokeStyle = 'rgba(0,0,0,0.3)'; tctx.strokeRect(col * TILE_SIZE + 0.5, row * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    });
    const tileset = new Tileset({ imagePath: tilesetCanvas.toDataURL(), tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, columns: 8, rows: 2 });
    await tileset.load();

    // Maps: use chars => tileIndex mapping
    const T = {
        G: 0, // grass
        P: 1, // pavement
        X: 2, // building exterior wall
        D: 3, // entrance door
        F: 4, // interior floor
        W: 5, // interior wall
        S: 6, // sign/accent
        L: 7, // glass
    } as const;

    const outsidePattern = [
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGG',
        'GGGGGGPPPPPPPPGGGGGG',
        'GGGGGGPPXXXXPPGGGGGG',
        'GGGGGGPPXLLXPPGGGGGG',
        'GGGGGGPPXLLXPPGGGGGG',
        'GGGGGGPPXLLXPPGGGGGG',
        'GGGGGGPPXDDXPPGGGGGG',
        // Open a walkway directly below the door so the player can reach it
        'GGGGGGPPXPPXPPGGGGGG',
        'GGGGGGPPPPPPPPGGGGGG',
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
        // Entrance spans both door tiles (columns 9 and 10 on row 7)
        { id: 'entrance', x: 9, y: 7, w: 2, h: 1, label: 'Enter LTB', interactable: true },
    ];
    const hotspotsInside: Hotspot[] = [
        { id: 'group-room', x: 9, y: 4, w: 1, h: 1, label: 'Group Room', interactable: true },
    ];

    // Player state (restored from window if present)
    let playerX = 9 * TILE_SIZE;
    let playerY = 9 * TILE_SIZE;
    const playerSize = TILE_SIZE - 6; // slight inset for nicer collision
    let running = true;
    let last = performance.now();
    const keys: Record<string, boolean> = {};
    let interactionCooldownUntil = 0;
    
    // Animation state
    let frameIndex = 0;
    const currentAnimation = 'idle_forward';
    const playerFrames = ANIMATION_FRAMES[currentAnimation];
    
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
        const val = mapData[gy]?.[gx];
        if (val == null || val < 0) return true;
        // Exterior/interior walls are blocked, glass counts as wall
        return val === T.X || val === T.W || val === T.L;
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
            case 'entrance':
                env = 'inside';
                mapData = mapFrom(insidePattern);
                // Place player near inside door (not on group-room tile)
                playerX = 9 * TILE_SIZE; playerY = 5 * TILE_SIZE;
                // Persist scene state so remounts keep us inside
                (window as any).__ltb_state = { env, x: playerX, y: playerY };
                setStatus('You entered LTB. Find the Group Room.');
                // Small cooldown to avoid accidental double-interact
                interactionCooldownUntil = performance.now() + 250;
                // Log the action (will remount, but our state persists)
                store.setState(logActivity(state, { segment: 'campus-ltb', choiceId: 'enter-ltb', summary: 'Entered LTB building', deltas: {} }));
                break;
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
        if (keys['arrowup'] || keys['w']) ny -= speed;
        if (keys['arrowdown'] || keys['s']) ny += speed;
        if (keys['arrowleft'] || keys['a']) nx -= speed;
        if (keys['arrowright'] || keys['d']) nx += speed;
        if (isWalkable(nx, ny)) { playerX = nx; playerY = ny; }

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

        // Draw hotspot outlines (subtle)
        const hsList = currentHotspots();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        hsList.forEach(h => {
            ctx.strokeRect(h.x * TILE_SIZE + 0.5, h.y * TILE_SIZE + 0.5, h.w * TILE_SIZE - 1, h.h * TILE_SIZE - 1);
        });

        // Emphasize the entrance hotspot when outside
        if (env === 'outside') {
            const entrance = hsList.find(h => h.id === 'entrance');
            if (entrance) {
                ctx.strokeStyle = 'rgba(251,191,36,0.9)'; // amber
                ctx.lineWidth = 2;
                ctx.strokeRect(entrance.x * TILE_SIZE + 1, entrance.y * TILE_SIZE + 1, entrance.w * TILE_SIZE - 2, entrance.h * TILE_SIZE - 2);
                ctx.lineWidth = 1;
            }
        }

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
            frameIndex = (frameIndex + 1) % playerFrames.length;
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
        ctx.fillText('Hotspots: Cafeteria, Library, Entrance', 12, 36);
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
    store.subscribe((next, prev) => { if (next.currentScene !== prev.currentScene) cleanup(); });
};
