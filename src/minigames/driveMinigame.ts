import type { Minigame, MinigameConfig, MinigameResult } from './types';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const LANE_WIDTH = 80;
const NUM_LANES = 3;
const CAR_WIDTH = 60;
const CAR_HEIGHT = 80;
const PARKING_TIME_LIMIT = 10; // seconds for parking phase

interface TrafficCar {
  x: number;
  y: number;
  lane: number;
  speed: number;
}

export const driveMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
    return new Promise((resolve) => {
      container.innerHTML = '';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'minigame-drive';
      wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px;';

      const header = document.createElement('div');
      header.className = 'minigame-drive__header';
      header.style.cssText = 'margin-bottom: 10px; font-size: 14px;';
      
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      canvas.style.cssText = 'border: 2px solid #333; background: #1a1a1a;';
      
      const instructions = document.createElement('div');
      instructions.className = 'minigame-drive__instructions';
      instructions.style.cssText = 'margin-top: 10px; text-align: center; font-size: 12px; color: #999;';
      
      wrapper.appendChild(header);
      wrapper.appendChild(canvas);
      wrapper.appendChild(instructions);
      container.appendChild(wrapper);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ success: false, completed: false });
        return;
      }

      // Calculate traffic speed based on stats
      const organisation = config.playerStats.organisation;
      const aura = config.playerStats.aura;
      const mobility = config.playerStats.mobility;
      
      let trafficSpeedMultiplier = 1.0;
      if (organisation >= 6 || aura >= 6) {
        trafficSpeedMultiplier = 0.9; // 10% slower
      }
      if (mobility <= 4) {
        trafficSpeedMultiplier = 1.1; // 10% faster
      }

      // Game phases
      type GamePhase = 'driving' | 'parking';
      let currentPhase: GamePhase = 'driving';
      
      // Driving phase state
      let playerLane = 1; // Middle lane
      let playerY = CANVAS_HEIGHT - CAR_HEIGHT - 20;
      let roadOffset = 0;
      const trafficCars: TrafficCar[] = [];
      let spawnTimer = 0;
      const spawnInterval = 1.5;
      
      // Parking phase state
      let parkingTime = PARKING_TIME_LIMIT;
      let parkingIndicator = 0; // 0 to 1, aim for 0.5
      let parkingIndicatorSpeed = 0.3;
      let parkingAttempts = 0;
      
      let gameActive = true;
      let lastTime = performance.now();

      instructions.innerHTML = `
        <p><strong>Left/Right Arrow Keys</strong> or <strong>A/D</strong> to change lanes</p>
        <p>Avoid traffic, then park perfectly!</p>
      `;

      // Input handling
      const keys: Record<string, boolean> = {};
      let laneChangeTimer = 0;
      const laneChangeCooldown = 0.3; // seconds
      
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

      const spawnTraffic = () => {
        const lane = Math.floor(Math.random() * NUM_LANES);
        const speed = (100 + Math.random() * 100) * trafficSpeedMultiplier;
        
        trafficCars.push({
          x: CANVAS_WIDTH / 2 - (NUM_LANES * LANE_WIDTH) / 2 + lane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2,
          y: -CAR_HEIGHT,
          lane,
          speed,
        });
      };

      const checkCollision = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean => {
        return (
          x1 < x2 + w2 &&
          x1 + w1 > x2 &&
          y1 < y2 + h2 &&
          y1 + h1 > y2
        );
      };

      const updateDriving = (deltaTime: number) => {
        // Lane changing
        laneChangeTimer += deltaTime;
        if (laneChangeTimer >= laneChangeCooldown) {
          if ((keys['arrowleft'] || keys['a']) && playerLane > 0) {
            playerLane--;
            laneChangeTimer = 0;
          }
          if ((keys['arrowright'] || keys['d']) && playerLane < NUM_LANES - 1) {
            playerLane++;
            laneChangeTimer = 0;
          }
        }

        // Road scrolling
        roadOffset += 200 * deltaTime;
        if (roadOffset >= 40) {
          roadOffset = 0;
        }

        // Spawn traffic
        spawnTimer += deltaTime;
        if (spawnTimer >= spawnInterval) {
          spawnTraffic();
          spawnTimer = 0;
        }

        // Update traffic
        for (let i = trafficCars.length - 1; i >= 0; i--) {
          const car = trafficCars[i];
          car.y += car.speed * deltaTime;

          // Check collision
          const playerX = CANVAS_WIDTH / 2 - (NUM_LANES * LANE_WIDTH) / 2 + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
          if (checkCollision(playerX, playerY, CAR_WIDTH, CAR_HEIGHT, car.x, car.y, CAR_WIDTH, CAR_HEIGHT)) {
            cleanup();
            // Still made it to campus, just had to fix the car
            resolve({ success: false, completed: true });
            return;
          }

          // Remove off-screen cars
          if (car.y > CANVAS_HEIGHT) {
            trafficCars.splice(i, 1);
          }
        }

        // Check if reached destination (drove for enough time)
        if (trafficCars.length >= 8) {
          currentPhase = 'parking';
          trafficCars.length = 0;
          instructions.innerHTML = `
            <p><strong>SPACE</strong> when indicator is in the green zone!</p>
            <p>Perfect parking required!</p>
          `;
        }
      };

      const updateParking = (deltaTime: number) => {
        parkingTime -= deltaTime;
        
        if (parkingTime <= 0) {
          parkingAttempts++;
          if (parkingAttempts >= 2) {
            // Auto-complete after 2 failures
            cleanup();
            resolve({ success: false, completed: true });
            return;
          }
          // Reset for another attempt
          parkingTime = PARKING_TIME_LIMIT;
          parkingIndicator = 0;
        }

        // Move indicator
        parkingIndicator += parkingIndicatorSpeed * deltaTime;
        if (parkingIndicator >= 1 || parkingIndicator <= 0) {
          parkingIndicatorSpeed = -parkingIndicatorSpeed;
          parkingIndicator = Math.max(0, Math.min(1, parkingIndicator));
        }

        // Check for space key press
        if (keys[' ']) {
          const tolerance = 0.15; // Green zone is 0.5 +/- 0.15
          if (Math.abs(parkingIndicator - 0.5) <= tolerance) {
            cleanup();
            resolve({ success: true, completed: true });
          } else {
            parkingAttempts++;
            if (parkingAttempts >= 2) {
              cleanup();
              resolve({ success: false, completed: true });
              return;
            }
            parkingTime = PARKING_TIME_LIMIT;
            parkingIndicator = 0;
          }
          keys[' '] = false;
        }
      };

      const update = (deltaTime: number) => {
        if (!gameActive) return;

        if (currentPhase === 'driving') {
          updateDriving(deltaTime);
        } else {
          updateParking(deltaTime);
        }
      };

      const renderDriving = () => {
        if (!ctx) return;

        // Draw road
        const roadX = CANVAS_WIDTH / 2 - (NUM_LANES * LANE_WIDTH) / 2;
        
        // Road background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(roadX, 0, NUM_LANES * LANE_WIDTH, CANVAS_HEIGHT);

        // Lane dividers (scrolling)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 20]);
        for (let i = 1; i < NUM_LANES; i++) {
          ctx.beginPath();
          ctx.moveTo(roadX + i * LANE_WIDTH, -roadOffset);
          ctx.lineTo(roadX + i * LANE_WIDTH, CANVAS_HEIGHT);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Road edges
        ctx.fillStyle = '#4a8c2a';
        ctx.fillRect(0, 0, roadX, CANVAS_HEIGHT);
        ctx.fillRect(roadX + NUM_LANES * LANE_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Traffic cars
        trafficCars.forEach((car) => {
          ctx.fillStyle = '#c94444';
          ctx.fillRect(car.x, car.y, CAR_WIDTH, CAR_HEIGHT);
          
          // Car details
          ctx.fillStyle = '#87ceeb';
          ctx.fillRect(car.x + 5, car.y + 10, CAR_WIDTH - 10, 20);
          ctx.fillRect(car.x + 5, car.y + 40, CAR_WIDTH - 10, 20);
        });

        // Player car
        const playerX = roadX + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
        ctx.fillStyle = '#4444c9';
        ctx.fillRect(playerX, playerY, CAR_WIDTH, CAR_HEIGHT);
        
        // Player car details
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(playerX + 5, playerY + 10, CAR_WIDTH - 10, 20);
        ctx.fillRect(playerX + 5, playerY + 50, CAR_WIDTH - 10, 20);
      };

      const renderParking = () => {
        if (!ctx) return;

        // Parking lot background
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Parking space
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 120, 200, 160);

        // Parking indicator bar
        const barWidth = 400;
        const barHeight = 30;
        const barX = CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = CANVAS_HEIGHT - 100;

        // Bar background
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Green zone
        const greenZoneWidth = barWidth * 0.3;
        const greenZoneX = barX + barWidth / 2 - greenZoneWidth / 2;
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(greenZoneX, barY, greenZoneWidth, barHeight);

        // Indicator
        const indicatorX = barX + parkingIndicator * barWidth;
        ctx.fillStyle = '#4ac94a';
        ctx.fillRect(indicatorX - 5, barY - 10, 10, barHeight + 20);

        // Instructions
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE in the green zone!', CANVAS_WIDTH / 2, 60);
      };

      const render = () => {
        if (!ctx || !gameActive) return;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (currentPhase === 'driving') {
          renderDriving();
        } else {
          renderParking();
        }

        // Update header
        if (currentPhase === 'driving') {
          header.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
              <span>Phase: Driving</span>
              <span>Traffic: ${trafficCars.length}</span>
              <span>Speed: ${(trafficSpeedMultiplier * 100).toFixed(0)}%</span>
            </div>
          `;
        } else {
          header.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
              <span>Phase: Parking</span>
              <span>Time: ${Math.ceil(parkingTime)}s</span>
              <span>Attempt: ${parkingAttempts + 1}/2</span>
            </div>
          `;
        }
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
