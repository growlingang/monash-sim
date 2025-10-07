import { MAJOR_DEFINITIONS } from '../data/majors';
import type { GameStore } from '../core/store';
import { logActivity, transitionScene } from '../core/gameState';
import { formatMinutes } from '../core/gameState';
import type { GameState } from '../core/types';

export const renderCharacterCreation = (root: HTMLElement, store: GameStore) => {
  const state = store.getState();

  const sceneContainer = document.createElement('div');
  sceneContainer.className = 'character-create';

  if (!state.playerName.trim()) {
    const card = document.createElement('section');
    card.className = 'character-create__card';

    const heading = document.createElement('h2');
    heading.className = 'character-create__title';
    heading.textContent = 'Welcome! What should we call you?';

    const description = document.createElement('p');
    description.className = 'character-create__copy';
    description.textContent = 'Enter the name you want classmates and lecturers to see on campus.';

    const form = document.createElement('form');
    form.className = 'character-create__form';

    const input = document.createElement('input');
    input.className = 'character-create__input';
    input.type = 'text';
    input.name = 'player-name';
    input.placeholder = 'e.g. Alex Chen';
    input.maxLength = 32;
    input.autocomplete = 'name';
    input.required = true;

    const submit = document.createElement('button');
    submit.className = 'character-create__button';
    submit.type = 'submit';
    submit.textContent = 'Continue';

    const helper = document.createElement('p');
    helper.className = 'character-create__helper';
    helper.textContent = 'Tip: you can change how NPCs greet you later in Settings.';

    const errorMsg = document.createElement('div');
    errorMsg.className = 'character-create__error';
    errorMsg.setAttribute('aria-live', 'polite');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (value.length === 0) {
        errorMsg.textContent = 'Please enter at least one character.';
        input.focus();
        return;
      }
      errorMsg.textContent = '';
      submit.disabled = true;
      store.setState((previous) => ({ ...previous, playerName: value }));
    });

    form.appendChild(input);
    form.appendChild(submit);

    card.appendChild(heading);
    card.appendChild(description);
    card.appendChild(form);
    card.appendChild(errorMsg);
    card.appendChild(helper);

    sceneContainer.appendChild(card);

    queueMicrotask(() => {
      input.focus();
    });
  } else {
    const intro = document.createElement('section');
    intro.className = 'character-create__card';

    const heading = document.createElement('h2');
    heading.className = 'character-create__title';
    heading.textContent = `Hey ${state.playerName}! Pick your Day 1 major.`;

    const description = document.createElement('p');
    description.className = 'character-create__copy';
    description.textContent = 'Each major gives you a different loadout of MONASH stats and a unique starter item.';

    intro.appendChild(heading);
    intro.appendChild(description);

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
            onboardingStep: 0,
          } satisfies GameState;
          const stamped = logActivity(next, {
            time: formatMinutes(next.timeMinutes),
            segment: 'character-creation',
            choiceId: `major-${major.id}`,
            summary: `${state.playerName} selected ${major.name}.`,
            deltas: {
              stats: { ...major.startingStats },
              hunger: major.startingHunger,
              money: major.startingMoney,
              time: 0,
              rapport: {},
              flagsGained: [],
            },
          });
          return transitionScene(stamped, 'onboarding');
        });
      });
      majorList.appendChild(button);
    });

    sceneContainer.appendChild(intro);
    sceneContainer.appendChild(majorList);
  }

  root.innerHTML = '';
  root.appendChild(sceneContainer);
};
