import type { SceneId } from '../core/types';

export interface SceneTransition {
  scene: SceneId;
  next: SceneId | null;
}

export const SCENE_FLOW: SceneTransition[] = [
  { scene: 'character-creation', next: 'bedroom' },
  { scene: 'bedroom', next: 'morning-commute' },
  { scene: 'phone', next: 'morning-commute' },
  { scene: 'morning-commute', next: 'evening-commute' },
  { scene: 'evening-commute', next: 'evening-activity' },
  { scene: 'evening-activity', next: null }, // End of Day 1 flow
];

export const getNextScene = (current: SceneId): SceneId | null => {
  const entry = SCENE_FLOW.find((item) => item.scene === current);
  return entry?.next ?? null;
};
