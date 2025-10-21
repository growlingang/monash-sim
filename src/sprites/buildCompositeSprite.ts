import type { LayerKey, PlayerSprite } from './playerSprite';
import { imageCache, loadPlayerImages, loadLayer, SPRITE_GRID } from './playerSpriteOptimizer';

/**
 * Build a fully composited sprite sheet for a player
 */
export async function buildCompositeSprite(
  player: PlayerSprite,
  frameW: number,
  frameH: number
): Promise<HTMLImageElement> {
  // Ensure all layers are loaded
  await loadPlayerImages(player);

  // Canvas matches full sprite sheet size
  const canvas = document.createElement('canvas');
  canvas.width = frameW * SPRITE_GRID.COLS;
  canvas.height = frameH * SPRITE_GRID.ROWS;
  const ctx = canvas.getContext('2d')!;

  // Draw every frame in the grid
  for (let row = 1; row <= SPRITE_GRID.ROWS; row++) {
    for (let col = 1; col <= SPRITE_GRID.COLS; col++) {
      const x = (col - 1) * frameW;
      const y = (row - 1) * frameH;

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

      for (const layer of layers) {
        if (!layer.src) continue;
        const img = imageCache.get(layer.src);
        if (!img) continue;

        // Draw the layer at this frame position (assumes layers are single-frame images)
        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, frameW, frameH);
      }
    }
  }

  // Convert canvas to HTMLImageElement
  const imgEl = new Image();
  imgEl.src = canvas.toDataURL('image/png');

  // wait for image to load
  await new Promise<void>((resolve) => {
    imgEl.onload = () => resolve();
    });
  // Store on player for animation usage
  player.compositedImage = imgEl;

  return imgEl;
}
