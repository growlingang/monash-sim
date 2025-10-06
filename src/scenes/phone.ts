import type { GameStore } from '../core/store';
import { transitionScene } from '../core/gameState';

type PhoneApp = 'home' | 'maps' | 'notes' | 'messages' | 'settings';

export const renderPhone = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  let currentApp: PhoneApp = 'home';

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

  const state = store.getState();
  const timeStr = `${7 + Math.floor(state.timeMinutes / 60)}:${String(state.timeMinutes % 60).padStart(2, '0')}`;
  
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
      gap: 24px;
      padding: 32px 16px;
      align-content: start;
    `;

    const apps = [
      { id: 'maps', name: 'Maps', icon: '🗺️', color: '#34d399' },
      { id: 'notes', name: 'Notes', icon: '📝', color: '#fbbf24' },
      { id: 'messages', name: 'WhatsApp', icon: '💬', color: '#25D366' },
      { id: 'settings', name: 'Settings', icon: '⚙️', color: '#6b7280' },
      { id: 'close', name: 'Lock Phone', icon: '🔒', color: '#ef4444' },
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
      `;

      appIcon.innerHTML = `
        <div style="font-size: 32px;">${app.icon}</div>
        <div style="font-size: 11px; color: white; font-weight: 500;">${app.name}</div>
      `;

      appIcon.addEventListener('mouseenter', () => {
        appIcon.style.transform = 'scale(1.05)';
      });

      appIcon.addEventListener('mouseleave', () => {
        appIcon.style.transform = 'scale(1)';
      });

      appIcon.addEventListener('click', () => {
        if (app.id === 'close') {
          store.setState((prev) => transitionScene(prev, 'morning-commute'));
        } else {
          currentApp = app.id as PhoneApp;
          renderApp(currentApp);
        }
      });

      appContent.appendChild(appIcon);
    });
  };

  const renderApp = (app: PhoneApp) => {
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
      case 'maps':
        appTitle.textContent = 'Maps - Transport';
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #4ac94a;">🚶 Walk</h3>
            <p style="margin: 8px 0; color: #999;">Free • ~45 min • Medium difficulty</p>
            <p style="margin: 0; font-size: 14px;">Crossy-road style minigame. Your mobility stat affects traffic density.</p>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #4ac94a;">🚌 Bus/Tram</h3>
            <p style="margin: 8px 0; color: #999;">$5 • ~35 min • Easy</p>
            <p style="margin: 0; font-size: 14px;">Balance minigame. Your aura stat affects stability. Bus may arrive late (random).</p>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #4ac94a;">🚗 Drive</h3>
            <p style="margin: 8px 0; color: #999;">$12 • ~30 min • Hard</p>
            <p style="margin: 0; font-size: 14px;">Two-phase: traffic dodging + parking. Organisation/Aura affects difficulty.</p>
          </div>
          
          <div style="background: #3a2a1a; border-radius: 8px; padding: 12px; margin-top: 16px; border-left: 3px solid #fbbf24;">
            <p style="margin: 0; font-size: 13px; color: #fbbf24;">💡 Tip: Lock your phone to begin your morning commute!</p>
          </div>
        `;
        break;

      case 'notes':
        appTitle.textContent = 'Notes - Tasks';
        const activityLog = state.activityLog;
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #fbbf24;">📋 Day 1 Tasks</h3>
            <ul style="margin: 8px 0; padding-left: 20px; color: #999;">
              <li>Morning Commute to Campus</li>
              <li>Explore Campus</li>
              <li>Meet Group Members</li>
              <li>Assignment Briefing</li>
              <li>Evening Activities</li>
            </ul>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #fbbf24;">📝 Activity Log</h3>
            ${activityLog.length > 0 
              ? activityLog.map(entry => `
                  <div style="border-bottom: 1px solid #333; padding: 8px 0; font-size: 14px;">
                    <div style="color: #4ac94a;">${entry.time} - ${entry.summary}</div>
                  </div>
                `).join('')
              : '<p style="color: #666; font-style: italic;">No activities yet. Start your day!</p>'
            }
          </div>
        `;
        break;

      case 'messages':
        appTitle.textContent = 'WhatsApp';
        content.innerHTML = `
          <div style="text-align: center; padding: 40px 16px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
            <p>No messages yet</p>
            <p style="font-size: 14px; margin-top: 8px;">You'll receive messages from your group members later today!</p>
          </div>
        `;
        break;

      case 'settings':
        appTitle.textContent = 'Settings';
        const major = state.major;
        const majorName = major.charAt(0).toUpperCase() + major.slice(1);
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">👤 Player Info</h3>
            <p style="margin: 8px 0;"><strong>Major:</strong> ${majorName}</p>
            <p style="margin: 8px 0;"><strong>Special Item:</strong> ${state.specialItem}</p>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">📊 MONASH Stats</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 4px 0;">M (Mobility): ${state.stats.M}/10</div>
              <div style="margin: 4px 0;">O (Organisation): ${state.stats.O}/10</div>
              <div style="margin: 4px 0;">N (Networking): ${state.stats.N}/10</div>
              <div style="margin: 4px 0;">A (Aura): ${state.stats.A}/10</div>
              <div style="margin: 4px 0;">S (Skills): ${state.stats.S}/10</div>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">💰 Resources</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 4px 0;">Money: $${state.money}</div>
              <div style="margin: 4px 0;">Hunger: ${state.hunger}/10</div>
              <div style="margin: 4px 0;">Time: ${timeStr}</div>
            </div>
          </div>
        `;
        break;
    }

    appContent.appendChild(content);
  };

  renderHomeScreen();
};
