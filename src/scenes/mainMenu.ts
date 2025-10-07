import type { GameStore } from '../core/store';
import { hasSave, loadGame, getSaveMetadata, deleteSave } from '../utils/saveSystem';
import { createInitialGameState } from '../core/gameState';

export const renderMainMenu = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'main-menu';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  // Title section
  const title = document.createElement('div');
  title.className = 'main-menu__title';
  title.style.cssText = `
    text-align: center;
    margin-bottom: 40px;
    color: white;
  `;
  title.innerHTML = `
    <h1 style="font-size: 48px; margin: 0 0 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
      Monash Uni Life Sim
    </h1>
    <p style="font-size: 18px; margin: 0; opacity: 0.9;">
      Experience University Life
    </p>
  `;

  // Menu buttons container
  const menuContainer = document.createElement('div');
  menuContainer.className = 'main-menu__buttons';
  menuContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 400px;
  `;

  // Check if save exists
  const saveExists = hasSave();
  const saveMetadata = getSaveMetadata();

  // New Game button
  const newGameBtn = createMenuButton('New Game', '🎮');
  newGameBtn.addEventListener('click', () => {
    if (saveExists && !confirm('Starting a new game will overwrite your current save. Continue?')) {
      return;
    }
    // Delete old save and start fresh
    deleteSave();
    // Reset to initial state and start character creation
    const currentState = store.getState();
    const newState = createInitialGameState(currentState.major);
    // Set scene to character-creation instead of main-menu
    store.setState({ ...newState, currentScene: 'character-creation' });
  });

  // Continue button (only if save exists)
  let continueBtn: HTMLButtonElement | null = null;
  if (saveExists && saveMetadata) {
    continueBtn = createMenuButton('Continue', '▶️');
    const saveInfo = document.createElement('div');
    saveInfo.style.cssText = `
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      margin-top: -10px;
      margin-bottom: 5px;
      text-align: center;
    `;
    const saveDate = new Date(saveMetadata.timestamp);
    saveInfo.textContent = `Last played: ${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}`;
    
    continueBtn.addEventListener('click', () => {
      const loadedState = loadGame();
      if (loadedState) {
        store.setState(loadedState);
      } else {
        alert('Failed to load save game. Please start a new game.');
      }
    });
  }

  // Multiplayer button (coming soon)
  const multiplayerBtn = createMenuButton('Multiplayer', '👥', true);
  multiplayerBtn.addEventListener('click', () => {
    alert('Multiplayer mode is under development! Stay tuned for future updates.');
  });

  // Settings button (coming soon)
  const settingsBtn = createMenuButton('Settings', '⚙️', true);
  settingsBtn.addEventListener('click', () => {
    alert('Settings menu is under development! Stay tuned for future updates.');
  });

  // Quit button (for web, this just shows a message)
  const quitBtn = createMenuButton('Quit', '🚪');
  quitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit?')) {
      window.close();
      // For browsers that don't allow window.close()
      setTimeout(() => {
        alert('Please close the browser tab to exit the game.');
      }, 100);
    }
  });

  // Append buttons
  menuContainer.appendChild(newGameBtn);
  if (continueBtn && saveMetadata) {
    const saveInfoDiv = document.createElement('div');
    saveInfoDiv.appendChild(continueBtn);
    const saveInfo = document.createElement('div');
    saveInfo.style.cssText = `
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      text-align: center;
      margin-top: 5px;
    `;
    const saveDate = new Date(saveMetadata.timestamp);
    saveInfo.textContent = `${saveMetadata.scene} • ${saveDate.toLocaleDateString()}`;
    saveInfoDiv.appendChild(saveInfo);
    menuContainer.appendChild(saveInfoDiv);
  }
  menuContainer.appendChild(multiplayerBtn);
  menuContainer.appendChild(settingsBtn);
  menuContainer.appendChild(quitBtn);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'main-menu__footer';
  footer.style.cssText = `
    position: absolute;
    bottom: 20px;
    text-align: center;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
  `;
  footer.textContent = '© 2025 Team GrowlinGang';

  container.appendChild(title);
  container.appendChild(menuContainer);
  container.appendChild(footer);
  root.appendChild(container);
};

/**
 * Helper function to create styled menu buttons
 */
const createMenuButton = (text: string, icon: string, disabled = false): HTMLButtonElement => {
  const button = document.createElement('button');
  button.className = 'main-menu__button';
  button.type = 'button';
  
  const baseStyle = `
    padding: 15px 30px;
    font-size: 18px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
  `;

  if (disabled) {
    button.style.cssText = baseStyle + `
      background: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.5);
    `;
    button.innerHTML = `
      <span>${icon}</span>
      <span>${text}</span>
      <span style="font-size: 11px; opacity: 0.7;">(Coming Soon)</span>
    `;
  } else {
    button.style.cssText = baseStyle + `
      background: white;
      color: #667eea;
    `;
    button.innerHTML = `
      <span>${icon}</span>
      <span>${text}</span>
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(1px)';
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-2px)';
    });
  }

  return button;
};
