import type { GameStore } from '../../core/store';
import type { SceneId } from '../../core/types';
import { renderCharacterCreation } from '../characterCreation';
import { renderBedroom } from '../bedroom';
import { renderPhone } from '../phone';
import { renderMorningCommute } from '../morningCommute';

export const mountScene = (scene: SceneId, root: HTMLElement, store: GameStore) => {
  switch (scene) {
    case 'character-creation':
      renderCharacterCreation(root, store);
      break;
    case 'bedroom':
      renderBedroom(root, store);
      break;
    case 'phone':
      renderPhone(root, store);
      break;
    case 'morning-commute':
      renderMorningCommute(root, store);
      break;
    default:
      root.innerHTML = `<p class="scene-placeholder">Scene <strong>${scene}</strong> not implemented yet.</p>`;
      break;
  }
};
