import type { GameStore } from '../../core/store';
import type { SceneId } from '../../core/types';
import { renderMainMenu } from '../mainMenu';
import { renderCharacterCreation } from '../characterCreation';
import { renderBedroom } from '../bedroom';
import { renderPhone } from '../phone';
import { renderMorningCommute } from '../morningCommute';
import { renderTilesetTest } from '../tilesetTest';

export const mountScene = (scene: SceneId, root: HTMLElement, store: GameStore) => {
  switch (scene) {
    case 'main-menu':
      renderMainMenu(root, store);
      break;
    case 'character-creation':
      renderCharacterCreation(root, store);
      break;
    case 'bedroom':
      // Async call - bedroom now loads sprites
      void renderBedroom(root, store);
      break;
    case 'phone':
      renderPhone(root, store);
      break;
    case 'morning-commute':
      renderMorningCommute(root, store);
      break;
    case 'tileset-test':
      // Async call - tileset test loads sprites
      void renderTilesetTest(root, store);
      break;
    default:
      root.innerHTML = `<p class="scene-placeholder">Scene <strong>${scene}</strong> not implemented yet.</p>`;
      break;
  }
};
