import { MAJOR_DEFINITIONS } from '../data/majors';
import type {
  ActivityEntry,
  GameState,
  GameStateDeltas,
  MajorId,
  MemoryFlagId,
  NpcId,
  RapportMap,
  SceneId,
} from './types';

export const START_OF_DAY_MINUTES = 0; // minutes since 07:00
export const RECAP_TRIGGER_MINUTES = 15 * ((22 - 7) * 4); // 15 min increments up to 22:00

export const RAPPORT_MIN = -3;
export const RAPPORT_MAX = 5;
export const HUNGER_MIN = 0;
export const HUNGER_MAX = 10;
export const STAT_MIN = 0;
export const STAT_MAX = 10;

export const createEmptyRapport = (): RapportMap => ({
  bonsen: 0,
  zahir: 0,
  jiun: 0,
  anika: 0,
  jiawen: 0,
});

export const createInitialGameState = (major: MajorId): GameState => {
  const majorDef = MAJOR_DEFINITIONS[major];
  return {
    playerName: '',
    stats: { ...majorDef.startingStats },
    hunger: majorDef.startingHunger,
    money: majorDef.startingMoney,
    timeMinutes: START_OF_DAY_MINUTES,
    currentScene: 'main-menu',
    major,
    specialItem: majorDef.specialItem.name,
    rapport: createEmptyRapport(),
    flags: new Set<MemoryFlagId>(),
    activityLog: [],
  };
};

export const formatMinutes = (minutesSinceStart: number): string => {
  const totalMinutes = 7 * 60 + minutesSinceStart;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const applyDeltas = (state: GameState, deltas: Partial<GameStateDeltas>): GameState => {
  const next: GameState = {
    ...state,
    stats: { ...state.stats },
    rapport: { ...state.rapport },
    flags: new Set(state.flags),
    activityLog: [...state.activityLog],
  };

  if (deltas.stats) {
    for (const key of Object.keys(deltas.stats) as Array<keyof GameStateDeltas['stats']>) {
      const statKey = key as keyof GameState['stats'];
      const current = state.stats[statKey];
      const delta = deltas.stats[statKey] ?? 0;
      next.stats[statKey] = clamp(current + delta, STAT_MIN, STAT_MAX);
    }
  }

  if (typeof deltas.hunger === 'number') {
    // hunger field = current fullness (0 to stats.H)
    // H stat = max hunger capacity (stays constant unless explicitly changed via stats delta)
    next.hunger = clamp(state.hunger + deltas.hunger, HUNGER_MIN, next.stats.H);
  }

  if (typeof deltas.money === 'number') {
    next.money = Math.max(0, state.money + deltas.money);
  }

  if (typeof deltas.time === 'number') {
    next.timeMinutes = Math.max(0, state.timeMinutes + deltas.time);
  }

  if (deltas.rapport) {
    for (const npc of Object.keys(deltas.rapport) as NpcId[]) {
      const delta = deltas.rapport[npc] ?? 0;
      const current = state.rapport[npc];
      next.rapport[npc] = clamp(current + delta, RAPPORT_MIN, RAPPORT_MAX);
    }
  }

  if (deltas.flagsGained) {
    deltas.flagsGained.forEach((flag) => next.flags.add(flag));
  }

  return next;
};

export const logActivity = (
  state: GameState,
  entry: Omit<ActivityEntry, 'time'> & { time?: string },
): GameState => {
  const time = entry.time ?? formatMinutes(state.timeMinutes);
  const nextEntry: ActivityEntry = { ...entry, time };
  return {
    ...state,
    activityLog: [...state.activityLog, nextEntry],
  };
};

export const transitionScene = (state: GameState, nextScene: SceneId): GameState => ({
  ...state,
  currentScene: nextScene,
});
