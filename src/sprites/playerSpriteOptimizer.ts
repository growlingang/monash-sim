import type { LayerKey, PlayerSprite } from './playerSprite';

// Dimensions of the sprite sheet grid
const SPRITE_GRID = {
  ROWS: 49,
  COLS: 8,
};

// Shared image loader/cache system
export const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load a single layer image and cache it
 */
export async function loadLayer(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new Image();
  img.src = `/sprites/player/layers/${encodeURIComponent(src)}`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load ' + img.src));
  });
  imageCache.set(src, img);
  return img;
}

/**
 * Load all equipped layers for a player sprite (only non-null entries)
 */
export async function loadPlayerImages(player: PlayerSprite) {
  const toLoad: Array<Promise<HTMLImageElement | null>> = [];
  const pushIf = (key?: string | null) => {
    if (key) toLoad.push(loadLayer(key));
  };

  pushIf(player.skin);
  pushIf(player.hair);
  pushIf(player.eyes);
  pushIf(player.lipstick ?? null);
  pushIf(player.shirt ?? null);
  pushIf(player.bottom ?? null);
  pushIf(player.shoes ?? null);

  const acc = player.accessories || {};
  pushIf(acc.beard ?? null);
  pushIf(acc.earring ?? null);
  pushIf(acc.glasses ?? null);
  pushIf(acc.hat ?? null);

  await Promise.all(toLoad);
}

/**
 * Build a composited sprite sheet and return as HTMLImageElement
 */
export async function buildCompositeSprite(
  player: PlayerSprite,
  frameW: number,
  frameH: number
): Promise<HTMLImageElement> {
  // Create offscreen canvas for drawing
  const canvas = document.createElement('canvas');
  canvas.width = frameW * SPRITE_GRID.COLS;
  canvas.height = frameH * SPRITE_GRID.ROWS;
  const ctx = canvas.getContext('2d')!;

  await loadPlayerImages(player);

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

        const sx = (col - 1) * frameW;
        const sy = (row - 1) * frameH;
        ctx.drawImage(img, sx, sy, frameW, frameH, x, y, frameW, frameH);
      }
    }
  }

  // Convert canvas to HTMLImageElement
  const imgEl = new Image();
  imgEl.src = canvas.toDataURL('image/png');

  // For debugging. Triggers a download of the composited sprite sheet.
    const a = document.createElement('a');
    a.href = imgEl.src;
    a.download = 'composited_sprite.png';
    a.click();

  // Store on player
  player.compositedImage = imgEl;
  return imgEl;

  
}

/**
 * Export the current composited sprite sheet as a PNG data URL
 */
export function exportCompositeSprite(player: PlayerSprite): string | null {
  if (!player.compositedImage) return null;
  return player.compositedImage.src;
}
