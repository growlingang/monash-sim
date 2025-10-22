export interface MinigameResult {
  success: boolean;
  completed: boolean; // false if player quit/interrupted
  extraTimePenalty?: number; // Additional time penalty (e.g., bus delay)
  penaltyReason?: string; // Narrative reason for extra time
}

export interface MinigameConfig {
  playerStats: {
    mobility: number;
    organisation: number;
    networking: number;
    aura: number;
    skills: number;
  };
  playerSprite?: any; // Optional player sprite data
}

export type MinigameCleanup = () => void;

export interface Minigame {
  mount: (container: HTMLElement, config: MinigameConfig) => Promise<MinigameResult>;
  cleanup?: MinigameCleanup;
}
