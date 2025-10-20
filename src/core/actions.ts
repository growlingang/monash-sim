import type { PlayerSprite } from '../sprites/playerSprite';
import type { MajorId } from './types';

export interface PlayerState {
  sprite: PlayerSprite;
  major: MajorId;
  name: string;
}

export type GameAction = 
  | { type: 'UPDATE_PLAYER'; payload: PlayerSprite }
  | { type: 'SET_MAJOR'; payload: MajorId }
  | { type: 'SET_NAME'; payload: string };