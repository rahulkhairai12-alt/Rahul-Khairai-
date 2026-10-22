import * as THREE from 'three';
import { createShieldTexture } from './proceduralTextures';

export interface CharacterController {
  group: THREE.Group;
  shieldMesh: THREE.Mesh;
  tearParticles: THREE.Points;
  updateAnimation: (
    dt: number,
    state: {
      speed: number;
      isJumping: boolean;
      isSliding: boolean;
      isGameOver: boolean;
      shieldActive: boolean;
      boostActive: boolean;
    }
  ) => void;
  resetPose: () => void;
  triggerCrying: () => void;
}

export function createExplorerCharacter(): CharacterController {
  const root = new THREE.Group();

  // Color & Material definitions
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 0.6,
    metalness: 0.05,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // brown leather explorer jacket
    roughness: 0.8,
    metalness: 0.1,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x556b2f, // khaki olive jungle cargo pants
    roughness: 0.85,
    metalness: 0.0,
  });
  const bootsMat = new THREE.MeshStandardMaterial({
    color: 0x2b1d0c, // rugged dark leather boots
    roughness: 0.9,
    metalness: 0.1,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0x6e4726, // explorer fedora
    roughness: 0.7,
    metalness: 0.05,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x1a1105,
    roughness: 0.5,
    metalness: 0.3,
  });
  const satchelMat = new THREE.MeshStandardMaterial({
    color: 0xa0522d,
    roughness: 0.75,
    metalness: 0.1,
  });

  // Hips (Root pivot of torso and legs)
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  root.add(hips);

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const torso = new THREE.Mesh(torsoGeo, jacketMat);
  torso.position.y = 0.35;
  torso.castShadow = true;
  hips.add(torso);

  // Belt & Gold Buckle
  const beltGeo = new THREE.BoxGeometry(0.57, 0.08, 0.37);
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.04;
  hips.add(belt);

  const buckleGeo = new THREE.BoxGeometry(0.12, 0.1, 0.39);
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
  const buckle = new THREE.Mesh(buckleGeo, buckleMat);
  buckle.position.y = 0.04;
  hips.add(buckle);

  // Explorer Satchel across chest
  const satchelGeo = new THREE.BoxGeometry(0.2, 0.22, 0.12);
  const satchel = new THREE.Mesh(satchelGeo, satchelMat);
  satchel.position.set(0.28, 0.2, 0.05);
  satchel.rotation.z = -0.15;
  hips.add(satchel);

  // Head & Neck
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.8;
  hips.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.34, 0.36, 0.34);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
  leftEye.position.set(-0.09, 0.04, 0.18);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
  rightEye.position.set(0.09, 0.04, 0.18);
  headGroup.add(rightEye);

  // Fedora Hat
  const hatBrimGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.04, 16);
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 0.2;
  headGroup.add(hatBrim);

  const hatCrownGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 16);
  const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
  hatCrown.position.y = 0.32;
  headGroup.add(hatCrown);

  // Left & Right Arms
  const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.35, 0.6, 0);
  hips.add(leftArmGroup);
  const leftArm = new THREE.Mesh(armGeo, jacketMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmGroup.add(leftArm);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.35, 0.6, 0);
  hips.add(rightArmGroup);
  const rightArm = new THREE.Mesh(armGeo, jacketMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmGroup.add(rightArm);

  // Left & Right Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  const bootGeo = new THREE.BoxGeometry(0.2, 0.3, 0.26);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, 0, 0);
  hips.add(leftLegGroup);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.y = -0.3;
  leftLeg.castShadow = true;
  leftLegGroup.add(leftLeg);
  const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
  leftBoot.position.set(0, -0.65, 0.04);
  leftBoot.castShadow = true;
  leftLegGroup.add(leftBoot);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, 0, 0);
  hips.add(rightLegGroup);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.y = -0.3;
  rightLeg.castShadow = true;
  rightLegGroup.add(rightLeg);
  const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
  rightBoot.position.set(0, -0.65, 0.04);
  rightBoot.castShadow = true;
  rightLegGroup.add(rightBoot);

  // Mystic Shield Sphere (visible when power-up active)
  const shieldGeo = new THREE.SphereGeometry(1.3, 24, 24);
  const shieldTex = createShieldTexture();
  const shieldMat = new THREE.MeshStandardMaterial({
    map: shieldTex,
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.5,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 0.9;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  // Contact Shadow Disc on ground
  const shadowGeo = new THREE.CircleGeometry(0.65, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0a1208,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // 3D Animated Crying Tears Particle System
  const tearCount = 70;
  const tearGeo = new THREE.BufferGeometry();
  const tearPositions = new Float32Array(tearCount * 3);
  const tearVelocities: { x: number; y: number; z: number; life: number }[] = [];

  for (let i = 0; i < tearCount; i++) {
    tearPositions[i * 3] = 0;
    tearPositions[i * 3 + 1] = 0;
    tearPositions[i * 3 + 2] = 0;
    tearVelocities.push({
      x: (Math.random() - 0.5) * 2.5,
      y: 1.5 + Math.random() * 3.0,
      z: 0.5 + Math.random() * 2.0,
      life: 0,
    });
  }
  tearGeo.setAttribute('position', new THREE.BufferAttribute(tearPositions, 3));

  // Procedural soft round droplet canvas texture
  const tearCanvas = document.createElement('canvas');
  tearCanvas.width = 64;
  tearCanvas.height = 64;
  const tearCtx = tearCanvas.getContext('2d')!;
  const tearGrad = tearCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  tearGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  tearGrad.addColorStop(0.3, 'rgba(100, 220, 255, 0.95)');
  tearGrad.addColorStop(0.7, 'rgba(0, 160, 255, 0.6)');
  tearGrad.addColorStop(1, 'rgba(0, 120, 255, 0)');
  tearCtx.fillStyle = tearGrad;
  tearCtx.beginPath();
  tearCtx.arc(32, 32, 30, 0, Math.PI * 2);
  tearCtx.fill();
  const tearTex = new THREE.CanvasTexture(tearCanvas);

  const tearMat = new THREE.PointsMaterial({
    map: tearTex,
    color: 0x88e5ff,
    size: 0.45,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    alphaTest: 0.02,
  });
  const tearParticles = new THREE.Points(tearGeo, tearMat);
  tearParticles.position.set(0, 1.7, 0.2);
  tearParticles.visible = false;
  root.add(tearParticles);

  let runTime = 0;
  let isCrying = false;
  let cryingTimer = 0;

  function resetPose() {
    isCrying = false;
    cryingTimer = 0;
    tearParticles.visible = false;
    hips.position.y = 0.9;
    hips.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
    leftArmGroup.rotation.set(0, 0, 0);
    rightArmGroup.rotation.set(0, 0, 0);
    leftLegGroup.rotation.set(0, 0, 0);
    rightLegGroup.rotation.set(0, 0, 0);
  }

  function triggerCrying() {
    isCrying = true;
    cryingTimer = 0;
    tearParticles.visible = true;

    // Reset tear positions
    const pos = tearGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < tearCount; i++) {
      pos[i * 3] = (i % 2 === 0 ? -0.12 : 0.12);
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      tearVelocities[i].life = Math.random() * 1.5;
    }
    tearGeo.attributes.position.needsUpdate = true;
  }

  function updateAnimation(
    dt: number,
    state: {
      speed: number;
      isJumping: boolean;
      isSliding: boolean;
      isGameOver: boolean;
      shieldActive: boolean;
      boostActive: boolean;
    }
  ) {
    shieldMesh.visible = state.shieldActive;
    if (state.shieldActive) {
      shieldMesh.rotation.y += dt * 2.0;
      shieldMesh.rotation.x += dt * 1.0;
    }

    if (state.isGameOver) {
      // Game Over Crying Animation!
      cryingTimer += dt;
      // Character collapses into kneeling/sitting sobbing pose
      hips.position.y = THREE.MathUtils.damp(hips.position.y, 0.4, 6, dt);
      hips.rotation.x = THREE.MathUtils.damp(hips.rotation.x, 0.35, 6, dt);

      // Hands covering face/head in deep weeping
      leftArmGroup.rotation.x = -1.6;
      leftArmGroup.rotation.z = 0.7;
      rightArmGroup.rotation.x = -1.6;
      rightArmGroup.rotation.z = -0.7;

      // Legs folded sitting
      leftLegGroup.rotation.x = 1.3;
      rightLegGroup.rotation.x = 1.3;

      // Head shaking with sobs
      headGroup.rotation.x = 0.2 + Math.sin(cryingTimer * 12) * 0.12;
      headGroup.rotation.z = Math.sin(cryingTimer * 8) * 0.08;

      // Update 3D fountain tears!
      if (tearParticles.visible) {
        const pos = tearGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < tearCount; i++) {
          tearVelocities[i].y -= 9.8 * dt; // gravity on tears
          pos[i * 3] += tearVelocities[i].x * dt;
          pos[i * 3 + 1] += tearVelocities[i].y * dt;
          pos[i * 3 + 2] += tearVelocities[i].z * dt;

          tearVelocities[i].life -= dt;
          if (tearVelocities[i].life <= 0 || pos[i * 3 + 1] < -1.5) {
            // Respawn tear from eyes with random fountain arc
            pos[i * 3] = (i % 2 === 0 ? -0.12 : 0.12);
            pos[i * 3 + 1] = 0;
            pos[i * 3 + 2] = 0;
            const side = i % 2 === 0 ? -1 : 1;
            tearVelocities[i] = {
              x: side * (0.8 + Math.random() * 1.5),
              y: 2.2 + Math.random() * 2.8,
              z: 0.6 + Math.random() * 1.8,
              life: 0.6 + Math.random() * 0.8,
            };
          }
        }
        tearGeo.attributes.position.needsUpdate = true;
      }
      return;
    }

    if (state.isSliding) {
      // Sliding under lintel: lean torso back, legs forward, low profile
      hips.position.y = THREE.MathUtils.damp(hips.position.y, 0.35, 15, dt);
      hips.rotation.x = THREE.MathUtils.damp(hips.rotation.x, -1.2, 15, dt);
      leftLegGroup.rotation.x = 1.2;
      rightLegGroup.rotation.x = 1.2;
      leftArmGroup.rotation.x = 0.8;
      rightArmGroup.rotation.x = 0.8;
      return;
    }

    if (state.isJumping) {
      // Jumping: tuck legs up, arms slightly out for balance
      hips.rotation.x = THREE.MathUtils.damp(hips.rotation.x, 0.15, 10, dt);
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, 0.7, 10, dt);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, -0.4, 10, dt);
      leftArmGroup.rotation.x = -1.2;
      rightArmGroup.rotation.x = -1.2;
      return;
    }

    // Normal running animation cycle
    hips.position.y = 0.9;
    hips.rotation.x = 0.15; // athletic forward lean

    const runFrequency = (state.speed / 18) * 14;
    runTime += dt * runFrequency;

    // Torso bobbing
    hips.position.y = 0.9 + Math.abs(Math.sin(runTime)) * 0.12;

    // Arm swings opposite to legs
    const armSwing = Math.sin(runTime) * 0.95;
    leftArmGroup.rotation.x = armSwing;
    rightArmGroup.rotation.x = -armSwing;

    // Leg swings with knee bending effect
    const legSwing = Math.sin(runTime) * 1.1;
    leftLegGroup.rotation.x = -legSwing;
    rightLegGroup.rotation.x = legSwing;

    // Subtle head counter-bob
    headGroup.rotation.x = -Math.sin(runTime * 2) * 0.05;
  }

  return {
    group: root,
    shieldMesh,
    tearParticles,
    updateAnimation,
    resetPose,
    triggerCrying,
  };
}
