import { EVENING_ACTIVITY_DEFINITIONS, getAvailableActivities } from '../data/eveningActivities';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { GameStore } from '../core/store';
import {
  applyDeltas,
  formatMinutes,
  logActivity,
  transitionScene,
} from '../core/gameState';
import type { GameState, GameStateDeltas, NpcId } from '../core/types';
import { getNextScene } from './sceneController';
import { createStatsBar } from '../ui/statsBar';

// Removed unused interface

const canAfford = (state: GameState, activity: any): boolean => {
  if (!activity.requirements.money) return true;
  return state.money >= activity.requirements.money;
};

const hasTime = (state: GameState, activity: any): boolean => {
  const timeRemaining = 15 * ((22 - 7) * 4) - state.timeMinutes; // Time until 22:00
  return timeRemaining >= activity.requirements.time;
};

const canDoActivity = (state: GameState, activity: any): boolean => {
  return canAfford(state, activity) && hasTime(state, activity);
};

const executeActivity = (activity: any, store: GameStore, npcId?: NpcId) => {
  store.setState((prev) => {
    let deltas: Partial<GameStateDeltas> = {
      stats: activity.outcome.statDeltas,
      time: activity.outcome.timeDelta,
      rapport: activity.outcome.rapportDeltas,
      flagsGained: [],
    };

    // Handle hunger and money deltas
    if (activity.outcome.hungerDelta !== undefined) {
      if (activity.id === 'eat') {
        // Eat sets hunger to 10
        deltas.hunger = 10 - prev.hunger;
      } else {
        // Rest adds hunger
        deltas.hunger = activity.outcome.hungerDelta;
      }
    }

    if (activity.outcome.moneyDelta !== undefined) {
      deltas.money = activity.outcome.moneyDelta;
    }

    // Handle text activity rapport bonus
    if (activity.id === 'text' && npcId) {
      const currentRapport = prev.rapport[npcId];
      const rapportBonus = currentRapport <= 0 ? 2 : 1;
      deltas.rapport = { [npcId]: rapportBonus };
    }

    // Handle doomscroll flag
    if (activity.id === 'doomscroll') {
      deltas.flagsGained = ['doomscroll-used'];
    }

    let next = applyDeltas(prev, deltas);

    // Log the activity
    const entrySummary = activity.outcome.description;
    const npcText = npcId ? ` with ${NPC_DEFINITIONS[npcId].name}` : '';
    
    next = logActivity(next, {
      segment: 'evening-activity',
      choiceId: `evening-${activity.id}${npcId ? `-${npcId}` : ''}`,
      summary: `${activity.label}${npcText}: ${entrySummary}`,
      deltas,
      time: formatMinutes(next.timeMinutes),
    });

    // Advance to recap
    const nextScene = getNextScene(prev.currentScene);
    if (nextScene) {
      next = transitionScene(next, nextScene);
    }

    return next;
  });
};

const renderActivityCard = (
  activity: any,
  state: GameState,
  onSelect: () => void,
): HTMLElement => {
  const card = document.createElement('article');
  card.className = 'evening-activity__option';

  const canDo = canDoActivity(state, activity);
  const costText = activity.requirements.money ? `$${activity.requirements.money}` : 'Free';
  const timeText = `${activity.requirements.time} min`;

  card.innerHTML = `
    <header>
      <h3>${activity.label}</h3>
      <p class="evening-activity__description">${activity.description}</p>
    </header>
    <ul class="evening-activity__facts">
      <li><strong>Time:</strong> ${timeText}</li>
      <li><strong>Cost:</strong> ${costText}</li>
      ${activity.requirements.hungerMax !== undefined ? `<li><strong>Requires:</strong> Hunger ≤ ${activity.requirements.hungerMax}</li>` : ''}
      ${activity.requirements.hungerMin !== undefined ? `<li><strong>Requires:</strong> Hunger ≥ ${activity.requirements.hungerMin}</li>` : ''}
    </ul>
  `;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'evening-activity__choose';
  button.textContent = canDo ? 'Choose activity' : 'Cannot do this';
  button.disabled = !canDo;
  button.addEventListener('click', () => {
    if (button.disabled) return;
    onSelect();
  });

  card.appendChild(button);
  return card;
};

const showNpcSelection = (activity: any, store: GameStore, root: HTMLElement) => {
  const state = store.getState();
  const availableNpcs = Object.keys(NPC_DEFINITIONS) as NpcId[];
  
  const modal = document.createElement('div');
  modal.className = 'evening-activity__modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 400px;
    width: 90%;
  `;

  modalContent.innerHTML = `
    <h3>Choose who to text</h3>
    <p>Select a teammate to send a message to:</p>
  `;

  const npcList = document.createElement('div');
  npcList.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin: 16px 0;';

  availableNpcs.forEach((npcId) => {
    const npc = NPC_DEFINITIONS[npcId];
    const button = document.createElement('button');
    button.style.cssText = `
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      text-align: left;
    `;
    button.innerHTML = `
      <strong>${npc.name}</strong><br>
      <small>Current rapport: ${state.rapport[npcId]}</small>
    `;
    
    button.addEventListener('click', () => {
      modal.remove();
      executeActivity(activity, store, npcId);
    });
    
    npcList.appendChild(button);
  });

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #f5f5f5;
    cursor: pointer;
    margin-top: 16px;
  `;
  cancelButton.addEventListener('click', () => {
    modal.remove();
  });

  modalContent.appendChild(npcList);
  modalContent.appendChild(cancelButton);
  modal.appendChild(modalContent);
  root.appendChild(modal);
};

export const renderEveningActivity = (root: HTMLElement, store: GameStore) => {
  const container = document.createElement('div');
  container.className = 'evening-activity';
  container.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 20px;';

  const header = document.createElement('section');
  header.style.cssText = 'text-align: center; margin-bottom: 20px;';
  header.innerHTML = `
    <h2>Evening Activity</h2>
    <p>You're back home. Choose how to spend your evening.</p>
  `;

  const statsBar = createStatsBar(store.getState());

  const optionsContainer = document.createElement('section');
  optionsContainer.className = 'evening-activity__options';
  optionsContainer.style.cssText = 'display: grid; gap: 16px;';

  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(optionsContainer);

  root.innerHTML = '';
  root.appendChild(container);

  const renderOptions = () => {
    const state = store.getState();
    const timeRemaining = 15 * ((22 - 7) * 4) - state.timeMinutes;
    
    // Check if we need to auto-resolve
    if (timeRemaining < 30) {
      // Auto-force Rest if possible, otherwise skip to recap
      const restActivity = EVENING_ACTIVITY_DEFINITIONS.find(a => a.id === 'rest');
      if (restActivity && canDoActivity(state, restActivity)) {
        executeActivity(restActivity, store);
        return;
      } else {
        // Skip to recap with fatigue warning
        store.setState((prev) => {
          const next = logActivity(prev, {
            segment: 'evening-activity',
            choiceId: 'evening-auto-skip',
            summary: 'Out of time - skipped evening activity with fatigue warning.',
            deltas: { time: 0 },
            time: formatMinutes(prev.timeMinutes),
          });
          const nextScene = getNextScene(prev.currentScene);
          return nextScene ? transitionScene(next, nextScene) : next;
        });
        return;
      }
    }

    optionsContainer.innerHTML = '';
    
    const availableActivities = getAvailableActivities({
      money: state.money,
      hunger: state.hunger,
      timeMinutes: state.timeMinutes,
      doomscrollUsed: state.doomscrollUsed,
    });

    availableActivities.forEach((activity) => {
      const card = renderActivityCard(activity, state, () => {
        if (activity.id === 'text') {
          showNpcSelection(activity, store, root);
        } else {
          executeActivity(activity, store);
        }
      });
      optionsContainer.appendChild(card);
    });

    if (availableActivities.length === 0) {
      optionsContainer.innerHTML = '<p>No activities available. You need more time, money, or different hunger levels.</p>';
    }
  };

  renderOptions();
};
