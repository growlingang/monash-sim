import type { LayerKey, PlayerSprite } from './playerSprite';
import { imageCache } from './playerSpriteOptimizer';

// Map high-level animation names to (row, col) or sequences of frames
export const ANIMATION_ROW: Record<
  string,
  { row: number; frames: Array<{ col: number }>; loop?: boolean }
> = {
  idle_forward: { row: 1, frames: [{ col: 1 }], loop: false },
  idle_backward: { row: 2, frames: [{ col: 1 }], loop: false },
  idle_right: { row: 3, frames: [{ col: 1 }], loop: false },
  idle_left: { row: 4, frames: [{ col: 1 }], loop: false },
  walk_forward: { row: 1, frames: [{ col: 2 }, { col: 4 }], loop: true },
  walk_backward: { row: 2, frames: [{ col: 2 }, { col: 4 }], loop: true },
  walk_right: { row: 3, frames: [{ col: 2 }, { col: 4 }], loop: true },
  walk_left: { row: 4, frames: [{ col: 2 }, { col: 4 }], loop: true },
  jump_forward: { row: 13, frames: [{ col: 1 }], loop: false },
  jump_backward: { row: 14, frames: [{ col: 1 }], loop: false },
  jump_right: { row: 15, frames: [{ col: 1 }], loop: false },
  jump_left: { row: 16, frames: [{ col: 1 }], loop: false },
};

/**
 * Draw a single character frame, using the composited sprite sheet if available
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  player: PlayerSprite,
  animationName: string,
  frameIndex: number,
  x: number,
  y: number,
  frameW: number,
  frameH: number
) {
  const mapping = ANIMATION_ROW[animationName];
  if (!mapping) throw new Error('Unknown animation: ' + animationName);

  const frame = mapping.frames[frameIndex % mapping.frames.length];
  const row = mapping.row; // 1-indexed
  const col = frame.col; // 1-indexed

  // Source coordinates in sprite sheet
  const sx = (col - 1) * frameW;
  const sy = (row - 1) * frameH;

  if (player.compositedImage) {
    // Fast path: draw from pre-composited sprite sheet
    ctx.drawImage(player.compositedImage, sx, sy, frameW, frameH, x, y, frameW, frameH);
  } else {
    // Slow path: live compositing
    const acc = player.accessories || {};
    const layers: Array<{ key: LayerKey; src?: string | null }> = [
      { key: 'skin', src: player.skin },
      { key: 'eyes', src: player.eyes },
      { key: 'lipstick', src: player.lipstick ?? null },
      { key: 'shirt', src: player.shirt ?? null },
      { key: 'bottom', src: player.bottom ?? null },
      { key: 'shoes', src: player.shoes ?? null },
      { key: 'hair', src: player.hair },
      { key: 'beard', src: acc.beard ?? null },
      { key: 'earring', src: acc.earring ?? null },
      { key: 'glasses', src: acc.glasses ?? null },
      { key: 'hat', src: acc.hat ?? null },
    ];

    // Draw each layer
    for (const layer of layers) {
      if (!layer.src) continue;
      const img = imageCache.get(layer.src);
      if (!img) continue;
      if (!player.compositedImage) return; 
    //   ctx.drawImage(img, sx, sy, frameW, frameH, x, y, frameW, frameH);
        ctx.drawImage(
        player.compositedImage, // full sprite sheet
        sx, sy,                 // source top-left
        frameW, frameH,         // source width/height
        x, y,                   // destination top-left
        frameW, frameH           // destination width/height
        );

    }
  }
}

/**
 * Create an animation loop generator with start/stop control
 */
export function createAnimationLoop(options: {
  ctx: CanvasRenderingContext2D;
  player: PlayerSprite;
  animationName: string;
  frameW: number;
  frameH: number;
  x: number;
  y: number;
  fps?: number;
}) {
  const { ctx, player, animationName, frameW, frameH, x, y } = options;
  const fps = options.fps ?? 6;

  let running = false;
  let last = performance.now();
  let acc = 0;
  let currentFrame = 0;

  const mapping = ANIMATION_ROW[animationName];
  if (!mapping) throw new Error('Unknown animation for loop: ' + animationName);

  function tick(now: number) {
    if (!running) return;

    const delta = now - last;
    last = now;
    acc += delta;

    const interval = 1000 / fps;
    if (acc >= interval) {
      if (mapping.loop) {
        currentFrame = (currentFrame + 1) % mapping.frames.length;
      } else {
        currentFrame = 0;
      }
      acc = 0;
    }

    ctx.clearRect(x, y, frameW, frameH);
    if (!player.compositedImage) return; // wait until loaded
    drawCharacter(ctx, player, animationName, currentFrame, x, y, frameW, frameH);
    requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      requestAnimationFrame(tick);
    },
    stop() {
      running = false;
    },
  };
}
