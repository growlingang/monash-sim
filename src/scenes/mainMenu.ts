import type { GameStore } from '../core/store';
import { hasSave, loadGame, getSaveMetadata, deleteSave } from '../utils/saveSystem';
import { createInitialGameState } from '../core/gameState';
import { getAudioSettings, startBackgroundMusic } from '../utils/audioManager';

const MAIN_MENU_BG_URL = 'http://localhost:3845/assets/83620c84c4b12a561dce0aeab7a621382516f9c8.png';

interface MenuItemInstance {
  id: string;
  button: HTMLButtonElement;
  action: () => void;
}

export const renderMainMenu = (root: HTMLElement, store: GameStore) => {
  root.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'main-menu';
  wrapper.tabIndex = 0;

  const background = document.createElement('div');
  background.className = 'main-menu__bg';
  background.style.backgroundImage = `url('${MAIN_MENU_BG_URL}')`;

  const overlay = document.createElement('div');
  overlay.className = 'main-menu__overlay';

  const content = document.createElement('div');
  content.className = 'main-menu__content';

  const logo = document.createElement('div');
  logo.className = 'main-menu__logo';
  logo.innerHTML = `
    <span class="main-menu__logo-word">Monash</span>
    <span class="main-menu__logo-word">Sim</span>
  `;

  const menuList = document.createElement('ul');
  menuList.className = 'main-menu__list';
  menuList.setAttribute('role', 'menu');

  const footer = document.createElement('div');
  footer.className = 'main-menu__footer';
  footer.textContent = '© 2025 Team GrowlinGang';

  // Add music control button if music is not playing
  const audioSettings = getAudioSettings();
  if (!audioSettings.isPlaying) {
    const musicButton = document.createElement('button');
    musicButton.className = 'main-menu__music-button';
    musicButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: #8b6f47;
      color: #fbe9cf;
      border: 3px solid #5a4a35;
      padding: 12px 20px;
      border-radius: 0;
      cursor: pointer;
      font-size: 10px;
      font-weight: bold;
      font-family: 'Press Start 2P', monospace;
      box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
      transition: all 0.1s ease;
      image-rendering: pixelated;
    `;
    musicButton.innerHTML = '🎵 Start Music';
    musicButton.addEventListener('mouseenter', () => {
      musicButton.style.background = '#a08560';
      musicButton.style.transform = 'translate(-2px, -2px)';
      musicButton.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.5)';
    });
    musicButton.addEventListener('mouseleave', () => {
      musicButton.style.background = '#8b6f47';
      musicButton.style.transform = 'translate(0, 0)';
      musicButton.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.5)';
    });
    musicButton.addEventListener('click', async () => {
      try {
        await startBackgroundMusic();
        musicButton.innerHTML = '🎵 Playing';
        musicButton.style.background = '#6a9e6a';
        musicButton.style.border = '3px solid #4a7a4a';
        musicButton.disabled = true;
        console.log('🎵 Background music started from main menu');
      } catch (error) {
        console.error('Failed to start music:', error);
        alert('Failed to start music. Please try again.');
      }
    });
    wrapper.appendChild(musicButton);
  }

  const saveExists = hasSave();
  const saveMetadata = getSaveMetadata();

  const menuItems: MenuItemInstance[] = [];
  let selectedIndex = 0;

  const selectIndex = (index: number, focus = false) => {
    if (!menuItems.length) return;
    const boundedIndex = ((index % menuItems.length) + menuItems.length) % menuItems.length;
    selectedIndex = boundedIndex;
    menuItems.forEach((item, idx) => {
      if (idx === boundedIndex) {
        item.button.classList.add('is-selected');
        if (focus && document.activeElement !== item.button) {
          item.button.focus();
        }
      } else {
        item.button.classList.remove('is-selected');
      }
    });
  };

  const addMenuItem = (
    id: string,
    label: string,
    onSelect: () => void,
    options: { subtitle?: string } = {},
  ) => {
    const entry = document.createElement('li');
    entry.className = 'main-menu__entry';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'main-menu__item';
    button.dataset.menuId = id;
    button.setAttribute('role', 'menuitem');
    button.innerHTML = `
      <span class="main-menu__item-arrow">&gt;</span>
      <span class="main-menu__item-label">${label}</span>
    `;

    button.addEventListener('mouseenter', () => {
      selectIndex(menuItems.findIndex((item) => item.button === button));
    });

    button.addEventListener('focus', () => {
      selectIndex(menuItems.findIndex((item) => item.button === button));
    });

    button.addEventListener('click', () => {
      onSelect();
    });

    entry.appendChild(button);

    if (options.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'main-menu__item-subtitle';
      subtitle.textContent = options.subtitle;
      entry.appendChild(subtitle);
    }

    menuList.appendChild(entry);
    menuItems.push({ id, button, action: onSelect });
  };

  addMenuItem('new-game', 'Story Mode', () => {
    if (saveExists && !confirm('Starting a new game will overwrite your current save. Continue?')) {
      return;
    }

    deleteSave();
    const currentState = store.getState();
    const newState = createInitialGameState(currentState.major);
    store.setState({ ...newState, currentScene: 'character-creation' });
  }, {
    subtitle: 'Begin a new day one adventure',
  });

  if (saveExists && saveMetadata) {
    const saveDate = new Date(saveMetadata.timestamp);
    addMenuItem('continue', 'Continue', () => {
      const loadedState = loadGame();
      if (loadedState) {
        store.setState(loadedState);
      } else {
        alert('Failed to load save game. Please start a new game.');
      }
    }, {
      subtitle: `${saveMetadata.scene} • ${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}`,
    });
  }

  addMenuItem('settings', 'Settings', () => {
    alert('Settings menu is under development! Stay tuned for future updates.');
  }, {
    subtitle: 'Adjust audio, gameplay and more',
  });

  addMenuItem('quit', 'Exit', () => {
    if (confirm('Are you sure you want to quit?')) {
      window.close();
      setTimeout(() => {
        alert('Please close the browser tab to exit the game.');
      }, 100);
    }
  }, {
    subtitle: 'Leave the sim and return later',
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!menuItems.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectIndex(selectedIndex + 1, true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectIndex(selectedIndex - 1, true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      menuItems[selectedIndex].action();
    }
  };

  wrapper.addEventListener('keydown', handleKeyDown);

  content.appendChild(logo);
  content.appendChild(menuList);
  content.appendChild(footer);

  wrapper.appendChild(background);
  wrapper.appendChild(overlay);
  wrapper.appendChild(content);

  root.appendChild(wrapper);

  requestAnimationFrame(() => {
    selectIndex(0, true);
    wrapper.focus();
  });
};
