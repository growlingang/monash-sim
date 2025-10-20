import type { GameState } from '../core/types';
import { formatMinutes } from '../core/gameState';

export const createStatsBar = (state: GameState): HTMLElement => {
  const statsBar = document.createElement('div');
  statsBar.className = 'stats-bar';
  statsBar.style.cssText = `
    background: #d4a574;
    border: 3px solid #8b6f47;
    border-radius: 0;
    padding: 12px 20px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 32px;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    box-shadow: 4px 4px 0 #5a4a35;
    image-rendering: pixelated;
  `;

  const stats = [
    { label: '⏰', name: 'Time', value: formatMinutes(state.timeMinutes) },
    { label: '🍕', name: 'Hunger', value: `${state.hunger}/${state.stats.H}` },
    { label: '💰', name: 'Money', value: `$${state.money}` },
  ];

  stats.forEach(stat => {
    const statDiv = document.createElement('div');
    statDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    statDiv.innerHTML = `
      <span style="font-size: 16px;">${stat.label}</span>
      <span style="color: #5a4a35; font-size: 11px;">${stat.name}:</span>
      <span style="color: #2d1f0f; font-weight: bold;">${stat.value}</span>
    `;
    statsBar.appendChild(statDiv);
  });

  return statsBar;
};

export const updateStatsBar = (statsBar: HTMLElement, state: GameState): void => {
  const stats = [
    { value: formatMinutes(state.timeMinutes) },
    { value: `${state.hunger}/${state.stats.H}` },
    { value: `$${state.money}` },
  ];

  const statValues = statsBar.querySelectorAll('div > span:last-child');
  stats.forEach((stat, index) => {
    if (statValues[index]) {
      statValues[index].textContent = stat.value;
    }
  });
};
