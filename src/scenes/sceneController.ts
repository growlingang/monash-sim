import type { SceneId } from '../core/types';

export interface SceneTransition {
    scene: SceneId;
    next: SceneId | null;
}

export const SCENE_FLOW: SceneTransition[] = [
    { scene: 'main-menu', next: 'character-creation' },
    { scene: 'character-creation', next: 'onboarding' },
    { scene: 'onboarding', next: 'bedroom' },
    { scene: 'bedroom', next: 'morning-commute' },
    { scene: 'phone', next: 'morning-commute' },
    { scene: 'morning-commute', next: 'campus-ltb' },
    { scene: 'campus-ltb', next: 'group-meeting' },
    { scene: 'group-meeting', next: 'evening-commute' },
    { scene: 'evening-commute', next: 'bedroom' },
];

export const getNextScene = (current: SceneId): SceneId | null => {
    const entry = SCENE_FLOW.find((item) => item.scene === current);
    return entry?.next ?? null;
};
