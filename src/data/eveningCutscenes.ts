import type { CutsceneFrame } from '../ui/cutscene';
import type { NpcId } from '../core/types';
import { NPC_DEFINITIONS } from './npcs';

type EveningActivityId = 'eat' | 'rest' | 'text' | 'doomscroll';

// Note: You can use 'image' (for images/videos) or 'emoji' in cutscene frames
// Supported formats: Images (.png, .jpg, .gif) and Videos (.mp4, .webm, .ogg, .mov)
// Example:
// {
//   background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%)',
//   image: '/path/to/your/image.png',  // or '/path/to/video.mp4' for videos
//   text: 'Time for dinner!',
//   subtext: 'You head to the kitchen, stomach rumbling...',
// }

export const getEveningActivityCutscene = (
  activityId: EveningActivityId,
  targetNpc?: NpcId
): CutsceneFrame[] => {
  switch (activityId) {
    case 'eat':
      return [
        {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%)',
          image: '/src/sprites/eat.jpg',
          text: 'A satisfying meal',
          subtext: 'You prepare a hearty dinner and enjoy every bite. Your energy is fully restored!',
        },
        {
          background: 'linear-gradient(135deg, #1a4a1a 0%, #1b2d1b 100%)',
          image: '/src/sprites/bleh.png',
          text: 'Feeling refreshed!',
          subtext: 'Nothing beats a good meal after a long day. Ready to take on tomorrow!',
        },
      ];

    case 'rest':
      return [
        {
          background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
          image: '/src/sprites/sleep.png',
          text: 'Peaceful rest',
          subtext: 'You close your eyes, breathe deeply, and find your center. The world fades away...',
        },
        {
          background: 'linear-gradient(135deg, #1a2e4a 0%, #1b2d3d 100%)',
          image: '/src/sprites/energised.png',
          text: 'Recharged!',
          subtext: 'You feel more energized and ready to face whatever comes next.',
        },
      ];

    case 'text':
      if (!targetNpc) {
        return [
          {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            emoji: '💬',
            text: 'Sending a message...',
            subtext: 'You pick up your phone to reach out to a teammate.',
          },
        ];
      }

      const npc = NPC_DEFINITIONS[targetNpc];
      return [
        {
          background: 'linear-gradient(135deg, #2e1a4a 0%, #1a2e4a 100%)',
          image: '/src/sprites/chat.png',
          text: `Chatting with ${npc.name}`,
          subtext: getTextingSubtext(targetNpc),
        },
        {
          background: 'linear-gradient(135deg, #1a4a2e 0%, #1b2d3d 100%)',
          emoji: '🤝',
          text: 'Connection strengthened!',
          subtext: `Your conversation with ${npc.name} went well. You feel closer to your teammate.`,
        },
      ];

    case 'doomscroll':
      return [
        {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2e2a1a 100%)',
          image: '/src/sprites/mmm.mp4',
          text: 'Just a quick scroll...',
          subtext: 'You open Instagram, telling yourself it\'ll only be a few minutes. (surely)',
        }
      ];

    default:
      return [
        {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          emoji: '✨',
          text: 'Evening activity complete!',
          subtext: 'You finish up for the day.',
        },
      ];
  }
};

function getTextingSubtext(npcId: NpcId): string {
  switch (npcId) {
    case 'bonsen':
      return 'You chat about tech, share some memes, and discuss tomorrow\'s plans. Bonsen sends you a funny GIF.';
    case 'zahir':
      return 'You exchange supportive messages and study tips. Zahir appreciates your encouragement.';
    case 'jiun':
      return 'You discuss data analysis strategies and share research insights. Jiun loves the analytical approach.';
    case 'anika':
      return 'You talk about organizing the team\'s workflow. Anika respects your structured thinking.';
    case 'jiawen':
      return 'You share creative ideas and inspiration. Jia Wen sends you some cool sketches she\'s been working on.';
    default:
      return 'You have a nice conversation and strengthen your bond.';
  }
}

