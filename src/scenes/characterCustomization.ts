
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/audioManager';
import { buildCompositeSprite, loadPlayerImages } from '../sprites/playerSpriteOptimizer';
import { EQUIPMENT } from '../sprites/playerSprite';
import type { PlayerSprite } from '../sprites/playerSprite';

const SPRITE_SIZE = 32; // Original sprite size
const SCALE = 4; // Scale factor for display
const PREVIEW_SIZE = SPRITE_SIZE * SCALE; // 128px displayed size

export class CharacterCustomizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: PlayerSprite;
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
    // Play character customisation music
    playBackgroundMusic('/audio/music/music_charactercustomisation.mp3', { loop: true, volume: 0.7 });
    // Deep clone the player to avoid modifying the original
    this.player = JSON.parse(JSON.stringify(initialPlayer));

    // Create main wrapper - centered vertical layout
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      max-width: 360px;
      margin: 0 auto;
      padding: 0.5rem;
    `;

    // Title
    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0;
      font-size: 0.65rem;
      color: #2d1f0f;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
      line-height: 1.2;
    `;
    title.textContent = 'CUSTOMIZE';
    wrapper.appendChild(title);
    
    // Create preview canvas
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = `
      background: #c9a876;
      border: 3px solid #8b6f47;
      padding: 0.75rem;
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    `;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = PREVIEW_SIZE;
    this.canvas.height = PREVIEW_SIZE;
    this.canvas.style.cssText = `
      display: block;
      width: 120px;
      height: 120px;
      border: 2px solid #8b6f47;
      background: #fbe9cf;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    `;
    this.ctx = this.canvas.getContext('2d')!;
    
    canvasWrapper.appendChild(this.canvas);
    wrapper.appendChild(canvasWrapper);
    
    // Create customization UI
    this.createUI(wrapper);
    
    container.appendChild(wrapper);
    
    // Start preview
    this.updatePreview();
  }

  private async updatePreview() {
    // Rebuild composited sprite with current options
    await loadPlayerImages(this.player);
    await buildCompositeSprite(this.player, SPRITE_SIZE, SPRITE_SIZE);

    // Clear canvas
    this.ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    
    // Draw single frame (idle_forward, row 1 col 1) scaled up
    if (this.player.compositedImage) {
      // Disable smoothing for crisp pixel art
      this.ctx.imageSmoothingEnabled = false;
      
      // Draw the idle forward sprite (row 1, col 1 = position 0,0 in sprite sheet)
      this.ctx.drawImage(
        this.player.compositedImage,
        0, 0, // Source position (first frame)
        SPRITE_SIZE, SPRITE_SIZE, // Source size
        0, 0, // Destination position
        PREVIEW_SIZE, PREVIEW_SIZE // Destination size (scaled up)
      );
    }
  }

  private createUI(container: HTMLElement) {
    // Row 1: Category and Select Part side by side
    const topRow = document.createElement('div');
    topRow.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
      width: 100%;
    `;
    
    // Category card
    const tabsCard = document.createElement('div');
    tabsCard.style.cssText = `
      background: #c9a876;
      border: 2px solid #8b6f47;
      padding: 0.4rem;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
    `;
    
    const tabsLabel = document.createElement('div');
    tabsLabel.style.cssText = `
      margin-bottom: 0.3rem;
      font-size: 0.5rem;
      color: #2d1f0f;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
    `;
    tabsLabel.textContent = 'CATEGORY';
    tabsCard.appendChild(tabsLabel);
    
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3rem;
    `;
    
    ['Basic', 'Clothes', 'Access'].forEach((category, idx) => {
      const fullName = ['Basic', 'Clothes', 'Accessories'][idx];
      const tab = document.createElement('button');
      tab.textContent = category;
      tab.style.cssText = `
        border: 2px solid #8b6f47;
        padding: 0.4rem 0.2rem;
        font-size: 0.5rem;
        background: #b8956a;
        color: #2d1f0f;
        cursor: pointer;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
        font-family: 'Press Start 2P', monospace;
        white-space: nowrap;
        overflow: hidden;
      `;
      tab.onclick = () => {
        this.showCategory(fullName);
        tabs.querySelectorAll('button').forEach(b => {
          (b as HTMLElement).style.background = '#b8956a';
        });
        tab.style.background = '#e0c095';
      };
      tabs.appendChild(tab);
    });
    tabsCard.appendChild(tabs);
    topRow.appendChild(tabsCard);

    // Select Part card
    const optionsCard = document.createElement('div');
    optionsCard.style.cssText = `
      background: #c9a876;
      border: 2px solid #8b6f47;
      padding: 0.4rem;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
    `;
    
    const optionsLabel = document.createElement('div');
    optionsLabel.style.cssText = `
      margin-bottom: 0.3rem;
      font-size: 0.5rem;
      color: #2d1f0f;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
    `;
    optionsLabel.textContent = 'SELECT PART';
    optionsCard.appendChild(optionsLabel);
    
    const options = document.createElement('div');
    options.style.cssText = `
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3rem;
      min-height: 110px;
      align-content: start;
    `;
    optionsCard.appendChild(options);
    (this as any)._optionsContainer = options;
    topRow.appendChild(optionsCard);
    
    container.appendChild(topRow);

    // Row 2: Change buttons
    const navCard = document.createElement('div');
    navCard.style.cssText = `
      background: #c9a876;
      border: 2px solid #8b6f47;
      padding: 0.4rem;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
      width: 100%;
    `;
    
    const navLabel = document.createElement('div');
    navLabel.style.cssText = `
      margin-bottom: 0.3rem;
      font-size: 0.5rem;
      color: #2d1f0f;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
    `;
    navLabel.textContent = 'CHANGE';
    navCard.appendChild(navLabel);
    
    const nav = document.createElement('div');
    nav.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◄';
    prevBtn.style.cssText = `
      border: 2px solid #8b6f47;
      padding: 0.5rem;
      font-size: 0.9rem;
      background: #b8956a;
      color: #2d1f0f;
      cursor: pointer;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
      font-family: 'Press Start 2P', monospace;
    `;
    prevBtn.onclick = () => this.cycleOption(-1);
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '►';
    nextBtn.style.cssText = prevBtn.style.cssText;
    nextBtn.onclick = () => this.cycleOption(1);
    
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    navCard.appendChild(nav);
    container.appendChild(navCard);

    // Row 3: Save button
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'SAVE';
    applyBtn.style.cssText = `
      border: 2px solid #4a7a4a;
      padding: 0.6rem;
      font-size: 0.65rem;
      background: #6a9e6a;
      color: #fbe9cf;
      cursor: pointer;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
      font-family: 'Press Start 2P', monospace;
      font-weight: bold;
      width: 100%;
    `;
    applyBtn.onclick = () => this.applyChanges();
    container.appendChild(applyBtn);
    
    // Initialize with Basic category and select first button
    setTimeout(() => {
      const firstTab = tabs.querySelector('button') as HTMLElement;
      if (firstTab) firstTab.style.background = '#e0c095';
    }, 0);
    this.showCategory('Basic');
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
    const containerEl: HTMLElement = (this as any)._optionsContainer as HTMLElement;
    if (!containerEl) return;
    containerEl.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      btn.style.cssText = `
        border: 2px solid #8b6f47;
        padding: 0.4rem 0.2rem;
        font-size: 0.5rem;
        background: #b8956a;
        color: #2d1f0f;
        cursor: pointer;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
        font-family: 'Press Start 2P', monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      btn.onclick = () => {
        this.currentCategory = opt as any;
        containerEl.querySelectorAll('button').forEach(b => {
          (b as HTMLElement).style.background = '#b8956a';
        });
        btn.style.background = '#e0c095';
      };
      containerEl.appendChild(btn);
    });
    
    // Set first option as active by default
    if (options.length > 0) {
      const firstBtn = containerEl.querySelector('button') as HTMLElement;
      if (firstBtn) {
        this.currentCategory = options[0] as any;
        firstBtn.style.background = '#e0c095';
      }
    }
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
    // Stop character customisation music and restore default background music
    stopBackgroundMusic();
    playBackgroundMusic('/audio/music/background.mp3', { loop: true, volume: 0.6, autoplay: true });
  }
}