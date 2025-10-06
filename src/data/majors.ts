import { majorDefinitionSchema, type MajorDefinition } from '../core/schema';
import type { MajorId } from '../core/types';

const rawMajorDefinitions = {
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    specialItem: {
      name: 'Pocket toolbox',
      description: 'Compact kit packed with allen keys, soldering iron tips, and a lucky spanner.',
    },
    startingStats: { M: 6, O: 5, N: 4, A: 4, S: 7, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
  medicine: {
    id: 'medicine',
    name: 'Medicine',
    specialItem: {
      name: 'Stethoscope',
      description: 'Polished chrome stethoscope engraved with a family motto.',
    },
    startingStats: { M: 5, O: 6, N: 4, A: 5, S: 6, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
  law: {
    id: 'law',
    name: 'Law',
    specialItem: {
      name: 'Case compendium',
      description: 'Tab-indexed folder full of case law summaries and sticky notes.',
    },
    startingStats: { M: 4, O: 6, N: 5, A: 6, S: 5, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
  it: {
    id: 'it',
    name: 'IT',
    specialItem: {
      name: 'Custom laptop',
      description: 'Water-cooled ultrabook plastered with hackathon stickers.',
    },
    startingStats: { M: 5, O: 5, N: 5, A: 4, S: 6, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
  science: {
    id: 'science',
    name: 'Science',
    specialItem: {
      name: 'Lab kit',
      description: 'Portable case with sample vials, field notebook, and safety goggles.',
    },
    startingStats: { M: 5, O: 5, N: 4, A: 5, S: 7, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
  arts: {
    id: 'arts',
    name: 'Arts',
    specialItem: {
      name: 'Sketch journal',
      description: 'Dog-eared sketchbook filled with color swatches and concept doodles.',
    },
    startingStats: { M: 4, O: 4, N: 6, A: 7, S: 5, H: 10 },
    startingHunger: 10,
    startingMoney: 60,
  },
} satisfies Record<MajorId, MajorDefinition>;

export const MAJOR_DEFINITIONS: Record<MajorId, MajorDefinition> = Object.fromEntries(
  Object.entries(rawMajorDefinitions).map(([id, def]) => [id as MajorId, majorDefinitionSchema.parse(def)]),
) as Record<MajorId, MajorDefinition>;
