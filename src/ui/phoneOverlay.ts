import type { GameStore } from '../core/store';
import type { NpcId } from '../core/types';
import { getSaveMetadata, saveGame } from '../utils/saveSystem';
import { getAvailableActivities, EVENING_ACTIVITY_DEFINITIONS } from '../data/eveningActivities';
import { NPC_DEFINITIONS } from '../data/npcs';
import { applyDeltas, formatMinutes, logActivity } from '../core/gameState';
import { createCutscene } from './cutscene';
import { getEveningActivityCutscene } from '../data/eveningCutscenes';
import { getAudioSettings, setVolume, toggleMute, startBackgroundMusic } from '../utils/audioManager';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';
import { CharacterCustomizer } from '../scenes/characterCustomization';
import type { GameAction } from '../core/actions';

type PhoneApp = 'home' | 'maps' | 'notes' | 'messages' | 'save' | 'settings' | 'activities' | 'character';

// Phone overlay styles
const PHONE_STYLES = `
  .character-customizer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #c9a876;
    height: 100%;
    overflow-y: auto;
  }

  .customizer-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .customizer-tabs button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    background: #8b6f47;
    color: #e8d5b5;
    cursor: pointer;
  }

  .customizer-tabs button.active {
    background: #3a2817;
    color: #e8d5b5;
  }

  .customizer-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .customizer-options button {
    padding: 0.5rem;
    border: 1px solid #8b6f47;
    background: #e8d5b5;
    color: #3a2817;
    cursor: pointer;
  }

  .customizer-options button.active {
    border-color: #3a2817;
    background: #8b6f47;
    color: #e8d5b5;
  }

  .customizer-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .customizer-nav button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    background: #3a2817;
    color: #e8d5b5;
    cursor: pointer;
  }

  .customizer-apply {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: #4a7c1b;
    color: #e8d5b5;
    cursor: pointer;
    font-weight: bold;
  }

  .preview-canvas {
    background: #e8d5b5;
    border: 2px solid #8b6f47;
    border-radius: 4px;
    margin: 0 auto;
  }
`;

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
    background: rgba(20, 15, 10, 0.95);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: none;
    image-rendering: pixelated;
  `;

  document.body.appendChild(overlayContainer);

  // Listen for 'P' key to toggle phone
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') {
      // Don't open phone if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      )) {
        return; // Ignore the 'p' key when typing in input fields
      }
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
    background: #3a2817;
    border-radius: 0;
    border: 6px solid #8b6f47;
    padding: 16px;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.6);
    position: relative;
    image-rendering: pixelated;
  `;

  const phoneScreen = document.createElement('div');
  phoneScreen.className = 'phone__screen';
  phoneScreen.style.cssText = `
    width: 100%;
    height: 100%;
    background: #c9a876;
    border-radius: 0;
    border: 3px solid #8b6f47;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const statusBar = document.createElement('div');
  statusBar.className = 'phone__status-bar';
  statusBar.style.cssText = `
    height: 44px;
    background: #8b6f47;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    color: #fbe9cf;
    font-size: 12px;
    font-family: 'Press Start 2P', monospace;
    border-bottom: 3px solid #5a4a35;
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
    background: #c9a876;
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
      background: linear-gradient(135deg, #d4a574 0%, #b8956a 100%);
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 32px 20px;
      align-content: start;
      justify-items: center;
    `;

    // Get current scene to determine which apps to show
    const currentState = store.getState();
    const isBedroomScene = currentState.currentScene === 'bedroom';
    const isMorningPhone = currentState.currentScene === 'morning-phone';

    // Show Activities only after the evening commute ("bus loop") was triggered
    // We infer this by checking the activity log for an 'evening-commute' entry
    const hasEveningCommute = currentState.activityLog.some((e) => e.segment === 'evening-commute');
    const showActivities = isBedroomScene && hasEveningCommute && !isMorningPhone;

    const apps = [
      { id: 'character', name: 'Character', icon: '👤', color: '#8b6f47' },
      { id: 'maps', name: 'Maps', icon: '🗺️', color: '#6a9e6a' },
      { id: 'notes', name: 'Notes', icon: '📝', color: '#d4a574' },
      { id: 'messages', name: 'WhatsApp', icon: '💬', color: '#6a9e6a' },
      // Only show Activities app in bedroom scene (evening)
      ...(showActivities ? [{ id: 'activities', name: 'Activities', icon: '🎯', color: '#c97a5a' }] : []),
      { id: 'save', name: 'Save', icon: '💾', color: '#8b8b6a' },
      { id: 'settings', name: 'Settings', icon: '⚙️', color: '#8b6f47' },
      { id: 'close', name: 'Close', icon: '❌', color: '#c97a7a' },
    ];

    apps.forEach((app) => {
      const appIcon = document.createElement('button');
      appIcon.className = 'phone__app-icon';
      appIcon.style.cssText = `
        background: ${app.color};
        border: 3px solid #5a4a35;
        border-radius: 0;
        width: 85px;
        height: 85px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        transition: transform 0.1s;
        box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
        image-rendering: pixelated;
        font-family: 'Press Start 2P', monospace;
      `;

      appIcon.innerHTML = `
        <div style="font-size: 32px;">${app.icon}</div>
        <div style="font-size: 9px; color: white; font-weight: 500;">${app.name}</div>
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
      background: #c9a876;
      overflow-y: auto;
      padding: 0;
    `;

    // Back button
    const header = document.createElement('div');
    header.style.cssText = `
      background: #8b6f47;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 3px solid #5a4a35;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      background: none;
      border: none;
      color: #fbe9cf;
      font-size: 12px;
      cursor: pointer;
      padding: 4px;
      font-family: 'Press Start 2P', monospace;
    `;
    backBtn.addEventListener('click', () => renderHomeScreen());

    const appTitle = document.createElement('h2');
    appTitle.style.cssText = 'color: #fbe9cf; font-size: 14px; margin: 0; font-family: "Press Start 2P", monospace;';

    header.appendChild(backBtn);
    header.appendChild(appTitle);
    appContent.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'padding: 16px; color: #fbe9cf; font-family: "Press Start 2P", monospace; font-size: 9px; line-height: 2;';

    const currentState = store.getState();

    switch (app) {
      case 'maps':
        const isEveningCommute = currentState.currentScene === 'evening-commute';
          appTitle.textContent = isEveningCommute ? 'Maps - Evening Transport' : 'Maps - Morning Transport';

          
        if (isEveningCommute) {
          // Evening commute - show transport options
          content.innerHTML = `
            <div style="background: #4a3a2a; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚶 Walk Home</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">Free • 45 min • Medium</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Crossy-road minigame</p>
              <button id="walk-btn" style="
                width: 100%;
                padding: 8px;
                background: #6a9e6a;
                border: 3px solid #4a7a4a;
                border-radius: 0;
                color: #fbe9cf;
                font-weight: bold;
                cursor: pointer;
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">Walk</button>
            </div>
            
            <div style="background: #5a4a35; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚌 Bus/Tram</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">$5 • 35 min • Easy</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Balance minigame</p>
              <button id="bus-btn" style="
                width: 100%;
                padding: 8px;
                background: ${currentState.money >= 5 ? '#6a9e6a' : '#4a4a4a'};
                border: 3px solid ${currentState.money >= 5 ? '#4a7a4a' : '#2a2a2a'};
                border-radius: 0;
                color: ${currentState.money >= 5 ? '#fbe9cf' : '#c0c0c0'};
                font-weight: bold;
                cursor: ${currentState.money >= 5 ? 'pointer' : 'not-allowed'};
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">${currentState.money >= 5 ? 'Bus' : 'Need $5'}</button>
            </div>
            
            <div style="background: #6a5a3a; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚗 Drive</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">$12 • 30 min • Hard</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Traffic + Parking</p>
              <button id="drive-btn" style="
                width: 100%;
                padding: 8px;
                background: ${currentState.money >= 12 ? '#6a9e6a' : '#4a4a4a'};
                border: 3px solid ${currentState.money >= 12 ? '#4a7a4a' : '#2a2a2a'};
                border-radius: 0;
                color: ${currentState.money >= 12 ? '#fbe9cf' : '#c0c0c0'};
                font-weight: bold;
                cursor: ${currentState.money >= 12 ? 'pointer' : 'not-allowed'};
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">${currentState.money >= 12 ? 'Drive' : 'Need $12'}</button>
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
            <div style="background: #4a3a2a; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚶 Walk</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">Free • 45 min • Medium</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Crossy-road minigame</p>
              <button id="walk-btn" style="
                width: 100%;
                padding: 8px;
                background: #6a9e6a;
                border: 3px solid #4a7a4a;
                border-radius: 0;
                color: #fbe9cf;
                font-weight: bold;
                cursor: pointer;
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">Walk</button>
            </div>
            
            <div style="background: #5a4a35; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚌 Bus/Tram</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">$5 • 35 min • Easy</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Balance minigame</p>
              <button id="bus-btn" style="
                width: 100%;
                padding: 8px;
                background: ${currentState.money >= 5 ? '#6a9e6a' : '#4a4a4a'};
                border: 3px solid ${currentState.money >= 5 ? '#4a7a4a' : '#2a2a2a'};
                border-radius: 0;
                color: ${currentState.money >= 5 ? '#fbe9cf' : '#c0c0c0'};
                font-weight: bold;
                cursor: ${currentState.money >= 5 ? 'pointer' : 'not-allowed'};
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">${currentState.money >= 5 ? 'Bus' : 'Need $5'}</button>
            </div>
            
            <div style="background: #6a5a3a; border: 3px solid #3a2817; border-radius: 0; padding: 12px; margin-bottom: 12px; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);">
              <h3 style="margin-top: 0; color: #d4f0d4; font-family: 'Press Start 2P', monospace; font-size: 11px;">🚗 Drive</h3>
              <p style="margin: 6px 0; color: #fbe9cf; font-size: 9px; line-height: 1.6;">$12 • 30 min • Hard</p>
              <p style="margin: 0 0 10px 0; font-size: 8px; color: #d4a574; line-height: 1.6;">Traffic + Parking</p>
              <button id="drive-btn" style="
                width: 100%;
                padding: 8px;
                background: ${currentState.money >= 12 ? '#6a9e6a' : '#4a4a4a'};
                border: 3px solid ${currentState.money >= 12 ? '#4a7a4a' : '#2a2a2a'};
                border-radius: 0;
                color: ${currentState.money >= 12 ? '#fbe9cf' : '#c0c0c0'};
                font-weight: bold;
                cursor: ${currentState.money >= 12 ? 'pointer' : 'not-allowed'};
                font-size: 9px;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
              ">${currentState.money >= 12 ? 'Drive' : 'Need $12'}</button>
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

        case 'character':
        appTitle.textContent = 'Character';
        const playerData = store.getState().playerSprite || DEFAULT_PLAYER;
        const customizer = new CharacterCustomizer(content, playerData);

        const handleUpdate = ((e: CustomEvent) => {
          store.setState((prev) => ({
            ...prev,
            playerSprite: e.detail.player,
          }));
        }) as EventListener;

        window.addEventListener('character-updated', handleUpdate);

        // ✅ Append content before return
        appContent.appendChild(content);

        return () => {
          window.removeEventListener('character-updated', handleUpdate);
          customizer.cleanup();
        };


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
        intro.style.cssText = 'margin: 0 0 16px; color: #fbe9cf; font-size: 9px; line-height: 1.8; font-family: "Press Start 2P", monospace;';
        intro.textContent = 'Save progress. Stored in browser.';

        const metadataCard = document.createElement('div');
        metadataCard.style.cssText = `
          background: #4a3a2a;
          border: 3px solid #3a2817;
          border-radius: 0;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 9px;
          color: #fbe9cf;
          line-height: 1.8;
          font-family: 'Press Start 2P', monospace;
        `;

        const renderMetadata = () => {
          const metadata = getSaveMetadata();
          if (!metadata) {
            metadataCard.innerHTML = `
              <strong style="color: #d4f0d4;">No save found</strong>
              <div style="margin-top: 8px; color: #d4a574;">Create a save</div>
            `;
            return;
          }

          const savedAt = new Date(metadata.timestamp);
          metadataCard.innerHTML = `
            <strong style="color: #d4f0d4;">Last save:</strong>
            <div style="margin-top: 4px; color: #fbe9cf;">${savedAt.toLocaleDateString()} ${savedAt.toLocaleTimeString()}</div>
            <div style="margin-top: 4px; color: #d4a574; font-size: 7px;">${metadata.scene} • ${metadata.major}</div>
          `;
        };

        renderMetadata();

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.style.cssText = `
          width: 100%;
          padding: 12px;
          border: 3px solid #8b6f47;
          border-radius: 0;
          background: #8b8b6a;
          color: #fbe9cf;
          font-weight: 600;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.1s;
          font-family: 'Press Start 2P', monospace;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
        `;
        saveBtn.textContent = 'Save';

        saveBtn.addEventListener('mouseenter', () => {
          if (!saveBtn.disabled) {
            saveBtn.style.transform = 'translate(-2px, -2px)';
            saveBtn.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
            saveBtn.style.background = '#9b9b7a';
          }
        });

        saveBtn.addEventListener('mouseleave', () => {
          saveBtn.style.transform = 'translate(0, 0)';
          saveBtn.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
          saveBtn.style.background = '#8b8b6a';
        });

        const statusMessage = document.createElement('div');
        statusMessage.style.cssText = 'min-height: 20px; margin-top: 12px; font-size: 8px; font-family: "Press Start 2P", monospace;';

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
          border: 3px solid #8b3a3a;
          border-radius: 0;
          background: #5a4a35;
          color: #fbe9cf;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.1s;
          font-family: 'Press Start 2P', monospace;
          font-size: 9px;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
        `;
        quitButton.textContent = 'Quit';

        quitButton.addEventListener('mouseenter', () => {
          quitButton.style.background = '#6a5a3a';
          quitButton.style.transform = 'translate(-2px, -2px)';
          quitButton.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
        });

        quitButton.addEventListener('mouseleave', () => {
          quitButton.style.background = '#5a4a35';
          quitButton.style.transform = 'translate(0, 0)';
          quitButton.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
        });

        quitButton.addEventListener('click', () => {
          closePhone();
          store.setState((prev) => ({ ...prev, currentScene: 'main-menu' as const }));
        });

        const continueButton = document.createElement('button');
        continueButton.type = 'button';
        continueButton.style.cssText = `
          padding: 10px;
          border: 3px solid #8b6f47;
          border-radius: 0;
          background: #6a9e6a;
          color: #fbe9cf;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.1s;
          font-family: 'Press Start 2P', monospace;
          font-size: 9px;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
        `;
        continueButton.textContent = 'Continue';

        continueButton.addEventListener('mouseenter', () => {
          continueButton.style.background = '#7aae7a';
          continueButton.style.transform = 'translate(-2px, -2px)';
          continueButton.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
        });

        continueButton.addEventListener('mouseleave', () => {
          continueButton.style.background = '#6a9e6a';
          continueButton.style.transform = 'translate(0, 0)';
          continueButton.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
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
          saveBtn.textContent = originalLabel ?? 'Save';

          if (success) {
            renderMetadata();
            const savedAt = new Date();
            statusMessage.textContent = `Saved ${savedAt.toLocaleTimeString()}`;
            statusMessage.style.color = '#d4f0d4';
            postSaveActions.style.display = 'flex';
          } else {
            statusMessage.textContent = 'Save failed';
            statusMessage.style.color = '#f0a0a0';
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
              <span style="color: #d4a574; font-size: 10px; font-family: 'Press Start 2P', monospace;">${audioSettings.isPlaying ? 'Music: Playing' : 'Music: Ready to Play'}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <label style="color: #d4a574; font-size: 10px; font-family: 'Press Start 2P', monospace; display: block; margin-bottom: 4px;">Master Volume: ${Math.round(audioSettings.masterVolume * 100)}%</label>
              <input type="range" id="master-volume" min="0" max="100" value="${Math.round(audioSettings.masterVolume * 100)}" style="width: 100%;">
            </div>
            <div style="margin-bottom: 8px;">
              <label style="color: #d4a574; font-size: 10px; font-family: 'Press Start 2P', monospace; display: block; margin-bottom: 4px;">Music Volume: ${Math.round(audioSettings.musicVolume * 100)}%</label>
              <input type="range" id="music-volume" min="0" max="100" value="${Math.round(audioSettings.musicVolume * 100)}" style="width: 100%;">
            </div>
            <div>
              <label style="color: #d4a574; font-size: 10px; font-family: 'Press Start 2P', monospace; display: block; margin-bottom: 4px;">SFX Volume: ${Math.round(audioSettings.sfxVolume * 100)}%</label>
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
    background: #4a3a2a;
    border-radius: 0;
    border: 3px solid #3a2817;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 10px;
    color: #fbe9cf;
    font-family: 'Press Start 2P', monospace;
    line-height: 1.8;
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
    background: #6a5a3a;
    border-radius: 0;
    padding: 12px;
    margin-bottom: 16px;
    border: 3px solid #8b6f47;
    font-size: 8px;
    color: #fbe9cf;
    font-family: 'Press Start 2P', monospace;
    line-height: 1.8;
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
      background: ${isAvailable ? '#5a4a35' : '#3a2817'};
      border-radius: 0;
      border: 3px solid ${isAvailable ? '#8b6f47' : '#5a4a35'};
      padding: 16px;
      margin-bottom: 12px;
      cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
      opacity: ${isAvailable ? '1' : '0.5'};
      transition: all 0.1s;
      box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    `;

    const activityIcon = getActivityIcon(activity.id as any);
    const activityTitle = document.createElement('h3');
    activityTitle.textContent = `${activityIcon} ${activity.label}`;
    activityTitle.style.cssText = `
      margin: 0 0 8px 0;
      color: ${isAvailable ? '#d4f0d4' : '#8b8b8b'};
      font-size: 11px;
      font-family: 'Press Start 2P', monospace;
    `;

    const activityDesc = document.createElement('p');
    activityDesc.textContent = activity.description;
    activityDesc.style.cssText = `
      margin: 0 0 8px 0;
      color: #d4a574;
      font-size: 9px;
      line-height: 1.6;
    // Style tag for character customization
    const style = document.createElement('style');
    style.textContent = PHONE_STYLES;
    document.head.appendChild(style);

    function renderCharacterApp() {
      const container = document.createElement('div');
      container.className = 'character-customizer-container';
      appContent.appendChild(container);

      // Set up customizer
      const customizer = new CharacterCustomizer(container, store.getState().player);

      // Listen for changes
      const handleUpdate = ((e: CustomEvent) => {
        // Update player in game state
        store.dispatch({
          type: 'UPDATE_PLAYER',
          payload: e.detail.player
        });
      }) as EventListener;

      window.addEventListener('character-updated', handleUpdate);

      // Clean up when switching apps
      return () => {
        window.removeEventListener('character-updated', handleUpdate);
        customizer.cleanup();
        style.remove();
      };
    }

    let cleanup: (() => void) | null = null;

    switch (app) {
      case 'character':
        appTitle.textContent = 'Character';
        cleanup = renderCharacterApp();
        break;
    `;

    const activityReqs = document.createElement('div');
    activityReqs.style.cssText = 'font-size: 8px; color: #b8956a; font-family: "Press Start 2P", monospace;';
    
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
        activityCard.style.background = '#6a5a3a';
        activityCard.style.borderColor = '#a08560';
        activityCard.style.transform = 'translate(-2px, -2px)';
        activityCard.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
      });

      activityCard.addEventListener('mouseleave', () => {
        activityCard.style.background = '#5a4a35';
        activityCard.style.borderColor = '#8b6f47';
        activityCard.style.transform = 'translate(0, 0)';
        activityCard.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
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
  backButton.textContent = '← Back';
  backButton.style.cssText = `
    width: 100%;
    padding: 12px;
    background: #5a4a35;
    color: #fbe9cf;
    border: 3px solid #3a2817;
    border-radius: 0;
    font-size: 8px;
    cursor: pointer;
    margin-bottom: 16px;
    font-family: 'Press Start 2P', monospace;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    transition: all 0.1s;
  `;
  backButton.addEventListener('click', () => {
    renderActivitiesApp(appTitle, content, store, renderHomeScreen);
  });
  content.appendChild(backButton);

  const instruction = document.createElement('p');
  instruction.textContent = 'Choose a teammate to send a message to:';
  instruction.style.cssText = 'color: #fbe9cf; font-size: 11px; margin-bottom: 16px; font-family: "Press Start 2P", monospace;';
  content.appendChild(instruction);

  // Show all NPCs
  const state = store.getState();
  const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];

  npcIds.forEach((npcId) => {
    const npc = NPC_DEFINITIONS[npcId];
    const rapport = state.rapport[npcId];
    const classChoice = state.classReplies?.[npcId];
    
    const npcCard = document.createElement('div');
    npcCard.style.cssText = `
      background: #5a4a35;
      border-radius: 0;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      border: 3px solid #8b6f47;
      transition: all 0.1s;
      box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    `;

    const npcHeader = document.createElement('div');
    npcHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    
    const npcName = document.createElement('h4');
    npcName.textContent = npc.name;
    npcName.style.cssText = 'margin: 0; color: #fbe9cf; font-size: 11px; font-family: "Press Start 2P", monospace;';
    
    const rapportBadge = document.createElement('span');
    rapportBadge.textContent = `❤️ ${rapport > 0 ? '+' : ''}${rapport}`;
    rapportBadge.style.cssText = `
      padding: 4px 8px;
      background: ${rapport >= 0 ? '#4a5a3a' : '#5a3a3a'};
      color: ${rapport >= 0 ? '#d4f0d4' : '#f0d4d4'};
      border-radius: 0;
      border: 2px solid ${rapport >= 0 ? '#6a9e6a' : '#c97a7a'};
      font-size: 9px;
      font-weight: bold;
      font-family: 'Press Start 2P', monospace;
    `;
    
    npcHeader.appendChild(npcName);
    npcHeader.appendChild(rapportBadge);

    const npcFocus = document.createElement('p');
    npcFocus.textContent = `${npc.focus.charAt(0).toUpperCase() + npc.focus.slice(1)} • ${npc.majorAffinity.toUpperCase()}`;
    npcFocus.style.cssText = 'margin: 0; color: #d4a574; font-size: 8px; font-family: "Press Start 2P", monospace;';

    npcCard.appendChild(npcHeader);
    npcCard.appendChild(npcFocus);

    npcCard.addEventListener('mouseenter', () => {
      npcCard.style.background = '#6a5a3a';
      npcCard.style.transform = 'translate(-2px, -2px)';
      npcCard.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.3)';
    });

    npcCard.addEventListener('mouseleave', () => {
      npcCard.style.background = '#5a4a35';
      npcCard.style.transform = 'translate(0, 0)';
      npcCard.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.3)';
    });

    npcCard.addEventListener('click', () => {
      // If we have a class choice, show tailored DM options first
      if (classChoice) {
        renderTailoredDM(appTitle, content, store, renderHomeScreen, npcId, classChoice);
      } else {
        executeActivity('text', store, renderHomeScreen, npcId);
      }
    });

    content.appendChild(npcCard);
  });
}
function renderTailoredDM(
  appTitle: HTMLElement,
  content: HTMLElement,
  store: GameStore,
  renderHomeScreen: () => void,
  npcId: NpcId,
  classChoice: 'friendly' | 'dismissive' | 'major'
) {
  appTitle.textContent = 'Draft Message';
  content.innerHTML = '';

  const state = store.getState();
  const npc = NPC_DEFINITIONS[npcId];

  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 12px;';
  header.innerHTML = `<div style="font-size:11px; color:#d4a574;">Texting ${npc.name}</div>`;
  content.appendChild(header);

  // Build GOOD / NEUTRAL / BAD options so players can fix, keep neutral, or double down
  let options: Array<{ label: string; rapportDelta: number }>; 
  if (classChoice === 'dismissive') {
    // Player was dismissive in class
    options = [
      { label: 'Hey about earlier—I should’ve phrased that better. Want to sync?', rapportDelta: 2 }, // GOOD: make up
      { label: 'Let’s lock next steps—what do you want me to pick up?', rapportDelta: 0 },             // NEUTRAL
      { label: 'Look, it wasn’t a big deal. Let’s just move on.', rapportDelta: -1 },                 // BAD: double down
    ];
  } else if (classChoice === 'friendly') {
    // Player was friendly in class
    options = [
      { label: 'Loved your point—want me to draft that section tonight?', rapportDelta: 1 },          // GOOD: reinforce constructively
      { label: 'Nice work today. Free to chat tomorrow?', rapportDelta: 0 },                           // NEUTRAL
      { label: 'I think I’ll just handle things my way—chat later.', rapportDelta: -1 },              // BAD: cool down rapport
    ];
  } else {
    // Player used major-linked line in class
    options = [
      { label: 'I can apply my major angle and deliver a draft tonight.', rapportDelta: 1 },          // GOOD: concrete help
      { label: 'I’ll read through notes again—touch base later?', rapportDelta: 0 },                  // NEUTRAL
      { label: 'My approach is probably best—let me lead this solo.', rapportDelta: -1 },             // BAD: overconfident
    ];
  }

  const list = document.createElement('div');
  list.style.cssText = 'display:flex; flex-direction:column; gap:16px; margin-top: 8px;';

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `
      width: 100%; padding: 14px 16px; border: 3px solid #8b6f47; border-radius: 0;
      background: #5a4a35; color: #fbe9cf; text-align: left; cursor: pointer;
      font-family: 'Press Start 2P', monospace; font-size: 10px; line-height: 1.9;
    `;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      // Apply rapport and log
      let nextState = store.getState();
      const deltas: any = { rapport: { [npcId]: opt.rapportDelta }, time: 15 };
      nextState = applyDeltas(nextState, deltas);
      nextState = logActivity(nextState, {
        segment: 'bedroom',
        choiceId: `text-${npcId}`,
        summary: `Texted ${npc.name}: ${opt.label}`,
        deltas,
      });
      store.setState(nextState);

      // Close phone and show tailored text cutscene reflecting the drafted message
      closePhone();
      const frames = getEveningActivityCutscene('text', npcId);
      if (frames.length) {
        frames[0] = { ...frames[0], subtext: `You text: “${opt.label}”` };
        if (frames.length > 1) {
          if (opt.rapportDelta > 0) {
            frames[1] = {
              ...frames[1],
              text: 'Connection strengthened',
              subtext: `Your conversation with ${npc.name} went well. You feel closer.`,
              emoji: '🤝',
            };
          } else if (opt.rapportDelta === 0) {
            frames[1] = {
              ...frames[1],
              text: 'Kept things steady',
              subtext: `You and ${npc.name} stay aligned. No change, but communication helps.`,
              emoji: '💬',
            };
          } else {
            frames[1] = {
              ...frames[1],
              text: 'Tension lingers',
              subtext: `The exchange with ${npc.name} felt strained. Rapport may have dipped.`,
              emoji: '😕',
            };
          }
        }
      }
      createCutscene(document.body, {
        frames,
        canSkip: true,
        onComplete: () => {
          // Transition to recap like the standard text activity
          store.setState((prev) => ({ ...prev, currentScene: 'recap' }));
        },
      });
    });
    list.appendChild(btn);
  });

  const back = document.createElement('button');
  back.type = 'button';
  back.style.cssText = `
    margin-top: 12px; padding: 8px; border: 3px solid #8b6f47; border-radius: 0;
    background: #6a9e6a; color: #fbe9cf; cursor: pointer; font-size: 9px;
    font-family: 'Press Start 2P', monospace;
  `;
  back.textContent = 'Back';
  back.addEventListener('click', () => renderNPCSelection(appTitle, content, store, renderHomeScreen));

  content.appendChild(list);
  content.appendChild(back);
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
  // Ensure overlay is initialised and attached to provided root
  if (!overlayContainer) {
    initPhoneOverlay(store);
  }

  // Use the root element to host overlay if provided
  if (root && overlayContainer && !root.contains(overlayContainer)) {
    root.appendChild(overlayContainer);
  }

  // Open phone and register a close callback
  openPhone(store);
  (window as any).__phoneOverlayCloseCallback = onClose;
  // Return a cleanup function
  return () => {
    (window as any).__phoneOverlayCloseCallback = undefined;
    closePhone();
  };
};
