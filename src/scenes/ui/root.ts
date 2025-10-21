import type { GameStore } from '../../core/store';
import type { SceneId } from '../../core/types';
import { renderMainMenu } from '../mainMenu';
import { renderCharacterCreation } from '../characterCreation';
import { renderOnboarding } from '../onboarding';
import { renderBedroom } from '../bedroom';
import { renderPhone } from '../phone';
import { renderMorningPhone } from '../morningPhone';
import { renderEveningPhone } from '../eveningPhone';
import { renderMorningCommute } from '../morningCommute';
import { renderEveningCommute } from '../eveningCommute';
import { renderEveningActivity } from '../eveningActivity';
import { renderRecap } from '../recap';
import { renderTilesetTest } from '../tilesetTest';
import { renderCampusLTB } from '../campusLTB.ts';
import { renderLTBinside } from '../LTBinside.ts';
import { renderGroupMeeting } from '../groupMeeting.ts';

export const mountScene = (scene: SceneId, root: HTMLElement, store: GameStore) => {
    switch (scene) {
        case 'main-menu':
            renderMainMenu(root, store);
            break;
        case 'character-creation':
            renderCharacterCreation(root, store);
            break;
        case 'onboarding':
            renderOnboarding(root, store);
            break;
        case 'bedroom':
            // Async call - bedroom now loads sprites
            void renderBedroom(root, store);
            break;
        case 'phone':
            renderPhone(root, store);
            break;
        case 'morning-phone':
            renderMorningPhone(root, store);
            break;
        case 'evening-phone':
            renderEveningPhone(root, store);
            break;
        case 'morning-commute':
            renderMorningCommute(root, store);
            break;
        case 'campus-ltb':
            void renderCampusLTB(root, store);
            break;
        case 'ltb-inside':
            void renderLTBinside(root, store);
            break;
        case 'group-meeting':
            void renderGroupMeeting(root, store);
            break;
        case 'evening-commute':
            renderEveningCommute(root, store);
            break;
        case 'evening-activity':
            renderEveningActivity(root, store);
            break;
        case 'recap':
            renderRecap(root, store);
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
