import type { GameStore } from '../core/store';
import { formatMinutes } from '../core/gameState';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { NpcId } from '../core/types';

// Grading system based on overall performance
type MonashGrade = 'N' | 'P' | 'C' | 'D' | 'HD';

interface GradeResult {
  grade: MonashGrade;
  score: number;
  feedback: string;
}

function calculateDayGrade(state: any): GradeResult {
  let score = 0;
  
  // MONASH Stats (max 50 points - 10 per stat)
  score += (state.stats.M * 2);
  score += (state.stats.O * 2);
  score += (state.stats.N * 2);
  score += (state.stats.A * 2);
  score += (state.stats.S * 2);
  
  // Rapport average (max 15 points)
  const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];
  const rapportTotal = npcIds.reduce((sum, id) => sum + state.rapport[id], 0);
  const rapportAvg = rapportTotal / npcIds.length;
  // Scale from -3 to +5 range to 0-15 points
  const rapportScore = Math.max(0, Math.min(15, ((rapportAvg + 3) / 8) * 15));
  score += rapportScore;
  
  // Resource management (max 10 points)
  const moneyScore = Math.min(7, (state.money / 50) * 7); // Up to $50
  const hungerScore = Math.min(3, state.hunger / 3.33); // 10 hunger = 3 points
  score += moneyScore + hungerScore;
  
  // Time efficiency (max 25 points) - increased from 10
  // Finishing before 10 PM (15 hours * 60 = 900 minutes) is good
  const timeScore = Math.max(0, Math.min(25, ((900 - state.timeMinutes) / 60) * 2.5));
  score += timeScore;
  
  // Determine grade (out of 100 points)
  let grade: MonashGrade;
  let feedback: string;
  
  if (score >= 80) {
    grade = 'HD';
    feedback = 'Outstanding! You excelled in every aspect of your first day.';
  } else if (score >= 70) {
    grade = 'D';
    feedback = 'Excellent work! You demonstrated strong performance today.';
  } else if (score >= 60) {
    grade = 'C';
    feedback = 'Good effort! You met expectations for your first day.';
  } else if (score >= 50) {
    grade = 'P';
    feedback = 'Satisfactory. You passed, but there\'s room for improvement.';
  } else {
    grade = 'N';
    feedback = 'Needs improvement. Focus on building better habits tomorrow.';
  }
  
  return { grade, score: Math.round(score), feedback };
}

export const renderRecap = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const state = store.getState();
  const gradeResult = calculateDayGrade(state);

  const container = document.createElement('div');
  container.className = 'recap';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
    min-height: 100vh;
    background: #c9a876;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    margin-bottom: 20px;
    width: 100%;
    background: #8b6f47;
    padding: 16px;
    border: 3px solid #5a4a35;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement('h1');
  title.textContent = '📊 Day 1 Recap';
  title.style.cssText = `
    font-size: 18px;
    margin: 0 0 8px 0;
    color: #fbe9cf;
    font-family: 'Press Start 2P', monospace;
  `;

  const subtitle = document.createElement('p');
  subtitle.textContent = `${formatMinutes(state.timeMinutes)} - First Day Complete`;
  subtitle.style.cssText = `
    font-size: 10px;
    margin: 0;
    color: #d4a574;
    font-family: 'Press Start 2P', monospace;
  `;

  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);
  
  // Grade Card (prominent display)
  const gradeCard = createGradeCard(gradeResult);
  container.appendChild(gradeCard);

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
    createResourceRow('🍔 Hunger', `${state.hunger}/10`, state.hunger < 5 ? '#c97a7a' : '#6a9e6a'),
    createResourceRow('⏰ Finished', formatMinutes(state.timeMinutes), '#d4a574'),
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
    padding: 12px 32px;
    background: #6a9e6a;
    color: #fbe9cf;
    border: 3px solid #4a7a4a;
    border-radius: 0;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 20px;
    font-family: 'Press Start 2P', monospace;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    transition: all 0.1s;
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

function createGradeCard(gradeResult: GradeResult): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #8b6f47;
    border: 3px solid #5a4a35;
    border-radius: 0;
    padding: 20px;
    width: 100%;
    margin-bottom: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    text-align: center;
  `;

  const gradeLabel = document.createElement('div');
  gradeLabel.textContent = 'DAY 1 GRADE';
  gradeLabel.style.cssText = `
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: #d4a574;
    margin-bottom: 12px;
  `;

  const gradeDisplay = document.createElement('div');
  gradeDisplay.textContent = gradeResult.grade;
  gradeDisplay.style.cssText = `
    font-family: 'Press Start 2P', monospace;
    font-size: 48px;
    color: ${getGradeColor(gradeResult.grade)};
    margin-bottom: 12px;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  `;

  const scoreDisplay = document.createElement('div');
  scoreDisplay.textContent = `Score: ${gradeResult.score}/100`;
  scoreDisplay.style.cssText = `
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: #fbe9cf;
    margin-bottom: 12px;
  `;

  const feedback = document.createElement('div');
  feedback.textContent = gradeResult.feedback;
  feedback.style.cssText = `
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #fbe9cf;
    line-height: 1.8;
    max-width: 600px;
    margin: 0 auto;
  `;

  card.appendChild(gradeLabel);
  card.appendChild(gradeDisplay);
  card.appendChild(scoreDisplay);
  card.appendChild(feedback);

  return card;
}

function getGradeColor(grade: MonashGrade): string {
  switch (grade) {
    case 'HD': return '#6ee7b7';
    case 'D': return '#6a9e6a';
    case 'C': return '#d4a574';
    case 'P': return '#c97a5a';
    case 'N': return '#c97a7a';
  }
}

function createCard(title: string, content: HTMLElement[]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #8b6f47;
    border: 3px solid #5a4a35;
    border-radius: 0;
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = title;
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 2px solid #5a4a35;
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
    margin-bottom: 8px;
    color: #fbe9cf;
    font-size: 9px;
    font-family: 'Press Start 2P', monospace;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueContainer = document.createElement('div');
  valueContainer.style.cssText = 'display: flex; align-items: center; gap: 6px;';

  const valueSpan = document.createElement('span');
  valueSpan.textContent = `${value}/10`;
  valueSpan.style.cssText = `
    font-weight: bold;
    color: ${value >= 7 ? '#6a9e6a' : value >= 4 ? '#d4a574' : '#c97a7a'};
  `;

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 80px;
    height: 6px;
    background: #3a2817;
    border: 2px solid #5a4a35;
    overflow: hidden;
  `;

  const progress = document.createElement('div');
  progress.style.cssText = `
    width: ${value * 10}%;
    height: 100%;
    background: ${value >= 7 ? '#6a9e6a' : value >= 4 ? '#d4a574' : '#c97a7a'};
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
    color: ${color};
  `;

  row.appendChild(labelSpan);
  row.appendChild(valueSpan);

  return row;
}

function createRapportCard(state: any): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #8b6f47;
    border: 3px solid #5a4a35;
    border-radius: 0;
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '❤️ Team Rapport';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 2px solid #5a4a35;
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
      margin-bottom: 10px;
      padding: 10px;
      background: #6a5a3a;
      border: 2px solid #5a4a35;
    `;

    const npcInfo = document.createElement('div');
    npcInfo.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    const npcName = document.createElement('span');
    npcName.textContent = npc.name;
    npcName.style.cssText = `
      font-weight: bold;
      color: #fbe9cf;
      font-size: 10px;
      font-family: 'Press Start 2P', monospace;
    `;

    const npcDesc = document.createElement('span');
    npcDesc.textContent = `${npc.focus.charAt(0).toUpperCase() + npc.focus.slice(1)} • ${npc.majorAffinity.toUpperCase()}`;
    npcDesc.style.cssText = `
      font-size: 7px;
      color: #d4a574;
      font-family: 'Press Start 2P', monospace;
    `;

    npcInfo.appendChild(npcName);
    npcInfo.appendChild(npcDesc);

    const rapportContainer = document.createElement('div');
    rapportContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const rapportBar = document.createElement('div');
    rapportBar.style.cssText = `
      width: 120px;
      height: 8px;
      background: #3a2817;
      border: 2px solid #5a4a35;
      position: relative;
      overflow: hidden;
    `;

    // Calculate position on the bar (-3 to +5 scale)
    const rapportPercent = Math.max(0, Math.min(100, ((rapport + 3) / 8) * 100));

    const rapportFill = document.createElement('div');
    rapportFill.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${rapportPercent}%;
      height: 100%;
      background: ${rapport >= 0 ? '#6a9e6a' : '#c97a7a'};
    `;

    // Center line marker
    const centerLine = document.createElement('div');
    centerLine.style.cssText = `
      position: absolute;
      left: ${(3 / 8) * 100}%;
      top: 0;
      width: 2px;
      height: 100%;
      background: #fbe9cf;
    `;

    rapportBar.appendChild(rapportFill);
    rapportBar.appendChild(centerLine);

    const rapportValue = document.createElement('span');
    rapportValue.textContent = rapport > 0 ? `+${rapport}` : `${rapport}`;
    rapportValue.style.cssText = `
      font-weight: bold;
      font-size: 10px;
      min-width: 30px;
      text-align: center;
      color: ${rapport >= 0 ? '#6a9e6a' : '#c97a7a'};
      font-family: 'Press Start 2P', monospace;
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
    background: #8b6f47;
    border: 3px solid #5a4a35;
    border-radius: 0;
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '📝 Activity Log';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 2px solid #5a4a35;
    padding-bottom: 8px;
  `;

  card.appendChild(cardTitle);

  if (state.activityLog.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No activities logged.';
    emptyMsg.style.cssText = `
      color: #d4a574;
      font-style: italic;
      font-size: 9px;
      font-family: 'Press Start 2P', monospace;
    `;
    card.appendChild(emptyMsg);
    return card;
  }

  const logContainer = document.createElement('div');
  logContainer.style.cssText = `
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
  `;

  state.activityLog.forEach((entry: any) => {
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
      padding: 8px;
      margin-bottom: 6px;
      background: #6a5a3a;
      border-left: 3px solid #6a9e6a;
      border: 2px solid #5a4a35;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;

    const timeAndSummary = document.createElement('div');
    timeAndSummary.style.cssText = 'margin-bottom: 6px;';

    const time = document.createElement('span');
    time.textContent = entry.time;
    time.style.cssText = `
      color: #6a9e6a;
      font-weight: bold;
      margin-right: 8px;
      font-size: 8px;
      font-family: 'Press Start 2P', monospace;
    `;

    const summary = document.createElement('span');
    summary.textContent = entry.summary;
    summary.style.cssText = `
      color: #fbe9cf;
      font-size: 8px;
      font-family: 'Press Start 2P', monospace;
      line-height: 1.6;
      word-wrap: break-word;
    `;

    timeAndSummary.appendChild(time);
    timeAndSummary.appendChild(summary);

    logEntry.appendChild(timeAndSummary);

    // Show deltas if available
    if (entry.deltas) {
      const deltasContainer = document.createElement('div');
      deltasContainer.style.cssText = `
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 7px;
        font-family: 'Press Start 2P', monospace;
      `;

      const deltas = [];

      if (entry.deltas.time) {
        deltas.push({ icon: '⏰', value: `${entry.deltas.time > 0 ? '+' : ''}${entry.deltas.time}m`, color: '#d4a574' });
      }
      if (entry.deltas.money) {
        deltas.push({ icon: '💰', value: `${entry.deltas.money > 0 ? '+' : ''}$${entry.deltas.money}`, color: entry.deltas.money > 0 ? '#6a9e6a' : '#c97a7a' });
      }
      if (entry.deltas.hunger) {
        deltas.push({ icon: '🍔', value: `${entry.deltas.hunger > 0 ? '+' : ''}${entry.deltas.hunger}`, color: entry.deltas.hunger > 0 ? '#6a9e6a' : '#c97a7a' });
      }
      if (entry.deltas.stats) {
        Object.entries(entry.deltas.stats).forEach(([stat, value]: [string, any]) => {
          deltas.push({ icon: '📊', value: `${stat}${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#6a9e6a' : '#c97a7a' });
        });
      }
      if (entry.deltas.rapport) {
        Object.entries(entry.deltas.rapport).forEach(([npc, value]: [string, any]) => {
          const npcName = NPC_DEFINITIONS[npc as NpcId]?.name?.split(' ')[0] || npc;
          deltas.push({ icon: '❤️', value: `${npcName}${value > 0 ? '+' : ''}${value}`, color: value > 0 ? '#6a9e6a' : '#c97a7a' });
        });
      }

      deltas.forEach((delta) => {
        const deltaSpan = document.createElement('span');
        deltaSpan.textContent = `${delta.icon}${delta.value}`;
        deltaSpan.style.cssText = `
          padding: 3px 6px;
          background: #3a2817;
          border: 1px solid #5a4a35;
          color: ${delta.color};
          white-space: nowrap;
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
    background: #8b4a4a;
    border: 3px solid #5a3535;
    border-radius: 0;
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
  `;

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = '⚠️ Warnings';
  cardTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 2px solid #5a3535;
    padding-bottom: 8px;
  `;

  card.appendChild(cardTitle);

  warnings.forEach((warning) => {
    const warningEl = document.createElement('div');
    warningEl.textContent = warning;
    warningEl.style.cssText = `
      padding: 8px;
      margin-bottom: 6px;
      background: #6a4a4a;
      border: 2px solid #5a3535;
      color: #fbe9cf;
      font-size: 7px;
      line-height: 1.6;
      font-family: 'Press Start 2P', monospace;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;
    card.appendChild(warningEl);
  });

  return card;
}

function createReminderCard(): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #6a7a9e;
    border: 3px solid #4a5a7a;
    border-radius: 0;
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    width: 100%;
    margin-bottom: 16px;
    text-align: center;
  `;

  const icon = document.createElement('div');
  icon.textContent = '📚';
  icon.style.cssText = 'font-size: 32px; margin-bottom: 8px;';

  const title = document.createElement('h3');
  title.textContent = 'Tomorrow: Day 2';
  title.style.cssText = `
    margin: 0 0 8px 0;
    color: #fbe9cf;
    font-size: 11px;
    font-family: 'Press Start 2P', monospace;
  `;

  const message = document.createElement('p');
  message.innerHTML = `Assignment: Digital Privacy<br>vs. Convenience<br>Due: Day 7, 11:59 PM`;
  message.style.cssText = `
    margin: 0;
    color: #fbe9cf;
    font-size: 8px;
    line-height: 1.8;
    font-family: 'Press Start 2P', monospace;
  `;

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(message);

  return card;
}

