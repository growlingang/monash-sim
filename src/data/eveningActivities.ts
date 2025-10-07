import { z } from 'zod';
import { statBlockSchema } from '../core/schema';
import type { NpcId } from '../core/types';

export const eveningActivityOutcomeSchema = z.object({
  id: z.enum(['success', 'auto']),
  description: z.string(),
  timeDelta: z.number().int(),
  hungerDelta: z.number().int().optional(),
  moneyDelta: z.number().int().optional(),
  statDeltas: statBlockSchema.partial().optional(),
  rapportDeltas: z
    .object({
      bonsen: z.number().int().optional(),
      zahir: z.number().int().optional(),
      jiun: z.number().int().optional(),
      anika: z.number().int().optional(),
      jiawen: z.number().int().optional(),
    })
    .optional(),
});

export const eveningActivitySchema = z.object({
  id: z.enum(['eat', 'rest', 'text', 'doomscroll']),
  label: z.string(),
  description: z.string(),
  requirements: z.object({
    money: z.number().int().optional(),
    hungerMin: z.number().int().optional(),
    hungerMax: z.number().int().optional(),
    time: z.number().int(),
    doomscrollUsed: z.boolean().optional(),
  }),
  outcome: eveningActivityOutcomeSchema,
  npcTarget: z.enum(['bonsen', 'zahir', 'jiun', 'anika', 'jiawen']).optional(),
});

export type EveningActivityDefinition = z.infer<typeof eveningActivitySchema>;
export type EveningActivityOutcome = z.infer<typeof eveningActivityOutcomeSchema>;

const rawEveningActivities: EveningActivityDefinition[] = [
  {
    id: 'eat',
    label: 'Eat',
    description: 'Grab a meal to restore your energy',
    requirements: {
      money: 8,
      hungerMax: 9,
      time: 30,
    },
    outcome: {
      id: 'success',
      description: 'You enjoy a satisfying meal and feel refreshed.',
      timeDelta: 30,
      hungerDelta: 10, // Sets hunger to 10
      moneyDelta: -8,
      statDeltas: { A: 1 },
    },
  },
  {
    id: 'rest',
    label: 'Rest',
    description: 'Take some time to relax and recover',
    requirements: {
      hungerMin: 0,
      hungerMax: 8,
      time: 30,
    },
    outcome: {
      id: 'success',
      description: 'You take a peaceful break and feel more energized.',
      timeDelta: 30,
      hungerDelta: 2,
      statDeltas: { A: 1 },
    },
  },
  {
    id: 'text',
    label: 'Text Someone',
    description: 'Send a message to one of your teammates',
    requirements: {
      time: 30,
    },
    outcome: {
      id: 'success',
      description: 'You send a supportive message and strengthen your connection.',
      timeDelta: 30,
      statDeltas: { N: 1 },
    },
    npcTarget: 'bonsen', // Will be set dynamically
  },
  {
    id: 'doomscroll',
    label: 'Doomscroll',
    description: 'Spend time browsing social media',
    requirements: {
      time: 30,
      doomscrollUsed: false,
    },
    outcome: {
      id: 'success',
      description: 'You scroll through social media and feel more confident.',
      timeDelta: 30,
      statDeltas: { A: 1 },
    },
  },
];

export const EVENING_ACTIVITY_DEFINITIONS = rawEveningActivities.map((activity) =>
  eveningActivitySchema.parse(activity),
);

// Helper function to get available activities based on current state
export const getAvailableActivities = (
  state: {
    money: number;
    hunger: number;
    timeMinutes: number;
    doomscrollUsed?: boolean;
    textHistory?: Set<NpcId>;
  },
): EveningActivityDefinition[] => {
  const available: EveningActivityDefinition[] = [];
  const timeRemaining = 15 * ((22 - 7) * 4) - state.timeMinutes; // Time until 22:00

  for (const activity of EVENING_ACTIVITY_DEFINITIONS) {
    // Check time requirement
    if (timeRemaining < activity.requirements.time) {
      continue;
    }

    // Check money requirement
    if (activity.requirements.money && state.money < activity.requirements.money) {
      continue;
    }

    // Check hunger requirements
    if (activity.requirements.hungerMin !== undefined && state.hunger < activity.requirements.hungerMin) {
      continue;
    }
    if (activity.requirements.hungerMax !== undefined && state.hunger > activity.requirements.hungerMax) {
      continue;
    }

    // Check doomscroll usage
    if (activity.requirements.doomscrollUsed === false && state.doomscrollUsed) {
      continue;
    }

    // For text activity, check if NPC was already texted today
    if (activity.id === 'text' && state.textHistory) {
      // We'll handle NPC selection in the UI
      available.push(activity);
    } else {
      available.push(activity);
    }
  }

  return available;
};
