import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ActivePowerUps,
  CauseOfDeath,
  GameOverDetails,
  GameState,
  LANE_POSITIONS,
  LaneIndex,
  PlayerStats,
} from './types';
import {
  calculateScore,
  calculateSpeed,
  checkChasmFall,
  checkObstacleCollision,
  getRandomCryingQuote,
  GRAVITY,
  isCoinCollected,
  JUMP_VELOCITY,
  SLIDE_DURATION,
  updatePowerUpTimers,
} from './rules';
import { createExplorerCharacter, CharacterController } from './character';
import { TrackManager } from './trackManager';
import { sounds } from './audio';

export interface EngineCallbacks {
  onStatsUpdate: (stats: PlayerStats, activePowerUps: ActivePowerUps) => void;
  onGameOver: (details: GameOverDetails) => void;
  onStateChange: (state: GameState) => void;
  onPowerUpCollected: (type: string) => void;
  onCryingEmojiBurst: (quote: string) => void;
}

export class Engine3D {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;

  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  private trackManager!: TrackManager;
  private character!: CharacterController;

  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;

  // Game Play State
  public state: GameState = 'title';
  private playerLane: LaneIndex = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private playerVy: number = 0;
  private isJumping: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;

  private distance: number = 0;
  private coins: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private multiplier: number = 1;

  private activePowerUps: ActivePowerUps = {
    shield: false,
    boostTimeLeft: 0,
    magnetTimeLeft: 0,
    multiplierTimeLeft: 0,
  };

  // Camera Shake & Juice
  private cameraShake: number = 0;
  private invulnerableTimer: number = 0;
  private hitstopTimer: number = 0;

  // Title screen camera angle
  private titleAngle: number = 0;

  // Bound event listeners
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onResizeBound: () => void;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load saved high score from localStorage
    try {
      const saved = localStorage.getItem('temple_escape_high_score');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {
      this.highScore = 0;
    }

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onResizeBound = this.handleResize.bind(this);

    this.initWebGL();
    this.setupScene();
    this.setupEventListeners();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupScene() {
    this.scene = new THREE.Scene();

    // Jungle canopy fog matching horizon
    const fogColor = new THREE.Color(0x192e1e);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(0x192e1e, 0.012);

    // Camera setup
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);
    this.camera.position.set(0, 4.2, -6.5);
    this.camera.lookAt(0, 1.5, 6);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced Lighting Rig
    // Warm Torch Key Light
    const keyLight = new THREE.DirectionalLight(0xffdfa0, 1.6);
    keyLight.position.set(15, 30, 20);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.camera.left = -20;
      keyLight.shadow.camera.right = 20;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
    }
    this.scene.add(keyLight);

    // Cool Jungle Canopy Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0x73b06f, 0x1f2e1b, 0.85);
    this.scene.add(hemiLight);

    // Torch amber point light that follows near player
    const torchLight = new THREE.PointLight(0xff7700, 1.2, 25);
    torchLight.position.set(0, 3, 2);
    this.scene.add(torchLight);

    // Initialize Track Manager
    this.trackManager = new TrackManager(this.scene);
    this.trackManager.init();

    // Initialize Explorer Character
    this.character = createExplorerCharacter();
    this.scene.add(this.character.group);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('resize', this.onResizeBound);
  }

  public start() {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = () => {
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // clamp delta

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.frameId = requestAnimationFrame(this.loop);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 40);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public startGame() {
    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.playerLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.multiplier = 1;
    this.invulnerableTimer = 0;
    this.cameraShake = 0;

    this.activePowerUps = {
      shield: false,
      boostTimeLeft: 0,
      magnetTimeLeft: 0,
      multiplierTimeLeft: 0,
    };

    this.character.resetPose();
    this.trackManager.reset();
    this.trackManager.init();

    sounds.startDrumLoop(1.0);
    this.callbacks.onStateChange('playing');
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      sounds.stopDrumLoop();
      this.callbacks.onStateChange('paused');
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      sounds.startDrumLoop(calculateSpeed(this.distance, this.activePowerUps.boostTimeLeft > 0) / 22);
      this.callbacks.onStateChange('playing');
    }
  }

  public returnToTitle() {
    this.state = 'title';
    document.body.dataset.state = 'title';
    this.character.resetPose();
    this.trackManager.reset();
    this.trackManager.init();
    this.playerZ = 0;
    this.playerX = 0;
    this.playerY = 0;
    sounds.stopDrumLoop();
    this.callbacks.onStateChange('title');
  }

  private update(dt: number) {
    if (this.state === 'title') {
      // Atmospheric live-world camera pan framing the entrance & explorer
      this.titleAngle += dt * 0.4;
      this.camera.position.x = Math.sin(this.titleAngle * 0.7) * 4.2;
      this.camera.position.z = -2.0;
      this.camera.position.y = 2.4 + Math.sin(this.titleAngle * 0.4) * 0.3;
      this.camera.lookAt(0, 1.3, 4.2);

      // Character idles ready at temple gates facing forward
      this.character.group.position.set(0, 0, 4.2);
      this.character.updateAnimation(dt, {
        speed: 0,
        isJumping: false,
        isSliding: false,
        isGameOver: false,
        shieldActive: false,
        boostActive: false,
      });
      return;
    }

    if (this.state === 'paused') {
      return;
    }

    if (this.state === 'gameover') {
      // Update character crying pose and tear animations!
      this.character.updateAnimation(dt, {
        speed: 0,
        isJumping: false,
        isSliding: false,
        isGameOver: true,
        shieldActive: false,
        boostActive: false,
      });

      // Camera smoothly dollies close in front of the sobbing hero
      const targetCamX = this.playerX;
      const targetCamY = 1.3;
      const targetCamZ = this.playerZ + 3.2; // in front to see the tears!

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 5, dt);
      this.camera.lookAt(this.playerX, 0.8, this.playerZ);
      return;
    }

    // Hitstop handling (brief freeze on heavy impact/shield break)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // In 'playing' state:
    const isBoostActive = this.activePowerUps.boostTimeLeft > 0;
    const currentSpeed = calculateSpeed(this.distance, isBoostActive);

    // Update power-up timers
    this.activePowerUps = updatePowerUpTimers(this.activePowerUps, dt);
    this.multiplier = this.activePowerUps.multiplierTimeLeft > 0 ? 2 : 1;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Move forward along Z
    const dz = currentSpeed * dt;
    this.playerZ += dz;
    this.distance += dz;

    // Calculate score
    this.score = calculateScore(this.distance, this.coins, this.multiplier);

    // Smooth lane transitions (horizontal X)
    const targetX = LANE_POSITIONS[this.playerLane];
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 18, dt);

    // Vertical Physics (Jump / Fall)
    if (this.isJumping) {
      this.playerVy -= GRAVITY * dt;
      this.playerY += this.playerVy * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isJumping = false;
        sounds.playLand();
      }
    }

    // Slide duration countdown
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Update Character Position & Kinematics
    this.character.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.character.updateAnimation(dt, {
      speed: currentSpeed,
      isJumping: this.isJumping,
      isSliding: this.isSliding,
      isGameOver: false,
      shieldActive: this.activePowerUps.shield,
      boostActive: isBoostActive,
    });

    // Update track and scenery (spawns ahead, removes behind)
    this.trackManager.update(this.playerZ, dt);

    // Collision Checks with Obstacles
    const playerBox = {
      x: this.playerX,
      y: this.playerY,
      z: this.playerZ,
      width: 0.8,
      height: this.isSliding ? 0.7 : 1.8,
      depth: 0.8,
      isSliding: this.isSliding,
      isJumping: this.isJumping,
    };

    // Check broken bridge / chasm falls
    for (const seg of this.trackManager.segments) {
      if (seg.hasGap) {
        const fell = checkChasmFall(
          { y: this.playerY, z: this.playerZ, isJumping: this.isJumping },
          { zStart: seg.gapZStart, length: seg.gapLength }
        );
        if (fell && !isBoostActive && this.invulnerableTimer <= 0) {
          this.triggerWipeout('fall');
          return;
        }
      }
    }

    // Check deadly obstacles
    for (const obs of this.trackManager.obstacles) {
      if (obs.passed) continue;

      // When behind player, mark passed
      if (obs.z < this.playerZ - 1.5) {
        obs.passed = true;
        continue;
      }

      const collides = checkObstacleCollision(playerBox, obs);
      if (collides) {
        if (isBoostActive) {
          // Boost obliterates the obstacle!
          sounds.playCrashImpact();
          this.cameraShake = 0.35;
          obs.passed = true;
          this.trackManager.spawnSingleCoin(this.playerLane, 1.0, obs.z + 1);
        } else if (this.activePowerUps.shield) {
          // Shield absorbs the blow!
          this.activePowerUps.shield = false;
          obs.passed = true;
          this.invulnerableTimer = 1.2;
          this.hitstopTimer = 0.08;
          this.cameraShake = 0.5;
          sounds.playShieldBreak();
        } else if (this.invulnerableTimer <= 0) {
          // Fatal collision -> Crying wipeout!
          const cause: CauseOfDeath = obs.type === 'flame_trap' ? 'flame' : 'obstacle';
          this.triggerWipeout(cause);
          return;
        }
      }
    }

    // Coin Pickups & Magnet
    const isMagnetActive = this.activePowerUps.magnetTimeLeft > 0;
    for (const coin of this.trackManager.coins) {
      if (coin.collected) continue;

      const pickup = isCoinCollected(
        { x: this.playerX, y: this.playerY, z: this.playerZ },
        coin,
        isMagnetActive || isBoostActive
      );

      if (pickup.collected) {
        coin.collected = true;
        this.trackManager.removeCoinMesh(coin.id);
        this.coins += 1;
        sounds.playCoin();
      } else if (pickup.pull) {
        // Magnet pulls coin mesh towards runner!
        const mesh = this.trackManager.coinMeshes.get(coin.id);
        if (mesh) {
          mesh.position.x = THREE.MathUtils.damp(mesh.position.x, this.playerX, 15, dt);
          mesh.position.y = THREE.MathUtils.damp(mesh.position.y, this.playerY + 0.9, 15, dt);
          mesh.position.z = THREE.MathUtils.damp(mesh.position.z, this.playerZ, 15, dt);
          // Check close proximity to collect
          if (Math.abs(mesh.position.z - this.playerZ) < 1.2) {
            coin.collected = true;
            this.trackManager.removeCoinMesh(coin.id);
            this.coins += 1;
            sounds.playCoin();
          }
        }
      }
    }

    // Power-up Pickups
    for (const pow of this.trackManager.powerUps) {
      if (pow.collected) continue;
      const px = LANE_POSITIONS[pow.lane];
      const distSq =
        (this.playerX - px) ** 2 +
        (this.playerY + 0.9 - 1.3) ** 2 +
        (this.playerZ - pow.z) ** 2;

      if (distSq < 2.5) {
        pow.collected = true;
        this.trackManager.removePowerUpMesh(pow.id);
        sounds.playPowerUp();
        this.applyPowerUp(pow.type);
        this.callbacks.onPowerUpCollected(pow.type);
      }
    }

    // Camera follow with exponential damping + decaying trauma shake
    this.updateCamera(dt, isBoostActive);

    // Push stats to UI
    this.callbacks.onStatsUpdate(
      {
        score: this.score,
        coins: this.coins,
        distance: Math.floor(this.distance),
        highScore: this.highScore,
        multiplier: this.multiplier,
      },
      this.activePowerUps
    );
  }

  private applyPowerUp(type: string) {
    if (type === 'shield') {
      this.activePowerUps.shield = true;
    } else if (type === 'boost') {
      this.activePowerUps.boostTimeLeft = 6.0;
    } else if (type === 'magnet') {
      this.activePowerUps.magnetTimeLeft = 8.0;
    } else if (type === 'multiplier') {
      this.activePowerUps.multiplierTimeLeft = 10.0;
    }
  }

  private triggerWipeout(cause: CauseOfDeath) {
    this.state = 'gameover';
    document.body.dataset.state = 'gameover';
    sounds.stopDrumLoop();
    sounds.playCrashImpact();

    // Trigger dramatic comical crying sob!
    setTimeout(() => {
      sounds.playCryingSob();
    }, 150);

    // Trigger character 3D crying animation & tear fountains!
    this.character.triggerCrying();

    // High Score check
    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.highScore = this.score;
      try {
        localStorage.setItem('temple_escape_high_score', this.highScore.toString());
      } catch {
        // ignore
      }
    }

    const quote = getRandomCryingQuote(cause);

    // Emit crying emoji burst in UI
    this.callbacks.onCryingEmojiBurst(quote);

    // Emit GameOver after small visual impact beat
    setTimeout(() => {
      this.callbacks.onGameOver({
        cause,
        quote,
        distance: Math.floor(this.distance),
        coins: this.coins,
        score: this.score,
        highScore: this.highScore,
        isNewRecord,
      });
      this.callbacks.onStateChange('gameover');
    }, 700);
  }

  private updateCamera(dt: number, isBoostActive: boolean) {
    // Camera follow rig behind the player
    const targetCamX = this.playerX * 0.7;
    const targetCamY = 3.6 + (this.isJumping ? this.playerY * 0.4 : 0);
    const targetCamZ = this.playerZ - 6.2 - (isBoostActive ? 1.5 : 0);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 12, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 12, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 14, dt);

    // Look slightly ahead of player
    const lookTargetX = this.playerX * 0.4;
    const lookTargetY = 1.6 + this.playerY * 0.5;
    const lookTargetZ = this.playerZ + 8;
    this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

    // Camera shake (trauma)
    if (this.cameraShake > 0) {
      const shakeAmt = this.cameraShake * this.cameraShake * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    }
  }

  // Player controls
  public moveLeft() {
    if (this.state !== 'playing') return;
    if (this.playerLane > -1) {
      this.playerLane = (this.playerLane - 1) as LaneIndex;
      sounds.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.state !== 'playing') return;
    if (this.playerLane < 1) {
      this.playerLane = (this.playerLane + 1) as LaneIndex;
      sounds.playLaneSwitch();
    }
  }

  public jump() {
    if (this.state !== 'playing') return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.playerVy = JUMP_VELOCITY;
      this.isSliding = false;
      this.slideTimer = 0;
      sounds.playJump();
    }
  }

  public slide() {
    if (this.state !== 'playing') return;
    if (this.isJumping) {
      // Fast drop down if mid-air
      this.playerVy = -GRAVITY * 0.8;
    }
    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    sounds.playSlide();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.state === 'title') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.startGame();
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      if (this.state === 'playing') this.pauseGame();
      else if (this.state === 'paused') this.resumeGame();
      return;
    }

    if (this.state !== 'playing') return;

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      e.preventDefault();
      this.moveLeft();
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      e.preventDefault();
      this.moveRight();
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      e.preventDefault();
      this.jump();
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      e.preventDefault();
      this.slide();
    }
  }

  private handleResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('resize', this.onResizeBound);
    sounds.stopDrumLoop();
    this.renderer.dispose();
  }
}
