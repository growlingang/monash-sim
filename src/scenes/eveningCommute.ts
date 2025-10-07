import { COMMUTE_DEFINITIONS } from '../data/commute';
import type { GameStore } from '../core/store';
import {
  applyDeltas,
  formatMinutes,
  logActivity,
  transitionScene,
} from '../core/gameState';
import type { CommuteDefinition, CommuteOutcome } from '../data/commute';
import type { GameState, GameStateDeltas } from '../core/types';
import { createStatsBar } from '../ui/statsBar';
import { walkMinigame, busMinigame, driveMinigame, type MinigameConfig } from '../minigames';

const TILE_SIZE = 32;
const BUS_BAY_WIDTH = 24; // tiles - wider to fill more screen
const BUS_BAY_HEIGHT = 16; // tiles - taller to fill more screen
const CANVAS_WIDTH = BUS_BAY_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = BUS_BAY_HEIGHT * TILE_SIZE;

type CommuteResultKind = 'success' | 'failure' | 'auto';

interface CommuteResolution {
  outcome: CommuteOutcome;
  result: CommuteResultKind;
  notes?: string;
}

const playMinigame = async (
  option: CommuteDefinition,
  state: GameState,
  container: HTMLElement,
): Promise<{ success: boolean; extraTimePenalty?: number; penaltyReason?: string }> => {
  const config: MinigameConfig = {
    playerStats: {
      mobility: state.stats.M,
      organisation: state.stats.O,
      networking: state.stats.N,
      aura: state.stats.A,
      skills: state.stats.S,
    },
  };

  let result;
  switch (option.id) {
    case 'walk':
      result = await walkMinigame.mount(container, config);
      break;
    case 'bus':
      result = await busMinigame.mount(container, config);
      break;
    case 'drive':
      result = await driveMinigame.mount(container, config);
      break;
    default:
      result = { success: true, completed: true };
  }

  return { 
    success: result.success && result.completed,
    extraTimePenalty: result.extraTimePenalty,
    penaltyReason: result.penaltyReason,
  };
};

const resolveOutcome = (
  minigameSuccess: boolean,
  option: CommuteDefinition,
  forcedAuto: boolean,
): CommuteResolution => {
  if (forcedAuto && option.autoOutcome) {
    return {
      outcome: option.autoOutcome,
      result: 'auto',
      notes: 'Insufficient funds forced you to walk home.',
    };
  }

  if (minigameSuccess) {
    return { outcome: option.successOutcome, result: 'success' };
  }

  // Failure still gets you home, just with penalties
  return { outcome: option.failureOutcome, result: 'failure' };
};

const launchMinigame = async (option: CommuteDefinition, store: GameStore, root: HTMLElement) => {
  console.log('Launching minigame for:', option.id);
  
  let extraTimePenalty = 0;
  let penaltyReason: string | undefined;

  const minigameContainer = document.createElement('div');
  minigameContainer.className = 'minigame-container';
  root.innerHTML = '';
  root.appendChild(minigameContainer);

  try {
    console.log('Starting minigame...');
    const result = await playMinigame(option, store.getState(), minigameContainer);
    console.log('Minigame result received:', result);
    
    const success = result.success;
    extraTimePenalty = result.extraTimePenalty || 0;
    penaltyReason = result.penaltyReason;
    
    console.log('Minigame completed:', { success, extraTimePenalty, penaltyReason });
    console.log('About to update state and transition to bedroom');
    
    // Process the minigame result immediately
    processMinigameResult(success, extraTimePenalty, penaltyReason, option, store);
    
  } catch (error) {
    console.error('Minigame error:', error);
    // Fallback - just transition to bedroom
    store.setState((prev) => transitionScene(prev, 'bedroom'));
    return;
  }

};

const processMinigameResult = (
  success: boolean,
  extraTimePenalty: number,
  penaltyReason: string | undefined,
  option: CommuteDefinition,
  store: GameStore
) => {
  console.log('Processing minigame result...');
  
  store.setState((prev) => {
    console.log('Current scene before update:', prev.currentScene);
    
    const resolution = resolveOutcome(success, option, false);
    const deltas: Partial<GameStateDeltas> = {
      stats: resolution.outcome.statDeltas,
      hunger: resolution.outcome.hungerDelta,
      money: resolution.outcome.moneyDelta,
      time: resolution.outcome.timeDelta + extraTimePenalty,
      rapport: resolution.outcome.rapportDeltas,
      flagsGained: [],
    };

    let next = applyDeltas(prev, deltas);

    const entrySummary = `${option.label}: ${resolution.outcome.description}`;
    const extraNote = penaltyReason ? ` ${penaltyReason}.` : '';

    next = logActivity(next, {
      segment: 'evening-commute',
      choiceId: `commute-${option.id}-${resolution.result}`,
      summary: `${entrySummary}${resolution.notes ? ` (${resolution.notes})` : ''}${extraNote}`,
      deltas,
      time: formatMinutes(next.timeMinutes),
    });

    // Always advance to next scene (bedroom)
    console.log('Transitioning to bedroom now');
    next = transitionScene(next, "bedroom");
    console.log('Transition complete, new scene:', next.currentScene);

    return next;
  });
};

export const renderEveningCommute = (root: HTMLElement, store: GameStore) => {
  // Check if a transport was pre-selected from phone
  const preSelectedTransport = (window as any).__selectedTransport;
  if (preSelectedTransport) {
    delete (window as any).__selectedTransport;
    const option = COMMUTE_DEFINITIONS.find(opt => opt.id === preSelectedTransport);
    if (option) {
      // Launch minigame immediately
      launchMinigame(option, store, root);
      return;
    }
  }

  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'evening-commute';
  container.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 800px; margin: 0 auto;';

  const header = document.createElement('div');
  header.className = 'evening-commute__header';
  header.style.cssText = 'margin-bottom: 10px; font-size: 14px; text-align: center; width: 100%;';
  header.innerHTML = '<h2>Bus Bay</h2><p>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move. Press <strong>P</strong> to open your phone.</p>';

  // Add stats bar
  const statsBar = createStatsBar(store.getState());

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.cssText = 'border: 2px solid #333; background: #2a4a2a;';

  const statusBar = document.createElement('div');
  statusBar.className = 'evening-commute__status';
  statusBar.style.cssText = 'margin-top: 10px; font-family: monospace; font-size: 12px; color: #999;';
  statusBar.innerHTML = 'You\'re at the bus bay. Press <strong>P</strong> for phone to choose your commute home.';
  
  // Add test button to skip minigame
  const testButton = document.createElement('button');
  testButton.textContent = 'TEST: Skip to Bedroom';
  testButton.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;';
  testButton.addEventListener('click', () => {
    console.log('Test button clicked - transitioning to bedroom');
    store.setState((prev) => transitionScene(prev, 'bedroom'));
  });

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(canvas);
  container.appendChild(statusBar);
  container.appendChild(testButton);
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
    // Phone shortcut (P key) is handled globally by phoneOverlay.ts
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  // Game loop
  const gameLoop = (currentTime: number) => {
    if (!gameActive) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Update player position
    const moveSpeed = 100; // pixels per second
    const moveDistance = (moveSpeed * deltaTime) / 1000;

    if (keys['arrowleft'] || keys['a']) {
      playerX = Math.max(0, playerX - moveDistance);
    }
    if (keys['arrowright'] || keys['d']) {
      playerX = Math.min(CANVAS_WIDTH - playerSize, playerX + moveDistance);
    }
    if (keys['arrowup'] || keys['w']) {
      playerY = Math.max(0, playerY - moveDistance);
    }
    if (keys['arrowdown'] || keys['s']) {
      playerY = Math.min(CANVAS_HEIGHT - playerSize, playerY + moveDistance);
    }

    // Render
    render();

    requestAnimationFrame(gameLoop);
  };

  const render = () => {
    // Clear canvas with bus bay background
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw curb going through the entire screen
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 8 * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
    
    // Draw curb edge (darker line)
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 8 * TILE_SIZE, CANVAS_WIDTH, 2);

    // Draw bus bay elements
    ctx.fillStyle = '#4a4a4a';
    // Bus shelter (larger)
    ctx.fillRect(10 * TILE_SIZE, 2 * TILE_SIZE, 4 * TILE_SIZE, 4 * TILE_SIZE);
    
    // Bus stop sign
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(3 * TILE_SIZE, 2 * TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE);
    
    // Benches along the curb
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(2 * TILE_SIZE, 7 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE);
    ctx.fillRect(19 * TILE_SIZE, 7 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE);
    
    // Trees
    ctx.fillStyle = '#228b22';
    ctx.fillRect(1 * TILE_SIZE, 1 * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.fillRect(22 * TILE_SIZE, 1 * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.fillRect(1 * TILE_SIZE, 14 * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.fillRect(22 * TILE_SIZE, 14 * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Draw player
    ctx.fillStyle = '#4169e1';
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
    
    // Player face
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(playerX + 4, playerY + 4, 8, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(playerX + 6, playerY + 6, 2, 2); // left eye
    ctx.fillRect(playerX + 10, playerY + 6, 2, 2); // right eye
    ctx.fillRect(playerX + 7, playerY + 10, 6, 1); // mouth
  };

  // Event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Start game loop
  requestAnimationFrame(gameLoop);

  // Cleanup function
  const cleanup = () => {
    gameActive = false;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  // Store cleanup function for later use
  (root as any).__cleanup = cleanup;
};