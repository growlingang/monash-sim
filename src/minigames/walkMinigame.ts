
import type { Minigame, MinigameConfig, MinigameResult } from './types';
import { drawSubSprite } from '../utils/spriteLoader';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

interface Vehicle {
  x: number;
  lane: number;
  speed: number;
  color: 'blue' | 'green' | 'white';
}

const TILE_SIZE = 32;
const TOTAL_LANES = 50; // Total lanes to cross before reaching campus
const VISIBLE_LANES = 19; // Number of lanes visible on screen at once
const CANVAS_WIDTH = 480; // 15 tiles wide (portrait mode, matching driveMinigame)
const CANVAS_HEIGHT = 640; // 20 tiles tall (portrait mode, matching driveMinigame)
const PLAYER_SIZE = 32;
const VEHICLE_WIDTH = 30; // Scaled down to fit in lanes (when rotated, this becomes height)
const VEHICLE_HEIGHT = 54; // Scaled down proportionally (when rotated, this becomes width)

// Sprite loader helper
const loadSprite = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const walkMinigame: Minigame = {
  mount: async (container: HTMLElement, config: MinigameConfig): Promise<MinigameResult> => {
    return new Promise(async (resolve) => {
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

      // Load car sprites, road tile, and grass tile
      let blueCarSprite: HTMLImageElement;
      let greenCarSprite: HTMLImageElement;
      let whiteCarSprite: HTMLImageElement;
      let roadTile: HTMLImageElement;
      let grassTile: HTMLImageElement;

      try {
        [blueCarSprite, greenCarSprite, whiteCarSprite, roadTile, grassTile] = await Promise.all([
          loadSprite('/sprites/cargame/blue_car.png'),
          loadSprite('/sprites/cargame/green_car.png'),
          loadSprite('/sprites/cargame/white_car.png'),
          loadSprite('/sprites/cargame/road.png'),
          loadSprite('/sprites/cargame/normal_grass.png'),
        ]);
      } catch (error) {
        console.error('Failed to load sprites:', error);
        resolve({ success: false, completed: false });
        return;
      }


      // Game state
      let playerX = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2; // Center horizontally
      let playerAbsoluteLane = TOTAL_LANES - 1; // Start in the last lane (bottom)
      let cameraOffset = TOTAL_LANES - VISIBLE_LANES; // Camera shows bottom portion initially
      let targetCameraOffset = TOTAL_LANES - VISIBLE_LANES; // Target for smooth scrolling
      const CAMERA_SCROLL_SPEED = 3.0; // How fast camera pans (higher = faster)
      // Player's screen position (always tries to stay near bottom of visible area)
      let playerScreenY = (VISIBLE_LANES - 1) * TILE_SIZE + 32 + (TILE_SIZE - PLAYER_SIZE) / 2;
      const vehicles: Vehicle[] = [];
      let gameActive = true;
      let lastTime = performance.now();
      let spawnTimer = 0;
      let elapsedTime = 0; // Track time since game start

      // Composite sprite/animation state
      let frameIndex = 0;
      let currentAnimation: keyof typeof ANIMATION_FRAMES = 'walk_forward';
      let playerFrames = ANIMATION_FRAMES[currentAnimation];
      // Get custom sprite from game state (if available)
      let customSprite = (window as any).gameStore?.getState?.().playerSprite;
      if (!customSprite) {
        customSprite = DEFAULT_PLAYER;
      }
      await buildCompositeSprite(customSprite, 32, 32);

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
      const keysPressed: Record<string, boolean> = {}; // Track if key was just pressed
      
      const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (!keys[key]) {
          keysPressed[key] = true; // Only set to true on initial press
        }
        keys[key] = true;
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

      // Helper function to get lane direction (alternating) - uses absolute lane
      const getLaneDirection = (absoluteLane: number): number => {
        return absoluteLane % 2 === 0 ? 1 : -1; // Even lanes go right, odd lanes go left
      };

      // Convert absolute lane to screen Y position (handles fractional camera offset for smooth scrolling)
      const getScreenY = (absoluteLane: number): number => {
        const relativeLane = absoluteLane - cameraOffset;
        return relativeLane * TILE_SIZE + 32 + (TILE_SIZE - VEHICLE_WIDTH) / 2;
      };


      const checkCollision = (vx: number, vy: number, vw: number, vh: number): boolean => {
        return (
          playerX < vx + vw &&
          playerX + PLAYER_SIZE > vx &&
          playerScreenY < vy + vh &&
          playerScreenY + PLAYER_SIZE > vy
        );
      };

      const update = (deltaTime: number) => {
        if (!gameActive) return;

        // Update elapsed time
        elapsedTime += deltaTime;

        // Smoothly interpolate camera offset toward target
        if (Math.abs(cameraOffset - targetCameraOffset) > 0.01) {
          const diff = targetCameraOffset - cameraOffset;
          cameraOffset += diff * CAMERA_SCROLL_SPEED * deltaTime;
          // Snap to target when very close
          if (Math.abs(cameraOffset - targetCameraOffset) < 0.01) {
            cameraOffset = targetCameraOffset;
          }
        }

        // Track which lanes got a spawn this frame
        const lanesSpawnedThisFrame = new Set<number>();

        // Calculate visible lane range (use Math.floor for spawn logic to avoid fractional lanes)
        const visibleLaneStart = Math.floor(cameraOffset);
        const visibleLaneEnd = Math.floor(cameraOffset) + VISIBLE_LANES + 1; // +1 buffer for smooth transitions

        // Ensure each visible lane has at least 1 car (except starting lane in first 5 seconds)
        for (let absoluteLane = visibleLaneStart; absoluteLane < visibleLaneEnd; absoluteLane++) {
          // Skip the starting lane (bottom) for the first 5 seconds
          const startingLane = TOTAL_LANES - 1;
          if (absoluteLane === startingLane && elapsedTime < 5) {
            continue;
          }
          
          const carsInLane = vehicles.filter(v => v.lane === absoluteLane);
          if (carsInLane.length === 0) {
            // Spawn a car in this empty lane
            const direction = getLaneDirection(absoluteLane);
            const speed = (100 + Math.random() * 50) * direction;
            const colors: Array<'blue' | 'green' | 'white'> = ['blue', 'green', 'white'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            vehicles.push({
              x: direction > 0 ? -VEHICLE_HEIGHT : CANVAS_WIDTH + VEHICLE_HEIGHT,
              lane: absoluteLane,
              speed,
              color,
            });
            lanesSpawnedThisFrame.add(absoluteLane);
          }
        }

        // Spawn additional vehicles periodically (only in visible lanes)
        spawnTimer += deltaTime;
        if (spawnTimer >= spawnInterval) {
          let attempts = 0;
          while (attempts < 10) {
            const absoluteLane = visibleLaneStart + Math.floor(Math.random() * VISIBLE_LANES);
            // Skip the starting lane in first 5 seconds
            const startingLane = TOTAL_LANES - 1;
            if (absoluteLane === startingLane && elapsedTime < 5) {
              attempts++;
              continue;
            }
            if (!lanesSpawnedThisFrame.has(absoluteLane)) {
              const direction = getLaneDirection(absoluteLane);
              const speed = (100 + Math.random() * 50) * direction;
              const colors: Array<'blue' | 'green' | 'white'> = ['blue', 'green', 'white'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              vehicles.push({
                x: direction > 0 ? -VEHICLE_HEIGHT : CANVAS_WIDTH + VEHICLE_HEIGHT,
                lane: absoluteLane,
                speed,
                color,
              });
              break;
            }
            attempts++;
          }
          spawnTimer = 0;
        }

        // Player movement
        const moveSpeed = 150 * deltaTime; // pixels per second
        
        // Horizontal movement (smooth, not lane-restricted)
        if (keys['arrowleft'] || keys['a']) {
          playerX = Math.max(0, playerX - moveSpeed);
        }
        if (keys['arrowright'] || keys['d']) {
          playerX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, playerX + moveSpeed);
        }

        // Vertical movement - one press = one lane (absolute lane tracking)
        if (keysPressed['arrowup'] || keysPressed['w']) {
          if (playerAbsoluteLane > 0) {
            playerAbsoluteLane--;
            
            // Calculate player's position relative to target camera (use target for smoother feel)
            const relativeLane = playerAbsoluteLane - targetCameraOffset;
            
            // Only scroll camera if player reaches middle of screen (lane 9 or less)
            if (relativeLane <= 9 && targetCameraOffset > 0) {
              targetCameraOffset = Math.max(0, targetCameraOffset - 1);
            }
          } else if (playerAbsoluteLane === 0) {
            // Reached campus!
            playerAbsoluteLane = -1;
            // Ensure campus is visible
            targetCameraOffset = 0;
          }
          keysPressed['arrowup'] = false;
          keysPressed['w'] = false;
        }
        if (keysPressed['arrowdown'] || keysPressed['s']) {
          if (playerAbsoluteLane < TOTAL_LANES - 1) {
            playerAbsoluteLane++;
            
            // Calculate player's position relative to target camera
            const relativeLane = playerAbsoluteLane - targetCameraOffset;
            
            // Only scroll camera if player reaches middle going down (lane 9 or more)
            if (relativeLane >= 9 && targetCameraOffset < TOTAL_LANES - VISIBLE_LANES) {
              targetCameraOffset = Math.min(TOTAL_LANES - VISIBLE_LANES, targetCameraOffset + 1);
            }
          }
          keysPressed['arrowdown'] = false;
          keysPressed['s'] = false;
        }

        // Update player screen Y based on absolute lane and camera
        if (playerAbsoluteLane === -1) {
          playerScreenY = 0; // In goal zone
        } else {
          const relativeLane = playerAbsoluteLane - cameraOffset;
          playerScreenY = relativeLane * TILE_SIZE + 32 + (TILE_SIZE - PLAYER_SIZE) / 2;
        }

        // Check if reached campus
        if (playerAbsoluteLane === -1) {
          cleanup();
          resolve({ success: true, completed: true });
          return;
        }

        // Update vehicles
        for (let i = vehicles.length - 1; i >= 0; i--) {
          const vehicle = vehicles[i];
          
          // Check if there's a vehicle ahead in the same lane (avoid car-to-car collision)
          const MIN_CAR_DISTANCE = VEHICLE_HEIGHT * 2; // Minimum spacing between cars
          let shouldSlowDown = false;
          
          for (const otherVehicle of vehicles) {
            if (otherVehicle === vehicle) continue;
            if (otherVehicle.lane === vehicle.lane) {
              // All cars in a lane move in the same direction (alternating lanes)
              const distance = vehicle.speed > 0 ? 
                otherVehicle.x - vehicle.x : 
                vehicle.x - otherVehicle.x;
              
              if (distance > 0 && distance < MIN_CAR_DISTANCE) {
                shouldSlowDown = true;
                break;
              }
            }
          }
          
          // Update position (slow down if car ahead)
          if (!shouldSlowDown) {
            vehicle.x += vehicle.speed * deltaTime;
          } else {
            vehicle.x += vehicle.speed * deltaTime * 0.5; // Move at half speed
          }

          // Check if vehicle is in visible range (with buffer for smooth scrolling)
          if (vehicle.lane >= Math.floor(cameraOffset) - 1 && vehicle.lane < Math.floor(cameraOffset) + VISIBLE_LANES + 1) {
            // Check collision with player (rotated dimensions)
            const vehicleScreenY = getScreenY(vehicle.lane);
            const rotatedWidth = VEHICLE_HEIGHT; // After 90 degree rotation, height becomes width
            const rotatedHeight = VEHICLE_WIDTH; // After 90 degree rotation, width becomes height
            if (checkCollision(vehicle.x, vehicleScreenY, rotatedWidth, rotatedHeight)) {
            cleanup();
            // Still made it to campus, just injured
            resolve({ success: false, completed: true });
            return;
            }
          }

          // Remove off-screen vehicles (horizontally or outside visible lane range)
          const rotatedWidth = VEHICLE_HEIGHT;
          if (vehicle.x < -rotatedWidth * 2 || vehicle.x > CANVAS_WIDTH + rotatedWidth * 2) {
            vehicles.splice(i, 1);
          }
          // Also remove vehicles that are no longer in visible lane range (with larger buffer)
          if (vehicle.lane < Math.floor(cameraOffset) - 3 || vehicle.lane > Math.floor(cameraOffset) + VISIBLE_LANES + 3) {
            vehicles.splice(i, 1);
          }
        }
      };

      const render = () => {
        if (!ctx || !gameActive) return;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw goal zone at top (visible when camera is near the top)
        if (cameraOffset < 1) {
          // Draw grass tiles for campus area
          for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE) {
            ctx.drawImage(grassTile, x, 0, TILE_SIZE, 32);
          }
          
          // Draw CAMPUS text
          ctx.fillStyle = '#4a8c2a';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          // Add text outline for better visibility
          ctx.strokeStyle = '#2d5016';
          ctx.lineWidth = 3;
          ctx.strokeText('CAMPUS', CANVAS_WIDTH / 2, 22);
          ctx.fillText('CAMPUS', CANVAS_WIDTH / 2, 22);
        }

        // Draw lanes with road tiles (with fractional offset for smooth scrolling)
        const baseCameraOffset = Math.floor(cameraOffset);
        const fractionalOffset = (cameraOffset - baseCameraOffset) * TILE_SIZE;
        
        // Draw extra lanes at top and bottom for smooth scrolling
        for (let i = -1; i <= VISIBLE_LANES + 1; i++) {
          const absoluteLane = baseCameraOffset + i;
          const y = i * TILE_SIZE + 32 - fractionalOffset;
          
          // Only draw lanes that exist and are visible on screen
          if (absoluteLane >= 0 && absoluteLane < TOTAL_LANES && y + TILE_SIZE >= 0 && y < CANVAS_HEIGHT) {
            // Draw road tiles across the lane width
            for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE) {
              ctx.drawImage(roadTile, x, y, TILE_SIZE, TILE_SIZE);
            }
            
            // Lane dividers
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(0, y + TILE_SIZE);
            ctx.lineTo(CANVAS_WIDTH, y + TILE_SIZE);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Draw vehicles with car sprites (only visible ones)
        vehicles.forEach((vehicle) => {
          // Only draw if vehicle is in visible range (with buffer)
          if (vehicle.lane < Math.floor(cameraOffset) - 1 || vehicle.lane >= Math.floor(cameraOffset) + VISIBLE_LANES + 1) {
            return;
          }
          
          const y = getScreenY(vehicle.lane);
          
          let carSprite: HTMLImageElement;
          switch (vehicle.color) {
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
          
          // Rotate car based on direction
          ctx.save();
          if (vehicle.speed > 0) {
            // Coming from left, rotate 90 degrees anticlockwise (-π/2)
            ctx.translate(vehicle.x + VEHICLE_HEIGHT / 2, y + VEHICLE_WIDTH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(carSprite, -VEHICLE_WIDTH / 2, -VEHICLE_HEIGHT / 2, VEHICLE_WIDTH, VEHICLE_HEIGHT);
          } else {
            // Coming from right, rotate 90 degrees clockwise (π/2)
            ctx.translate(vehicle.x + VEHICLE_HEIGHT / 2, y + VEHICLE_WIDTH / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(carSprite, -VEHICLE_WIDTH / 2, -VEHICLE_HEIGHT / 2, VEHICLE_WIDTH, VEHICLE_HEIGHT);
          }
          ctx.restore();
        });


        // Draw player composite sprite (animated)
        if (customSprite?.compositedImage) {
          const frame = playerFrames[frameIndex];
          drawSubSprite(ctx, customSprite.compositedImage, {
            x: playerX,
            y: playerScreenY,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            sourceX: (frame.col - 1) * 32,
            sourceY: (frame.row - 1) * 32,
            sourceWidth: 32,
            sourceHeight: 32,
          });
          frameIndex = (frameIndex + 1) % playerFrames.length;
        } else {
          // Fallback to rectangle if sprite not loaded
          ctx.fillStyle = '#4ac94a';
          ctx.fillRect(playerX, playerScreenY, PLAYER_SIZE, PLAYER_SIZE);
          ctx.fillStyle = '#2d5016';
          ctx.fillRect(playerX + 8, playerScreenY + 8, 6, 6);
          ctx.fillRect(playerX + 18, playerScreenY + 8, 6, 6);
          ctx.fillRect(playerX + 8, playerScreenY + 18, 16, 4);
        }

        // Update header
        const lanesRemaining = playerAbsoluteLane + 1; // +1 because lane 0 is still one to cross
        header.innerHTML = `
          <div style="display: flex; justify-content: space-between; width: ${CANVAS_WIDTH}px; font-family: monospace;">
            <span>Lanes: ${lanesRemaining}/${TOTAL_LANES}</span>
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
