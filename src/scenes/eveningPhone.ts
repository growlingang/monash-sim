import type { GameStore } from '../core/store';
import { openPhone } from '../ui/phoneOverlay';

export const renderEveningPhone = (_root: HTMLElement, store: GameStore) => {
  // Evening phone is just the phone overlay system
  // which already has the Activities app when in bedroom scene
  openPhone(store);
  
  // Set up a way to return to bedroom when phone is closed
  // (This scene exists mainly for navigation/scene management)
};


