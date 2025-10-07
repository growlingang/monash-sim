export type StatKey = 'M' | 'O' | 'N' | 'A' | 'S' | 'H';

export type StatBlock = Record<StatKey, number>;

export const MAJOR_IDS = [
  'engineering',
  'medicine',
  'law',
  'it',
  'science',
  'arts',
] as const;

export type MajorId = (typeof MAJOR_IDS)[number];

export const NPC_IDS = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'] as const;

export type NpcId = (typeof NPC_IDS)[number];

export const MEMORY_FLAG_IDS = [
  'bonsen-custom-kit',
  'zahir-family-motivation',
  'jiun-lab-habit',
  'anika-moot-team',
  'jiawen-sketch-collab',
  'strained-dm-bonsen',
  'strained-dm-zahir',
  'strained-dm-jiun',
  'strained-dm-anika',
  'strained-dm-jiawen',
  'doomscroll-used',
] as const;

export type MemoryFlagId = (typeof MEMORY_FLAG_IDS)[number];

export interface MemoryFlag {
  id: MemoryFlagId;
  label: string;
  description: string;
}

export interface RapportMap {
  bonsen: number;
  zahir: number;
  jiun: number;
  anika: number;
  jiawen: number;
}

export const SCENE_IDS = [
  'main-menu',
  'character-creation',
  'onboarding',
  'bedroom',
  'phone',
  'morning-commute',
  'evening-commute',
  'tileset-test', // Test scene for tileset functionality
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export interface ActivityEntry {
  time: string; // HH:MM formatted string
  segment: SceneId;
  choiceId: string;
  summary: string;
  deltas: Partial<GameStateDeltas>;
}

export interface GameStateDeltas {
  stats: Partial<StatBlock>;
  hunger: number;
  money: number;
  time: number;
  rapport: Partial<RapportMap>;
  flagsGained: MemoryFlagId[];
}

export interface GameState {
  playerName: string;
  onboardingStep: number;
  stats: StatBlock;
  hunger: number; // Current fullness: 0 (starving) to stats.H (completely full)
  money: number;
  timeMinutes: number; // minutes since 07:00
  currentScene: SceneId;
  major: MajorId;
  specialItem: string;
  rapport: RapportMap;
  flags: Set<MemoryFlagId>;
  activityLog: ActivityEntry[];
  phoneAppsOpened?: {
    texts: boolean;
    map: boolean;
    notes: boolean;
    social: boolean;
    inventory: boolean;
  };
  doomscrollUsed?: boolean;
}
