import type { Minigame, MinigameConfig, MinigameResult } from './types';

// Grid system: 32x32 tiles
const TILE_SIZE = 32;
const CANVAS_WIDTH = 480; // 15 tiles wide (portrait mode)
const CANVAS_HEIGHT = 640; // 20 tiles tall (portrait mode)
const LANE_WIDTH = 128; // 4 tiles per lane
const NUM_LANES = 3;
const CAR_WIDTH = 74; // Downsized by 1/3 (was 111)
const CAR_HEIGHT = 132; // Downsized by 1/3 (was 198)
const PARKING_TIME_LIMIT = 10; // seconds for parking phase

interface TrafficCar {
  x: number;
  y: number;
  lane: number;
  speed: number;
  color: 'blue' | 'green' | 'white';
}

// Sprite loader helper
const loadSprite = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const driveMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
    return new Promise(async (resolve) => {
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

      // Load car sprites and tile images
      let playerCarSprite: HTMLImageElement;
      let blueCarSprite: HTMLImageElement;
      let greenCarSprite: HTMLImageElement;
      let whiteCarSprite: HTMLImageElement;
      let roadTile: HTMLImageElement;
      let grassLeftTile: HTMLImageElement;
      let grassRightTile: HTMLImageElement;

      try {
        [playerCarSprite, blueCarSprite, greenCarSprite, whiteCarSprite, roadTile, grassLeftTile, grassRightTile] = await Promise.all([
          loadSprite('/sprites/cargame/self_car.png'),
          loadSprite('/sprites/cargame/blue_car.png'),
          loadSprite('/sprites/cargame/green_car.png'),
          loadSprite('/sprites/cargame/white_car.png'),
          loadSprite('/sprites/cargame/road.png'),
          loadSprite('/sprites/cargame/grass_left.png'),
          loadSprite('/sprites/cargame/grass_right.png'),
        ]);
      } catch (error) {
        console.error('Failed to load sprites:', error);
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
      let playerLane = 1; // Middle lane (target lane)
      let playerY = CANVAS_HEIGHT - CAR_HEIGHT - 100; // More space from bottom
      const roadX = CANVAS_WIDTH / 2 - (NUM_LANES * LANE_WIDTH) / 2;
      let playerX = roadX + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2; // Actual X position
      let roadOffset = 0;
      const trafficCars: TrafficCar[] = [];
      let spawnTimer = 0;
      const spawnInterval = 1.0; // Faster attempts since we now limit to 2 lanes occupied
      let survivalTime = 0; // Track how long player has survived (seconds)
      const SURVIVAL_GOAL = 60; // Need to survive for 60 seconds
      const LANE_CHANGE_SPEED = 600; // Pixels per second for smooth lane transitions
      
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
      const laneChangeCooldown = 0.2; // seconds (faster for better responsiveness)
      
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
        // Strategy: Spawn freely, but prevent all 3 lanes from being blocked simultaneously ahead of player
        const MIN_SPACING_SPAWN = CAR_HEIGHT * 4; // Minimum spacing between cars in same lane
        
        // Find lanes that can spawn (no car within MIN_SPACING from spawn point)
        const availableLanes: number[] = [];
        for (let lane = 0; lane < NUM_LANES; lane++) {
          let canSpawn = true;
          for (const car of trafficCars) {
            if (car.lane === lane && car.y < MIN_SPACING_SPAWN) {
              canSpawn = false;
              break;
            }
          }
          if (canSpawn) {
            availableLanes.push(lane);
          }
        }
        
        // No lanes available to spawn
        if (availableLanes.length === 0) {
          return;
        }
        
        // Randomly pick a lane from available lanes
        const spawnLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        
        // Check if spawning in this lane would block all 3 lanes ahead of player
        // Define "blocking zone" as the area ahead of player where they need escape routes
        const BLOCKING_ZONE_START = playerY - CAR_HEIGHT * 5; // 5 car lengths ahead
        const BLOCKING_ZONE_END = playerY;
        
        // Count how many lanes are currently blocked in this zone
        const lanesBlockedInZone: Set<number> = new Set();
        for (const car of trafficCars) {
          if (car.y >= BLOCKING_ZONE_START && car.y <= BLOCKING_ZONE_END) {
            lanesBlockedInZone.add(car.lane);
          }
        }
        
        // Check if the new spawn would block a 3rd lane
        // If there are already 2 lanes blocked, and this is a 3rd different lane, skip it
        if (lanesBlockedInZone.size >= 2 && !lanesBlockedInZone.has(spawnLane)) {
          // This would be the 3rd lane blocked - skip this spawn
          return;
        }
        
        const speed = (100 + Math.random() * 40) * trafficSpeedMultiplier; // More consistent speed (100-140)
        const colors: Array<'blue' | 'green' | 'white'> = ['blue', 'green', 'white'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        trafficCars.push({
          x: CANVAS_WIDTH / 2 - (NUM_LANES * LANE_WIDTH) / 2 + spawnLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2,
          y: -CAR_HEIGHT,
          lane: spawnLane,
          speed,
          color,
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
        // Update survival time
        survivalTime += deltaTime;
        
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

        // Smooth lane transition - interpolate playerX toward target lane position
        const targetX = roadX + playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
        const distanceToTarget = targetX - playerX;
        
        if (Math.abs(distanceToTarget) > 1) {
          // Move toward target
          const moveAmount = LANE_CHANGE_SPEED * deltaTime;
          if (distanceToTarget > 0) {
            playerX = Math.min(playerX + moveAmount, targetX);
          } else {
            playerX = Math.max(playerX - moveAmount, targetX);
          }
        } else {
          // Snap to target when close enough
          playerX = targetX;
        }

        // Road scrolling (aligned to tile size)
        roadOffset += 250 * deltaTime; // Slightly faster scroll for taller canvas
        if (roadOffset >= TILE_SIZE) {
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
          
          // Check if there's a car ahead in the same lane
          const MIN_CAR_DISTANCE = CAR_HEIGHT * 2.5; // Increased minimum distance for safer merging
          
          for (const otherCar of trafficCars) {
            if (otherCar === car) continue;
            if (otherCar.lane === car.lane && otherCar.y > car.y) {
              const distance = otherCar.y - car.y;
              if (distance < MIN_CAR_DISTANCE) {
                // Match speed with car ahead to maintain distance
                car.speed = Math.min(car.speed, otherCar.speed * 0.95); // Slightly slower to create gap
                break;
              }
            }
          }
          
          car.y += car.speed * deltaTime;

          // Check collision with player (with generous tolerance for fairer gameplay)
          const COLLISION_TOLERANCE_HORIZONTAL = 12; // More forgiving on sides
          const COLLISION_TOLERANCE_VERTICAL = 15; // Very forgiving vertically
          if (checkCollision(
            playerX + COLLISION_TOLERANCE_HORIZONTAL, 
            playerY + COLLISION_TOLERANCE_VERTICAL, 
            CAR_WIDTH - COLLISION_TOLERANCE_HORIZONTAL * 2, 
            CAR_HEIGHT - COLLISION_TOLERANCE_VERTICAL * 2, 
            car.x, 
            car.y, 
            CAR_WIDTH, 
            CAR_HEIGHT
          )) {
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

        // Check if survived for 60 seconds
        if (survivalTime >= SURVIVAL_GOAL) {
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
        const roadWidth = NUM_LANES * LANE_WIDTH;
        
        // Draw grass on left side (stretched to fit width, one tile per row)
        const leftGrassWidth = roadX;
        for (let y = 0; y < CANVAS_HEIGHT; y += TILE_SIZE) {
          ctx.drawImage(grassLeftTile, 0, y, leftGrassWidth, TILE_SIZE);
        }
        
        // Draw grass on right side (stretched to fit width, one tile per row)
        const rightGrassX = roadX + roadWidth;
        const rightGrassWidth = CANVAS_WIDTH - rightGrassX;
        for (let y = 0; y < CANVAS_HEIGHT; y += TILE_SIZE) {
          ctx.drawImage(grassRightTile, rightGrassX, y, rightGrassWidth, TILE_SIZE);
        }
        
        // Draw road tiles (static, no scrolling, 4x larger)
        const roadTileSize = TILE_SIZE * 4; // 128px instead of 32px
        for (let y = 0; y < CANVAS_HEIGHT; y += roadTileSize) {
          for (let x = roadX; x < roadX + roadWidth; x += roadTileSize) {
            ctx.drawImage(roadTile, x, y, roadTileSize, roadTileSize);
          }
        }

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

        // Traffic cars
        trafficCars.forEach((car) => {
          let carSprite: HTMLImageElement;
          switch (car.color) {
            case 'blue':
              carSprite = blueCarSprite;
              break;
            case 'green':
              carSprite = greenCarSprite;
              break;
            case 'white':
              carSprite = whiteCarSprite;
              break;
          }
          ctx.drawImage(carSprite, car.x, car.y, CAR_WIDTH, CAR_HEIGHT);
        });

        // Player car (uses smoothly interpolated playerX)
        ctx.drawImage(playerCarSprite, playerX, playerY, CAR_WIDTH, CAR_HEIGHT);
      };

      const renderParking = () => {
        if (!ctx) return;

        // Parking lot background
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Parking space (aligned to 32x32 tile grid, sized for smaller car)
        const parkingWidth = 96; // 3 tiles (fits 74px car with some margin)
        const parkingHeight = 160; // 5 tiles (fits 132px car with some margin)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(CANVAS_WIDTH / 2 - parkingWidth / 2, CANVAS_HEIGHT / 2 - parkingHeight / 2, parkingWidth, parkingHeight);

        // Draw player car in parking space
        const carX = CANVAS_WIDTH / 2 - CAR_WIDTH / 2;
        const carY = CANVAS_HEIGHT / 2 - CAR_HEIGHT / 2;
        ctx.drawImage(playerCarSprite, carX, carY, CAR_WIDTH, CAR_HEIGHT);

        // Parking indicator bar (aligned to 32x32 tiles)
        const barWidth = 384; // 12 tiles (fits within 480px canvas)
        const barHeight = 32; // 1 tile
        const barX = CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = CANVAS_HEIGHT - 128; // 4 tiles from bottom (more space in taller canvas)

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
        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE in the green zone!', CANVAS_WIDTH / 2, 96); // 3 tiles from top
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
          const timeRemaining = Math.max(0, SURVIVAL_GOAL - survivalTime);
          header.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
              <span>Phase: Driving</span>
              <span>Time: ${Math.ceil(timeRemaining)}s</span>
              <span>On Road: ${trafficCars.length}</span>
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
