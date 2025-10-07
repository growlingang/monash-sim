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
  { scene: 'evening-commute', next: 'bedroom' }, // Go back to bedroom after evening commute
];

export const getNextScene = (current: SceneId): SceneId | null => {
  const entry = SCENE_FLOW.find((item) => item.scene === current);
  return entry?.next ?? null;
};
