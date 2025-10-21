import { buildCompositeSprite, loadPlayerImages } from '../sprites/playerSpriteOptimizer';
import { createAnimationLoop } from '../sprites/playerRenderer';
import { EQUIPMENT } from '../sprites/playerSprite';
import type { PlayerSprite } from '../sprites/playerSprite';

const PREVIEW_SIZE = {
  width: 256,
  height: 256,
  frameW: 32,
  frameH: 32,
};

export class CharacterCustomizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: PlayerSprite;
  private previewAnim?: ReturnType<typeof createAnimationLoop>;
  private currentCategory: 'skin' | 'hair' | 'eyes' | 'lipstick' | 'shirt' | 'bottom' | 'shoes' | 'beard' | 'earring' | 'glasses' | 'hat' = 'skin';
  private indices: Record<string, number> = {
    skin: 0,
    hair: 0,
    eyes: 0,
    lipstick: 0,
    shirt: 0,
    bottom: 0,
    shoes: 0,
    beard: 0,
    earring: 0,
    glasses: 0,
    hat: 0,
  };

  constructor(container: HTMLElement, initialPlayer: PlayerSprite) {
    // Create preview canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = PREVIEW_SIZE.width;
    this.canvas.height = PREVIEW_SIZE.height;
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);

    // Deep clone the player to avoid modifying the original
    this.player = JSON.parse(JSON.stringify(initialPlayer));

    // Create customization UI
    this.createUI(container);
    
    // Start preview animation
    this.updatePreview();
  }

  private async updatePreview() {
    // Stop existing animation if any
    this.previewAnim?.stop();

    // Rebuild composited sprite with current options
    await loadPlayerImages(this.player);
    await buildCompositeSprite(this.player, PREVIEW_SIZE.frameW, PREVIEW_SIZE.frameH);

    // Create new preview animation
    this.previewAnim = createAnimationLoop({
      ctx: this.ctx,
      player: this.player,
      animationName: 'idle_forward',
      frameW: PREVIEW_SIZE.frameW,
      frameH: PREVIEW_SIZE.frameH,
      x: (PREVIEW_SIZE.width - PREVIEW_SIZE.frameW) / 2,
      y: (PREVIEW_SIZE.height - PREVIEW_SIZE.frameH) / 2,
      fps: 4,
    });

    this.previewAnim.start();
  }

  private createUI(container: HTMLElement) {
    const ui = document.createElement('div');
    ui.className = 'character-customizer';
    
    // Category tabs
    const tabs = document.createElement('div');
    tabs.className = 'customizer-tabs';
    ['Basic', 'Clothes', 'Accessories'].forEach(category => {
      const tab = document.createElement('button');
      tab.textContent = category;
      tab.onclick = () => this.showCategory(category);
      tabs.appendChild(tab);
    });
    ui.appendChild(tabs);

  // Options panel (store a local reference so we don't query the whole document)
  const options = document.createElement('div');
  options.className = 'customizer-options';
  ui.appendChild(options);
  // Attach to instance so other methods reference the correct node
  (this as any)._optionsContainer = options;

    // Navigation buttons
    const nav = document.createElement('div');
    nav.className = 'customizer-nav';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.onclick = () => this.cycleOption(-1);
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.onclick = () => this.cycleOption(1);
    
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    ui.appendChild(nav);

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.className = 'customizer-apply';
    applyBtn.textContent = 'Save Changes';
    applyBtn.onclick = () => this.applyChanges();
    ui.appendChild(applyBtn);

    container.appendChild(ui);
  }

  private showCategory(category: string) {
    switch (category) {
      case 'Basic':
        this.showOptions(['skin', 'hair', 'eyes', 'lipstick']);
        break;
      case 'Clothes':
        this.showOptions(['shirt', 'bottom', 'shoes']);
        break;
      case 'Accessories':
        this.showOptions(['beard', 'earring', 'glasses', 'hat']);
        break;
    }
  }

  private showOptions(options: string[]) {
  // Use the locally stored options container to avoid collisions
  const containerEl: HTMLElement = (this as any)._optionsContainer as HTMLElement;
  if (!containerEl) return;
  containerEl.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      btn.onclick = () => {
        this.currentCategory = opt as any;
        // Limit query to our options container
        containerEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      containerEl.appendChild(btn);
    });
  }

  private async cycleOption(direction: 1 | -1) {
    let list: string[] = [];
    let currentIdx = this.indices[this.currentCategory];
    // Resolve list for the selected category
    switch (this.currentCategory) {
      case 'skin':
        list = EQUIPMENT.skins;
        break;
      case 'hair':
        list = EQUIPMENT.hairs;
        break;
      case 'eyes':
        list = EQUIPMENT.eyes;
        break;
      case 'lipstick':
        list = EQUIPMENT.lipsticks;
        break;
      case 'shirt':
        list = EQUIPMENT.shirts;
        break;
      case 'bottom':
        list = EQUIPMENT.bottoms;
        break;
      case 'shoes':
        list = EQUIPMENT.shoes;
        break;
      // accessories
      case 'beard':
      case 'earring':
      case 'glasses':
      case 'hat':
        list = EQUIPMENT.accessories[this.currentCategory as keyof typeof EQUIPMENT.accessories] || [];
        break;
      default:
        list = [];
    }

    // Update index and apply change
    const nextIdx = ((cur: number, arr: string[], dir: number) => {
      if (arr.length === 0) return -1;
      return (cur + dir + arr.length) % arr.length;
    })(currentIdx, list, direction);
    if (nextIdx !== -1) {
      this.indices[this.currentCategory] = nextIdx;
      
      if (this.currentCategory in this.player.accessories) {
        (this.player.accessories as any)[this.currentCategory] = list[nextIdx];
      } else {
        (this.player as any)[this.currentCategory] = list[nextIdx];
      }
      
      await this.updatePreview();
    }
  }

  private applyChanges() {
    // Dispatch event with updated player data
    const event = new CustomEvent('character-updated', {
      detail: { player: this.player }
    });
    window.dispatchEvent(event);
  }

  public cleanup() {
    this.previewAnim?.stop();
    this.canvas.remove();
  }
}