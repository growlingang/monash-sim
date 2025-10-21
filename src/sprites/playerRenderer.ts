import { ANIMATION_FRAMES } from './animationFrames';
import type { PlayerSprite } from './playerSprite';
import { drawSubSprite } from '../utils/spriteLoader';

interface AnimationLoopOptions {
  ctx: CanvasRenderingContext2D;
  player: PlayerSprite;
  animationName: keyof typeof ANIMATION_FRAMES;
  frameW: number;
  frameH: number;
  x: number;
  y: number;
  fps: number;
}

export function createAnimationLoop(options: AnimationLoopOptions) {
  const { ctx, player, animationName, frameW, frameH, x, y, fps } = options;
  const frames = ANIMATION_FRAMES[animationName];
  let frameIndex = 0;
  let interval: number | undefined;

  const loop = () => {
    ctx.clearRect(x, y, frameW, frameH);

    const frame = frames[frameIndex];
    drawSubSprite(ctx, player.compositedImage!, {
      x,
      y,
      width: frameW,
      height: frameH,
      sourceX: (frame.col - 1) * frameW,
      sourceY: (frame.row - 1) * frameH,
      sourceWidth: frameW,
      sourceHeight: frameH,
    });

    frameIndex = (frameIndex + 1) % frames.length;
  };

  return {
    start() {
      interval = window.setInterval(loop, 1000 / fps);
    },
    stop() {
      if (interval) clearInterval(interval);
    },
  };
}
