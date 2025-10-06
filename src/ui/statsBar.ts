import type { GameState } from '../core/types';
import { formatMinutes } from '../core/gameState';

export const createStatsBar = (state: GameState): HTMLElement => {
  const statsBar = document.createElement('div');
  statsBar.className = 'stats-bar';
  statsBar.style.cssText = `
    background: #2a2a2a;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 12px 20px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 32px;
    font-family: monospace;
    font-size: 14px;
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
      <span style="font-size: 18px;">${stat.label}</span>
      <span style="color: #999; font-size: 13px;">${stat.name}:</span>
      <span style="color: #4ac94a; font-weight: bold;">${stat.value}</span>
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
