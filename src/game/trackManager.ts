import * as THREE from 'three';
import {
  CoinData,
  LANE_POSITIONS,
  LANE_WIDTH,
  LaneIndex,
  ObstacleData,
  ObstacleType,
  PowerUpData,
  PowerUpType,
} from './types';
import {
  createGoldCoinTexture,
  createPillarStoneTexture,
  createStonePaverTexture,
} from './proceduralTextures';

export interface TrackSegmentInstance {
  group: THREE.Group;
  zStart: number;
  length: number;
  hasGap: boolean;
  gapZStart: number;
  gapLength: number;
}

export class TrackManager {
  public scene: THREE.Scene;
  public segments: TrackSegmentInstance[] = [];
  public obstacles: ObstacleData[] = [];
  public powerUps: PowerUpData[] = [];
  public coins: CoinData[] = [];

  // 3D Object pools / mappings
  public obstacleMeshes: Map<string, THREE.Group> = new Map();
  public powerUpMeshes: Map<string, THREE.Group> = new Map();
  public coinMeshes: Map<string, THREE.Mesh> = new Map();

  // Materials & Geometries shared
  private roadMaterial: THREE.MeshStandardMaterial;
  private wallMaterial: THREE.MeshStandardMaterial;
  private pillarMaterial: THREE.MeshStandardMaterial;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  private nextZ: number = 0;
  private segmentCounter: number = 0;
  private itemCounter: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const stoneTex = createStonePaverTexture();
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.1,
    });
    this.roadMaterial.map!.repeat.set(1.5, 8);

    const pillarTex = createPillarStoneTexture();
    this.pillarMaterial = new THREE.MeshStandardMaterial({
      map: pillarTex,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.pillarMaterial.map!.repeat.set(1, 4);

    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d4336,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Gold coin geometry & material
    this.coinGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
    this.coinGeometry.rotateX(Math.PI / 2);
    const coinTex = createGoldCoinTexture();
    this.coinMaterial = new THREE.MeshStandardMaterial({
      map: coinTex,
      color: 0xffe135,
      metalness: 0.85,
      roughness: 0.2,
    });
  }

  public init() {
    this.reset();
    // Pre-populate initial 12 segments (approx 480 meters)
    for (let i = 0; i < 12; i++) {
      this.spawnSegment(i < 3); // first 3 segments are completely peaceful
    }
  }

  public reset() {
    // Remove all meshes from scene
    for (const seg of this.segments) {
      this.scene.remove(seg.group);
    }
    this.segments = [];

    this.obstacleMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.obstacleMeshes.clear();
    this.obstacles = [];

    this.powerUpMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.powerUpMeshes.clear();
    this.powerUps = [];

    this.coinMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.coinMeshes.clear();
    this.coins = [];

    this.nextZ = 0;
    this.segmentCounter = 0;
    this.itemCounter = 0;
  }

  public update(playerZ: number, dt: number) {
    // Animate spinning coins
    this.coinMeshes.forEach((mesh) => {
      mesh.rotation.z += dt * 3.5;
    });

    // Animate hovering powerups
    this.powerUpMeshes.forEach((mesh) => {
      mesh.rotation.y += dt * 2.5;
      mesh.position.y = 1.3 + Math.sin(Date.now() * 0.004) * 0.2;
    });

    // Spawn new segments ahead
    while (this.nextZ < playerZ + 280) {
      this.spawnSegment(false);
    }

    // Clean up segments and items that are far behind player
    const cleanupThreshold = playerZ - 30;

    // Segments
    while (this.segments.length > 0 && this.segments[0].zStart + this.segments[0].length < cleanupThreshold) {
      const oldSeg = this.segments.shift()!;
      this.scene.remove(oldSeg.group);
    }

    // Obstacles
    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.z < cleanupThreshold) {
        const mesh = this.obstacleMeshes.get(obs.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.obstacleMeshes.delete(obs.id);
        }
        return false;
      }
      return true;
    });

    // Powerups
    this.powerUps = this.powerUps.filter((p) => {
      if (p.z < cleanupThreshold || p.collected) {
        const mesh = this.powerUpMeshes.get(p.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.powerUpMeshes.delete(p.id);
        }
        return false;
      }
      return true;
    });

    // Coins
    this.coins = this.coins.filter((c) => {
      if (c.z < cleanupThreshold || c.collected) {
        const mesh = this.coinMeshes.get(c.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.coinMeshes.delete(c.id);
        }
        return false;
      }
      return true;
    });
  }

  private spawnSegment(peaceful: boolean) {
    const segLength = 40;
    const segGroup = new THREE.Group();
    const zStart = this.nextZ;
    this.segmentCounter++;

    // 15% chance of chasm / broken gap bridge (only after initial peaceful zone)
    const hasGap = !peaceful && Math.random() < 0.16;
    const gapLength = hasGap ? 8 : 0;
    const gapZStart = zStart + 16;

    const trackWidth = LANE_WIDTH * 3 + 0.8;

    // Wide jungle undergrowth ground plane
    const jungleFloorGeo = new THREE.BoxGeometry(70, 2, segLength);
    const jungleFloorMat = new THREE.MeshStandardMaterial({
      color: 0x122415,
      roughness: 0.95,
      metalness: 0.0,
    });
    const jungleFloor = new THREE.Mesh(jungleFloorGeo, jungleFloorMat);
    jungleFloor.position.set(0, -1.6, zStart + segLength / 2);
    jungleFloor.receiveShadow = true;
    segGroup.add(jungleFloor);

    if (hasGap) {
      // First half of bridge
      const len1 = gapZStart - zStart;
      const roadGeo1 = new THREE.BoxGeometry(trackWidth, 1.2, len1);
      const road1 = new THREE.Mesh(roadGeo1, this.roadMaterial);
      road1.position.set(0, -0.6, zStart + len1 / 2);
      road1.receiveShadow = true;
      segGroup.add(road1);

      // Second half of bridge
      const len2 = zStart + segLength - (gapZStart + gapLength);
      const roadGeo2 = new THREE.BoxGeometry(trackWidth, 1.2, len2);
      const road2 = new THREE.Mesh(roadGeo2, this.roadMaterial);
      road2.position.set(0, -0.6, gapZStart + gapLength + len2 / 2);
      road2.receiveShadow = true;
      segGroup.add(road2);

      // Broken jagged stone edges
      const edgeGeo = new THREE.BoxGeometry(trackWidth + 0.2, 0.4, 0.8);
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2b2f24, roughness: 0.9 });
      const edge1 = new THREE.Mesh(edgeGeo, edgeMat);
      edge1.position.set(0, 0, gapZStart);
      segGroup.add(edge1);

      const edge2 = new THREE.Mesh(edgeGeo, edgeMat);
      edge2.position.set(0, 0, gapZStart + gapLength);
      segGroup.add(edge2);
    } else {
      // Solid stone road
      const roadGeo = new THREE.BoxGeometry(trackWidth, 1.2, segLength);
      const road = new THREE.Mesh(roadGeo, this.roadMaterial);
      road.position.set(0, -0.6, zStart + segLength / 2);
      road.receiveShadow = true;
      segGroup.add(road);
    }

    // Side temple kerbs / stone balustrades
    const kerbGeo = new THREE.BoxGeometry(0.5, 0.4, segLength);
    const kerbMat = new THREE.MeshStandardMaterial({ color: 0x363d2e, roughness: 0.8 });

    const leftKerb = new THREE.Mesh(kerbGeo, kerbMat);
    leftKerb.position.set(-(trackWidth / 2) + 0.25, 0.2, zStart + segLength / 2);
    segGroup.add(leftKerb);

    const rightKerb = new THREE.Mesh(kerbGeo, kerbMat);
    rightKerb.position.set(trackWidth / 2 - 0.25, 0.2, zStart + segLength / 2);
    segGroup.add(rightKerb);

    // Ancient Temple Pillars along the sides with torches
    const pillarCount = 3;
    const pillarSpacing = segLength / pillarCount;

    for (let p = 0; p < pillarCount; p++) {
      const pz = zStart + p * pillarSpacing + pillarSpacing / 2;

      // Left Pillar
      this.buildAncientPillar(segGroup, -(trackWidth / 2) - 1.2, pz, true);
      // Right Pillar
      this.buildAncientPillar(segGroup, trackWidth / 2 + 1.2, pz, false);
    }

    // Jungle Foliage & Palm Trees along perimeter
    this.buildJungleFoliage(segGroup, zStart, segLength, trackWidth);

    this.scene.add(segGroup);
    this.segments.push({
      group: segGroup,
      zStart,
      length: segLength,
      hasGap,
      gapZStart,
      gapLength,
    });

    // Populate gameplay items (obstacles, powerups, coins) on this segment
    if (!peaceful) {
      this.populateSegmentItems(zStart, segLength, hasGap, gapZStart, gapLength);
    } else if (zStart > 10) {
      // Light coins on starting segments
      this.spawnCoinStrip(0, zStart + 10, 6);
    }

    this.nextZ += segLength;
  }

  private buildAncientPillar(parent: THREE.Group, x: number, z: number, hasTorch: boolean) {
    const pillarHeight = 5.5;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, pillarHeight, 10),
      this.pillarMaterial
    );
    pillar.position.set(x, pillarHeight / 2 - 0.2, z);
    pillar.castShadow = true;
    parent.add(pillar);

    // Capital (top block)
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 1.4),
      this.wallMaterial
    );
    cap.position.set(x, pillarHeight, z);
    parent.add(cap);

    // Torch on pillar with fire glow
    if (hasTorch) {
      const torchHolder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 })
      );
      torchHolder.position.set(x + (x < 0 ? 0.6 : -0.6), 2.8, z);
      parent.add(torchHolder);

      // Flickering flame mesh
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.45, 8),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      flame.position.set(x + (x < 0 ? 0.6 : -0.6), 3.1, z);
      parent.add(flame);
    }
  }

  private buildJungleFoliage(parent: THREE.Group, zStart: number, segLength: number, trackWidth: number) {
    // Palm fronds & giant tropical monstera leaves on sides
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1b4d18,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3219,
      roughness: 0.9,
    });

    const sides = [-1, 1];
    for (const side of sides) {
      for (let f = 0; f < 3; f++) {
        const fx = side * (trackWidth / 2 + 3.0 + Math.random() * 4.0);
        const fz = zStart + (f / 3) * segLength + Math.random() * 8;

        // Tree trunk
        const trunkH = 7 + Math.random() * 3;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.45, trunkH, 8),
          trunkMat
        );
        trunk.position.set(fx, trunkH / 2, fz);
        trunk.rotation.z = side * (0.05 + Math.random() * 0.1);
        parent.add(trunk);

        // Canopy crown
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(3.2 + Math.random() * 1.5, 3.5, 7),
          foliageMat
        );
        crown.position.set(fx, trunkH + 1.2, fz);
        parent.add(crown);
      }
    }
  }

  private populateSegmentItems(
    zStart: number,
    segLength: number,
    hasGap: boolean,
    gapZStart: number,
    gapLength: number
  ) {
    const lanes: LaneIndex[] = [-1, 0, 1];

    if (hasGap) {
      // Gap chasm: register gap as obstacle check
      // Spawn an arch of coins over the gap inviting the jump!
      const jumpCoinsCount = 5;
      const jumpLane = lanes[Math.floor(Math.random() * lanes.length)];
      for (let i = 0; i < jumpCoinsCount; i++) {
        const t = (i + 1) / (jumpCoinsCount + 1);
        const cz = gapZStart + t * gapLength;
        const cy = 0.9 + Math.sin(t * Math.PI) * 1.8; // arc!
        this.spawnSingleCoin(jumpLane, cy, cz);
      }
      return;
    }

    // Choose obstacle layout for this solid segment
    const patternRoll = Math.random();

    if (patternRoll < 0.35) {
      // Single hurdle or flame trap in one or two lanes + coin line in safe lane
      const obsType: ObstacleType = Math.random() < 0.6 ? 'hurdle' : 'flame_trap';
      const blockedLane = lanes[Math.floor(Math.random() * lanes.length)];
      const safeLane = blockedLane === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;

      this.spawnObstacle(obsType, blockedLane, zStart + segLength * 0.45);
      this.spawnCoinStrip(safeLane, zStart + 5, 8);
    } else if (patternRoll < 0.65) {
      // Overhead hanging lintel (player must slide under or switch lane)
      const lintelLane = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1);
      this.spawnObstacle('lintel', lintelLane, zStart + segLength * 0.5);

      // Coins underneath the lintel! Encourages sliding
      this.spawnCoinStrip(lintelLane, zStart + segLength * 0.35, 6, 0.4);
    } else if (patternRoll < 0.85) {
      // Ancient stone totem blocking 1 or 2 lanes
      const totemLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.spawnObstacle('totem', totemLane, zStart + segLength * 0.5);

      // Remaining lane has coins
      const openLane = totemLane === 0 ? 1 : 0;
      this.spawnCoinStrip(openLane, zStart + 8, 7);
    } else {
      // Low hurdle spanning all lanes (must jump!)
      this.spawnObstacle('hurdle', 'all', zStart + segLength * 0.5);
      // Arc of coins over the hurdle
      for (let i = 0; i < 5; i++) {
        const t = (i + 1) / 6;
        const cz = zStart + segLength * 0.5 - 4 + t * 8;
        const cy = 0.8 + Math.sin(t * Math.PI) * 1.6;
        this.spawnSingleCoin(0, cy, cz);
      }
    }

    // 25% chance of spawning a power-up on this segment
    if (Math.random() < 0.28) {
      const powerUpTypes: PowerUpType[] = ['shield', 'boost', 'magnet', 'multiplier'];
      const chosenType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      const freeLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.spawnPowerUp(chosenType, freeLane, zStart + segLength * 0.8);
    }
  }

  public spawnObstacle(type: ObstacleType, lane: LaneIndex | 'all', z: number) {
    const id = `obs_${this.itemCounter++}`;
    let width = 2.0;
    let height = 0.9;
    let depth = 0.8;

    if (lane === 'all') {
      width = LANE_WIDTH * 3;
    }

    const group = new THREE.Group();
    const x = lane === 'all' ? 0 : LANE_POSITIONS[lane];

    if (type === 'hurdle') {
      // Spiked ancient log / tree trunk
      height = 0.85;
      const logGeo = new THREE.CylinderGeometry(0.38, 0.38, width, 12);
      logGeo.rotateZ(Math.PI / 2);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.y = 0.4;
      log.castShadow = true;
      group.add(log);

      // Spikes along the log
      const spikeGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.2 });
      const spikeCount = Math.floor(width * 2.5);
      for (let s = 0; s < spikeCount; s++) {
        const sp = new THREE.Mesh(spikeGeo, spikeMat);
        const sx = -width / 2 + (s + 0.5) * (width / spikeCount);
        sp.position.set(sx, 0.8, 0);
        group.add(sp);
      }
    } else if (type === 'lintel') {
      // Hanging swinging spiked beam / ancient temple lintel
      height = 1.0;
      depth = 1.0;
      const lintelGeo = new THREE.BoxGeometry(width, 0.7, 0.8);
      const lintelMat = new THREE.MeshStandardMaterial({ color: 0x474238, roughness: 0.85 });
      const lintelMesh = new THREE.Mesh(lintelGeo, lintelMat);
      lintelMesh.position.y = 1.6; // hangs high so sliding passes under!
      lintelMesh.castShadow = true;
      group.add(lintelMesh);

      // Hanging chains
      const chainGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
      const chainMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      const leftChain = new THREE.Mesh(chainGeo, chainMat);
      leftChain.position.set(-width / 2 + 0.3, 3.0, 0);
      group.add(leftChain);
      const rightChain = new THREE.Mesh(chainGeo, chainMat);
      rightChain.position.set(width / 2 - 0.3, 3.0, 0);
      group.add(rightChain);

      // Spikes pointing downwards
      const spikeGeo = new THREE.ConeGeometry(0.1, 0.3, 6);
      spikeGeo.rotateX(Math.PI);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      for (let s = 0; s < 4; s++) {
        const sp = new THREE.Mesh(spikeGeo, spikeMat);
        sp.position.set(-width / 2 + 0.4 + s * 0.4, 1.15, 0);
        group.add(sp);
      }
    } else if (type === 'totem') {
      // Tall carved stone Aztec/Mayan Idol
      height = 3.2;
      width = 1.8;
      depth = 1.4;

      const baseGeo = new THREE.BoxGeometry(1.6, 2.8, 1.2);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x5a5446, roughness: 0.8 });
      const totemMesh = new THREE.Mesh(baseGeo, baseMat);
      totemMesh.position.y = 1.4;
      totemMesh.castShadow = true;
      group.add(totemMesh);

      // Glowing carved red eyes on the totem
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.1), eyeMat);
      eyeL.position.set(-0.35, 2.1, 0.62);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.1), eyeMat);
      eyeR.position.set(0.35, 2.1, 0.62);
      group.add(eyeR);

      // Carved menacing mouth
      const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      mouth.position.set(0, 1.45, 0.62);
      group.add(mouth);
    } else if (type === 'flame_trap') {
      // Ground ancient fire brazier
      height = 0.8;
      const bowlGeo = new THREE.CylinderGeometry(0.8, 0.5, 0.5, 12);
      const bowlMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.position.y = 0.25;
      group.add(bowl);

      const fireGeo = new THREE.ConeGeometry(0.65, 1.2, 10);
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.y = 0.9;
      group.add(fire);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);
    this.obstacleMeshes.set(id, group);

    this.obstacles.push({
      id,
      type,
      lane,
      z,
      width,
      height,
      depth,
    });
  }

  public spawnPowerUp(type: PowerUpType, lane: LaneIndex, z: number) {
    const id = `pow_${this.itemCounter++}`;
    const group = new THREE.Group();
    const x = LANE_POSITIONS[lane];

    if (type === 'shield') {
      // Cyan orb with orbiting rings (Mystic Shield)
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0x00f3ff,
          metalness: 0.2,
          roughness: 0.1,
          emissive: 0x005577,
        })
      );
      group.add(orb);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x88ffff })
      );
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    } else if (type === 'boost') {
      // Golden speed feather/flame (Jungle Dash)
      const rocket = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.9, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff8c00,
          emissive: 0xff3300,
          metalness: 0.5,
          roughness: 0.2,
        })
      );
      rocket.rotation.x = Math.PI;
      group.add(rocket);

      const wings = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.1, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      group.add(wings);
    } else if (type === 'magnet') {
      // Horseshoe relic magnet
      const magnet = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.12, 10, 16, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0xdc143c,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x330000,
        })
      );
      magnet.rotation.z = Math.PI;
      group.add(magnet);
    } else if (type === 'multiplier') {
      // Aztec Gold Star / Mask
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0x664400,
        })
      );
      group.add(star);
    }

    group.position.set(x, 1.3, z);
    this.scene.add(group);
    this.powerUpMeshes.set(id, group);

    this.powerUps.push({
      id,
      type,
      lane,
      z,
    });
  }

  public spawnSingleCoin(lane: LaneIndex, y: number, z: number) {
    const id = `coin_${this.itemCounter++}`;
    const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    mesh.position.set(LANE_POSITIONS[lane], y, z);
    this.scene.add(mesh);
    this.coinMeshes.set(id, mesh);

    this.coins.push({
      id,
      lane,
      y,
      z,
    });
  }

  public spawnCoinStrip(lane: LaneIndex, zStart: number, count: number, y: number = 0.8) {
    const spacing = 2.2;
    for (let i = 0; i < count; i++) {
      this.spawnSingleCoin(lane, y, zStart + i * spacing);
    }
  }

  public removeCoinMesh(id: string) {
    const mesh = this.coinMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.coinMeshes.delete(id);
    }
  }

  public removePowerUpMesh(id: string) {
    const mesh = this.powerUpMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.powerUpMeshes.delete(id);
    }
  }
}
