import { createInitialGameState } from './gameState';
import type { GameState, MajorId } from './types';
import { autoSaveOnScene } from '../utils/saveSystem';

export type StateListener = (next: GameState, previous: GameState) => void;

export class GameStore {
  private state: GameState;
  private listeners = new Set<StateListener>();

  constructor(initialMajor: MajorId) {
    this.state = createInitialGameState(initialMajor);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setState(updater: GameState | ((previous: GameState) => GameState)): void {
    const previous = this.state;
    const next = typeof updater === 'function' ? (updater as (p: GameState) => GameState)(previous) : updater;

    if (next === previous) {
      return;
    }

    this.state = next;
    
    // Auto-save when reaching bedroom scene
    autoSaveOnScene(next);
    
    this.listeners.forEach((listener) => listener(this.state, previous));
  }

  reset(major: MajorId): void {
    const previous = this.state;
    this.state = createInitialGameState(major);
    this.listeners.forEach((listener) => listener(this.state, previous));
  }
}

export const createGameStore = (major: MajorId): GameStore => new GameStore(major);
