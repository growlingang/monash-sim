import './style.css';
import { createGameStore } from './core/store';
import type { GameState, MajorId } from './core/types';
import { MAJOR_DEFINITIONS } from './data/majors';
import { mountScene } from './scenes/ui/root';
import { initPhoneOverlay } from './ui/phoneOverlay';

const DEFAULT_MAJOR: MajorId = 'engineering';

const store = createGameStore(DEFAULT_MAJOR);

// Initialize phone overlay
initPhoneOverlay(store);

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Failed to locate root app container');
}

app.innerHTML = `
  <main class="ui-shell">
    <aside class="ui-shell__sidebar">
      <section class="ui-shell__panel">
        <h1>Monash Uni Life Sim</h1>
        <p class="ui-shell__subtitle">Day 1 Adventure Prototype</p>
      </section>
      <section class="ui-shell__panel ui-shell__panel--stats">
        <h2>State Monitor</h2>
        <pre id="state-dump"></pre>
      </section>
      <section class="ui-shell__panel ui-shell__panel--majors">
        <h2>Majors</h2>
        <div class="ui-shell__major-buttons" id="major-buttons"></div>
      </section>
    </aside>
    <section class="ui-shell__scene" id="scene-root"></section>
  </main>
`;

const stateDump = document.querySelector<HTMLPreElement>('#state-dump');
const majorButtons = document.querySelector<HTMLDivElement>('#major-buttons');
const sceneRoot = document.querySelector<HTMLDivElement>('#scene-root');

if (!stateDump || !majorButtons || !sceneRoot) {
  throw new Error('UI shell rendered without required elements');
}

const renderState = (state: GameState = store.getState()) => {
  stateDump.textContent = JSON.stringify(
    {
      scene: state.currentScene,
      major: state.major,
      stats: state.stats,
      hunger: state.hunger,
      money: state.money,
      timeMinutes: state.timeMinutes,
      flags: Array.from(state.flags),
    },
    null,
    2,
  );
  mountScene(state.currentScene, sceneRoot, store);
};

const buildMajorButtons = () => {
  majorButtons.innerHTML = '';
  Object.values(MAJOR_DEFINITIONS).forEach((major) => {
    const btn = document.createElement('button');
    btn.textContent = major.name;
    btn.type = 'button';
    btn.className = 'ui-shell__major-button';
    btn.addEventListener('click', () => {
      store.reset(major.id);
    });
    majorButtons.appendChild(btn);
  });
};

store.subscribe((next) => renderState(next));
buildMajorButtons();
renderState(store.getState());

// Register service worker if supported (only in production builds ideally)
if ('serviceWorker' in navigator) {
  // Delay registration slightly so it doesn't block startup work
  window.addEventListener('load', () => {
    const swUrl = '/service-worker.js';
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // Registration successful
        // eslint-disable-next-line no-console
        console.log('Service worker registered:', reg.scope);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', err);
      });
  });
}
