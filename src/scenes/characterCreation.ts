import { MAJOR_DEFINITIONS } from '../data/majors';
import type { GameStore } from '../core/store';
import { logActivity, transitionScene } from '../core/gameState';
import { formatMinutes } from '../core/gameState';
import type { GameState } from '../core/types';

export const renderCharacterCreation = (root: HTMLElement, store: GameStore) => {
  const majorList = document.createElement('div');
  majorList.className = 'major-select';

  Object.values(MAJOR_DEFINITIONS).forEach((major) => {
    const button = document.createElement('button');
    button.className = 'major-select__option';
    button.type = 'button';
    button.innerHTML = `
      <strong>${major.name}</strong>
      <span>${major.specialItem.name}</span>
    `;
    button.addEventListener('click', () => {
      store.setState((previous) => {
        const next = {
          ...previous,
          major: major.id,
          stats: { ...major.startingStats },
          hunger: major.startingHunger,
          money: major.startingMoney,
          specialItem: major.specialItem.name,
        } satisfies GameState;
        const stamped = logActivity(next, {
          time: formatMinutes(next.timeMinutes),
          segment: 'character-creation',
          choiceId: `major-${major.id}`,
          summary: `Selected ${major.name}.`,
          deltas: {
            stats: { ...major.startingStats },
            hunger: major.startingHunger,
            money: major.startingMoney,
            time: 0,
            rapport: {},
            flagsGained: [],
          },
        });
        return transitionScene(stamped, 'bedroom');
      });
    });
    majorList.appendChild(button);
  });

  root.innerHTML = '';
  root.appendChild(majorList);
};
