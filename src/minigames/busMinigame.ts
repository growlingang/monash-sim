import type { Minigame, MinigameConfig, MinigameResult } from './types';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const BALANCE_BAR_WIDTH = 120;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const TIME_LIMIT = 25; // seconds

export const busMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
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

        // Draw bus interior background
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Bus windows
        for (let i = 0; i < 4; i++) {
          const x = 50 + i * 150;
          ctx.fillStyle = '#87ceeb';
          ctx.fillRect(x, 40, 100, 80);
          ctx.fillStyle = '#4a90a4';
          ctx.fillRect(x + 50, 40, 2, 80);
        }

        // Bus floor
        ctx.fillStyle = '#555';
        ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
        
        // Floor lines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 80, CANVAS_HEIGHT - 100);
          ctx.lineTo(i * 80 + 40, CANVAS_HEIGHT);
          ctx.stroke();
        }

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
        
        // Body
        ctx.fillStyle = '#4a8c2a';
        ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        // Face
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(-PLAYER_WIDTH / 2 + 6, -PLAYER_HEIGHT + 8, 6, 6);
        ctx.fillRect(-PLAYER_WIDTH / 2 + 20, -PLAYER_HEIGHT + 8, 6, 6);
        
        // Mouth (worried expression)
        const mouthY = Math.abs(balance) > 0.5 ? -PLAYER_HEIGHT + 24 : -PLAYER_HEIGHT + 22;
        ctx.fillRect(-PLAYER_WIDTH / 2 + 8, mouthY, 16, 3);
        
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
