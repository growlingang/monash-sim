import type { GameStore } from '../core/store';
import type { NpcId } from '../core/types';
import { getSaveMetadata, saveGame } from '../utils/saveSystem';
import { getAvailableActivities, EVENING_ACTIVITY_DEFINITIONS } from '../data/eveningActivities';
import { NPC_DEFINITIONS } from '../data/npcs';
import { applyDeltas, formatMinutes, logActivity } from '../core/gameState';
import { createCutscene } from './cutscene';
import { getEveningActivityCutscene } from '../data/eveningCutscenes';
import { getAudioSettings, setVolume, toggleMute, startBackgroundMusic } from '../utils/audioManager';

type PhoneApp = 'home' | 'maps' | 'notes' | 'messages' | 'save' | 'settings' | 'activities';

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

    // Get current scene to determine which apps to show
    const currentState = store.getState();
    const isBedroomScene = currentState.currentScene === 'bedroom';
    const isMorningPhone = currentState.currentScene === 'morning-phone';
    
    // Only show Activities in evening bedroom (after commute, timeMinutes > 60)
    // Morning bedroom has low timeMinutes (0-60), evening has high timeMinutes (900+)
    const isEveningBedroom = isBedroomScene && currentState.timeMinutes > 60;
    const showActivities = isEveningBedroom && !isMorningPhone;

    const apps = [
      { id: 'maps', name: 'Maps', icon: '🗺️', color: '#34d399' },
      { id: 'notes', name: 'Notes', icon: '📝', color: '#fbbf24' },
      { id: 'messages', name: 'WhatsApp', icon: '💬', color: '#25D366' },
      // Only show Activities app in bedroom scene (evening)
      ...(showActivities ? [{ id: 'activities', name: 'Activities', icon: '🎯', color: '#f97316' }] : []),
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

      case 'activities':
        renderActivitiesApp(appTitle, content, store, renderHomeScreen);
        break;

      case 'settings':
        appTitle.textContent = 'Settings';
        const major = currentState.major;
        const majorName = major.charAt(0).toUpperCase() + major.slice(1);
        const audioSettings = getAudioSettings();
        content.innerHTML = `
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">👤 Player Info</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${currentState.playerName || 'Unregistered'}</p>
            <p style="margin: 8px 0;"><strong>Major:</strong> ${majorName}</p>
            <p style="margin: 8px 0;"><strong>Special Item:</strong> ${currentState.specialItem}</p>
          </div>
          
          <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #6b7280;">🔊 Audio Settings</h3>
            <div style="margin-bottom: 12px;">
              <button id="mute-toggle" style="
                background: ${audioSettings.isMuted ? '#ef4444' : '#10b981'};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 8px;
              ">${audioSettings.isMuted ? '🔇 Unmute' : '🔊 Mute'}</button>
              ${!audioSettings.isPlaying ? `
                <button id="start-music" style="
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  margin-right: 8px;
                ">🎵 Start Music</button>
              ` : ''}
              <span style="color: #999; font-size: 12px;">${audioSettings.isPlaying ? 'Music: Playing' : 'Music: Ready to Play'}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <label style="color: #999; font-size: 12px; display: block; margin-bottom: 4px;">Master Volume: ${Math.round(audioSettings.masterVolume * 100)}%</label>
              <input type="range" id="master-volume" min="0" max="100" value="${Math.round(audioSettings.masterVolume * 100)}" style="width: 100%;">
            </div>
            <div style="margin-bottom: 8px;">
              <label style="color: #999; font-size: 12px; display: block; margin-bottom: 4px;">Music Volume: ${Math.round(audioSettings.musicVolume * 100)}%</label>
              <input type="range" id="music-volume" min="0" max="100" value="${Math.round(audioSettings.musicVolume * 100)}" style="width: 100%;">
            </div>
            <div>
              <label style="color: #999; font-size: 12px; display: block; margin-bottom: 4px;">SFX Volume: ${Math.round(audioSettings.sfxVolume * 100)}%</label>
              <input type="range" id="sfx-volume" min="0" max="100" value="${Math.round(audioSettings.sfxVolume * 100)}" style="width: 100%;">
            </div>
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

        // Add event listeners for audio controls
        const muteButton = content.querySelector('#mute-toggle') as HTMLButtonElement;
        const startMusicButton = content.querySelector('#start-music') as HTMLButtonElement;
        const masterVolumeSlider = content.querySelector('#master-volume') as HTMLInputElement;
        const musicVolumeSlider = content.querySelector('#music-volume') as HTMLInputElement;
        const sfxVolumeSlider = content.querySelector('#sfx-volume') as HTMLInputElement;

        if (startMusicButton) {
          startMusicButton.addEventListener('click', async () => {
            try {
              await startBackgroundMusic();
              // Remove the start button and update status
              startMusicButton.remove();
              const statusSpan = content.querySelector('span');
              if (statusSpan) {
                statusSpan.textContent = 'Music: Playing';
              }
              console.log('🎵 Music started successfully!');
            } catch (error) {
              console.error('Failed to start music:', error);
              alert('Failed to start music. Please try again.');
            }
          });
        }

        if (muteButton) {
          muteButton.addEventListener('click', () => {
            toggleMute();
            // Update button appearance
            const newSettings = getAudioSettings();
            muteButton.style.background = newSettings.isMuted ? '#ef4444' : '#10b981';
            muteButton.textContent = newSettings.isMuted ? '🔇 Unmute' : '🔊 Mute';
            
            // Update volume sliders
            const masterVol = content.querySelector('#master-volume') as HTMLInputElement;
            const musicVol = content.querySelector('#music-volume') as HTMLInputElement;
            const sfxVol = content.querySelector('#sfx-volume') as HTMLInputElement;
            
            if (masterVol) masterVol.value = Math.round(newSettings.masterVolume * 100).toString();
            if (musicVol) musicVol.value = Math.round(newSettings.musicVolume * 100).toString();
            if (sfxVol) sfxVol.value = Math.round(newSettings.sfxVolume * 100).toString();
          });
        }

        if (masterVolumeSlider) {
          masterVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value) / 100;
            setVolume('master', value);
            
            // Update labels
            const labels = content.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent?.includes('Master Volume:')) {
                label.textContent = `Master Volume: ${Math.round(value * 100)}%`;
              }
            });
          });
        }

        if (musicVolumeSlider) {
          musicVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value) / 100;
            setVolume('music', value);
            
            // Update labels
            const labels = content.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent?.includes('Music Volume:')) {
                label.textContent = `Music Volume: ${Math.round(value * 100)}%`;
              }
            });
          });
        }

        if (sfxVolumeSlider) {
          sfxVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value) / 100;
            setVolume('sfx', value);
            
            // Update labels
            const labels = content.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent?.includes('SFX Volume:')) {
                label.textContent = `SFX Volume: ${Math.round(value * 100)}%`;
              }
            });
          });
        }
        break;
    }

    appContent.appendChild(content);
  };

  renderHomeScreen();
};

function renderActivitiesApp(
  appTitle: HTMLElement,
  content: HTMLElement,
  store: GameStore,
  renderHomeScreen: () => void
) {
  appTitle.textContent = 'Evening Activities';
  content.innerHTML = '';

  const state = store.getState();
  const timeStr = formatMinutes(state.timeMinutes);

  // Get available activities
  const availableActivities = getAvailableActivities({
    money: state.money,
    hunger: state.hunger,
    timeMinutes: state.timeMinutes,
    doomscrollUsed: state.flags.has('doomscroll-used'),
  });

  // Stats display
  const statsDisplay = document.createElement('div');
  statsDisplay.style.cssText = `
    background: #2a2a2a;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #999;
  `;
  statsDisplay.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>💰 Money: $${state.money}</span>
      <span>🍔 Hunger: ${state.hunger}/10</span>
    </div>
    <div style="color: #666; font-size: 12px;">⏰ Time: ${timeStr}</div>
  `;
  content.appendChild(statsDisplay);

  // Instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    background: #1e3a5f;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    border-left: 3px solid #3b82f6;
    font-size: 13px;
    color: #93c5fd;
  `;
  instructions.innerHTML = `
    <p style="margin: 0;">💡 Choose an evening activity before heading to bed.</p>
  `;
  content.appendChild(instructions);

  // Render activities
  EVENING_ACTIVITY_DEFINITIONS.forEach((activity) => {
    const isAvailable = availableActivities.some((a) => a.id === activity.id);
    
    const activityCard = document.createElement('div');
    activityCard.style.cssText = `
      background: ${isAvailable ? '#2a2a2a' : '#1a1a1a'};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
      opacity: ${isAvailable ? '1' : '0.5'};
      border: 2px solid ${isAvailable ? 'transparent' : '#333'};
      transition: all 0.2s;
    `;

    const activityIcon = getActivityIcon(activity.id as any);
    const activityTitle = document.createElement('h3');
    activityTitle.textContent = `${activityIcon} ${activity.label}`;
    activityTitle.style.cssText = `
      margin: 0 0 8px 0;
      color: ${isAvailable ? '#4ac94a' : '#666'};
      font-size: 16px;
    `;

    const activityDesc = document.createElement('p');
    activityDesc.textContent = activity.description;
    activityDesc.style.cssText = `
      margin: 0 0 8px 0;
      color: #999;
      font-size: 14px;
    `;

    const activityReqs = document.createElement('div');
    activityReqs.style.cssText = 'font-size: 13px; color: #666;';
    
    const reqParts: string[] = [];
    if (activity.requirements.money) {
      reqParts.push(`💰 $${activity.requirements.money}`);
    }
    if (activity.requirements.hungerMax !== undefined) {
      reqParts.push(`🍔 Hunger < ${activity.requirements.hungerMax + 1}`);
    }
    if (activity.requirements.hungerMin !== undefined && activity.requirements.hungerMin > 0) {
      reqParts.push(`🍔 Hunger > ${activity.requirements.hungerMin - 1}`);
    }
    reqParts.push(`⏰ ${activity.requirements.time} min`);
    
    activityReqs.textContent = reqParts.join(' • ');

    activityCard.appendChild(activityTitle);
    activityCard.appendChild(activityDesc);
    activityCard.appendChild(activityReqs);

    // Show why it's unavailable
    if (!isAvailable) {
      const unavailableReason = getUnavailableReason(activity, state);
      if (unavailableReason) {
        const reasonDiv = document.createElement('div');
        reasonDiv.style.cssText = `
          margin-top: 8px;
          padding: 8px;
          background: #3a1a1a;
          border-radius: 4px;
          font-size: 12px;
          color: #ff6b6b;
        `;
        reasonDiv.textContent = `❌ ${unavailableReason}`;
        activityCard.appendChild(reasonDiv);
      }
    }

    // Add hover effect for available activities
    if (isAvailable) {
      activityCard.addEventListener('mouseenter', () => {
        activityCard.style.background = '#3a3a3a';
        activityCard.style.borderColor = '#4ac94a';
      });

      activityCard.addEventListener('mouseleave', () => {
        activityCard.style.background = '#2a2a2a';
        activityCard.style.borderColor = 'transparent';
      });

      activityCard.addEventListener('click', () => {
        if (activity.id === 'text') {
          // Show NPC selection
          renderNPCSelection(appTitle, content, store, renderHomeScreen);
        } else {
          // Execute activity
          executeActivity(activity.id as any, store, renderHomeScreen);
        }
      });
    }

    content.appendChild(activityCard);
  });
}

function getActivityIcon(activityId: 'eat' | 'rest' | 'text' | 'doomscroll'): string {
  switch (activityId) {
    case 'eat': return '🍔';
    case 'rest': return '😴';
    case 'text': return '💬';
    case 'doomscroll': return '📱';
  }
}

function getUnavailableReason(activity: typeof EVENING_ACTIVITY_DEFINITIONS[0], state: any): string | null {
  const timeRemaining = 15 * ((22 - 7) * 4) - state.timeMinutes;
  
  if (timeRemaining < activity.requirements.time) {
    return 'Not enough time remaining';
  }
  
  if (activity.requirements.money && state.money < activity.requirements.money) {
    return `Need $${activity.requirements.money}`;
  }
  
  if (activity.requirements.hungerMin !== undefined && state.hunger < activity.requirements.hungerMin) {
    return `Hunger too low (need > ${activity.requirements.hungerMin - 1})`;
  }
  
  if (activity.requirements.hungerMax !== undefined && state.hunger > activity.requirements.hungerMax) {
    return `Hunger too high (need < ${activity.requirements.hungerMax + 1})`;
  }
  
  if (activity.requirements.doomscrollUsed === false && state.flags.has('doomscroll-used')) {
    return 'Already used today';
  }
  
  return null;
}

function renderNPCSelection(
  appTitle: HTMLElement,
  content: HTMLElement,
  store: GameStore,
  renderHomeScreen: () => void
) {
  appTitle.textContent = 'Text Someone';
  content.innerHTML = '';

  const backButton = document.createElement('button');
  backButton.textContent = '← Back to Activities';
  backButton.style.cssText = `
    width: 100%;
    padding: 12px;
    background: #2a2a2a;
    color: #4ac94a;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 16px;
  `;
  backButton.addEventListener('click', () => {
    renderActivitiesApp(appTitle, content, store, renderHomeScreen);
  });
  content.appendChild(backButton);

  const instruction = document.createElement('p');
  instruction.textContent = 'Choose a teammate to send a message to:';
  instruction.style.cssText = 'color: #999; font-size: 14px; margin-bottom: 16px;';
  content.appendChild(instruction);

  // Show all NPCs
  const state = store.getState();
  const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];

  npcIds.forEach((npcId) => {
    const npc = NPC_DEFINITIONS[npcId];
    const rapport = state.rapport[npcId];
    
    const npcCard = document.createElement('div');
    npcCard.style.cssText = `
      background: #2a2a2a;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
    `;

    const npcHeader = document.createElement('div');
    npcHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    
    const npcName = document.createElement('h4');
    npcName.textContent = npc.name;
    npcName.style.cssText = 'margin: 0; color: #4ac94a; font-size: 16px;';
    
    const rapportBadge = document.createElement('span');
    rapportBadge.textContent = `❤️ ${rapport > 0 ? '+' : ''}${rapport}`;
    rapportBadge.style.cssText = `
      padding: 4px 8px;
      background: ${rapport >= 0 ? '#1e3a1e' : '#3a1e1e'};
      color: ${rapport >= 0 ? '#4ac94a' : '#ff6b6b'};
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    `;
    
    npcHeader.appendChild(npcName);
    npcHeader.appendChild(rapportBadge);

    const npcFocus = document.createElement('p');
    npcFocus.textContent = `${npc.focus.charAt(0).toUpperCase() + npc.focus.slice(1)} • ${npc.majorAffinity.toUpperCase()}`;
    npcFocus.style.cssText = 'margin: 0; color: #666; font-size: 12px;';

    npcCard.appendChild(npcHeader);
    npcCard.appendChild(npcFocus);

    npcCard.addEventListener('mouseenter', () => {
      npcCard.style.background = '#3a3a3a';
      npcCard.style.borderColor = '#4ac94a';
    });

    npcCard.addEventListener('mouseleave', () => {
      npcCard.style.background = '#2a2a2a';
      npcCard.style.borderColor = 'transparent';
    });

    npcCard.addEventListener('click', () => {
      executeActivity('text', store, renderHomeScreen, npcId);
    });

    content.appendChild(npcCard);
  });
}

function executeActivity(
  activityId: 'eat' | 'rest' | 'text' | 'doomscroll',
  store: GameStore,
  renderHomeScreen: () => void,
  targetNpc?: NpcId
) {
  const state = store.getState();
  const activity = EVENING_ACTIVITY_DEFINITIONS.find((a) => a.id === activityId);
  
  if (!activity) return;

  // Build deltas
  const deltas: any = {
    time: activity.outcome.timeDelta,
  };

  if (activity.outcome.hungerDelta !== undefined) {
    // For eat: set hunger to 10
    if (activityId === 'eat') {
      deltas.hunger = 10 - state.hunger; // Delta to reach 10
    } else {
      deltas.hunger = activity.outcome.hungerDelta;
    }
  }

  if (activity.outcome.moneyDelta !== undefined) {
    deltas.money = activity.outcome.moneyDelta;
  }

  if (activity.outcome.statDeltas) {
    deltas.stats = activity.outcome.statDeltas;
  }

  // Handle text activity with rapport
  if (activityId === 'text' && targetNpc) {
    const currentRapport = state.rapport[targetNpc];
    const rapportDelta = currentRapport <= 0 ? 2 : 1;
    deltas.rapport = { [targetNpc]: rapportDelta };
  }

  // Apply deltas
  let nextState = applyDeltas(state, deltas);

  // Add flag for doomscroll
  if (activityId === 'doomscroll') {
    nextState.flags.add('doomscroll-used');
  }

  // Log activity
  const summaryText = targetNpc 
    ? `${activity.outcome.description} (Texted ${NPC_DEFINITIONS[targetNpc].name})`
    : activity.outcome.description;
    
  nextState = logActivity(nextState, {
    segment: 'bedroom',
    choiceId: activityId,
    summary: summaryText,
    deltas,
  });

  // Update store
  store.setState(nextState);

  // Close phone and show cutscene
  closePhone();
  
  // Get cutscene frames for this activity
  const cutsceneFrames = getEveningActivityCutscene(activityId, targetNpc);
  
  // Show cutscene and then go to recap
  createCutscene(document.body, {
    frames: cutsceneFrames,
    canSkip: true,
    onComplete: () => {
      // Transition to recap scene after cutscene
      store.setState((prev) => ({ ...prev, currentScene: 'recap' }));
    },
  });
}


export const isPhoneOverlayOpen = () => isPhoneOpen;

export const createPhoneOverlay = (root: HTMLElement, store: GameStore, onClose: () => void) => {
  openPhone(store);
  
  // Override close behavior to call onClose callback
  const originalClose = closePhone;
  (window as any).__phoneOverlayCloseCallback = onClose;
};
