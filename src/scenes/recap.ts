import type { GameStore } from '../core/store';
import { formatMinutes } from '../core/gameState';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { NpcId } from '../core/types';

export const renderRecap = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const state = store.getState();

  const container = document.createElement('div');
  container.className = 'recap';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    max-width: 900px;
    margin: 0 auto;
    min-height: 100vh;
    background: #3a2817;
    overflow-y: auto;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    margin-bottom: 24px;
    width: 100%;
  `;

  const title = document.createElement('h1');
  title.textContent = '📊 Day 1 Recap';
  title.style.cssText = `
    font-size: 24px;
    margin: 0 0 12px 0;
    color: #d4f0d4;
    font-family: 'Press Start 2P', monospace;
    text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  `;

  const subtitle = document.createElement('p');
  subtitle.textContent = `Your first day at Monash University - ${formatMinutes(state.timeMinutes)}`;
  subtitle.style.cssText = `
    font-size: 10px;
    margin: 0;
    color: #d4a574;
    font-family: 'Press Start 2P', monospace;
  `;

  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // Main content grid
  const contentGrid = document.createElement('div');
  contentGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
    margin-bottom: 16px;
  `;

  // Stats Section
  const statsCard = createCard('📊 MONASH Stats', [
    createStatRow('M (Mobility)', state.stats.M),
    createStatRow('O (Organisation)', state.stats.O),
    createStatRow('N (Networking)', state.stats.N),
    createStatRow('A (Aura)', state.stats.A),
    createStatRow('S (Skills)', state.stats.S),
  ]);
  contentGrid.appendChild(statsCard);

  // Resources Section
  const resourcesCard = createCard('💰 Resources', [
    createResourceRow('💵 Money', `$${state.money}`, state.money < 10 ? '#c97a7a' : '#6a9e6a'),
    createResourceRow('🍔 Hunger', `${state.hunger}/${state.stats.H}`, state.hunger < 5 ? '#c97a7a' : '#6a9e6a'),
    createResourceRow('⏰ Time Ended', formatMinutes(state.timeMinutes), '#d4a574'),
  ]);
  contentGrid.appendChild(resourcesCard);

  container.appendChild(contentGrid);

  // Rapport Section (full width)
  const rapportCard = createRapportCard(state);
  container.appendChild(rapportCard);

  // Activity Log (full width)
  const activityCard = createActivityLogCard(state);
  container.appendChild(activityCard);

  // Warnings Section (if any)
  const warnings = generateWarnings(state);
  if (warnings.length > 0) {
    const warningsCard = createWarningsCard(warnings);
    container.appendChild(warningsCard);
  }

  // Tomorrow Reminder
  const reminderCard = createReminderCard();
  container.appendChild(reminderCard);

  // Continue Button
  const continueBtn = document.createElement('button');
  continueBtn.textContent = 'Continue to Day 2';
  continueBtn.style.cssText = `
    padding: 12px 36px;
    background: #6a9e6a;
    color: #fbe9cf;
    border: 3px solid #4a7a4a;
    border-radius: 0;
    font-size: 11px;
    font-weight: bold;
    font-family: 'Press Start 2P', monospace;
    cursor: pointer;
    margin-top: 20px;
    transition: none;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  `;

  continueBtn.addEventListener('mouseenter', () => {
    continueBtn.style.transform = 'translate(-2px, -2px)';
    continueBtn.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
  });

  continueBtn.addEventListener('mouseleave', () => {
    continueBtn.style.transform = 'translate(0, 0)';
    continueBtn.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
  });

  continueBtn.addEventListener('click', () => {
    // TODO: Transition to Day 2 or main menu
    store.setState((prev) => ({ ...prev, currentScene: 'main-menu' }));
  });

  container.appendChild(continueBtn);
  root.appendChild(container);
};

function createCard(title: string, content: HTMLElement[]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #5a4a35;
    border-radius: 0;
    padding: 16px;
    border: 3px solid #8b6f47;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = title;
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #d4f0d4;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 3px solid #8b6f47;
    padding-bottom: 6px;
  `;

  card.appendChild(cardTitle);
  content.forEach((el) => card.appendChild(el));

  return card;
}

function createStatRow(label: string, value: number): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: #fbe9cf;
    font-size: 9px;
    font-family: 'Press Start 2P', monospace;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueContainer = document.createElement('div');
  valueContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

  const valueSpan = document.createElement('span');
  valueSpan.textContent = `${value}/10`;
  valueSpan.style.cssText = `
    font-weight: bold;
    font-family: 'Press Start 2P', monospace;
    color: ${value >= 7 ? '#6a9e6a' : value >= 4 ? '#d4a574' : '#c97a7a'};
  `;

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 80px;
    height: 6px;
    background: #3a2817;
    border-radius: 0;
    border: 2px solid #8b6f47;
    overflow: hidden;
  `;

  const progress = document.createElement('div');
  progress.style.cssText = `
    width: ${value * 10}%;
    height: 100%;
    background: ${value >= 7 ? '#6a9e6a' : value >= 4 ? '#d4a574' : '#c97a7a'};
    transition: none;
  `;

  progressBar.appendChild(progress);
  valueContainer.appendChild(valueSpan);
  valueContainer.appendChild(progressBar);

  row.appendChild(labelSpan);
  row.appendChild(valueContainer);

  return row;
}

function createResourceRow(label: string, value: string, color: string): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: #fbe9cf;
    font-size: 9px;
    font-family: 'Press Start 2P', monospace;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.textContent = value;
  valueSpan.style.cssText = `
    font-weight: bold;
    font-family: 'Press Start 2P', monospace;
    color: ${color};
  `;

  row.appendChild(labelSpan);
  row.appendChild(valueSpan);

  return row;
}

function createRapportCard(state: any): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #4a3a2a;
    border-radius: 0;
    padding: 16px;
    border: 3px solid #8b6f47;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '❤️ Team Rapport';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #d4f0d4;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 3px solid #8b6f47;
    padding-bottom: 6px;
  `;

  card.appendChild(cardTitle);

  const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];

  npcIds.forEach((npcId) => {
    const npc = NPC_DEFINITIONS[npcId];
    const rapport = state.rapport[npcId];

    const npcRow = document.createElement('div');
    npcRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding: 10px;
      background: #3a2817;
      border-radius: 0;
      border: 2px solid #5a4a35;
    `;

    const npcInfo = document.createElement('div');
    npcInfo.style.cssText = 'display: flex; flex-direction: column;';

    const npcName = document.createElement('span');
    npcName.textContent = npc.name;
    npcName.style.cssText = `
      font-weight: bold;
      color: #fbe9cf;
      font-size: 9px;
      font-family: 'Press Start 2P', monospace;
    `;

    const npcDesc = document.createElement('span');
    npcDesc.textContent = `${npc.focus.charAt(0).toUpperCase() + npc.focus.slice(1)} - ${npc.majorAffinity.toUpperCase()}`;
    npcDesc.style.cssText = `
      font-size: 7px;
      color: #8b6f47;
      margin-top: 4px;
      font-family: 'Press Start 2P', monospace;
    `;

    npcInfo.appendChild(npcName);
    npcInfo.appendChild(npcDesc);

    const rapportContainer = document.createElement('div');
    rapportContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    const rapportBar = document.createElement('div');
    rapportBar.style.cssText = `
      width: 120px;
      height: 8px;
      background: #2d1f0f;
      border-radius: 0;
      border: 2px solid #5a4a35;
      position: relative;
      overflow: hidden;
    `;

    // Calculate position on the bar (-3 to +5 scale)
    const rapportPercent = ((rapport + 3) / 8) * 100; // -3 to +5 = 8 point range

    const rapportFill = document.createElement('div');
    rapportFill.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${rapportPercent}%;
      height: 100%;
      background: ${rapport >= 0 ? '#6a9e6a' : '#c97a7a'};
      transition: none;
    `;

    // Center line marker
    const centerLine = document.createElement('div');
    centerLine.style.cssText = `
      position: absolute;
      left: ${(3 / 8) * 100}%;
      top: 0;
      width: 2px;
      height: 100%;
      background: #8b6f47;
    `;

    rapportBar.appendChild(rapportFill);
    rapportBar.appendChild(centerLine);

    const rapportValue = document.createElement('span');
    rapportValue.textContent = rapport > 0 ? `+${rapport}` : `${rapport}`;
    rapportValue.style.cssText = `
      font-weight: bold;
      font-size: 10px;
      min-width: 35px;
      text-align: center;
      font-family: 'Press Start 2P', monospace;
      color: ${rapport >= 0 ? '#6a9e6a' : '#c97a7a'};
    `;

    rapportContainer.appendChild(rapportBar);
    rapportContainer.appendChild(rapportValue);

    npcRow.appendChild(npcInfo);
    npcRow.appendChild(rapportContainer);

    card.appendChild(npcRow);
  });

  return card;
}

function createActivityLogCard(state: any): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #6a5a3a;
    border-radius: 0;
    padding: 16px;
    border: 3px solid #8b6f47;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '📝 Activity Log';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #d4f0d4;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 3px solid #8b6f47;
    padding-bottom: 6px;
  `;

  card.appendChild(cardTitle);

  if (state.activityLog.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No activities logged today.';
    emptyMsg.style.cssText = 'color: #8b6f47; font-size: 8px; font-family: "Press Start 2P", monospace;';
    card.appendChild(emptyMsg);
    return card;
  }

  const logContainer = document.createElement('div');
  logContainer.style.cssText = `
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
  `;

  state.activityLog.forEach((entry: any, index: number) => {
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
      padding: 10px;
      margin-bottom: 8px;
      background: #5a4a35;
      border-radius: 0;
      border-left: 4px solid #6a9e6a;
    `;

    const timeAndSummary = document.createElement('div');
    timeAndSummary.style.cssText = 'margin-bottom: 8px;';

    const time = document.createElement('span');
    time.textContent = entry.time;
    time.style.cssText = `
      color: #d4f0d4;
      font-weight: bold;
      margin-right: 8px;
      font-size: 8px;
      font-family: 'Press Start 2P', monospace;
    `;

    const summary = document.createElement('span');
    summary.textContent = entry.summary;
    summary.style.cssText = 'color: #fbe9cf; font-size: 8px; font-family: "Press Start 2P", monospace;';

    timeAndSummary.appendChild(time);
    timeAndSummary.appendChild(summary);

    logEntry.appendChild(timeAndSummary);

    // Show deltas if available
    if (entry.deltas) {
      const deltasContainer = document.createElement('div');
      deltasContainer.style.cssText = `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 7px;
        font-family: 'Press Start 2P', monospace;
      `;

      const deltas = [];

      if (entry.deltas.time) {
        deltas.push({ icon: '⏰', value: `${entry.deltas.time > 0 ? '+' : ''}${entry.deltas.time} min`, color: '#d4a574' });
      }
      if (entry.deltas.money) {
        deltas.push({ icon: '💰', value: `${entry.deltas.money > 0 ? '+' : ''}$${entry.deltas.money}`, color: entry.deltas.money > 0 ? '#6a9e6a' : '#c97a7a' });
      }
      if (entry.deltas.hunger) {
        deltas.push({ icon: '🍔', value: `${entry.deltas.hunger > 0 ? '+' : ''}${entry.deltas.hunger}`, color: entry.deltas.hunger > 0 ? '#6a9e6a' : '#c97a7a' });
      }
      if (entry.deltas.stats) {
        Object.entries(entry.deltas.stats).forEach(([stat, value]: [string, any]) => {
          deltas.push({ icon: '📊', value: `${stat} ${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#6a9e6a' : '#c97a7a' });
        });
      }
      if (entry.deltas.rapport) {
        Object.entries(entry.deltas.rapport).forEach(([npc, value]: [string, any]) => {
          const npcName = NPC_DEFINITIONS[npc as NpcId]?.name || npc;
          deltas.push({ icon: '❤️', value: `${npcName} ${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#6a9e6a' : '#c97a7a' });
        });
      }

      deltas.forEach((delta) => {
        const deltaSpan = document.createElement('span');
        deltaSpan.textContent = `${delta.icon} ${delta.value}`;
        deltaSpan.style.cssText = `
          padding: 3px 6px;
          background: #3a2817;
          border-radius: 0;
          border: 2px solid #5a4a35;
          color: ${delta.color};
          font-family: 'Press Start 2P', monospace;
        `;
        deltasContainer.appendChild(deltaSpan);
      });

      logEntry.appendChild(deltasContainer);
    }

    logContainer.appendChild(logEntry);
  });

  card.appendChild(logContainer);

  return card;
}

function generateWarnings(state: any): string[] {
  const warnings: string[] = [];

  // Low hunger warning
  if (state.hunger < 5) {
    warnings.push(`⚠️ Low hunger (${state.hunger}/10) - Make sure to eat tomorrow!`);
  }

  // Low money warning
  if (state.money < 10) {
    warnings.push(`⚠️ Low funds ($${state.money}) - Budget carefully for Day 2!`);
  }

  // Negative rapport warnings
  const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];
  npcIds.forEach((npcId) => {
    const rapport = state.rapport[npcId];
    if (rapport < 0) {
      const npcName = NPC_DEFINITIONS[npcId].name;
      warnings.push(`⚠️ Negative rapport with ${npcName} (${rapport}) - Try to improve this relationship!`);
    }
  });

  // Strained DM warnings
  npcIds.forEach((npcId) => {
    const strainedFlag = `strained-dm-${npcId}` as any;
    if (state.flags.has(strainedFlag)) {
      const npcName = NPC_DEFINITIONS[npcId].name;
      warnings.push(`⚠️ Conversation with ${npcName} feels strained - Be more considerate in future messages.`);
    }
  });

  // Low stats warnings
  Object.entries(state.stats).forEach(([stat, value]: [string, any]) => {
    if (stat !== 'H' && value <= 3) {
      const statNames: Record<string, string> = {
        M: 'Mobility',
        O: 'Organisation',
        N: 'Networking',
        A: 'Aura',
        S: 'Skills',
      };
      warnings.push(`⚠️ Low ${statNames[stat]} (${value}/10) - This may affect your performance tomorrow.`);
    }
  });

  return warnings;
}

function createWarningsCard(warnings: string[]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #6a5a3a;
    border-radius: 0;
    padding: 16px;
    border: 3px solid #c97a7a;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '⚠️ Warnings & Alerts';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 3px solid #8b6f47;
    padding-bottom: 6px;
  `;

  card.appendChild(cardTitle);

  warnings.forEach((warning) => {
    const warningEl = document.createElement('div');
    warningEl.textContent = warning;
    warningEl.style.cssText = `
      padding: 10px;
      margin-bottom: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      color: #ffcccc;
      font-size: 14px;
      line-height: 1.5;
    `;
    card.appendChild(warningEl);
  });

  return card;
}

function createReminderCard(): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: rgba(30, 58, 95, 0.8);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #3b82f6;
    backdrop-filter: blur(10px);
    width: 100%;
    margin-bottom: 20px;
    text-align: center;
  `;

  const icon = document.createElement('div');
  icon.textContent = '📚';
  icon.style.cssText = 'font-size: 48px; margin-bottom: 12px;';

  const title = document.createElement('h3');
  title.textContent = 'Tomorrow: Day 2';
  title.style.cssText = `
    margin: 0 0 12px 0;
    color: #3b82f6;
    font-size: 24px;
  `;

  const message = document.createElement('p');
  message.innerHTML = `
    <strong>Assignment:</strong> Digital Privacy vs. Convenience - Okta Verify Debate<br>
    <strong>Due:</strong> Day 7, 11:59 PM<br><br>
    Start working with your team to complete the assignment!
  `;
  message.style.cssText = `
    margin: 0;
    color: #fbe9cf;
    font-size: 9px;
    line-height: 1.6;
    font-family: 'Press Start 2P', monospace;
  `;

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(message);

  return card;
}

