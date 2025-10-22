import type { GameStore } from '../core/store';
import { PHONE_CONTENT } from '../data/phone';
import { applyDeltas, logActivity, formatMinutes } from '../core/gameState';
// import type { NpcId } from '../core/types';

type PhoneTutorialApp = 'texts' | 'map' | 'notes' | 'social' | 'inventory';

export const renderMorningPhone = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const state = store.getState();
  let currentApp: PhoneTutorialApp | 'home' = 'home';
  
  // Track which apps have been opened (for tutorial progression)
  const appsOpened = state.phoneAppsOpened || {
    texts: false,
    map: false,
    notes: false,
    social: false,
    inventory: false,
  };

  const container = document.createElement('div');
  container.className = 'phone';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    min-height: 600px;
  `;

  const phoneDevice = document.createElement('div');
  phoneDevice.className = 'phone__device';
  phoneDevice.style.cssText = `
    width: 375px;
    height: 667px;
    background: #000;
    border-radius: 36px;
    padding: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    position: relative;
  `;

  const phoneScreen = document.createElement('div');
  phoneScreen.className = 'phone__screen';
  phoneScreen.style.cssText = `
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const statusBar = document.createElement('div');
  statusBar.className = 'phone__status-bar';
  statusBar.style.cssText = `
    height: 44px;
    background: #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    color: #fff;
    font-size: 14px;
  `;

  const timeStr = formatMinutes(state.timeMinutes);
  
  statusBar.innerHTML = `
    <span>${timeStr}</span>
    <span>📶 💯</span>
  `;

  const appContent = document.createElement('div');
  appContent.className = 'phone__content';
  appContent.style.cssText = `
    flex: 1;
    background: #1a1a1a;
    overflow-y: auto;
    padding: 16px;
  `;

  phoneScreen.appendChild(statusBar);
  phoneScreen.appendChild(appContent);
  phoneDevice.appendChild(phoneScreen);
  container.appendChild(phoneDevice);
  root.appendChild(container);

  const renderHomeScreen = () => {
    appContent.innerHTML = '';
    appContent.style.cssText = `
      flex: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 32px 16px;
      align-content: start;
      overflow-y: auto;
    `;

    const tutorialMessage = document.createElement('div');
    tutorialMessage.style.cssText = `
      grid-column: 1 / -1;
      background: rgba(0, 0, 0, 0.6);
      padding: 12px;
      border-radius: 8px;
      color: white;
      text-align: center;
      font-size: 13px;
      margin-bottom: 10px;
    `;
    tutorialMessage.innerHTML = `
      <strong>📱 Phone Tutorial</strong><br>
      Open each app to learn the basics!
    `;
    appContent.appendChild(tutorialMessage);

    const apps = [
      { id: 'texts', name: 'Texts', icon: '💬', color: '#25D366', opened: appsOpened.texts },
      { id: 'map', name: 'Map', icon: '🗺️', color: '#34d399', opened: appsOpened.map },
      { id: 'notes', name: 'Notes', icon: '📝', color: '#fbbf24', opened: appsOpened.notes },
      { id: 'social', name: 'Social Feed', icon: '📱', color: '#e91e63', opened: appsOpened.social },
      { id: 'inventory', name: 'Inventory', icon: '🎒', color: '#9c27b0', opened: appsOpened.inventory },
      { id: 'close', name: 'Lock Phone', icon: '🔒', color: '#ef4444', opened: true },
    ];

    apps.forEach((app) => {
      const appIcon = document.createElement('button');
      appIcon.className = 'phone__app-icon';
      appIcon.style.cssText = `
        background: ${app.color};
        border: none;
        border-radius: 16px;
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        min-height: 80px;
        position: relative;
        opacity: ${app.id === 'close' || app.opened ? '1' : '0.7'};
      `;

      if (!app.opened && app.id !== 'close') {
        const badge = document.createElement('div');
        badge.textContent = '!';
        badge.style.cssText = `
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff4444;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          animation: pulse 2s ease-in-out infinite;
        `;
        appIcon.appendChild(badge);
      }

      appIcon.innerHTML += `
        <div style="font-size: 28px;">${app.icon}</div>
        <div style="font-size: 10px; color: white; font-weight: 500; text-align: center;">${app.name}</div>
      `;

      appIcon.addEventListener('mouseenter', () => {
        appIcon.style.transform = 'scale(1.05)';
      });

      appIcon.addEventListener('mouseleave', () => {
        appIcon.style.transform = 'scale(1)';
      });

      appIcon.addEventListener('click', () => {
        if (app.id === 'close') {
          // Check if all apps have been opened
          const allOpened = Object.values(appsOpened).every(v => v);
          if (allOpened) {
            // Tutorial complete - go to morning commute
            store.setState((prev) => ({ ...prev, currentScene: 'morning-commute' }));
          } else {
            alert('Please open all apps first to complete the tutorial!');
          }
        } else {
          currentApp = app.id as PhoneTutorialApp;
          renderApp(currentApp);
        }
      });

      appContent.appendChild(appIcon);
    });
  };

  const renderApp = (app: PhoneTutorialApp) => {
    // Mark app as opened
    appsOpened[app] = true;
    store.setState((prev) => ({
      ...prev,
      phoneAppsOpened: appsOpened,
    }));

    appContent.innerHTML = '';
    appContent.style.cssText = `
      flex: 1;
      background: #1a1a1a;
      overflow-y: auto;
      padding: 0;
    `;

    // Back button
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2a2a2a;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #333;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      background: none;
      border: none;
      color: #4ac94a;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
    `;
    backBtn.addEventListener('click', () => renderHomeScreen());

    const appTitle = document.createElement('h2');
    appTitle.style.cssText = 'color: white; font-size: 18px; margin: 0;';

    header.appendChild(backBtn);
    header.appendChild(appTitle);
    appContent.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'padding: 16px; color: white;';

    switch (app) {
      case 'texts':
        appTitle.textContent = 'WhatsApp - Group Chat';
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #25D366;">📱 Assignment Group</h3>
            ${PHONE_CONTENT.groupChatMessages.map(msg => `
              <div style="background: #1a1a1a; padding: 10px; margin-bottom: 8px; border-radius: 6px; font-size: 14px;">
                ${msg}
              </div>
            `).join('')}
          </div>
          
          <div style="background: #1e3a5f; border-radius: 8px; padding: 12px; border-left: 3px solid #3b82f6;">
            <p style="margin: 0; font-size: 13px; color: #93c5fd;">
              💡 You can text your teammates later in the evening to build rapport!
            </p>
          </div>
        `;
        break;

      case 'map':
        appTitle.textContent = 'Maps - Transport Overview';
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #34d399;">🗺️ Transport Options</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #333;">
                  <th style="text-align: left; padding: 8px; color: #4ac94a;">Mode</th>
                  <th style="text-align: left; padding: 8px; color: #4ac94a;">Time</th>
                  <th style="text-align: left; padding: 8px; color: #4ac94a;">Cost</th>
                  <th style="text-align: left; padding: 8px; color: #4ac94a;">Hunger</th>
                </tr>
              </thead>
              <tbody>
                ${PHONE_CONTENT.mapRows.map(row => `
                  <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 8px;">${row.mode}</td>
                    <td style="padding: 8px;">${row.time}</td>
                    <td style="padding: 8px;">${row.cost}</td>
                    <td style="padding: 8px;">${row.hunger}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="background: #3a2a1a; border-radius: 8px; padding: 12px; border-left: 3px solid #fbbf24;">
            <p style="margin: 0; font-size: 13px; color: #fbbf24;">
              💡 Insufficient funds auto-select Walk for evening commute.
            </p>
          </div>
        `;
        break;

      case 'notes':
        appTitle.textContent = 'Notes - Tasks & Log';
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #fbbf24;">📝 Today's Notes</h3>
            <ul style="margin: 8px 0; padding-left: 20px; color: #ddd;">
              ${PHONE_CONTENT.notes.map(note => `<li style="margin-bottom: 8px;">${note}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #fbbf24;">📋 Activity Log</h3>
            ${state.activityLog.length > 0 
              ? state.activityLog.map(entry => `
                  <div style="border-bottom: 1px solid #333; padding: 8px 0; font-size: 14px;">
                    <div style="color: #4ac94a;">${entry.time} - ${entry.summary}</div>
                  </div>
                `).join('')
              : '<p style="color: #666; font-style: italic;">No activities yet. Your journey is just beginning!</p>'
            }
          </div>
        `;
        break;

      case 'social':
        appTitle.textContent = 'Social Feed';
        
        const hasUsedDoomscroll = state.flags.has('doomscroll-used');
        
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #e91e63;">📱 Instagram Feed</h3>
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 48px; margin-bottom: 16px;">📸</div>
              <p style="color: #999; margin-bottom: 20px;">
                Endless scrolling awaits...
              </p>
              
              ${!hasUsedDoomscroll ? `
                <button id="doomscroll-btn" style="
                  width: 100%;
                  padding: 14px;
                  background: linear-gradient(135deg, #e91e63, #9c27b0);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: bold;
                  cursor: pointer;
                  transition: all 0.2s;
                ">
                  Doomscroll Now (+1 Aura, -30 min)
                </button>
                <p style="color: #666; font-size: 12px; margin-top: 8px;">Can only be used once per day</p>
              ` : `
                <div style="background: #3a1a1a; padding: 12px; border-radius: 6px; color: #ff6b6b;">
                  ✓ You've already doomscrolled today
                </div>
              `}
            </div>
          </div>
          
          <div style="background: #1e3a5f; border-radius: 8px; padding: 12px; border-left: 3px solid #3b82f6;">
            <p style="margin: 0; font-size: 13px; color: #93c5fd;">
              💡 Doomscrolling boosts your aura but costs time. Use it wisely!
            </p>
          </div>
        `;

        // Add doomscroll handler
        setTimeout(() => {
          const doomscrollBtn = document.getElementById('doomscroll-btn');
          if (doomscrollBtn) {
            doomscrollBtn.addEventListener('click', () => {
              const deltas = {
                stats: { A: 1 },
                time: 30,
              };
              
              let nextState = applyDeltas(state, deltas);
              nextState.flags.add('doomscroll-used');
              nextState = logActivity(nextState, {
                segment: 'morning-phone',
                choiceId: 'doomscroll',
                summary: 'Doomscrolled through social media',
                deltas,
              });
              
              store.setState(nextState);
              renderApp('social'); // Re-render to show used state
            });
          }
        }, 0);
        break;

      case 'inventory':
        appTitle.textContent = 'Inventory';
        const major = state.major;
        const majorName = major.charAt(0).toUpperCase() + major.slice(1);
        
        // Get memory flags
        const memoryFlags = Array.from(state.flags).filter(flag => !flag.startsWith('doomscroll'));
        
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #9c27b0;">👤 Player Info</h3>
            <div style="font-size: 14px;">
              <div style="margin: 8px 0;"><strong>Name:</strong> ${state.playerName || 'Student'}</div>
              <div style="margin: 8px 0;"><strong>Major:</strong> ${majorName}</div>
              <div style="margin: 8px 0;"><strong>Special Item:</strong> ${state.specialItem}</div>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #9c27b0;">💰 Resources</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 8px 0;">Money: $${state.money}</div>
              <div style="margin: 8px 0;">Hunger: ${state.hunger}/${state.stats.H}</div>
              <div style="margin: 8px 0;">Time: ${timeStr}</div>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #9c27b0;">📊 MONASH Stats</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 6px 0;">M (Mobility): ${state.stats.M}/10</div>
              <div style="margin: 6px 0;">O (Organisation): ${state.stats.O}/10</div>
              <div style="margin: 6px 0;">N (Networking): ${state.stats.N}/10</div>
              <div style="margin: 6px 0;">A (Aura): ${state.stats.A}/10</div>
              <div style="margin: 6px 0;">S (Skills): ${state.stats.S}/10</div>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #9c27b0;">🏆 Memory Flags</h3>
            ${memoryFlags.length > 0 
              ? memoryFlags.map(flag => `
                  <div style="background: #1a1a1a; padding: 8px; margin-bottom: 6px; border-radius: 4px; font-size: 13px;">
                    ✓ ${flag}
                  </div>
                `).join('')
              : '<p style="color: #666; font-style: italic;">No special memories unlocked yet.</p>'
            }
          </div>
        `;
        break;
    }

    appContent.appendChild(content);
  };

  renderHomeScreen();
};


