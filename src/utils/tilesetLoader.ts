/**
 * Tileset/Tilemap utilities for tile-based rendering
 * Built on top of the sprite loader system
 */

import { loadSprite, drawSubSprite } from './spriteLoader';

/**
 * Represents a tileset configuration
 */
export interface TilesetConfig {
  imagePath: string;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  spacing?: number;  // Gap between tiles (default: 0)
  margin?: number;   // Outer margin (default: 0)
}

/**
 * Tileset class for managing and drawing tiles from a sprite sheet
 */
export class Tileset {
  private image: HTMLImageElement | null = null;
  private config: TilesetConfig;

  constructor(config: TilesetConfig) {
    this.config = {
      spacing: 0,
      margin: 0,
      ...config,
    };
  }

  /**
   * Load the tileset image
   */
  async load(): Promise<void> {
    this.image = await loadSprite(this.config.imagePath);
  }

  /**
   * Get the total number of tiles in this tileset
   */
  getTileCount(): number {
    return this.config.columns * this.config.rows;
  }

  /**
   * Get source coordinates for a tile by its index
   * @param tileIndex - 0-based tile index (left-to-right, top-to-bottom)
   */
  getTileCoords(tileIndex: number): { x: number; y: number; width: number; height: number } {
    const col = tileIndex % this.config.columns;
    const row = Math.floor(tileIndex / this.config.columns);

    const { tileWidth, tileHeight, spacing = 0, margin = 0 } = this.config;

    return {
      x: margin + col * (tileWidth + spacing),
      y: margin + row * (tileHeight + spacing),
      width: tileWidth,
      height: tileHeight,
    };
  }

  /**
   * Draw a single tile by index
   */
  drawTile(
    ctx: CanvasRenderingContext2D,
    tileIndex: number,
    x: number,
    y: number,
    scale: number = 1,
  ): void {
    if (!this.image) {
      console.warn('Tileset image not loaded');
      return;
    }

    const coords = this.getTileCoords(tileIndex);

    drawSubSprite(ctx, this.image, {
      sourceX: coords.x,
      sourceY: coords.y,
      sourceWidth: coords.width,
      sourceHeight: coords.height,
      x,
      y,
      width: coords.width * scale,
      height: coords.height * scale,
    });
  }

  /**
   * Check if tileset is loaded
   */
  isLoaded(): boolean {
    return this.image !== null;
  }
}

/**
 * Tilemap for rendering tile-based levels
 */
export interface TilemapConfig {
  tileset: Tileset;
  data: number[][];  // 2D array of tile indices (-1 or null for empty)
  tileSize: number;   // Size to render each tile (can be different from tileset tile size)
}

export class Tilemap {
  private config: TilemapConfig;

  constructor(config: TilemapConfig) {
    this.config = config;
  }

  /**
   * Get map dimensions
   */
  getDimensions() {
    return {
      width: this.config.data[0]?.length || 0,
      height: this.config.data.length,
    };
  }

  /**
   * Get tile index at grid position
   */
  getTileAt(gridX: number, gridY: number): number {
    if (
      gridY < 0 ||
      gridY >= this.config.data.length ||
      gridX < 0 ||
      gridX >= (this.config.data[gridY]?.length || 0)
    ) {
      return -1;
    }
    return this.config.data[gridY][gridX];
  }

  /**
   * Set tile index at grid position
   */
  setTileAt(gridX: number, gridY: number, tileIndex: number): void {
    if (
      gridY >= 0 &&
      gridY < this.config.data.length &&
      gridX >= 0 &&
      gridX < (this.config.data[gridY]?.length || 0)
    ) {
      this.config.data[gridY][gridX] = tileIndex;
    }
  }

  /**
   * Render the entire tilemap
   */
  render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
    const { tileset, data, tileSize } = this.config;

    if (!tileset.isLoaded()) {
      console.warn('Tileset not loaded, cannot render tilemap');
      return;
    }

    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const tileIndex = data[row][col];

        // Skip empty tiles (-1 or null/undefined)
        if (tileIndex < 0 || tileIndex == null) continue;

        const x = offsetX + col * tileSize;
        const y = offsetY + row * tileSize;

        tileset.drawTile(ctx, tileIndex, x, y, tileSize / tileset['config'].tileWidth);
      }
    }
  }

  /**
   * Render only visible portion of tilemap (optimized for large maps)
   */
  renderVisible(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    const { tileset, tileSize } = this.config;

    if (!tileset.isLoaded()) return;

    // Calculate visible tile range
    const startCol = Math.max(0, Math.floor(cameraX / tileSize));
    const endCol = Math.min(
      this.config.data[0].length,
      Math.ceil((cameraX + viewportWidth) / tileSize),
    );
    const startRow = Math.max(0, Math.floor(cameraY / tileSize));
    const endRow = Math.min(this.config.data.length, Math.ceil((cameraY + viewportHeight) / tileSize));

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileIndex = this.config.data[row][col];

        if (tileIndex < 0 || tileIndex == null) continue;

        const x = col * tileSize - cameraX;
        const y = row * tileSize - cameraY;

        tileset.drawTile(ctx, tileIndex, x, y, tileSize / tileset['config'].tileWidth);
      }
    }
  }
}

/**
 * Helper to create a tilemap from a string pattern
 * Useful for quick level design
 */
export function createTilemapFromPattern(
  tileset: Tileset,
  pattern: string,
  tileSize: number,
  mapping: Record<string, number>,
): Tilemap {
  const lines = pattern.trim().split('\n');
  const data: number[][] = lines.map((line) =>
    line.split('').map((char) => mapping[char] ?? -1),
  );

  return new Tilemap({ tileset, data, tileSize });
}
