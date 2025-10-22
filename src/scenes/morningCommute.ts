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
import { getNextScene } from './sceneController';
import { walkMinigame, busMinigame, driveMinigame, type MinigameConfig } from '../minigames';
import { createStatsBar } from '../ui/statsBar';

const canAfford = (state: GameState, option: CommuteDefinition): boolean => {
  const moneyDelta = option.successOutcome.moneyDelta;
  const projected = state.money + moneyDelta;
  return projected >= 0;
};

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
    playerSprite: state.playerSprite, // Pass player sprite to minigames
  } as any;

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
      notes: 'Insufficient funds forced you to walk to campus.',
    };
  }

  if (minigameSuccess) {
    return { outcome: option.successOutcome, result: 'success' };
  }

  // Failure still gets you to campus, just with penalties
  return { outcome: option.failureOutcome, result: 'failure' };
};

const launchMinigame = async (option: CommuteDefinition, store: GameStore, root: HTMLElement) => {
  let extraTimePenalty = 0;
  let penaltyReason: string | undefined;

  const minigameContainer = document.createElement('div');
  minigameContainer.className = 'minigame-container';
  root.innerHTML = '';
  root.appendChild(minigameContainer);

  const result = await playMinigame(option, store.getState(), minigameContainer);
  const success = result.success;
  extraTimePenalty = result.extraTimePenalty || 0;
  penaltyReason = result.penaltyReason;

  store.setState((prev) => {
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
      segment: 'morning-commute',
      choiceId: `commute-${option.id}-${resolution.result}`,
      summary: `${entrySummary}${resolution.notes ? ` (${resolution.notes})` : ''}${extraNote}`,
      deltas,
      time: formatMinutes(next.timeMinutes),
    });

    // Always advance to campus
    const nextScene = getNextScene(prev.currentScene);
    if (nextScene) {
      next = transitionScene(next, nextScene);
    }

    return next;
  });
};

const renderOptionCard = (
  option: CommuteDefinition,
  state: GameState,
  onSelect: () => void,
): HTMLElement => {
  const card = document.createElement('article');
  card.className = 'commute__option';

  const costValue = option.successOutcome.moneyDelta;
  const displayCost = costValue === 0 ? '$0' : `$${Math.abs(costValue)}`;
  const afford = state.money + costValue >= 0;

  card.innerHTML = `
    <header>
      <h3>${option.label}</h3>
      <p class="commute__difficulty">${option.difficulty.toUpperCase()}</p>
    </header>
    <ul class="commute__facts">
      <li><strong>Time:</strong> ~${option.baseTime} min</li>
      <li><strong>Cost:</strong> ${displayCost}</li>
      <li><strong>Hunger:</strong> ${option.hungerCost >= 0 ? `+${option.hungerCost}` : option.hungerCost}</li>
    </ul>
    <p class="commute__flavor">${option.successOutcome.description}</p>
  `;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'commute__choose';
  button.textContent = afford ? 'Start commute' : 'Insufficient funds';
  button.disabled = !afford;
  button.addEventListener('click', () => {
    if (button.disabled) {
      return;
    }
    onSelect();
  });

  card.appendChild(button);
  return card;
};

export const renderMorningCommute = (root: HTMLElement, store: GameStore) => {
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

  const container = document.createElement('div');
  container.className = 'commute';
  container.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 20px;';

  const header = document.createElement('section');
  header.style.cssText = 'text-align: center; margin-bottom: 20px;';
  header.innerHTML = `
    <h2>Morning Commute</h2>
    <p>The day starts at 07:00. Choose how you reach campus.</p>
  `;

  const statsBar = createStatsBar(store.getState());

  const optionsContainer = document.createElement('section');
  optionsContainer.className = 'commute__options';
  optionsContainer.style.cssText = 'display: grid; gap: 16px;';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(optionsContainer);

  root.innerHTML = '';
  root.appendChild(container);

  const renderOptions = () => {
    const state = store.getState();
    optionsContainer.innerHTML = '';
    
    COMMUTE_DEFINITIONS.forEach((option) => {
      const card = renderOptionCard(option, state, () => {
        launchMinigame(option, store, root);
      });
      optionsContainer.appendChild(card);
    });
  };

  renderOptions();

  const maybeAutoResolve = () => {
    const state = store.getState();

    const bus = COMMUTE_DEFINITIONS.find((entry) => entry.id === 'bus');
    const drive = COMMUTE_DEFINITIONS.find((entry) => entry.id === 'drive');
    const walk = COMMUTE_DEFINITIONS.find((entry) => entry.id === 'walk');

    if (!bus || !drive || !walk) {
      return;
    }

    const canBus = canAfford(state, bus);
    const canDrive = canAfford(state, drive);

    if (!canBus && !canDrive) {
      launchMinigame(walk, store, root);
    }
  };

  maybeAutoResolve();
};
