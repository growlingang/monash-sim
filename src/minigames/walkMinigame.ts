import type { Minigame, MinigameConfig, MinigameResult } from './types';

interface Vehicle {
  x: number;
  lane: number;
  speed: number;
}

const TILE_SIZE = 32;
const LANES = 9;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = LANES * TILE_SIZE + 64; // Extra space for UI
const PLAYER_SIZE = 32;
const TIME_LIMIT = 60; // seconds
const VEHICLE_WIDTH = 48;
const VEHICLE_HEIGHT = 24;

export const walkMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
    return new Promise((resolve) => {
      container.innerHTML = '';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'minigame-walk';
      wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px;';

      const header = document.createElement('div');
      header.className = 'minigame-walk__header';
      header.style.cssText = 'margin-bottom: 10px; font-size: 14px;';
      
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';
      
      const instructions = document.createElement('div');
      instructions.className = 'minigame-walk__instructions';
      instructions.style.cssText = 'margin-top: 10px; text-align: center; font-size: 12px; color: #999;';
      instructions.innerHTML = `
        <p><strong>Arrow Keys</strong> or <strong>WASD</strong> to move</p>
        <p>Reach the top to get to campus!</p>
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

      // Game state
      let playerX = CANVAS_WIDTH / 2;
      let playerY = CANVAS_HEIGHT - TILE_SIZE - 10;
      const vehicles: Vehicle[] = [];
      let timeRemaining = TIME_LIMIT;
      let gameActive = true;
      let lastTime = performance.now();
      let spawnTimer = 0;

      // Calculate spawn rate based on mobility stat
      const mobility = config.playerStats.mobility;
      let spawnInterval: number;
      if (mobility >= 6) {
        spawnInterval = 1.5; // Easier
      } else if (mobility <= 4) {
        spawnInterval = 0.9; // Harder
      } else {
        spawnInterval = 1.2; // Normal
      }

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

      const spawnVehicle = () => {
        const lane = Math.floor(Math.random() * LANES);
        const direction = Math.random() > 0.5 ? 1 : -1;
        const speed = (2 + Math.random() * 2) * direction;
        
        vehicles.push({
          x: direction > 0 ? -VEHICLE_WIDTH : CANVAS_WIDTH + VEHICLE_WIDTH,
          lane,
          speed,
        });
      };

      const checkCollision = (vx: number, vy: number, vw: number, vh: number): boolean => {
        return (
          playerX < vx + vw &&
          playerX + PLAYER_SIZE > vx &&
          playerY < vy + vh &&
          playerY + PLAYER_SIZE > vy
        );
      };

      const update = (deltaTime: number) => {
        if (!gameActive) return;

        // Update timer
        timeRemaining -= deltaTime;
        if (timeRemaining <= 0) {
          cleanup();
          resolve({ success: false, completed: true });
          return;
        }

        // Spawn vehicles
        spawnTimer += deltaTime;
        if (spawnTimer >= spawnInterval) {
          spawnVehicle();
          spawnTimer = 0;
        }

        // Player movement
        const moveSpeed = 150 * deltaTime; // pixels per second
        if (keys['arrowup'] || keys['w']) {
          playerY = Math.max(0, playerY - moveSpeed);
        }
        if (keys['arrowdown'] || keys['s']) {
          playerY = Math.min(CANVAS_HEIGHT - PLAYER_SIZE - 10, playerY + moveSpeed);
        }
        if (keys['arrowleft'] || keys['a']) {
          playerX = Math.max(0, playerX - moveSpeed);
        }
        if (keys['arrowright'] || keys['d']) {
          playerX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, playerX + moveSpeed);
        }

        // Check if reached top
        if (playerY <= TILE_SIZE) {
          cleanup();
          resolve({ success: true, completed: true });
          return;
        }

        // Update vehicles
        for (let i = vehicles.length - 1; i >= 0; i--) {
          const vehicle = vehicles[i];
          vehicle.x += vehicle.speed;

          // Check collision
          const vehicleY = vehicle.lane * TILE_SIZE + 32;
          if (checkCollision(vehicle.x, vehicleY, VEHICLE_WIDTH, VEHICLE_HEIGHT)) {
            cleanup();
            // Still made it to campus, just injured
            resolve({ success: false, completed: true });
            return;
          }

          // Remove off-screen vehicles
          if (vehicle.x < -VEHICLE_WIDTH * 2 || vehicle.x > CANVAS_WIDTH + VEHICLE_WIDTH * 2) {
            vehicles.splice(i, 1);
          }
        }
      };

      const render = () => {
        if (!ctx || !gameActive) return;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw lanes
        for (let i = 0; i < LANES; i++) {
          const y = i * TILE_SIZE + 32;
          ctx.fillStyle = i % 2 === 0 ? '#2a2a2a' : '#1f1f1f';
          ctx.fillRect(0, y, CANVAS_WIDTH, TILE_SIZE);
          
          // Lane dividers
          ctx.strokeStyle = '#444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
          ctx.stroke();
        }

        // Draw goal zone
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, CANVAS_WIDTH, TILE_SIZE + 32);
        ctx.fillStyle = '#4a8c2a';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CAMPUS', CANVAS_WIDTH / 2, 24);

        // Draw vehicles
        vehicles.forEach((vehicle) => {
          const y = vehicle.lane * TILE_SIZE + 32 + (TILE_SIZE - VEHICLE_HEIGHT) / 2;
          
          // Vehicle body
          ctx.fillStyle = vehicle.speed > 0 ? '#c94444' : '#4444c9';
          ctx.fillRect(vehicle.x, y, VEHICLE_WIDTH, VEHICLE_HEIGHT);
          
          // Vehicle details
          ctx.fillStyle = '#222';
          ctx.fillRect(vehicle.x + 4, y + 4, VEHICLE_WIDTH - 8, VEHICLE_HEIGHT - 8);
        });

        // Draw player
        ctx.fillStyle = '#4ac94a';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
        
        // Player face
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(playerX + 8, playerY + 8, 6, 6);
        ctx.fillRect(playerX + 18, playerY + 8, 6, 6);
        ctx.fillRect(playerX + 8, playerY + 18, 16, 4);

        // Update header
        header.innerHTML = `
          <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
            <span>Time: ${Math.ceil(timeRemaining)}s</span>
            <span>Vehicles: ${vehicles.length}</span>
            <span>Mobility: ${mobility}</span>
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
