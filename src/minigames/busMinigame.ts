
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/audioManager';
import type { Minigame, MinigameConfig, MinigameResult } from './types';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const BALANCE_BAR_WIDTH = 120;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const TIME_LIMIT = 25; // seconds

export const busMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
    // Play bus minigame music
    await playBackgroundMusic('/audio/ambience/Melbourne_Bus_Loop.mp3', { loop: true, volume: 0.7 });
    return new Promise((resolve) => {
      container.innerHTML = '';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'minigame-bus';
      wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px;';

      const header = document.createElement('div');
      header.className = 'minigame-bus__header';
      header.style.cssText = 'margin-bottom: 10px; font-size: 14px;';
      
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';
      
      const instructions = document.createElement('div');
      instructions.className = 'minigame-bus__instructions';
      instructions.style.cssText = 'margin-top: 10px; text-align: center; font-size: 12px; color: #999;';
      instructions.innerHTML = `
        <p><strong>Left/Right Arrow Keys</strong> or <strong>A/D</strong> to balance</p>
        <p>Stay in the green zone for ${TIME_LIMIT} seconds!</p>
      `;

      wrapper.appendChild(header);
      wrapper.appendChild(canvas);
      wrapper.appendChild(instructions);
      container.appendChild(wrapper);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ success: false, completed: false });
        return;
      }

      // Random bus delay (10% chance the bus is 2-5 minutes late)
      const busDelayChance = Math.random();
      const busIsLate = busDelayChance < 0.1;
      const busDelayMinutes = busIsLate ? Math.floor(Math.random() * 3) + 2 : 0;

      if (busIsLate) {
        const delayNotice = document.createElement('div');
        delayNotice.style.cssText = 'background: #c94444; color: white; padding: 10px; margin-bottom: 10px; border-radius: 4px; text-align: center; font-weight: bold;';
        delayNotice.textContent = `⏰ The bus is running ${busDelayMinutes} minutes late! (Not your fault)`;
        wrapper.insertBefore(delayNotice, header);
      }

      // Game state
      let balance = 0; // -1 to 1, 0 is center
      let timeRemaining = TIME_LIMIT;
      let gameActive = true;
      let lastTime = performance.now();
      let wobblePhase = 0;
      
      // Calculate safe zone based on stats
      const aura = config.playerStats.aura;
      const mobility = config.playerStats.mobility;
      
      let safeZone = 30; // Base safe zone in pixels
      if (aura >= 6) {
        safeZone += 15;
      }
      if (mobility <= 4) {
        safeZone -= 20;
      }
      safeZone = Math.max(10, safeZone); // Minimum safe zone

      // Wobble frequency (bus shaking)
      const wobbleFrequency = aura >= 6 ? 1.5 : 2.5;

      // Input handling
      const keys: Record<string, boolean> = {};
      
      const handleKeyDown = (e: KeyboardEvent) => {
        keys[e.key.toLowerCase()] = true;
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
        keys[e.key.toLowerCase()] = false;
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      const cleanup = () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        gameActive = false;
        // Stop bus minigame music and restore default background music
        stopBackgroundMusic();
        playBackgroundMusic('/audio/music/background.mp3', { loop: true, volume: 0.6, autoplay: true });
      };

      const update = (deltaTime: number) => {
        if (!gameActive) return;

        // Update timer
        timeRemaining -= deltaTime;
        if (timeRemaining <= 0) {
          cleanup();
          resolve({ 
            success: true, 
            completed: true,
            extraTimePenalty: busDelayMinutes,
            penaltyReason: busIsLate ? `Bus arrived ${busDelayMinutes} min late` : undefined,
          });
          return;
        }

        // Bus wobble (external force pushing player)
        wobblePhase += deltaTime * wobbleFrequency;
        const wobble = Math.sin(wobblePhase) * 0.3 * deltaTime;
        balance += wobble;

        // Player input
        const balanceSpeed = 0.8 * deltaTime;
        if (keys['arrowleft'] || keys['a']) {
          balance -= balanceSpeed;
        }
        if (keys['arrowright'] || keys['d']) {
          balance += balanceSpeed;
        }

        // Clamp balance
        balance = Math.max(-1, Math.min(1, balance));

        // Check if out of safe zone (fell over)
        const balancePixels = balance * (BALANCE_BAR_WIDTH / 2);
        if (Math.abs(balancePixels) > safeZone / 2) {
          cleanup();
          // Still completed the journey, just with a penalty
          resolve({ 
            success: false, 
            completed: true,
            extraTimePenalty: busDelayMinutes,
            penaltyReason: busIsLate ? `Bus arrived ${busDelayMinutes} min late` : undefined,
          });
          return;
        }
      };

      const render = () => {
        if (!ctx || !gameActive) return;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw bus interior background (walls)
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Ceiling with lighting
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 35);
        
        // Ceiling lights
        for (let i = 0; i < 5; i++) {
          const x = 80 + i * 130;
          ctx.fillStyle = '#ffffe0';
          ctx.fillRect(x, 8, 50, 15);
          ctx.fillStyle = '#ffffaa';
          ctx.fillRect(x + 5, 12, 40, 8);
        }
        
        // Bus windows with animated scenery
        const scrollOffset = (performance.now() / 50) % 150;
        for (let i = 0; i < 5; i++) {
          const x = 30 + i * 130;
          
          // Window frame
          ctx.fillStyle = '#2a2a2a';
          ctx.fillRect(x, 40, 110, 90);
          
          // Window glass with sky gradient
          const gradient = ctx.createLinearGradient(0, 40, 0, 130);
          gradient.addColorStop(0, '#87ceeb');
          gradient.addColorStop(1, '#b0d4f1');
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 5, 45, 100, 80);
          
          // Passing clouds/buildings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const cloudX = (x + scrollOffset + i * 40) % (CANVAS_WIDTH + 60);
          ctx.fillRect(cloudX - 30, 55, 40, 15);
          ctx.fillRect(cloudX - 20, 65, 30, 15);
          
          // Building silhouettes
          ctx.fillStyle = 'rgba(80, 80, 80, 0.4)';
          const buildingX = (x - scrollOffset * 1.5 + i * 60) % (CANVAS_WIDTH + 100);
          ctx.fillRect(buildingX - 40, 90, 25, 35);
          ctx.fillRect(buildingX - 10, 95, 20, 30);
          
          // Window divider
          ctx.fillStyle = '#2a2a2a';
          ctx.fillRect(x + 52, 45, 6, 80);
        }

        // Bus seats on the sides
        for (let i = 0; i < 3; i++) {
          const y = 150 + i * 60;
          
          // Left seats
          ctx.fillStyle = '#3d5a80';
          ctx.fillRect(10, y, 60, 45);
          ctx.fillStyle = '#293f5e';
          ctx.fillRect(10, y, 60, 15); // Seat back
          ctx.fillStyle = '#4a6fa5';
          ctx.fillRect(15, y + 5, 50, 8);
          
          // Right seats
          ctx.fillRect(CANVAS_WIDTH - 70, y, 60, 45);
          ctx.fillStyle = '#293f5e';
          ctx.fillRect(CANVAS_WIDTH - 70, y, 60, 15);
          ctx.fillStyle = '#4a6fa5';
          ctx.fillRect(CANVAS_WIDTH - 65, y + 5, 50, 8);
        }

        // Vertical poles
        for (let i = 0; i < 4; i++) {
          const x = 150 + i * 130;
          ctx.fillStyle = '#888';
          ctx.fillRect(x, 35, 8, CANVAS_HEIGHT - 135);
          
          // Pole shine
          ctx.fillStyle = '#aaa';
          ctx.fillRect(x + 1, 35, 3, CANVAS_HEIGHT - 135);
        }
        
        // Horizontal hand rails
        ctx.fillStyle = '#888';
        ctx.fillRect(100, 35, CANVAS_WIDTH - 200, 6);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(100, 36, CANVAS_WIDTH - 200, 2);

        // Bus floor with better texture
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
        
        // Floor pattern (rubber mat texture)
        ctx.fillStyle = '#2a2a2a';
        for (let y = 0; y < 100; y += 10) {
          for (let x = 0; x < CANVAS_WIDTH; x += 10) {
            ctx.fillRect(x + (y % 20) / 2, CANVAS_HEIGHT - 100 + y, 8, 8);
          }
        }
        
        // Yellow safety line at floor edge
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 4);

        // Draw balance bar
        const barX = CANVAS_WIDTH / 2 - BALANCE_BAR_WIDTH / 2;
        const barY = CANVAS_HEIGHT - 180;
        
        // Bar background
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, BALANCE_BAR_WIDTH, 20);
        
        // Safe zone
        const safeZoneX = barX + BALANCE_BAR_WIDTH / 2 - safeZone / 2;
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(safeZoneX, barY, safeZone, 20);
        
        // Center line
        ctx.strokeStyle = '#4a8c2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX + BALANCE_BAR_WIDTH / 2, barY);
        ctx.lineTo(barX + BALANCE_BAR_WIDTH / 2, barY + 20);
        ctx.stroke();
        
        // Balance indicator
        const indicatorX = barX + BALANCE_BAR_WIDTH / 2 + balance * (BALANCE_BAR_WIDTH / 2);
        ctx.fillStyle = Math.abs(balance * (BALANCE_BAR_WIDTH / 2)) > safeZone / 2 ? '#c94444' : '#4ac94a';
        ctx.fillRect(indicatorX - 3, barY - 5, 6, 30);

        // Draw player
        const playerX = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2 + balance * 40;
        const playerY = CANVAS_HEIGHT - 150;
        
        // Player body (tilting based on balance)
        ctx.save();
        ctx.translate(playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT);
        ctx.rotate(balance * 0.3);
        
        // Legs
        ctx.fillStyle = '#2a4d6e';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 4, -16, 10, 16);
        ctx.fillRect(-PLAYER_WIDTH / 2 + 18, -16, 10, 16);
        
        // Shoes
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 2, -4, 12, 4);
        ctx.fillRect(-PLAYER_WIDTH / 2 + 16, -4, 12, 4);
        
        // Torso
        ctx.fillStyle = '#5a9abd';
        ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT + 12, PLAYER_WIDTH, 32);
        
        // Arms (swaying for balance)
        const armSwing = balance * 15;
        ctx.fillStyle = '#d4a574';
        // Left arm
        ctx.fillRect(-PLAYER_WIDTH / 2 - 6, -PLAYER_HEIGHT + 14 - armSwing, 6, 20);
        // Right arm
        ctx.fillRect(PLAYER_WIDTH / 2, -PLAYER_HEIGHT + 14 + armSwing, 6, 20);
        
        // Hands
        ctx.fillStyle = '#c49464';
        ctx.beginPath();
        ctx.arc(-PLAYER_WIDTH / 2 - 3, -PLAYER_HEIGHT + 34 - armSwing, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(PLAYER_WIDTH / 2 + 3, -PLAYER_HEIGHT + 34 + armSwing, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 10, -PLAYER_HEIGHT + 10, 12, 6);
        
        // Head
        ctx.fillStyle = '#f5d5a8';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 6, -PLAYER_HEIGHT, 20, 16);
        
        // Hair
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 6, -PLAYER_HEIGHT, 20, 6);
        ctx.fillRect(-PLAYER_WIDTH / 2 + 4, -PLAYER_HEIGHT + 2, 4, 8);
        ctx.fillRect(-PLAYER_WIDTH / 2 + 22, -PLAYER_HEIGHT + 2, 4, 8);
        
        // Eyes (worried expression)
        ctx.fillStyle = '#2d2d2d';
        if (Math.abs(balance) > 0.6) {
          // Wide eyes when losing balance
          ctx.fillRect(-PLAYER_WIDTH / 2 + 9, -PLAYER_HEIGHT + 7, 3, 5);
          ctx.fillRect(-PLAYER_WIDTH / 2 + 20, -PLAYER_HEIGHT + 7, 3, 5);
        } else {
          // Normal eyes
          ctx.fillRect(-PLAYER_WIDTH / 2 + 9, -PLAYER_HEIGHT + 8, 3, 3);
          ctx.fillRect(-PLAYER_WIDTH / 2 + 20, -PLAYER_HEIGHT + 8, 3, 3);
        }
        
        // Mouth (changes based on balance)
        ctx.fillStyle = '#2d2d2d';
        if (Math.abs(balance) > 0.7) {
          // Worried/scared mouth
          ctx.beginPath();
          ctx.ellipse(0, -PLAYER_HEIGHT + 13, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (Math.abs(balance) > 0.4) {
          // Concerned line
          ctx.fillRect(-PLAYER_WIDTH / 2 + 10, -PLAYER_HEIGHT + 13, 12, 2);
        } else {
          // Slight smile
          ctx.fillRect(-PLAYER_WIDTH / 2 + 10, -PLAYER_HEIGHT + 13, 10, 2);
          ctx.fillRect(-PLAYER_WIDTH / 2 + 11, -PLAYER_HEIGHT + 14, 8, 1);
        }
        
        // Backpack (student detail)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-PLAYER_WIDTH / 2 - 2, -PLAYER_HEIGHT + 16, 6, 16);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(-PLAYER_WIDTH / 2 - 1, -PLAYER_HEIGHT + 20, 4, 2);
        
        ctx.restore();

        // Update header
        header.innerHTML = `
          <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
            <span>Time: ${Math.ceil(timeRemaining)}s</span>
            <span>Balance: ${(balance * 100).toFixed(0)}%</span>
            <span>Aura: ${aura} | Safe Zone: ${safeZone}px</span>
          </div>
        `;
      };

      const gameLoop = (currentTime: number) => {
        if (!gameActive) return;

        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        update(deltaTime);
        render();

        requestAnimationFrame(gameLoop);
      };

      requestAnimationFrame(gameLoop);
    });
  },
};
