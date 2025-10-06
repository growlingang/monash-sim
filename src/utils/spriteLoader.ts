/**
 * Sprite loading and caching utility
 * Handles async image loading with promise-based API
 */

type SpriteCache = Map<string, HTMLImageElement>;

const cache: SpriteCache = new Map();

/**
 * Load a single sprite image
 * @param path - Path to image relative to public folder (e.g., '/sprites/player.png')
 * @returns Promise that resolves to the loaded image
 */
export const loadSprite = async (path: string): Promise<HTMLImageElement> => {
  // Return cached sprite if already loaded
  if (cache.has(path)) {
    return cache.get(path)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      cache.set(path, img);
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load sprite: ${path}`));
    };
    
    img.src = path;
  });
};

/**
 * Load multiple sprites in parallel
 * @param paths - Array of sprite paths
 * @returns Promise that resolves to map of path -> image
 */
export const loadSprites = async (paths: string[]): Promise<Map<string, HTMLImageElement>> => {
  const promises = paths.map(async (path) => {
    const img = await loadSprite(path);
    return [path, img] as const;
  });
  
  const results = await Promise.all(promises);
  return new Map(results);
};

/**
 * Draw a sprite on canvas with optional transformations
 */
export interface DrawSpriteOptions {
  x: number;
  y: number;
  width?: number;  // If not provided, uses image natural width
  height?: number; // If not provided, uses image natural height
  rotation?: number; // In radians
  flipX?: boolean;
  flipY?: boolean;
  alpha?: number; // 0-1 opacity
}

export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  options: DrawSpriteOptions,
): void => {
  const {
    x,
    y,
    width = sprite.naturalWidth,
    height = sprite.naturalHeight,
    rotation = 0,
    flipX = false,
    flipY = false,
    alpha = 1,
  } = options;

  ctx.save();

  // Apply transformations
  ctx.globalAlpha = alpha;
  ctx.translate(x + width / 2, y + height / 2);
  
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  
  if (flipX || flipY) {
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  }

  // Draw the sprite centered at origin
  ctx.drawImage(sprite, -width / 2, -height / 2, width, height);

  ctx.restore();
};

/**
 * Draw a subsection of a sprite (sprite sheet support)
 */
export interface DrawSubSpriteOptions extends DrawSpriteOptions {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export const drawSubSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  options: DrawSubSpriteOptions,
): void => {
  const {
    x,
    y,
    width = options.sourceWidth,
    height = options.sourceHeight,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    rotation = 0,
    flipX = false,
    flipY = false,
    alpha = 1,
  } = options;

  ctx.save();

  ctx.globalAlpha = alpha;
  ctx.translate(x + width / 2, y + height / 2);
  
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  
  if (flipX || flipY) {
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  }

  ctx.drawImage(
    sprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  );

  ctx.restore();
};

/**
 * Clear the sprite cache (useful for testing or memory cleanup)
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Get cache stats (for debugging)
 */
export const getCacheStats = () => ({
  size: cache.size,
  paths: Array.from(cache.keys()),
});
