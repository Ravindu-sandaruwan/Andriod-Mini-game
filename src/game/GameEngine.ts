import * as THREE from 'three';
import { Lane, PowerUpState, PowerUpType, CharacterConfig, UpgradeLevels } from '../types/game';
import { CharacterRig, buildCharacterRig, animateCharacterRig, AnimState, CHARACTERS_DATA } from './CharacterMesh';
import { EnvironmentBuilder, ChunkInstance, CHUNK_LENGTH, LANE_COORDS } from './EnvironmentBuilder';
import { soundManager } from '../audio/SoundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, multiplier: number) => void;
  onCoinCollect: (coins: number) => void;
  onPowerUpStateUpdate: (powerups: PowerUpState[]) => void;
  onHoverboardUpdate: (active: boolean, count: number) => void;
  onGameOver: (finalScore: number, runCoins: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private callbacks: GameEngineCallbacks;

  // Environment & Chunks
  private envBuilder: EnvironmentBuilder;
  private chunks: ChunkInstance[] = [];
  private chunkCounter: number = 0;
  private maxVisibleChunks: number = 5;

  // Character
  private characterRig: CharacterRig;
  private currentCharacter: CharacterConfig;
  private currentLane: Lane = 0;
  private targetLane: Lane = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private laneTilt: number = 0;

  // Game Progress & Speed
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isDead: boolean = false;
  private speed: number = 22; // Initial running speed m/s
  private baseMultiplier: number = 1;
  private currentScore: number = 0;
  private runCoins: number = 0;
  private hoverboardsInventory: number = 3;
  private upgrades: UpgradeLevels = { jetpack: 1, magnet: 1, multiplier: 1, sneakers: 1 };
  private screenShakeEnabled: boolean = true;

  // Power-up States
  private powerUps: Record<PowerUpType, PowerUpState> = {
    jetpack: { type: 'jetpack', duration: 8, remaining: 0, active: false },
    magnet: { type: 'magnet', duration: 10, remaining: 0, active: false },
    multiplier: { type: 'multiplier', duration: 12, remaining: 0, active: false },
    sneakers: { type: 'sneakers', duration: 10, remaining: 0, active: false },
    hoverboard: { type: 'hoverboard', duration: 25, remaining: 0, active: false },
  };

  // Particles
  private particleGroup: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Camera Shake
  private cameraShakeIntensity: number = 0;
  private cameraBaseOffset = new THREE.Vector3(0, 4.2, 7.5);
  private cameraLookOffset = new THREE.Vector3(0, 1.8, -6);

  // Animation Frame Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private totalRunTime: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.012);

    // 2. Camera
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 700;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 300);
    this.camera.position.set(0, 4.2, 7.5);

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Environment Builder
    this.envBuilder = new EnvironmentBuilder();

    // 6. Particle Container
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // 7. Initial Character
    this.currentCharacter = CHARACTERS_DATA[0];
    this.characterRig = buildCharacterRig(this.currentCharacter);
    this.scene.add(this.characterRig.root);

    // 8. Handle Window Resizing
    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    // Warm Directional Sunlight
    const sun = new THREE.DirectionalLight(0xfff7ed, 1.3);
    sun.position.set(15, 30, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun);

    // Subtle blue hemilight for cartoon bounce shading
    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x475569, 0.4);
    this.scene.add(hemi);
  }

  public setCharacter(characterId: string) {
    const found = CHARACTERS_DATA.find((c) => c.id === characterId) || CHARACTERS_DATA[0];
    this.currentCharacter = found;
    this.scene.remove(this.characterRig.root);
    this.characterRig = buildCharacterRig(this.currentCharacter);
    this.scene.add(this.characterRig.root);
    this.characterRig.root.position.set(this.playerX, this.playerY, this.playerZ);
  }

  public setUpgrades(upgrades: UpgradeLevels) {
    this.upgrades = upgrades;
    // Calculate durations based on upgrade levels (1 to 5)
    this.powerUps.jetpack.duration = 6 + (upgrades.jetpack - 1) * 2;
    this.powerUps.magnet.duration = 8 + (upgrades.magnet - 1) * 2;
    this.powerUps.multiplier.duration = 10 + (upgrades.multiplier - 1) * 3;
    this.powerUps.sneakers.duration = 8 + (upgrades.sneakers - 1) * 2;
  }

  public setHoverboardsCount(count: number) {
    this.hoverboardsInventory = count;
    this.callbacks.onHoverboardUpdate(this.powerUps.hoverboard.active, this.hoverboardsInventory);
  }

  public setScreenShakeEnabled(enabled: boolean) {
    this.screenShakeEnabled = enabled;
  }

  /**
   * Starts a brand new endless run
   */
  public startRun() {
    this.isRunning = true;
    this.isPaused = false;
    this.isDead = false;

    // Reset player position and state
    this.currentLane = 0;
    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.laneTilt = 0;

    // Reset speed & scores
    this.speed = 22;
    this.currentScore = 0;
    this.runCoins = 0;
    this.totalRunTime = 0;

    // Reset active powerups
    (Object.keys(this.powerUps) as PowerUpType[]).forEach((key) => {
      this.powerUps[key].active = false;
      this.powerUps[key].remaining = 0;
    });

    // Clear existing chunks
    this.chunks.forEach((c) => this.scene.remove(c.group));
    this.chunks = [];
    this.chunkCounter = 0;

    // Generate initial track chunks ahead of player
    for (let i = 0; i < this.maxVisibleChunks; i++) {
      this.spawnNextChunk();
    }

    this.callbacks.onScoreUpdate(0, 1);
    this.callbacks.onCoinCollect(0);
    this.callbacks.onPowerUpStateUpdate(this.getActivePowerUpList());
    this.callbacks.onHoverboardUpdate(false, this.hoverboardsInventory);

    soundManager.startMusic();

    this.lastTime = performance.now();
    if (this.animFrameId === null) {
      this.animate();
    }
  }

  public pause() {
    this.isPaused = true;
    soundManager.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    soundManager.startMusic();
  }

  // --- Input Actions ---

  public moveLeft() {
    if (!this.isRunning || this.isPaused || this.isDead) return;
    if (this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as Lane;
      soundManager.playLaneChange();
      this.laneTilt = 0.25; // Lean left
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused || this.isDead) return;
    if (this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as Lane;
      soundManager.playLaneChange();
      this.laneTilt = -0.25; // Lean right
    }
  }

  public jump() {
    if (!this.isRunning || this.isPaused || this.isDead) return;

    // If sliding, cancel slide immediately to jump
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    if (this.isGrounded || this.powerUps.jetpack.active) {
      const jumpImpulse = this.powerUps.sneakers.active ? 15.5 : 12.0;
      this.velocityY = jumpImpulse;
      this.isGrounded = false;
      soundManager.playJump();
      this.spawnJumpPuff();
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused || this.isDead) return;

    // If airborne, perform fast-fall dive slam to ground!
    if (!this.isGrounded && !this.powerUps.jetpack.active) {
      this.velocityY = -22.0;
    }

    this.isSliding = true;
    this.slideTimer = 0.85; // Slide lasts ~0.85s
    soundManager.playSlide();
    this.spawnSlideDust();
  }

  public activateHoverboard() {
    if (!this.isRunning || this.isPaused || this.isDead) return;
    if (this.powerUps.hoverboard.active) return; // already active

    if (this.hoverboardsInventory > 0) {
      this.hoverboardsInventory--;
      this.powerUps.hoverboard.active = true;
      this.powerUps.hoverboard.remaining = this.powerUps.hoverboard.duration;
      soundManager.playHoverboard();
      this.callbacks.onHoverboardUpdate(true, this.hoverboardsInventory);
      this.callbacks.onPowerUpStateUpdate(this.getActivePowerUpList());
      this.spawnPowerUpBurst(this.playerX, this.playerY + 0.3, this.playerZ, 0x38bdf8);
    }
  }

  // --- Main 60FPS Game Loop ---

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Clamp dt to prevent frame spikes
    this.lastTime = now;

    if (!this.isRunning || this.isPaused) {
      // Idle character showcase animation in menu
      if (!this.isRunning) {
        this.totalRunTime += dt;
        animateCharacterRig(this.characterRig, this.totalRunTime, 'celebrate', 10, false, false, 0);
        this.renderer.render(this.scene, this.camera);
      }
      return;
    }

    this.totalRunTime += dt;

    if (!this.isDead) {
      // 1. Advance Forward
      const currentSpeed = this.speed;
      this.playerZ -= currentSpeed * dt;

      // Slowly increase difficulty/speed
      if (this.speed < 42) {
        this.speed += dt * 0.28;
      }

      // 2. Smooth Lane Interpolation (Lerp X)
      const targetX = LANE_COORDS[this.targetLane];
      this.playerX = THREE.MathUtils.lerp(this.playerX, targetX, 1 - Math.exp(-18 * dt));
      this.laneTilt = THREE.MathUtils.lerp(this.laneTilt, 0, 1 - Math.exp(-10 * dt));

      // 3. Vertical Physics (Jump / Fall / Jetpack)
      this.updateVerticalPhysics(dt);

      // 4. Slide Duration
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        }
      }

      // 5. Update Power-ups
      this.updatePowerUps(dt);

      // 6. Score Accumulator
      const multiplier = this.baseMultiplier * (this.powerUps.multiplier.active ? 2 : 1);
      this.currentScore += Math.floor(currentSpeed * dt * 2.5 * multiplier);
      this.callbacks.onScoreUpdate(this.currentScore, multiplier);

      // 7. Move Moving Trains & Objects
      this.updateMovingObstacles(dt);

      // 8. Collisions (Obstacles & Coins & Power-ups)
      this.checkCollisions();

      // 9. Procedural Track Infinite Recycling
      this.updateChunks();

      // 10. Update Character Rig Animation
      let animState: AnimState = 'run';
      if (!this.isGrounded && !this.powerUps.jetpack.active) {
        animState = 'jump';
      } else if (this.isSliding) {
        animState = 'slide';
      }

      animateCharacterRig(
        this.characterRig,
        this.totalRunTime,
        animState,
        this.speed,
        this.powerUps.hoverboard.active,
        this.powerUps.jetpack.active,
        this.laneTilt
      );
    } else {
      // Dead state: stumble animation
      animateCharacterRig(this.characterRig, this.totalRunTime, 'crash', 0, false, false, 0);
    }

    // 11. Update Character Position
    this.characterRig.root.position.set(this.playerX, this.playerY, this.playerZ);

    // 12. Particles Update
    this.updateParticles(dt);

    // 13. Dynamic Camera Follow & Screen Shake
    this.updateCamera(dt);

    // 14. Render Frame
    this.renderer.render(this.scene, this.camera);
  };

  private updateVerticalPhysics(dt: number) {
    if (this.powerUps.jetpack.active) {
      // Smoothly ascend to high sky lane
      const targetFlightY = 6.2;
      this.playerY = THREE.MathUtils.lerp(this.playerY, targetFlightY, 1 - Math.exp(-6 * dt));
      this.velocityY = 0;
      this.isGrounded = false;
      return;
    }

    const gravity = -38; // Snappy arcade gravity
    this.velocityY += gravity * dt;
    this.playerY += this.velocityY * dt;

    // Ground floor collision check
    if (this.playerY <= 0) {
      this.playerY = 0;
      this.velocityY = 0;
      this.isGrounded = true;
    }
  }

  private updatePowerUps(dt: number) {
    let stateChanged = false;

    (Object.keys(this.powerUps) as PowerUpType[]).forEach((key) => {
      const p = this.powerUps[key];
      if (p.active) {
        p.remaining -= dt;
        if (p.remaining <= 0) {
          p.active = false;
          p.remaining = 0;
          stateChanged = true;

          if (key === 'hoverboard') {
            this.callbacks.onHoverboardUpdate(false, this.hoverboardsInventory);
          }
        }
      }
    });

    if (stateChanged || Math.floor(this.totalRunTime * 10) % 5 === 0) {
      this.callbacks.onPowerUpStateUpdate(this.getActivePowerUpList());
    }
  }

  private getActivePowerUpList(): PowerUpState[] {
    return Object.values(this.powerUps).filter((p) => p.active);
  }

  private updateMovingObstacles(dt: number) {
    this.chunks.forEach((chunk) => {
      chunk.movingTrains.forEach((item) => {
        const moveDist = (item.data.speed || 15) * dt;
        item.mesh.position.z += moveDist;
        item.data.z += moveDist;
      });
    });
  }

  private checkCollisions() {
    const playerBox = new THREE.Box3();
    const halfWidth = 0.35;
    const playerHeight = this.isSliding ? 0.7 : 1.7; // Lower bounding box when sliding!

    playerBox.min.set(
      this.playerX - halfWidth,
      this.playerY,
      this.playerZ - 0.35
    );
    playerBox.max.set(
      this.playerX + halfWidth,
      this.playerY + playerHeight,
      this.playerZ + 0.35
    );

    // 1. Coins Collection & Magnet Attraction
    const isMagnetActive = this.powerUps.magnet.active;
    const magnetRadius = 11.0;

    for (const chunk of this.chunks) {
      for (let i = 0; i < chunk.coins.length; i++) {
        const coin = chunk.coins[i];
        if (coin.collected) continue;

        const mesh = chunk.coinMeshes[i];
        if (!mesh) continue;

        // Spin coins nicely
        mesh.rotation.z += 0.08;

        const distZ = Math.abs(coin.z - this.playerZ);
        if (distZ > 30) continue; // Too far to check

        // Magnet vacuum pull
        if (isMagnetActive && distZ < magnetRadius) {
          const coinPos = mesh.position;
          // Interpolate coin toward player
          coinPos.x = THREE.MathUtils.lerp(coinPos.x, this.playerX, 0.2);
          coinPos.y = THREE.MathUtils.lerp(coinPos.y, this.playerY + 1.0, 0.2);
          coinPos.z = THREE.MathUtils.lerp(coinPos.z, this.playerZ - chunk.zStart, 0.2);
          coin.x = coinPos.x;
          coin.y = coinPos.y;
          coin.z = chunk.zStart + coinPos.z;
        }

        // Distance check for collection
        const dx = coin.x - this.playerX;
        const dy = coin.y - (this.playerY + 0.8);
        const dz = coin.z - this.playerZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 1.44) {
          coin.collected = true;
          mesh.visible = false;
          this.runCoins += 1;
          this.callbacks.onCoinCollect(this.runCoins);
          soundManager.playCoin();
          this.spawnCoinSparkle(coin.x, coin.y, coin.z);
        }
      }

      // 2. Power-Up Pickups
      for (let i = 0; i < chunk.powerups.length; i++) {
        const pData = chunk.powerups[i];
        if (pData.collected) continue;

        const pMesh = chunk.powerupMeshes[i];
        if (!pMesh) continue;

        pMesh.rotation.y += 0.04; // Spin pickup

        const distZ = Math.abs(pData.z - this.playerZ);
        if (distZ < 1.5 && Math.abs(pData.x - this.playerX) < 1.2 && Math.abs(pData.y - this.playerY) < 2.0) {
          pData.collected = true;
          pMesh.visible = false;
          this.activatePowerUp(pData.type);
        }
      }

      // 3. Obstacle Collision (Bypass ground obstacles when jetpack active!)
      if (this.powerUps.jetpack.active) continue;

      for (const obstacle of chunk.obstacles) {
        // Ramp check: if running up a ramp onto a train
        if (obstacle.type === 'ramp') {
          const distZ = Math.abs(obstacle.z - this.playerZ);
          const distX = Math.abs(LANE_COORDS[obstacle.lane] - this.playerX);
          if (distX < 1.0 && distZ < (obstacle.length || 5) / 2) {
            // Smoothly lift player onto train roof
            const rampProgress = 1 - (this.playerZ - (obstacle.z - 2.75)) / 5.5;
            if (rampProgress >= 0 && rampProgress <= 1) {
              const trainRoofY = obstacle.height || 3.5;
              this.playerY = Math.max(this.playerY, rampProgress * trainRoofY);
              this.velocityY = 0;
              this.isGrounded = true;
            }
          }
          continue;
        }

        const obstLaneX = LANE_COORDS[obstacle.lane];
        const distX = Math.abs(obstLaneX - this.playerX);
        const distZ = Math.abs(obstacle.z - this.playerZ);

        const hitToleranceZ = (obstacle.length || 0.8) / 2 + 0.35;
        const hitToleranceX = (obstacle.width || 2.0) / 2;

        if (distX < hitToleranceX && distZ < hitToleranceZ) {
          let hasCollided = false;

          if (obstacle.type === 'barrier_low' || obstacle.type === 'traffic_cones') {
            // Must jump over! If player feet are below obstacle height, crash!
            if (this.playerY < (obstacle.height || 1.0) - 0.15) {
              hasCollided = true;
            }
          } else if (obstacle.type === 'barrier_high') {
            // Must slide under! If player is standing (not sliding), crash!
            if (!this.isSliding || this.playerY > 0.4) {
              hasCollided = true;
            }
          } else if (obstacle.type === 'train_static' || obstacle.type === 'train_moving') {
            // Train collision
            const trainTopY = (obstacle.height || 3.5) + 0.2;
            // If player is on top of the train roof, allow running on top!
            if (this.playerY >= trainTopY - 0.2) {
              this.playerY = trainTopY;
              this.velocityY = 0;
              this.isGrounded = true;
            } else {
              hasCollided = true;
            }
          }

          if (hasCollided) {
            this.handleCollision();
            return;
          }
        }
      }
    }
  }

  private activatePowerUp(type: PowerUpType) {
    const power = this.powerUps[type];
    power.active = true;
    power.remaining = power.duration;

    soundManager.playPowerup();
    this.callbacks.onPowerUpStateUpdate(this.getActivePowerUpList());
    this.spawnPowerUpBurst(this.playerX, this.playerY + 1.2, this.playerZ, 0xfacc15);

    if (type === 'hoverboard') {
      this.callbacks.onHoverboardUpdate(true, this.hoverboardsInventory);
    }
  }

  private handleCollision() {
    // Check if Hoverboard Shield protects from death!
    if (this.powerUps.hoverboard.active) {
      this.powerUps.hoverboard.active = false;
      this.powerUps.hoverboard.remaining = 0;
      soundManager.playShieldBreak();

      // Explosion of blue shield particles
      this.spawnPowerUpBurst(this.playerX, this.playerY + 1.0, this.playerZ, 0x38bdf8);
      this.callbacks.onHoverboardUpdate(false, this.hoverboardsInventory);
      this.callbacks.onPowerUpStateUpdate(this.getActivePowerUpList());

      // Minor camera shake
      if (this.screenShakeEnabled) {
        this.cameraShakeIntensity = 0.35;
      }

      // Small bounce recovery
      this.velocityY = 8.0;
      this.isGrounded = false;
      return;
    }

    // Fatal Crash
    this.isDead = true;
    soundManager.playCrash();
    soundManager.stopMusic();

    if (this.screenShakeEnabled) {
      this.cameraShakeIntensity = 0.8;
    }

    this.spawnCrashExplosion(this.playerX, this.playerY + 0.8, this.playerZ);

    // Trigger Game Over after short tumble impact
    setTimeout(() => {
      this.isRunning = false;
      this.callbacks.onGameOver(this.currentScore, this.runCoins);
    }, 900);
  }

  // --- Procedural World Chunk Cycling ---

  private spawnNextChunk() {
    const zStart = -this.chunkCounter * CHUNK_LENGTH;
    const difficultyFactor = Math.min(this.speed / 20, 2.5);
    const chunk = this.envBuilder.createChunk(this.chunkCounter, zStart, difficultyFactor);
    this.chunks.push(chunk);
    this.scene.add(chunk.group);
    this.chunkCounter++;
  }

  private updateChunks() {
    // If player has moved past the oldest chunk, recycle it
    if (this.chunks.length > 0) {
      const oldestChunk = this.chunks[0];
      // Chunk ends at zStart - CHUNK_LENGTH
      if (this.playerZ < oldestChunk.zStart - CHUNK_LENGTH - 10) {
        this.scene.remove(oldestChunk.group);
        this.chunks.shift();
        this.spawnNextChunk();
      }
    }
  }

  // --- Camera & Screen Shake ---

  private updateCamera(dt: number) {
    const targetCamX = this.playerX * 0.45;
    const targetCamY = this.cameraBaseOffset.y + Math.max(0, this.playerY * 0.65);
    const targetCamZ = this.playerZ + this.cameraBaseOffset.z;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 1 - Math.exp(-12 * dt));
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 1 - Math.exp(-8 * dt));
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 1 - Math.exp(-25 * dt));

    // Apply Camera Shake
    if (this.cameraShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.2);
    }

    const lookAtX = this.playerX * 0.3;
    const lookAtY = this.cameraLookOffset.y + this.playerY * 0.5;
    const lookAtZ = this.playerZ + this.cameraLookOffset.z;
    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  // --- Particle Systems ---

  private spawnCoinSparkle(x: number, y: number, z: number) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

    for (let i = 0; i < 7; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );

      this.particles.push({ mesh, velocity: vel, life: 0.45, maxLife: 0.45 });
    }
  }

  private spawnPowerUpBurst(x: number, y: number, z: number, colorHex: number) {
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8 + 3,
        (Math.random() - 0.5) * 8
      );

      this.particles.push({ mesh, velocity: vel, life: 0.65, maxLife: 0.65 });
    }
  }

  private spawnJumpPuff() {
    const geo = new THREE.SphereGeometry(0.14, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.playerX + (Math.random() - 0.5) * 0.4, 0.1, this.playerZ + (Math.random() - 0.5) * 0.4);
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      );

      this.particles.push({ mesh, velocity: vel, life: 0.35, maxLife: 0.35 });
    }
  }

  private spawnSlideDust() {
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 });

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(this.playerX + (Math.random() - 0.5) * 0.3, 0.1, this.playerZ + Math.random() * 0.5);
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        Math.random() * 6 + 2 // kicks back behind player
      );

      this.particles.push({ mesh, velocity: vel, life: 0.4, maxLife: 0.4 });
    }
  }

  private spawnCrashExplosion(x: number, y: number, z: number) {
    const geo = new THREE.DodecahedronGeometry(0.2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 9 + 2,
        (Math.random() - 0.5) * 10
      );

      this.particles.push({ mesh, velocity: vel, life: 0.8, maxLife: 0.8 });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      const scale = p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    soundManager.stopMusic();
    this.renderer.dispose();
  }
}
