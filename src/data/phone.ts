import { z } from 'zod';
import { memoryFlagIdSchema, npcIdSchema } from '../core/schema';

const dmSchema = z.object({
  npcId: npcIdSchema,
  message: z.string(),
  friendlyReply: z.object({
    line: z.string(),
    rapportDelta: z.number().int(),
    networkingDelta: z.number().int(),
  }),
  rudeReply: z.object({
    line: z.string(),
    rapportDelta: z.number().int(),
    auraDelta: z.number().int(),
    flag: memoryFlagIdSchema,
  }),
});

export const phoneContentSchema = z.object({
  groupChatMessages: z.array(z.string()),
  dmOptions: z.array(dmSchema),
  mapRows: z.array(
    z.object({
      mode: z.string(),
      time: z.string(),
      cost: z.string(),
      hunger: z.string(),
    }),
  ),
  notes: z.array(z.string()),
});

export type PhoneContent = z.infer<typeof phoneContentSchema>;

const rawPhoneContent: PhoneContent = {
  groupChatMessages: [
    "Jia Wen: Let’s crush ‘Digital Privacy vs Convenience’! 💬",
    "Anika: Meeting notes tomorrow morning. Don’t sleep in.",
    'System: Assignment due Day 7, 11:59 PM.',
  ],
  dmOptions: [
    {
      npcId: 'bonsen',
      message: 'Yo, if the campus wifi drops I’ve got a hotspot ready.',
      friendlyReply: {
        line: 'Legend—thanks for covering us!',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rudeReply: {
        line: 'We’ll manage.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-bonsen',
      },
    },
    {
      npcId: 'zahir',
      message: 'Looking forward to collaborating. Hope today wasn’t too hectic.',
      friendlyReply: {
        line: 'Same here! We’ve got a solid team.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rudeReply: {
        line: 'We’ll see.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-zahir',
      },
    },
    {
      npcId: 'jiun',
      message: 'I’m logging all the notes in a spreadsheet tonight.',
      friendlyReply: {
        line: 'Share it whenever—it’ll help heaps.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rudeReply: {
        line: 'Don’t overdo it.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-jiun',
      },
    },
    {
      npcId: 'anika',
      message: 'We should outline roles tomorrow—efficiency matters.',
      friendlyReply: {
        line: 'Agreed, let’s align first thing.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rudeReply: {
        line: 'Chill, it’s day one.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-anika',
      },
    },
    {
      npcId: 'jiawen',
      message: 'Got any cool ideas brewing? I’m sketching concepts already!',
      friendlyReply: {
        line: 'Love the enthusiasm—let’s brainstorm after class.',
        rapportDelta: 1,
        networkingDelta: 1,
      },
      rudeReply: {
        line: 'Too early for that.',
        rapportDelta: -1,
        auraDelta: -1,
        flag: 'strained-dm-jiawen',
      },
    },
  ],
  mapRows: [
    { mode: 'Walk', time: '45 min', cost: '$0', hunger: '-1 on fail' },
    { mode: 'Bus / Tram', time: '35 min', cost: '$5', hunger: '-1' },
    { mode: 'Drive', time: '30 min', cost: '$12', hunger: '-1' },
  ],
  notes: [
    'Met the team in Lecture Theatre 3.',
    'Assignment: Digital Privacy vs. Convenience — Okta Verify Debate.',
    'Phone tutorial completed; apps unlocked.',
  ],
};

export const PHONE_CONTENT = phoneContentSchema.parse(rawPhoneContent);
