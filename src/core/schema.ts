import { z } from 'zod';
import { MAJOR_IDS, MEMORY_FLAG_IDS, NPC_IDS, SCENE_IDS, type NpcId } from './types';

export const statKeySchema = z.enum(['M', 'O', 'N', 'A', 'S', 'H']);
export const statValueSchema = z.number().int();
export const statBlockSchema = z.object({
  M: statValueSchema,
  O: statValueSchema,
  N: statValueSchema,
  A: statValueSchema,
  S: statValueSchema,
  H: statValueSchema,
});

export const majorIdSchema = z.enum(MAJOR_IDS);
export const npcIdSchema = z.enum(NPC_IDS);
export const memoryFlagIdSchema = z.enum(MEMORY_FLAG_IDS);
export const sceneIdSchema = z.enum(SCENE_IDS);

export const majorDefinitionSchema = z.object({
  id: majorIdSchema,
  name: z.string(),
  specialItem: z.object({
    name: z.string(),
    description: z.string(),
  }),
  startingStats: statBlockSchema,
  startingHunger: z.number().int(),
  startingMoney: z.number().int(),
});

export type MajorDefinition = z.infer<typeof majorDefinitionSchema>;

export const npcReplyOutcomeSchema = z.object({
  label: z.enum(['friendly', 'dismissive', 'major']),
  line: z.string(),
  rapportDelta: z.number().int(),
  auraDelta: z.number().int().optional(),
  networkingDelta: z.number().int().optional(),
  organisationDelta: z.number().int().optional(),
  skillsDelta: z.number().int().optional(),
  mobilityDelta: z.number().int().optional(),
  flag: memoryFlagIdSchema.optional(),
  onMatch: z
    .object({
      rapportDelta: z.number().int().optional(),
      networkingDelta: z.number().int().optional(),
      auraDelta: z.number().int().optional(),
      organisationDelta: z.number().int().optional(),
      skillsDelta: z.number().int().optional(),
      mobilityDelta: z.number().int().optional(),
      flag: memoryFlagIdSchema.optional(),
    })
    .optional(),
  flavor: z.string(),
});

export const npcDefinitionSchema = z.object({
  id: npcIdSchema,
  name: z.string(),
  focus: z.enum(['tech', 'medicine', 'science', 'law', 'arts']),
  majorAffinity: majorIdSchema,
  greeting: z.string(),
  replies: z.array(npcReplyOutcomeSchema),
  dmMessage: z.string(),
  dmResponses: z.object({
    friendly: z.object({
      line: z.string(),
      rapportDelta: z.number().int(),
      networkingDelta: z.number().int(),
    }),
    rude: z.object({
      line: z.string(),
      rapportDelta: z.number().int(),
      auraDelta: z.number().int(),
      flag: memoryFlagIdSchema,
    }),
  }),
});

export type NpcDefinition = z.infer<typeof npcDefinitionSchema>;
export type NpcReplyOutcomeInput = z.infer<typeof npcReplyOutcomeSchema>;

export const rapportMapSchema = z.object({
  bonsen: z.number().int(),
  zahir: z.number().int(),
  jiun: z.number().int(),
  anika: z.number().int(),
  jiawen: z.number().int(),
});

export const activityEntrySchema = z.object({
  time: z.string(),
  segment: sceneIdSchema,
  choiceId: z.string(),
  summary: z.string(),
  deltas: z.object({
    stats: statBlockSchema.partial(),
    hunger: z.number().int().optional(),
    money: z.number().int().optional(),
    time: z.number().int().optional(),
    rapport: rapportMapSchema.partial().optional(),
    flagsGained: z.array(memoryFlagIdSchema).optional(),
  }),
});

export const gameStateSchema = z.object({
  stats: statBlockSchema,
  hunger: z.number().int(),
  money: z.number().int(),
  timeMinutes: z.number().int(),
  currentScene: sceneIdSchema,
  major: majorIdSchema,
  specialItem: z.string(),
  rapport: rapportMapSchema,
  flags: z.set(memoryFlagIdSchema),
  activityLog: z.array(activityEntrySchema),
});

export type GameStateInput = z.infer<typeof gameStateSchema>;

export const validateNpcDefinitions = (data: Record<NpcId, unknown>) => {
  (Object.entries(data) as Array<[NpcId, unknown]>).forEach(([npcId, value]) => {
    const parsed = npcDefinitionSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(`Invalid NPC definition for ${npcId}: ${parsed.error.message}`);
    }
  });
};

export const validateMajorDefinitions = (data: Record<string, unknown>) => {
  (Object.entries(data) as Array<[string, unknown]>).forEach(([majorId, value]) => {
    const parsed = majorDefinitionSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(`Invalid major definition for ${majorId}: ${parsed.error.message}`);
    }
  });
};