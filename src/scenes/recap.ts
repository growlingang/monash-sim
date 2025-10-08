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
    padding: 40px 20px;
    max-width: 900px;
    margin: 0 auto;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    margin-bottom: 40px;
    width: 100%;
  `;

  const title = document.createElement('h1');
  title.textContent = '📊 Day 1 Recap';
  title.style.cssText = `
    font-size: 48px;
    margin: 0 0 16px 0;
    color: #4ac94a;
    text-shadow: 0 0 20px rgba(74, 201, 74, 0.5);
  `;

  const subtitle = document.createElement('p');
  subtitle.textContent = `Your first day at Monash University - ${formatMinutes(state.timeMinutes)}`;
  subtitle.style.cssText = `
    font-size: 18px;
    margin: 0;
    color: #999;
  `;

  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // Main content grid
  const contentGrid = document.createElement('div');
  contentGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    margin-bottom: 20px;
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
    createResourceRow('💵 Money', `$${state.money}`, state.money < 10 ? '#ff6b6b' : '#4ac94a'),
    createResourceRow('🍔 Hunger', `${state.hunger}/${state.stats.H}`, state.hunger < 5 ? '#ff6b6b' : '#4ac94a'),
    createResourceRow('⏰ Time Ended', formatMinutes(state.timeMinutes), '#93c5fd'),
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
    padding: 16px 48px;
    background: #4ac94a;
    color: #000;
    border: none;
    border-radius: 12px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 30px;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(74, 201, 74, 0.4);
  `;

  continueBtn.addEventListener('mouseenter', () => {
    continueBtn.style.transform = 'scale(1.05)';
    continueBtn.style.boxShadow = '0 6px 30px rgba(74, 201, 74, 0.6)';
  });

  continueBtn.addEventListener('mouseleave', () => {
    continueBtn.style.transform = 'scale(1)';
    continueBtn.style.boxShadow = '0 4px 20px rgba(74, 201, 74, 0.4)';
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
    background: rgba(42, 42, 42, 0.8);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #333;
    backdrop-filter: blur(10px);
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = title;
  cardTitle.style.cssText = `
    margin: 0 0 16px 0;
    color: #4ac94a;
    font-size: 20px;
    border-bottom: 2px solid #333;
    padding-bottom: 8px;
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
    margin-bottom: 12px;
    color: #ddd;
    font-size: 16px;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueContainer = document.createElement('div');
  valueContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

  const valueSpan = document.createElement('span');
  valueSpan.textContent = `${value}/10`;
  valueSpan.style.cssText = `
    font-weight: bold;
    color: ${value >= 7 ? '#4ac94a' : value >= 4 ? '#fbbf24' : '#ff6b6b'};
  `;

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 100px;
    height: 8px;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
  `;

  const progress = document.createElement('div');
  progress.style.cssText = `
    width: ${value * 10}%;
    height: 100%;
    background: ${value >= 7 ? '#4ac94a' : value >= 4 ? '#fbbf24' : '#ff6b6b'};
    transition: width 0.3s ease;
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
    margin-bottom: 12px;
    color: #ddd;
    font-size: 16px;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.textContent = value;
  valueSpan.style.cssText = `
    font-weight: bold;
    color: ${color};
  `;

  row.appendChild(labelSpan);
  row.appendChild(valueSpan);

  return row;
}

function createRapportCard(state: any): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: rgba(42, 42, 42, 0.8);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #333;
    backdrop-filter: blur(10px);
    width: 100%;
    margin-bottom: 20px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '❤️ Team Rapport';
  cardTitle.style.cssText = `
    margin: 0 0 16px 0;
    color: #4ac94a;
    font-size: 20px;
    border-bottom: 2px solid #333;
    padding-bottom: 8px;
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
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(26, 26, 26, 0.5);
      border-radius: 8px;
    `;

    const npcInfo = document.createElement('div');
    npcInfo.style.cssText = 'display: flex; flex-direction: column;';

    const npcName = document.createElement('span');
    npcName.textContent = npc.name;
    npcName.style.cssText = `
      font-weight: bold;
      color: #fff;
      font-size: 16px;
    `;

    const npcDesc = document.createElement('span');
    npcDesc.textContent = `${npc.focus.charAt(0).toUpperCase() + npc.focus.slice(1)} - ${npc.majorAffinity.toUpperCase()}`;
    npcDesc.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    `;

    npcInfo.appendChild(npcName);
    npcInfo.appendChild(npcDesc);

    const rapportContainer = document.createElement('div');
    rapportContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    const rapportBar = document.createElement('div');
    rapportBar.style.cssText = `
      width: 150px;
      height: 10px;
      background: #1a1a1a;
      border-radius: 5px;
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
      background: ${rapport >= 0 ? 'linear-gradient(90deg, #4ac94a 0%, #2d5016 100%)' : 'linear-gradient(90deg, #ff6b6b 0%, #8b0000 100%)'};
      transition: width 0.3s ease;
    `;

    // Center line marker
    const centerLine = document.createElement('div');
    centerLine.style.cssText = `
      position: absolute;
      left: ${(3 / 8) * 100}%;
      top: 0;
      width: 2px;
      height: 100%;
      background: #666;
    `;

    rapportBar.appendChild(rapportFill);
    rapportBar.appendChild(centerLine);

    const rapportValue = document.createElement('span');
    rapportValue.textContent = rapport > 0 ? `+${rapport}` : `${rapport}`;
    rapportValue.style.cssText = `
      font-weight: bold;
      font-size: 18px;
      min-width: 40px;
      text-align: center;
      color: ${rapport >= 0 ? '#4ac94a' : '#ff6b6b'};
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
    background: rgba(42, 42, 42, 0.8);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #333;
    backdrop-filter: blur(10px);
    width: 100%;
    margin-bottom: 20px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '📝 Activity Log';
  cardTitle.style.cssText = `
    margin: 0 0 16px 0;
    color: #4ac94a;
    font-size: 20px;
    border-bottom: 2px solid #333;
    padding-bottom: 8px;
  `;

  card.appendChild(cardTitle);

  if (state.activityLog.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No activities logged today.';
    emptyMsg.style.cssText = 'color: #666; font-style: italic;';
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
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(26, 26, 26, 0.5);
      border-radius: 8px;
      border-left: 3px solid #4ac94a;
    `;

    const timeAndSummary = document.createElement('div');
    timeAndSummary.style.cssText = 'margin-bottom: 8px;';

    const time = document.createElement('span');
    time.textContent = entry.time;
    time.style.cssText = `
      color: #4ac94a;
      font-weight: bold;
      margin-right: 12px;
    `;

    const summary = document.createElement('span');
    summary.textContent = entry.summary;
    summary.style.cssText = 'color: #ddd;';

    timeAndSummary.appendChild(time);
    timeAndSummary.appendChild(summary);

    logEntry.appendChild(timeAndSummary);

    // Show deltas if available
    if (entry.deltas) {
      const deltasContainer = document.createElement('div');
      deltasContainer.style.cssText = `
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 8px;
        font-size: 12px;
      `;

      const deltas = [];

      if (entry.deltas.time) {
        deltas.push({ icon: '⏰', value: `${entry.deltas.time > 0 ? '+' : ''}${entry.deltas.time} min`, color: '#93c5fd' });
      }
      if (entry.deltas.money) {
        deltas.push({ icon: '💰', value: `${entry.deltas.money > 0 ? '+' : ''}$${entry.deltas.money}`, color: entry.deltas.money > 0 ? '#4ac94a' : '#ff6b6b' });
      }
      if (entry.deltas.hunger) {
        deltas.push({ icon: '🍔', value: `${entry.deltas.hunger > 0 ? '+' : ''}${entry.deltas.hunger}`, color: entry.deltas.hunger > 0 ? '#4ac94a' : '#ff6b6b' });
      }
      if (entry.deltas.stats) {
        Object.entries(entry.deltas.stats).forEach(([stat, value]: [string, any]) => {
          deltas.push({ icon: '📊', value: `${stat} ${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#4ac94a' : '#ff6b6b' });
        });
      }
      if (entry.deltas.rapport) {
        Object.entries(entry.deltas.rapport).forEach(([npc, value]: [string, any]) => {
          const npcName = NPC_DEFINITIONS[npc as NpcId]?.name || npc;
          deltas.push({ icon: '❤️', value: `${npcName} ${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#4ac94a' : '#ff6b6b' });
        });
      }

      deltas.forEach((delta) => {
        const deltaSpan = document.createElement('span');
        deltaSpan.textContent = `${delta.icon} ${delta.value}`;
        deltaSpan.style.cssText = `
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          color: ${delta.color};
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
    background: rgba(58, 26, 26, 0.8);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #ff6b6b;
    backdrop-filter: blur(10px);
    width: 100%;
    margin-bottom: 20px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '⚠️ Warnings & Alerts';
  cardTitle.style.cssText = `
    margin: 0 0 16px 0;
    color: #ff6b6b;
    font-size: 20px;
    border-bottom: 2px solid rgba(255, 107, 107, 0.3);
    padding-bottom: 8px;
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
    color: #93c5fd;
    font-size: 16px;
    line-height: 1.8;
  `;

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(message);

  return card;
}

