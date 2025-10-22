import type { GameStore } from '../core/store';
import { transitionScene } from '../core/gameState';
import type { GameState } from '../core/types';

import bgIntro from '../ui/bg_1.png';
import bg2 from '../ui/bg_2.png';
import bg3 from '../ui/bg_3.png';
import bgFinal from '../ui/bg_4.png';
import sirJohnPortrait from '../ui/sirjohn_monash.png';
import arrowButton from '../ui/arrow_button.png';

interface OnboardingStep {
  id: string;
  background: string;
  portrait: string;
  message: (state: GameState) => string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    background: bgIntro,
    portrait: sirJohnPortrait,
    message: (state) => {
      const name = state.playerName.trim() || 'there';
      return `Hey ${name}, welcome to Monash Sim game!\nWe're excited to have you here.`;
    },
  },
  {
    id: 'introduction',
    background: bgIntro,
    portrait: sirJohnPortrait,
    message: () => {
      return `I'm Sir John Monash, at your service! Nice to meet you.`;
    },
  },
  {
    id: 'campus-view',
    background: bg2,
    portrait: sirJohnPortrait,
    message: () => `That's Monash Clayton. Beautiful, isn't it?`,
  },
  {
    id: 'explore-prompt',
    background: bg2,
    portrait: sirJohnPortrait,
    message: () => `You'll have the chance to explore the campus on your own!`,
  },
  {
    id: 'support-location',
    background: bg3,
    portrait: sirJohnPortrait,
    message: () => `Press P to open your phone and access helpful tools\nthroughout your day!`,
  },
  {
    id: 'map-question',
    background: bg2,
    portrait: sirJohnPortrait,
    message: () => `Now, where are YOU on this map...?`,
  },
  {
    id: 'final-transition',
    background: bgFinal,
    portrait: sirJohnPortrait,
    message: () => `Alright – time to begin your first day!`,
  },
];

export const renderOnboarding = (root: HTMLElement, store: GameStore) => {
  const state = store.getState();
  const stepIndex = state.onboardingStep ?? 0;

  if (stepIndex >= ONBOARDING_STEPS.length) {
    store.setState((previous) => transitionScene(previous, 'bedroom'));
    return;
  }

  const step = ONBOARDING_STEPS[stepIndex];
  const message = step.message(state);

  let typingTimer: number | null = null;
  let isTyping = false;
  let text: HTMLParagraphElement;
  let nextButton: HTMLButtonElement;

  const stopTyping = () => {
    if (typingTimer !== null) {
      window.clearInterval(typingTimer);
      typingTimer = null;
    }
    if (isTyping) {
      isTyping = false;
      if (text) {
        text.textContent = message;
      }
      nextButton?.classList.remove('is-waiting');
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault();
      handleAdvance();
    }
  };

  const handleAdvance = () => {
    if (isTyping) {
      stopTyping();
      return;
    }

    document.removeEventListener('keydown', handleKeyDown);
    stopTyping();

    store.setState((previous) => {
      const nextIndex = (previous.onboardingStep ?? 0) + 1;
      if (nextIndex < ONBOARDING_STEPS.length) {
        return { ...previous, onboardingStep: nextIndex };
      }
      return transitionScene({ ...previous, onboardingStep: nextIndex }, 'bedroom');
    });
  };

  document.addEventListener('keydown', handleKeyDown);

  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'onboarding';
  container.style.backgroundImage = `url(${step.background})`;

  const panel = document.createElement('section');
  panel.className = 'onboarding__panel';

  const portrait = document.createElement('img');
  portrait.src = step.portrait;
  portrait.alt = 'Sir John Monash smiling proudly';
  portrait.className = 'onboarding__character';

  const textGroup = document.createElement('div');
  textGroup.className = 'onboarding__text-group';

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.classList.add('onboarding__text-bg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const rect = document.createElementNS(svgNs, 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '100');
  rect.setAttribute('height', '100');
  rect.setAttribute('rx', '6');
  rect.setAttribute('ry', '6');
  rect.setAttribute('fill', '#f4e7cd');
  rect.setAttribute('stroke', '#3a2214');
  rect.setAttribute('stroke-width', '1.4');
  svg.appendChild(rect);

  text = document.createElement('p');
  text.className = 'onboarding__text';
  text.setAttribute('aria-live', 'polite');
  text.setAttribute('aria-atomic', 'true');
  text.textContent = '';

  const startTyping = () => {
    isTyping = true;
    nextButton?.classList.add('is-waiting');
    let index = 0;
    const delay = Math.max(24, Math.min(55, Math.round(900 / Math.max(message.length, 1))));

    if (message.length === 0) {
      stopTyping();
      return;
    }

    typingTimer = window.setInterval(() => {
      index += 1;
      text.textContent = message.slice(0, index);

      if (index >= message.length) {
        stopTyping();
      }
    }, delay);
  };

  nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'onboarding__next';
  nextButton.setAttribute('aria-label', 'Continue');
  nextButton.style.backgroundImage = `url(${arrowButton})`;
  nextButton.addEventListener('click', handleAdvance);

  textGroup.appendChild(svg);
  textGroup.appendChild(text);
  textGroup.appendChild(nextButton);

  panel.appendChild(portrait);
  panel.appendChild(textGroup);

  container.appendChild(panel);

  root.appendChild(container);

  startTyping();
};
