import { z } from 'zod';
import { statBlockSchema } from '../core/schema';

export const commuteOutcomeSchema = z.object({
  id: z.enum(['success', 'failure', 'auto']),
  description: z.string(),
  timeDelta: z.number().int(),
  hungerDelta: z.number().int(),
  moneyDelta: z.number().int(),
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

export const commuteDefinitionSchema = z.object({
  id: z.enum(['walk', 'bus', 'drive']),
  label: z.string(),
  cost: z.number().int(),
  baseTime: z.number().int(),
  hungerCost: z.number().int(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  successOutcome: commuteOutcomeSchema,
  failureOutcome: commuteOutcomeSchema,
  autoOutcome: commuteOutcomeSchema.optional(),
});

export type CommuteDefinition = z.infer<typeof commuteDefinitionSchema>;
export type CommuteOutcome = z.infer<typeof commuteOutcomeSchema>;

const rawCommuteDefinitions: CommuteDefinition[] = [
  {
    id: 'walk',
    label: 'Walk',
    cost: 0,
    baseTime: 45,
    hungerCost: 0,
    difficulty: 'hard',
    successOutcome: {
      id: 'success',
      description: 'You weave through traffic and reach campus energized.',
      timeDelta: 45,
      hungerDelta: 0,
      moneyDelta: 0,
      statDeltas: { M: 1 },
    },
    failureOutcome: {
      id: 'failure',
      description: 'You got hit by a car but survived with minor injuries—the delay cost you time.',
      timeDelta: 60,
      hungerDelta: -1,
      moneyDelta: 0,
      statDeltas: { M: -1 },
    },
    autoOutcome: {
      id: 'auto',
      description: 'After several close calls, you stumble onto campus exhausted and shaken.',
      timeDelta: 75,
      hungerDelta: -1,
      moneyDelta: 0,
      statDeltas: { M: -1 },
    },
  },
  {
    id: 'bus',
    label: 'Bus / Tram',
    cost: -5,
    baseTime: 35,
    hungerCost: -1,
    difficulty: 'medium',
    successOutcome: {
      id: 'success',
      description: 'You balance like a pro and hop off refreshed.',
      timeDelta: 35,
      hungerDelta: -1,
      moneyDelta: -5,
      statDeltas: { N: 1 },
    },
    failureOutcome: {
      id: 'failure',
      description: 'You fell on the bus and bumped your head—cleaning up the injury made you late.',
      timeDelta: 55,
      hungerDelta: -2,
      moneyDelta: -5,
      statDeltas: { A: -1 },
    },
  },
  {
    id: 'drive',
    label: 'Drive',
    cost: -12,
    baseTime: 30,
    hungerCost: -1,
    difficulty: 'easy',
    successOutcome: {
      id: 'success',
      description: 'Clear roads and a clean parking job.',
      timeDelta: 30,
      hungerDelta: -1,
      moneyDelta: -12,
      statDeltas: { O: 1 },
    },
    failureOutcome: {
      id: 'failure',
      description: 'You scraped the bumper and had to deal with the damage—arrived flustered.',
      timeDelta: 45,
      hungerDelta: -1,
      moneyDelta: -12,
      statDeltas: { A: -1, M: -1 },
    },
    autoOutcome: {
      id: 'auto',
      description: 'After multiple parking attempts, you finally squeeze in—embarrassed but safe.',
      timeDelta: 50,
      hungerDelta: -1,
      moneyDelta: -12,
      statDeltas: { A: -1 },
    },
  },
];

export const COMMUTE_DEFINITIONS = rawCommuteDefinitions.map((entry) =>
  commuteDefinitionSchema.parse(entry),
);