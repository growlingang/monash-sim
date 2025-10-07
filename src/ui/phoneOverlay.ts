import type { GameStore } from '../core/store';
import { getSaveMetadata, saveGame } from '../utils/saveSystem';

type PhoneApp = 'home' | 'maps' | 'notes' | 'messages' | 'save' | 'settings';

let overlayContainer: HTMLElement | null = null;
let isPhoneOpen = false;

export const initPhoneOverlay = (store: GameStore) => {
  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.className = 'phone-overlay';
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
  `;

  document.body.appendChild(overlayContainer);

  // Listen for 'P' key to toggle phone
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') {
      togglePhone(store);
    }
  });
};

export const togglePhone = (store: GameStore) => {
  if (!overlayContainer) return;

  isPhoneOpen = !isPhoneOpen;

  if (isPhoneOpen) {
    openPhone(store);
  } else {
    closePhone();
  }
};

export const openPhone = (store: GameStore) => {
  if (!overlayContainer) return;

  isPhoneOpen = true;
  overlayContainer.style.display = 'flex';
  renderPhoneContent(store);
};

export const closePhone = () => {
  if (!overlayContainer) return;

  isPhoneOpen = false;
  overlayContainer.style.display = 'none';
  overlayContainer.innerHTML = '';
};

const renderPhoneContent = (store: GameStore) => {
  if (!overlayContainer) return;

  overlayContainer.innerHTML = '';

  let currentApp: PhoneApp = 'home';

  const phoneDevice = document.createElement('div');
  phoneDevice.className = 'phone__device';
  phoneDevice.style.cssText = `
    width: 375px;
    height: 667px;
    background: #000;
    border-radius: 36px;
    padding: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
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
  overlayContainer.appendChild(phoneDevice);

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
      { id: 'save', name: 'Save', icon: '💾', color: '#60a5fa' },
      { id: 'settings', name: 'Settings', icon: '⚙️', color: '#6b7280' },
      { id: 'close', name: 'Close', icon: '❌', color: '#ef4444' },
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
          closePhone();
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

    const currentState = store.getState();

    switch (app) {
      case 'maps':
        const isEveningCommute = currentState.currentScene === 'evening-commute';
        appTitle.textContent = isEveningCommute ? 'Maps - Evening Transport' : 'Maps - Morning Transport';
        
        if (isEveningCommute) {
          // Evening commute - show transport options
          content.innerHTML = `
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚶 Walk Home</h3>
              <p style="margin: 8px 0; color: #999;">Free • ~45 min • Medium difficulty</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Crossy-road style minigame. Your mobility stat affects traffic density.</p>
              <button id="walk-btn" style="
                width: 100%;
                padding: 12px;
                background: #4ac94a;
                border: none;
                border-radius: 6px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
              ">Choose Walk</button>
            </div>
            
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚌 Bus/Tram Home</h3>
              <p style="margin: 8px 0; color: #999;">$5 • ~35 min • Easy</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Balance minigame. Your aura stat affects stability.</p>
              <button id="bus-btn" style="
                width: 100%;
                padding: 12px;
                background: ${currentState.money >= 5 ? '#4ac94a' : '#666'};
                border: none;
                border-radius: 6px;
                color: ${currentState.money >= 5 ? '#000' : '#999'};
                font-weight: bold;
                cursor: ${currentState.money >= 5 ? 'pointer' : 'not-allowed'};
                font-size: 14px;
              ">${currentState.money >= 5 ? 'Choose Bus' : 'Insufficient Funds ($5)'}</button>
            </div>
            
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚗 Drive Home</h3>
              <p style="margin: 8px 0; color: #999;">$12 • ~30 min • Hard</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Two-phase: traffic dodging + parking. Organisation/Aura affects difficulty.</p>
              <button id="drive-btn" style="
                width: 100%;
                padding: 12px;
                background: ${currentState.money >= 12 ? '#4ac94a' : '#666'};
                border: none;
                border-radius: 6px;
                color: ${currentState.money >= 12 ? '#000' : '#999'};
                font-weight: bold;
                cursor: ${currentState.money >= 12 ? 'pointer' : 'not-allowed'};
                font-size: 14px;
              ">${currentState.money >= 12 ? 'Choose Drive' : 'Insufficient Funds ($12)'}</button>
            </div>
            
            <div style="background: #3a2a1a; border-radius: 8px; padding: 12px; margin-top: 16px; border-left: 3px solid #fbbf24;">
              <p style="margin: 0; font-size: 13px; color: #fbbf24;">💡 Tip: Select your transport, then close the phone to begin!</p>
            </div>
          `;
          
          // Add event listeners for evening transport buttons
          setTimeout(() => {
            const walkBtn = document.getElementById('walk-btn');
            const busBtn = document.getElementById('bus-btn');
            const driveBtn = document.getElementById('drive-btn');
            
            if (walkBtn) {
              walkBtn.addEventListener('click', () => {
                (window as any).__selectedTransport = 'walk';
                closePhone();
                // Trigger scene refresh to launch minigame
                store.setState((prev) => ({ ...prev }));
              });
            }
            
            if (busBtn && currentState.money >= 5) {
              busBtn.addEventListener('click', () => {
                (window as any).__selectedTransport = 'bus';
                closePhone();
                // Trigger scene refresh to launch minigame
                store.setState((prev) => ({ ...prev }));
              });
            }
            
            if (driveBtn && currentState.money >= 12) {
              driveBtn.addEventListener('click', () => {
                (window as any).__selectedTransport = 'drive';
                closePhone();
                // Trigger scene refresh to launch minigame
                store.setState((prev) => ({ ...prev }));
              });
            }
          }, 0);
        } else {
          // Morning commute - show transport options
          content.innerHTML = `
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚶 Walk</h3>
              <p style="margin: 8px 0; color: #999;">Free • ~45 min • Medium difficulty</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Crossy-road style minigame. Your mobility stat affects traffic density.</p>
              <button id="walk-btn" style="
                width: 100%;
                padding: 12px;
                background: #4ac94a;
                border: none;
                border-radius: 6px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
              ">Start Walking Commute</button>
            </div>
            
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚌 Bus/Tram</h3>
              <p style="margin: 8px 0; color: #999;">$5 • ~35 min • Easy</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Balance minigame. Your aura stat affects stability. Bus may arrive late (random).</p>
              <button id="bus-btn" style="
                width: 100%;
                padding: 12px;
                background: ${currentState.money >= 5 ? '#4ac94a' : '#666'};
                border: none;
                border-radius: 6px;
                color: ${currentState.money >= 5 ? '#000' : '#999'};
                font-weight: bold;
                cursor: ${currentState.money >= 5 ? 'pointer' : 'not-allowed'};
                font-size: 14px;
              ">${currentState.money >= 5 ? 'Start Bus Commute' : 'Insufficient Funds ($5)'}</button>
            </div>
            
            <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
              <h3 style="margin-top: 0; color: #4ac94a;">🚗 Drive</h3>
              <p style="margin: 8px 0; color: #999;">$12 • ~30 min • Hard</p>
              <p style="margin: 0 0 12px 0; font-size: 14px;">Two-phase: traffic dodging + parking. Organisation/Aura affects difficulty.</p>
              <button id="drive-btn" style="
                width: 100%;
                padding: 12px;
                background: ${currentState.money >= 12 ? '#4ac94a' : '#666'};
                border: none;
                border-radius: 6px;
                color: ${currentState.money >= 12 ? '#000' : '#999'};
                font-weight: bold;
                cursor: ${currentState.money >= 12 ? 'pointer' : 'not-allowed'};
                font-size: 14px;
              ">${currentState.money >= 12 ? 'Start Driving Commute' : 'Insufficient Funds ($12)'}</button>
            </div>
            
            <div style="background: #3a2a1a; border-radius: 8px; padding: 12px; margin-top: 16px; border-left: 3px solid #fbbf24;">
              <p style="margin: 0; font-size: 13px; color: #fbbf24;">💡 Tip: Choose your transport to begin your morning commute!</p>
            </div>
          `;
          
          // Add event listeners for morning transport buttons
          setTimeout(() => {
            const walkBtn = document.getElementById('walk-btn');
            const busBtn = document.getElementById('bus-btn');
            const driveBtn = document.getElementById('drive-btn');
            
            if (walkBtn) {
              walkBtn.addEventListener('click', () => {
                closePhone();
                store.setState((prev) => {
                  const next = { ...prev, currentScene: 'morning-commute' as const };
                  (window as any).__selectedTransport = 'walk';
                  return next;
                });
              });
            }
            
            if (busBtn && currentState.money >= 5) {
              busBtn.addEventListener('click', () => {
                closePhone();
                store.setState((prev) => {
                  const next = { ...prev, currentScene: 'morning-commute' as const };
                  (window as any).__selectedTransport = 'bus';
                  return next;
                });
              });
            }
            
            if (driveBtn && currentState.money >= 12) {
              driveBtn.addEventListener('click', () => {
                closePhone();
                store.setState((prev) => {
                  const next = { ...prev, currentScene: 'morning-commute' as const };
                  (window as any).__selectedTransport = 'drive';
                  return next;
                });
              });
            }
          }, 0);
        }
        break;

      case 'notes':
        appTitle.textContent = 'Notes - Tasks';
        const activityLog = currentState.activityLog;
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

      case 'save': {
        appTitle.textContent = 'Save Game';
        content.innerHTML = '';

        const intro = document.createElement('p');
        intro.style.cssText = 'margin: 0 0 16px; color: #bbb; font-size: 14px; line-height: 1.5;';
        intro.textContent = 'Save your progress so you can continue later. Saves live in your browser on this device.';

        const metadataCard = document.createElement('div');
        metadataCard.style.cssText = `
          background: #262626;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #ddd;
          line-height: 1.5;
        `;

        const renderMetadata = () => {
          const metadata = getSaveMetadata();
          if (!metadata) {
            metadataCard.innerHTML = `
              <strong style="color: #60a5fa;">No manual save found.</strong>
              <div style="margin-top: 8px; color: #888;">Create a save to remember your Day 1 progress.</div>
            `;
            return;
          }

          const savedAt = new Date(metadata.timestamp);
          metadataCard.innerHTML = `
            <strong style="color: #60a5fa;">Last save:</strong>
            <div style="margin-top: 4px;">${savedAt.toLocaleDateString()} ${savedAt.toLocaleTimeString()}</div>
            <div style="margin-top: 4px; color: #888; font-size: 12px;">Scene: ${metadata.scene} • Major: ${metadata.major}</div>
          `;
        };

        renderMetadata();

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.style.cssText = `
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #60a5fa;
          color: #0f172a;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s;
        `;
        saveBtn.textContent = 'Save Progress';

        saveBtn.addEventListener('mouseenter', () => {
          if (!saveBtn.disabled) {
            saveBtn.style.transform = 'translateY(-1px) scale(1.01)';
          }
        });

        saveBtn.addEventListener('mouseleave', () => {
          saveBtn.style.transform = 'translateY(0) scale(1)';
        });

        const statusMessage = document.createElement('div');
        statusMessage.style.cssText = 'min-height: 20px; margin-top: 12px; font-size: 13px;';

        const postSaveActions = document.createElement('div');
        postSaveActions.style.cssText = `
          margin-top: 20px;
          display: none;
          flex-direction: column;
          gap: 12px;
        `;

        const quitButton = document.createElement('button');
        quitButton.type = 'button';
        quitButton.style.cssText = `
          padding: 10px;
          border: 1px solid #ef4444;
          border-radius: 8px;
          background: transparent;
          color: #ef4444;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        `;
        quitButton.textContent = 'Quit to Main Menu';

        quitButton.addEventListener('mouseenter', () => {
          quitButton.style.background = '#ef4444';
          quitButton.style.color = '#000';
        });

        quitButton.addEventListener('mouseleave', () => {
          quitButton.style.background = 'transparent';
          quitButton.style.color = '#ef4444';
        });

        quitButton.addEventListener('click', () => {
          closePhone();
          store.setState((prev) => ({ ...prev, currentScene: 'main-menu' as const }));
        });

        const continueButton = document.createElement('button');
        continueButton.type = 'button';
        continueButton.style.cssText = `
          padding: 10px;
          border: 1px solid #4ac94a;
          border-radius: 8px;
          background: transparent;
          color: #4ac94a;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        `;
        continueButton.textContent = 'Continue Playing';

        continueButton.addEventListener('mouseenter', () => {
          continueButton.style.background = '#4ac94a';
          continueButton.style.color = '#000';
        });

        continueButton.addEventListener('mouseleave', () => {
          continueButton.style.background = 'transparent';
          continueButton.style.color = '#4ac94a';
        });

        continueButton.addEventListener('click', () => {
          closePhone();
        });

        postSaveActions.appendChild(quitButton);
        postSaveActions.appendChild(continueButton);

        saveBtn.addEventListener('click', () => {
          const originalLabel = saveBtn.textContent;
          saveBtn.disabled = true;
          saveBtn.style.cursor = 'wait';
          saveBtn.textContent = 'Saving...';
          statusMessage.textContent = '';
          statusMessage.style.color = '#ddd';

          const success = saveGame(store.getState());

          saveBtn.disabled = false;
          saveBtn.style.cursor = 'pointer';
          saveBtn.textContent = originalLabel ?? 'Save Progress';

          if (success) {
            renderMetadata();
            const savedAt = new Date();
            statusMessage.textContent = `Game saved at ${savedAt.toLocaleTimeString()}.`;
            statusMessage.style.color = '#4ac94a';
            postSaveActions.style.display = 'flex';
          } else {
            statusMessage.textContent = 'Something went wrong while saving. Please try again.';
            statusMessage.style.color = '#ef4444';
            postSaveActions.style.display = 'none';
          }
        });

        content.appendChild(intro);
        content.appendChild(metadataCard);
        content.appendChild(saveBtn);
        content.appendChild(statusMessage);
        content.appendChild(postSaveActions);
        break;
      }

      case 'settings':
        appTitle.textContent = 'Settings';
        const major = currentState.major;
        const majorName = major.charAt(0).toUpperCase() + major.slice(1);
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">👤 Player Info</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${currentState.playerName || 'Unregistered'}</p>
            <p style="margin: 8px 0;"><strong>Major:</strong> ${majorName}</p>
            <p style="margin: 8px 0;"><strong>Special Item:</strong> ${currentState.specialItem}</p>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">📊 MONASH Stats</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 4px 0;">M (Mobility): ${currentState.stats.M}/10</div>
              <div style="margin: 4px 0;">O (Organisation): ${currentState.stats.O}/10</div>
              <div style="margin: 4px 0;">N (Networking): ${currentState.stats.N}/10</div>
              <div style="margin: 4px 0;">A (Aura): ${currentState.stats.A}/10</div>
              <div style="margin: 4px 0;">S (Skills): ${currentState.stats.S}/10</div>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">💰 Resources</h3>
            <div style="font-family: monospace; font-size: 14px;">
              <div style="margin: 4px 0;">Money: $${currentState.money}</div>
              <div style="margin: 4px 0;">Hunger: ${currentState.hunger}/${currentState.stats.H}</div>
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

export const isPhoneOverlayOpen = () => isPhoneOpen;
