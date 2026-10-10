import * as THREE from 'three';
import { Lane, ObstacleData, CoinData, PowerUpPickupData, PowerUpType } from '../types/game';

export const LANE_WIDTH = 2.8;
export const LANE_COORDS: Record<Lane, number> = {
  '-1': -LANE_WIDTH,
  '0': 0,
  '1': LANE_WIDTH,
};

export const CHUNK_LENGTH = 64; // Length of each procedural chunk

export interface ChunkInstance {
  id: number;
  zStart: number;
  group: THREE.Group;
  obstacles: ObstacleData[];
  coins: CoinData[];
  coinMeshes: THREE.Mesh[];
  powerups: PowerUpPickupData[];
  powerupMeshes: THREE.Group[];
  movingTrains: {
    mesh: THREE.Group;
    data: ObstacleData;
  }[];
}

export class EnvironmentBuilder {
  private materials: Record<string, THREE.Material> = {};
  private coinGeometry: THREE.BufferGeometry;
  private coinMaterial: THREE.Material;

  constructor() {
    this.initSharedMaterials();
    // Reusable coin geometry: faceted cylinder with beveled feel
    this.coinGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 16);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xcc8800,
      metalness: 0.8,
      roughness: 0.25,
    });
  }

  private initSharedMaterials() {
    // Railway track & ballast
    this.materials.ballast = new THREE.MeshLambertMaterial({ color: 0x272e38 });
    this.materials.rail = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
    this.materials.tie = new THREE.MeshLambertMaterial({ color: 0x5a3e2b });
    this.materials.curb = new THREE.MeshLambertMaterial({ color: 0x475569 });

    // City building walls
    this.materials.buildingBlue = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    this.materials.buildingTeal = new THREE.MeshLambertMaterial({ color: 0x0f766e });
    this.materials.buildingOrange = new THREE.MeshLambertMaterial({ color: 0xc2410c });
    this.materials.buildingSlate = new THREE.MeshLambertMaterial({ color: 0x334155 });
    this.materials.buildingPurple = new THREE.MeshLambertMaterial({ color: 0x581c87 });
    this.materials.windowLit = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.materials.windowDark = new THREE.MeshLambertMaterial({ color: 0x111827 });

    // Obstacle materials
    this.materials.barrierOrange = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    this.materials.barrierWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    this.materials.signalRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.materials.signalYellow = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    this.materials.metalBlack = new THREE.MeshLambertMaterial({ color: 0x18181b });

    // Train materials
    this.materials.trainBodyRed = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    this.materials.trainBodyBlue = new THREE.MeshLambertMaterial({ color: 0x2563eb });
    this.materials.trainBodyGreen = new THREE.MeshLambertMaterial({ color: 0x16a34a });
    this.materials.trainRoof = new THREE.MeshLambertMaterial({ color: 0x475569 });
    this.materials.trainGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.materials.trainHeadlight = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    // Foliage & props
    this.materials.treeFoliage = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    this.materials.treeTrunk = new THREE.MeshLambertMaterial({ color: 0x78350f });
  }

  /**
   * Generates a track chunk at zStart
   */
  public createChunk(chunkIndex: number, zStart: number, difficultyFactor: number): ChunkInstance {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zStart;

    const obstacles: ObstacleData[] = [];
    const coins: CoinData[] = [];
    const coinMeshes: THREE.Mesh[] = [];
    const powerups: PowerUpPickupData[] = [];
    const powerupMeshes: THREE.Group[] = [];
    const movingTrains: { mesh: THREE.Group; data: ObstacleData }[] = [];

    // 1. Build Base Ground and 3 Railway Tracks
    this.buildTracks(chunkGroup);

    // 2. Build City Scenery on sides (Skyscrapers, streetlights, billboard signs, trees)
    this.buildCityScenery(chunkGroup, chunkIndex);

    // 3. Populate Gameplay Elements (Safe procedural distribution)
    // First 2 chunks are clear tutorial / runway chunks
    if (chunkIndex > 1) {
      this.populateObstaclesAndCollectibles(
        chunkGroup,
        zStart,
        chunkIndex,
        difficultyFactor,
        obstacles,
        coins,
        coinMeshes,
        powerups,
        powerupMeshes,
        movingTrains
      );
    } else {
      // Warm up coins in early chunks
      this.generateCoinArc(chunkGroup, zStart, 0, -20, 10, coins, coinMeshes);
    }

    return {
      id: chunkIndex,
      zStart,
      group: chunkGroup,
      obstacles,
      coins,
      coinMeshes,
      powerups,
      powerupMeshes,
      movingTrains,
    };
  }

  /**
   * Builds the 3 railway lines and roadbed
   */
  private buildTracks(parent: THREE.Group) {
    // Main Ballast Bed (Ground)
    const groundGeo = new THREE.PlaneGeometry(16, CHUNK_LENGTH);
    const ground = new THREE.Mesh(groundGeo, this.materials.ballast);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -CHUNK_LENGTH / 2);
    ground.receiveShadow = true;
    parent.add(ground);

    // Left and Right Curbs
    const curbGeo = new THREE.BoxGeometry(1.2, 0.4, CHUNK_LENGTH);
    const leftCurb = new THREE.Mesh(curbGeo, this.materials.curb);
    leftCurb.position.set(-7, 0.2, -CHUNK_LENGTH / 2);
    const rightCurb = leftCurb.clone();
    rightCurb.position.x = 7;
    parent.add(leftCurb, rightCurb);

    // 3 Railway Lanes: -2.8, 0, 2.8
    const lanes: Lane[] = [-1, 0, 1];
    lanes.forEach((lane) => {
      const laneX = LANE_COORDS[lane];

      // Metallic Steel Rails (pair)
      const railGeo = new THREE.BoxGeometry(0.08, 0.12, CHUNK_LENGTH);
      const railL = new THREE.Mesh(railGeo, this.materials.rail);
      railL.position.set(laneX - 0.7, 0.14, -CHUNK_LENGTH / 2);
      const railR = new THREE.Mesh(railGeo, this.materials.rail);
      railR.position.set(laneX + 0.7, 0.14, -CHUNK_LENGTH / 2);
      parent.add(railL, railR);

      // Wooden Railroad Ties spaced every 2.4 units
      const tieGeo = new THREE.BoxGeometry(1.8, 0.08, 0.35);
      const tieCount = Math.floor(CHUNK_LENGTH / 2.5);
      for (let i = 0; i < tieCount; i++) {
        const tieZ = -(i * 2.5 + 1.25);
        const tie = new THREE.Mesh(tieGeo, this.materials.tie);
        tie.position.set(laneX, 0.04, tieZ);
        tie.receiveShadow = true;
        parent.add(tie);
      }
    });
  }

  /**
   * Builds colorful skyscrapers, neon billboards, streetlights, and trees
   */
  private buildCityScenery(parent: THREE.Group, chunkIndex: number) {
    const buildingMats = [
      this.materials.buildingBlue,
      this.materials.buildingTeal,
      this.materials.buildingOrange,
      this.materials.buildingSlate,
      this.materials.buildingPurple,
    ];

    // Left and Right Building Rows
    const sides = [-1, 1];
    sides.forEach((side) => {
      const xBase = side * 12.5;
      const count = 3;
      const spacing = CHUNK_LENGTH / count;

      for (let i = 0; i < count; i++) {
        const zPos = -(i * spacing + spacing / 2);
        const height = 18 + ((chunkIndex * 7 + i * 11) % 20);
        const width = 8 + ((i * 3) % 4);
        const depth = spacing - 1.5;

        const mat = buildingMats[(chunkIndex + i + (side > 0 ? 2 : 0)) % buildingMats.length];
        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(bGeo, mat);
        bMesh.position.set(xBase + side * (width / 2 - 2), height / 2, zPos);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        parent.add(bMesh);

        // Lit Windows Grid
        const winRows = Math.floor(height / 4);
        for (let r = 1; r < winRows; r++) {
          const winGeo = new THREE.PlaneGeometry(0.8, 1.2);
          const winMat = (r + i + chunkIndex) % 3 === 0 ? this.materials.windowLit : this.materials.windowDark;
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(xBase - side * 2.1, r * 3.8 + 1, zPos);
          win.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          parent.add(win);
        }

        // Rooftop Water Tank or Antenna on some buildings
        if ((i + chunkIndex) % 2 === 0) {
          const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.2, 10);
          const tank = new THREE.Mesh(tankGeo, this.materials.buildingSlate);
          tank.position.set(bMesh.position.x, height + 1.1, zPos);
          parent.add(tank);
        }
      }
    });

    // Streetlights along side tracks
    const lightZPositions = [-10, -32, -54];
    lightZPositions.forEach((z) => {
      sides.forEach((side) => {
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8);
        const pole = new THREE.Mesh(poleGeo, this.materials.metalBlack);
        pole.position.set(side * 5.8, 2.25, z);

        const lampGeo = new THREE.BoxGeometry(0.5, 0.2, 0.4);
        const lamp = new THREE.Mesh(lampGeo, this.materials.signalYellow);
        lamp.position.set(side * 5.3, 4.4, z);

        parent.add(pole, lamp);
      });
    });

    // Overhead Railway Arch / Signal Bridge
    if (chunkIndex % 2 === 1) {
      this.buildOverheadArch(parent, -CHUNK_LENGTH / 2);
    }
  }

  private buildOverheadArch(parent: THREE.Group, z: number) {
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, z);

    // Left Pillar, Right Pillar
    const pillarGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
    const pL = new THREE.Mesh(pillarGeo, this.materials.metalBlack);
    pL.position.set(-5.5, 3, 0);
    const pR = new THREE.Mesh(pillarGeo, this.materials.metalBlack);
    pR.position.set(5.5, 3, 0);

    // Cross Beam
    const beamGeo = new THREE.BoxGeometry(11.6, 0.6, 0.6);
    const beam = new THREE.Mesh(beamGeo, this.materials.metalBlack);
    beam.position.set(0, 5.8, 0);

    // Railway Signal Lights
    const sigL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.materials.signalRed);
    sigL.position.set(-LANE_WIDTH, 5.2, 0.4);
    const sigC = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.materials.signalYellow);
    sigC.position.set(0, 5.2, 0.4);
    const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.materials.signalRed);
    sigR.position.set(LANE_WIDTH, 5.2, 0.4);

    archGroup.add(pL, pR, beam, sigL, sigC, sigR);
    parent.add(archGroup);
  }

  /**
   * Procedural safe generation of obstacles, moving trains, and rewards
   */
  private populateObstaclesAndCollectibles(
    parent: THREE.Group,
    zStart: number,
    chunkIndex: number,
    difficultyFactor: number,
    obstacles: ObstacleData[],
    coins: CoinData[],
    coinMeshes: THREE.Mesh[],
    powerups: PowerUpPickupData[],
    powerupMeshes: THREE.Group[],
    movingTrains: { mesh: THREE.Group; data: ObstacleData }[]
  ) {
    // Choose 2 primary hazard zones along this chunk length
    const zoneZOffsets = [-18, -42];
    const lanesList: Lane[] = [-1, 0, 1];

    zoneZOffsets.forEach((zoneOffsetZ, zoneIdx) => {
      // Pick a blocked pattern. IMPORTANT: NEVER block all 3 lanes without a ramp/jump option!
      const patternSeed = (chunkIndex * 3 + zoneIdx) % 5;

      if (patternSeed === 0) {
        // Pattern 0: Parked Train on one lane with ramp, Low barrier on second lane, Open lane with coins on third
        const trainLane = lanesList[chunkIndex % 3];
        const barrierLane = lanesList[(chunkIndex + 1) % 3];
        const freeLane = lanesList[(chunkIndex + 2) % 3];

        this.spawnStaticTrain(parent, zStart, trainLane, zoneOffsetZ, obstacles, true); // true = has ramp
        this.spawnLowBarrier(parent, zStart, barrierLane, zoneOffsetZ, obstacles);
        this.generateCoinArc(parent, zStart, freeLane, zoneOffsetZ - 10, 6, coins, coinMeshes);
      } else if (patternSeed === 1) {
        // Pattern 1: High Clearance Overhead Barrier (must slide!) across 2 lanes, 1 lane has coins
        const slideLane1 = lanesList[chunkIndex % 3];
        const slideLane2 = lanesList[(chunkIndex + 1) % 3];
        const otherLane = lanesList[(chunkIndex + 2) % 3];

        this.spawnHighBarrier(parent, zStart, slideLane1, zoneOffsetZ, obstacles);
        this.spawnHighBarrier(parent, zStart, slideLane2, zoneOffsetZ, obstacles);
        this.spawnTrafficCones(parent, zStart, otherLane, zoneOffsetZ, obstacles);

        // Power-up spawn chance on the other lane
        if (chunkIndex % 3 === 0) {
          this.spawnPowerUp(parent, zStart, otherLane, zoneOffsetZ - 4, powerups, powerupMeshes);
        }
      } else if (patternSeed === 2) {
        // Pattern 2: Moving Train approaching!
        const movingTrainLane = lanesList[(chunkIndex + zoneIdx) % 3];
        const openLane1 = lanesList[(chunkIndex + zoneIdx + 1) % 3];

        this.spawnMovingTrain(parent, zStart, movingTrainLane, zoneOffsetZ, obstacles, movingTrains, difficultyFactor);
        this.generateCoinArc(parent, zStart, openLane1, zoneOffsetZ - 8, 8, coins, coinMeshes);
      } else if (patternSeed === 3) {
        // Pattern 3: Two Low Hurdles (jump test) + Coin trail arching over the hurdle!
        const jumpLane = lanesList[(chunkIndex * 2) % 3];
        const blockLane = lanesList[(chunkIndex * 2 + 1) % 3];

        this.spawnLowBarrier(parent, zStart, jumpLane, zoneOffsetZ, obstacles);
        this.spawnStaticTrain(parent, zStart, blockLane, zoneOffsetZ, obstacles, false);

        // Coins arching directly over the hurdle for high-skill jump collection
        this.generateJumpingCoinArc(parent, zStart, jumpLane, zoneOffsetZ, coins, coinMeshes);
      } else {
        // Pattern 4: Power-up spotlight with double coin rows
        const powerupLane = lanesList[zoneIdx % 3];
        this.spawnPowerUp(parent, zStart, powerupLane, zoneOffsetZ, powerups, powerupMeshes);

        const sideLane = lanesList[(zoneIdx + 1) % 3];
        this.spawnLowBarrier(parent, zStart, sideLane, zoneOffsetZ, obstacles);
        this.generateCoinArc(parent, zStart, lanesList[(zoneIdx + 2) % 3], zoneOffsetZ - 6, 7, coins, coinMeshes);
      }
    });
  }

  // --- Obstacle Builders ---

  private spawnLowBarrier(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    obstacles: ObstacleData[]
  ) {
    const x = LANE_COORDS[lane];
    const group = new THREE.Group();
    group.position.set(x, 0, offsetZ);

    // Two striped legs + crossbar
    const legGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);
    const legL = new THREE.Mesh(legGeo, this.materials.metalBlack);
    legL.position.set(-1.0, 0.5, 0);
    const legR = new THREE.Mesh(legGeo, this.materials.metalBlack);
    legR.position.set(1.0, 0.5, 0);

    const barGeo = new THREE.BoxGeometry(2.3, 0.45, 0.15);
    const bar = new THREE.Mesh(barGeo, this.materials.barrierOrange);
    bar.position.set(0, 0.75, 0);
    bar.castShadow = true;

    // White stripe details
    const stripeGeo = new THREE.BoxGeometry(0.35, 0.46, 0.16);
    const s1 = new THREE.Mesh(stripeGeo, this.materials.barrierWhite);
    s1.position.set(-0.5, 0.75, 0);
    const s2 = s1.clone();
    s2.position.x = 0.5;

    group.add(legL, legR, bar, s1, s2);
    parent.add(group);

    obstacles.push({
      id: Math.random(),
      lane,
      z: zStart + offsetZ,
      type: 'barrier_low',
      width: 2.3,
      height: 1.0,
      length: 0.5,
    });
  }

  private spawnHighBarrier(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    obstacles: ObstacleData[]
  ) {
    const x = LANE_COORDS[lane];
    const group = new THREE.Group();
    group.position.set(x, 0, offsetZ);

    // High overhead bar (player must slide under!)
    const legGeo = new THREE.BoxGeometry(0.12, 2.6, 0.12);
    const legL = new THREE.Mesh(legGeo, this.materials.metalBlack);
    legL.position.set(-1.1, 1.3, 0);
    const legR = new THREE.Mesh(legGeo, this.materials.metalBlack);
    legR.position.set(1.1, 1.3, 0);

    const barGeo = new THREE.BoxGeometry(2.4, 0.8, 0.2);
    const bar = new THREE.Mesh(barGeo, this.materials.barrierOrange);
    bar.position.set(0, 2.0, 0); // Bottom of bar is at y=1.6 (slides under at y<1.2)
    bar.castShadow = true;

    // Warning sign stripes
    const signGeo = new THREE.PlaneGeometry(1.6, 0.5);
    const sign = new THREE.Mesh(signGeo, this.materials.barrierWhite);
    sign.position.set(0, 2.0, 0.11);

    group.add(legL, legR, bar, sign);
    parent.add(group);

    obstacles.push({
      id: Math.random(),
      lane,
      z: zStart + offsetZ,
      type: 'barrier_high',
      width: 2.3,
      height: 2.4,
      length: 0.5,
    });
  }

  private spawnTrafficCones(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    obstacles: ObstacleData[]
  ) {
    const x = LANE_COORDS[lane];
    const group = new THREE.Group();
    group.position.set(x, 0, offsetZ);

    const coneGeo = new THREE.ConeGeometry(0.24, 0.7, 8);
    const cone1 = new THREE.Mesh(coneGeo, this.materials.barrierOrange);
    cone1.position.set(-0.45, 0.35, 0);
    const cone2 = new THREE.Mesh(coneGeo, this.materials.barrierOrange);
    cone2.position.set(0.45, 0.35, 0);

    group.add(cone1, cone2);
    parent.add(group);

    obstacles.push({
      id: Math.random(),
      lane,
      z: zStart + offsetZ,
      type: 'traffic_cones',
      width: 1.8,
      height: 0.7,
      length: 0.5,
    });
  }

  private spawnStaticTrain(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    obstacles: ObstacleData[],
    includeRamp: boolean
  ) {
    const x = LANE_COORDS[lane];
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, 0, offsetZ);

    const length = 14;
    const height = 3.2;
    const width = 2.4;

    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const bodyMat = this.materials.trainBodyRed;
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, height / 2 + 0.3, -length / 2);
    body.castShadow = true;
    body.receiveShadow = true;

    // Roof walkway
    const roofGeo = new THREE.BoxGeometry(width - 0.2, 0.1, length);
    const roof = new THREE.Mesh(roofGeo, this.materials.trainRoof);
    roof.position.set(0, height + 0.35, -length / 2);

    // Front Windshield
    const glassGeo = new THREE.PlaneGeometry(1.8, 1.1);
    const glass = new THREE.Mesh(glassGeo, this.materials.trainGlass);
    glass.position.set(0, height / 2 + 0.7, 0.01);

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const lightL = new THREE.Mesh(lightGeo, this.materials.trainHeadlight);
    lightL.position.set(-0.8, 0.8, 0.05);
    const lightR = new THREE.Mesh(lightGeo, this.materials.trainHeadlight);
    lightR.position.set(0.8, 0.8, 0.05);

    trainGroup.add(body, roof, glass, lightL, lightR);

    // If ramp is included, add a wooden/steel ramp in front of train so player can run up!
    if (includeRamp) {
      const rampGeo = new THREE.BoxGeometry(width, 0.2, 5.5);
      const ramp = new THREE.Mesh(rampGeo, this.materials.tie);
      ramp.position.set(0, (height + 0.3) / 2, 2.75);
      ramp.rotation.x = Math.atan2(height + 0.3, 5.5); // Slopes up to train roof
      ramp.castShadow = true;
      trainGroup.add(ramp);

      // Record ramp as passable obstacle
      obstacles.push({
        id: Math.random(),
        lane,
        z: zStart + offsetZ + 2.75,
        type: 'ramp',
        width: 2.2,
        height: height + 0.3,
        length: 5.5,
      });
    }

    parent.add(trainGroup);

    obstacles.push({
      id: Math.random(),
      lane,
      z: zStart + offsetZ - length / 2,
      type: 'train_static',
      width: 2.3,
      height: 3.5,
      length: length,
    });
  }

  private spawnMovingTrain(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    obstacles: ObstacleData[],
    movingTrains: { mesh: THREE.Group; data: ObstacleData }[],
    difficultyFactor: number
  ) {
    const x = LANE_COORDS[lane];
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, 0, offsetZ);

    const length = 15;
    const height = 3.2;
    const width = 2.4;

    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const bodyMat = this.materials.trainBodyBlue;
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, height / 2 + 0.3, -length / 2);
    body.castShadow = true;
    body.receiveShadow = true;

    // Glowing front headlights
    const lightGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const lightL = new THREE.Mesh(lightGeo, this.materials.trainHeadlight);
    lightL.position.set(-0.8, 0.9, 0.05);
    const lightR = new THREE.Mesh(lightGeo, this.materials.trainHeadlight);
    lightR.position.set(0.8, 0.9, 0.05);

    // Front windshield
    const glassGeo = new THREE.PlaneGeometry(1.8, 1.1);
    const glass = new THREE.Mesh(glassGeo, this.materials.trainGlass);
    glass.position.set(0, height / 2 + 0.7, 0.01);

    trainGroup.add(body, lightL, lightR, glass);
    parent.add(trainGroup);

    const trainObstacle: ObstacleData = {
      id: Math.random(),
      lane,
      z: zStart + offsetZ - length / 2,
      type: 'train_moving',
      speed: 12 + difficultyFactor * 4, // Moves towards player (+Z direction)
      width: 2.3,
      height: 3.5,
      length: length,
    };

    obstacles.push(trainObstacle);
    movingTrains.push({
      mesh: trainGroup,
      data: trainObstacle,
    });
  }

  // --- Collectibles & Pickups ---

  private generateCoinArc(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    startOffsetZ: number,
    count: number,
    coins: CoinData[],
    coinMeshes: THREE.Mesh[]
  ) {
    const x = LANE_COORDS[lane];
    const spacing = 1.8;

    for (let i = 0; i < count; i++) {
      const zOffset = startOffsetZ - i * spacing;
      const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      coin.position.set(x, 1.0, zOffset);
      coin.rotation.x = Math.PI / 2;
      parent.add(coin);
      coinMeshes.push(coin);

      coins.push({
        id: Math.random(),
        lane,
        x,
        y: 1.0,
        z: zStart + zOffset,
        collected: false,
      });
    }
  }

  private generateJumpingCoinArc(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    centerOffsetZ: number,
    coins: CoinData[],
    coinMeshes: THREE.Mesh[]
  ) {
    const x = LANE_COORDS[lane];
    const count = 7;
    const spacing = 1.4;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1); // 0 to 1
      // Parabolic jump arc height
      const y = 1.0 + Math.sin(t * Math.PI) * 2.4;
      const zOffset = centerOffsetZ + (i - Math.floor(count / 2)) * spacing;

      const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      coin.position.set(x, y, zOffset);
      coin.rotation.x = Math.PI / 2;
      parent.add(coin);
      coinMeshes.push(coin);

      coins.push({
        id: Math.random(),
        lane,
        x,
        y,
        z: zStart + zOffset,
        collected: false,
      });
    }
  }

  private spawnPowerUp(
    parent: THREE.Group,
    zStart: number,
    lane: Lane,
    offsetZ: number,
    powerups: PowerUpPickupData[],
    powerupMeshes: THREE.Group[]
  ) {
    const types: PowerUpType[] = ['jetpack', 'magnet', 'multiplier', 'sneakers'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = LANE_COORDS[lane];
    const group = new THREE.Group();
    group.position.set(x, 1.4, offsetZ);

    // Glowing beacon orb background
    const haloGeo = new THREE.SphereGeometry(0.55, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: type === 'jetpack' ? 0xf97316 : type === 'magnet' ? 0xef4444 : type === 'multiplier' ? 0x8b5cf6 : 0x10b981,
      wireframe: true,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    // 3D icon representation
    if (type === 'magnet') {
      const magnetGeo = new THREE.TorusGeometry(0.3, 0.09, 8, 16, Math.PI);
      const magnetMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
      const magnet = new THREE.Mesh(magnetGeo, magnetMat);
      magnet.rotation.z = Math.PI;
      group.add(magnet);
    } else if (type === 'multiplier') {
      const starGeo = new THREE.OctahedronGeometry(0.35);
      const starMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x6b21a8 });
      const star = new THREE.Mesh(starGeo, starMat);
      group.add(star);
    } else if (type === 'sneakers') {
      const shoeGeo = new THREE.BoxGeometry(0.4, 0.25, 0.55);
      const shoeMat = new THREE.MeshLambertMaterial({ color: 0x10b981 });
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      group.add(shoe);
    } else {
      // Jetpack
      const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
      const tankMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
      const t1 = new THREE.Mesh(tankGeo, tankMat);
      t1.position.x = -0.15;
      const t2 = t1.clone();
      t2.position.x = 0.15;
      group.add(t1, t2);
    }

    parent.add(group);
    powerupMeshes.push(group);

    powerups.push({
      id: Math.random(),
      lane,
      type,
      x,
      y: 1.4,
      z: zStart + offsetZ,
      collected: false,
    });
  }
}
