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
  { scene: 'morning-commute', next: 'campus-exploration' },
  { scene: 'campus-exploration', next: 'group-meeting' },
  { scene: 'group-meeting', next: 'assignment-reveal' },
  { scene: 'assignment-reveal', next: 'phone-tutorial' },
  { scene: 'phone-tutorial', next: 'evening-commute' },
  { scene: 'evening-commute', next: 'evening-activity' },
  { scene: 'evening-activity', next: 'recap' },
  { scene: 'recap', next: null },
];

export const getNextScene = (current: SceneId): SceneId | null => {
  const entry = SCENE_FLOW.find((item) => item.scene === current);
  return entry?.next ?? null;
};
