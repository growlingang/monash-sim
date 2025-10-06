import { npcDefinitionSchema, type NpcDefinition } from '../core/schema';
import type { NpcId } from '../core/types';

const rawNpcDefinitions = {
  bonsen: {
    id: 'bonsen',
    name: 'Bonsen',
    focus: 'tech',
    majorAffinity: 'it',
    greeting: "Hey! I’m Bonsen. If something breaks, hand it to me.",
    replies: [
      {
        label: 'friendly',
        line: "Great to meet you, Bonsen—can’t wait to see your setup in action!",
        rapportDelta: 2,
        networkingDelta: 1,
        flavor: 'Bonsen grins and lifts his laptop.',
      },
      {
        label: 'dismissive',
        line: 'Cool. Let’s just do our parts.',
        rapportDelta: -1,
        auraDelta: -1,
        flavor: 'He shrugs but steps back.',
      },
      {
        label: 'major',
        line: 'I’m into tech too—maybe we can compare builds later?',
        rapportDelta: 1,
        networkingDelta: 1,
        flag: 'bonsen-custom-kit',
        onMatch: {
          rapportDelta: 1,
          networkingDelta: 1,
        },
        flavor: 'Bonsen’s eyes light up at the idea.',
      },
    ],
    dmMessage: 'Yo, if the campus wifi drops I’ve got a hotspot ready.',
    dmResponses: {
      friendly: {
        line: 'Legend—thanks for covering us!',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rude: {
        line: 'We’ll manage.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-bonsen',
      },
    },
  },
  zahir: {
    id: 'zahir',
    name: 'Zahir',
    focus: 'medicine',
    majorAffinity: 'medicine',
    greeting: 'Hi, I’m Zahir. First-day butterflies, but I’m ready to help.',
    replies: [
      {
        label: 'friendly',
        line: 'We’ll have each other’s backs, Zahir. You’ve got this.',
        rapportDelta: 2,
        networkingDelta: 1,
        flavor: 'Zahir exhales and smiles.',
      },
      {
        label: 'dismissive',
        line: 'Just tell me what you need from me later.',
        rapportDelta: -1,
        auraDelta: -1,
        flavor: 'He fidgets with his stethoscope.',
      },
      {
        label: 'major',
        line: 'I’m [player major]; maybe we can swap study tips over coffee?',
        rapportDelta: 1,
        networkingDelta: 1,
        flag: 'zahir-family-motivation',
        onMatch: {
          rapportDelta: 1,
          skillsDelta: 1,
        },
        flavor: 'He nods appreciatively.',
      },
    ],
    dmMessage: 'Looking forward to collaborating. Hope today wasn’t too hectic.',
    dmResponses: {
      friendly: {
        line: 'Same here! We’ve got a solid team.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rude: {
        line: 'We’ll see.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-zahir',
      },
    },
  },
  jiun: {
    id: 'jiun',
    name: 'Jiun',
    focus: 'science',
    majorAffinity: 'science',
    greeting: 'Hello! I’m Jiun. I like making sense of data—I hope that’s useful.',
    replies: [
      {
        label: 'friendly',
        line: 'Data is our friend—let’s chart our way to a win.',
        rapportDelta: 2,
        networkingDelta: 1,
        flavor: 'Jiun adds you to a spreadsheet on their tablet.',
      },
      {
        label: 'dismissive',
        line: 'We’ll see if we need charts later.',
        rapportDelta: -1,
        auraDelta: -1,
        flavor: 'Their enthusiasm dims.',
      },
      {
        label: 'major',
        line: 'Science brains unite; maybe you can show me your lab notes?',
        rapportDelta: 1,
        organisationDelta: 1,
        flag: 'jiun-lab-habit',
        onMatch: {
          rapportDelta: 1,
          skillsDelta: 1,
        },
        flavor: 'Jiun brightens and talks experiments.',
      },
    ],
    dmMessage: 'I’m logging all the notes in a spreadsheet tonight.',
    dmResponses: {
      friendly: {
        line: 'Share it whenever—it’ll help heaps.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rude: {
        line: 'Don’t overdo it.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-jiun',
      },
    },
  },
  anika: {
    id: 'anika',
    name: 'Anika',
    focus: 'law',
    majorAffinity: 'law',
    greeting: 'I’m Anika. Let’s keep things sharp and on schedule.',
    replies: [
      {
        label: 'friendly',
        line: 'Love the energy—structure will save us all!',
        rapportDelta: 2,
        auraDelta: 1,
        flavor: 'Anika nods approvingly.',
      },
      {
        label: 'dismissive',
        line: 'Schedules stress me out—let’s not overdo it.',
        rapportDelta: -1,
        auraDelta: -1,
        flavor: 'She raises an eyebrow.',
      },
      {
        label: 'major',
        line: 'From one legal mind to another, let’s brief this like pros.',
        rapportDelta: 1,
        auraDelta: 1,
        flag: 'anika-moot-team',
        onMatch: {
          rapportDelta: 1,
          organisationDelta: 1,
        },
        flavor: 'Anika smirks, clearly impressed.',
      },
    ],
    dmMessage: 'We should outline roles tomorrow—efficiency matters.',
    dmResponses: {
      friendly: {
        line: 'Agreed, let’s align first thing.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rude: {
        line: 'Chill, it’s day one.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-anika',
      },
    },
  },
  jiawen: {
    id: 'jiawen',
    name: 'Jia Wen',
    focus: 'arts',
    majorAffinity: 'arts',
    greeting: 'Hi! I’m Jia Wen. I love turning wild ideas into something beautiful.',
    replies: [
      {
        label: 'friendly',
        line: 'Your energy is contagious—let’s make this project sing.',
        rapportDelta: 2,
        auraDelta: 1,
        flavor: 'She twirls her sketch journal.',
      },
      {
        label: 'dismissive',
        line: 'Let’s keep it practical, okay?',
        rapportDelta: -1,
        auraDelta: -1,
        flavor: 'Her smile wavers.',
      },
      {
        label: 'major',
        line: 'I sketch too—maybe we can storyboard our pitch later?',
        rapportDelta: 1,
        networkingDelta: 1,
        flag: 'jiawen-sketch-collab',
        onMatch: {
          rapportDelta: 1,
          auraDelta: 1,
        },
        flavor: 'Jia Wen lights up at the idea.',
      },
    ],
    dmMessage: 'Got any cool ideas brewing? I’m sketching concepts already!',
    dmResponses: {
      friendly: {
        line: 'Love the enthusiasm—let’s brainstorm after class.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rude: {
        line: 'Too early for that.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-jiawen',
      },
    },
  },
} satisfies Record<NpcId, NpcDefinition>;

export const NPC_DEFINITIONS: Record<NpcId, NpcDefinition> = Object.fromEntries(
  Object.entries(rawNpcDefinitions).map(([id, def]) => [id as NpcId, npcDefinitionSchema.parse(def)]),
) as Record<NpcId, NpcDefinition>;
