import type { GameState, MajorId, MemoryFlagId } from '../core/types';

const SAVE_KEY = 'monash-sim-save';
const AUTOSAVE_KEY = 'monash-sim-autosave';

export interface SaveData {
  version: string;
  timestamp: number;
  state: SerializedGameState;
}

// Serialized version of GameState (Set converted to array)
interface SerializedGameState extends Omit<GameState, 'flags'> {
  flags: MemoryFlagId[];
}

/**
 * Save the current game state to localStorage
 */
export const saveGame = (state: GameState, isAutoSave = false): boolean => {
  try {
    const serialized: SerializedGameState = {
      ...state,
      flags: Array.from(state.flags),
    };

    const saveData: SaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      state: serialized,
    };

    const key = isAutoSave ? AUTOSAVE_KEY : SAVE_KEY;
    localStorage.setItem(key, JSON.stringify(saveData));
    
    console.log(`✅ Game ${isAutoSave ? 'auto-' : ''}saved successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save game:', error);
    return false;
  }
};

/**
 * Load a saved game from localStorage
 */
export const loadGame = (useAutoSave = false): GameState | null => {
  try {
    const key = useAutoSave ? AUTOSAVE_KEY : SAVE_KEY;
    const saved = localStorage.getItem(key);
    
    if (!saved) {
      console.log(`ℹ️ No ${useAutoSave ? 'auto-' : ''}save found`);
      return null;
    }

    const saveData: SaveData = JSON.parse(saved);
    const state: GameState = {
      ...saveData.state,
      flags: new Set(saveData.state.flags as MemoryFlagId[]),
    };

    console.log(`✅ Game loaded from ${useAutoSave ? 'auto-' : ''}save (${new Date(saveData.timestamp).toLocaleString()})`);
    return state;
  } catch (error) {
    console.error('❌ Failed to load game:', error);
    return null;
  }
};

/**
 * Check if a save exists
 */
export const hasSave = (): boolean => {
  return localStorage.getItem(SAVE_KEY) !== null;
};

/**
 * Check if an autosave exists
 */
export const hasAutoSave = (): boolean => {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
};

/**
 * Delete the current save
 */
export const deleteSave = (): void => {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(AUTOSAVE_KEY);
  console.log('🗑️ Save deleted');
};

/**
 * Auto-save when certain scenes are reached
 */
export const autoSaveOnScene = (state: GameState): void => {
  // Auto-save when player reaches the bedroom scene
  if (state.currentScene === 'bedroom') {
    saveGame(state, true);
  }
};

/**
 * Get save metadata without loading the full state
 */
export const getSaveMetadata = (): { timestamp: number; major: MajorId; scene: string } | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const saveData: SaveData = JSON.parse(saved);
    return {
      timestamp: saveData.timestamp,
      major: saveData.state.major,
      scene: saveData.state.currentScene,
    };
  } catch {
    return null;
  }
};
