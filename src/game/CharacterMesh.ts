import * as THREE from 'three';
import { CharacterConfig } from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hoverboardMesh: THREE.Group;
  jetpackMesh: THREE.Group;
  leftThrustParticle: THREE.Mesh;
  rightThrustParticle: THREE.Mesh;
  materials: THREE.Material[];
}

export const CHARACTERS_DATA: CharacterConfig[] = [
  {
    id: 'dash',
    name: 'Dash',
    title: 'The Street Skater',
    price: 0,
    unlocked: true,
    colors: {
      skin: '#f5c6a5',
      shirt: '#e11d48', // Red hoodie
      pants: '#1e293b', // Dark jeans
      shoes: '#ffffff', // White sneakers
      accent: '#fbbf24', // Gold cap & trim
      hair: '#3b2010',
    },
    style: 'urban',
    stats: {
      speedBoost: '+5% Lane Agility',
      jumpBonus: 'Standard Leap',
      specialTrait: 'All-Rounder',
    },
  },
  {
    id: 'maya',
    name: 'Maya',
    title: 'Cyber Surge',
    price: 2500,
    unlocked: false,
    colors: {
      skin: '#e0ac69',
      shirt: '#06b6d4', // Cyan neon suit
      pants: '#0f172a', // Midnight tech pants
      shoes: '#00f5d4', // Cyan glowing soles
      accent: '#f43f5e', // Hot pink neon visor/trim
      hair: '#818cf8',
    },
    style: 'cyber',
    stats: {
      speedBoost: '+10% Hoverboard Speed',
      jumpBonus: '+5% Hang Time',
      specialTrait: 'Cyber Trails',
    },
  },
  {
    id: 'bolt',
    name: 'Bolt',
    title: 'Retro Robo',
    price: 5000,
    unlocked: false,
    colors: {
      skin: '#eab308', // Yellow chassis
      shirt: '#eab308',
      pants: '#334155', // Steel grey joints
      shoes: '#f97316', // Orange treads
      accent: '#38bdf8', // Neon blue core light
      hair: '#64748b',
    },
    style: 'robot',
    stats: {
      speedBoost: '+15% Magnet Duration',
      jumpBonus: 'Rocket Hover',
      specialTrait: 'Coin Vacuum',
    },
  },
  {
    id: 'kira',
    name: 'Kira',
    title: 'Shadow Swift',
    price: 10000,
    unlocked: false,
    colors: {
      skin: '#fcd34d',
      shirt: '#475569', // Shadow vest
      pants: '#09090b', // Shinobi joggers
      shoes: '#dc2626', // Crimson wraps
      accent: '#ef4444', // Red headband tail
      hair: '#18181b',
    },
    style: 'ninja',
    stats: {
      speedBoost: '+20% Slide Distance',
      jumpBonus: 'Acrobatic Flip',
      specialTrait: 'Shadow Step',
    },
  },
];

export function buildCharacterRig(character: CharacterConfig): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const materials: THREE.Material[] = [];

  // Reusable materials with toon / smooth phong shading
  const skinMat = new THREE.MeshToonMaterial({ color: character.colors.skin });
  const shirtMat = new THREE.MeshToonMaterial({ color: character.colors.shirt });
  const pantsMat = new THREE.MeshToonMaterial({ color: character.colors.pants });
  const shoesMat = new THREE.MeshToonMaterial({ color: character.colors.shoes });
  const accentMat = new THREE.MeshToonMaterial({
    color: character.colors.accent,
    emissive: character.style === 'cyber' ? new THREE.Color(character.colors.accent).multiplyScalar(0.5) : 0x000000,
  });
  const hairMat = new THREE.MeshToonMaterial({ color: character.colors.hair });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

  materials.push(skinMat, shirtMat, pantsMat, shoesMat, accentMat, hairMat, eyeWhiteMat, eyePupilMat);

  // --- Torso / Chest ---
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.65, 8);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torso.position.y = 0.85;
  body.add(torso);

  // Logo / Chest decal
  const logoGeo = new THREE.PlaneGeometry(0.24, 0.24);
  const logo = new THREE.Mesh(logoGeo, accentMat);
  logo.position.set(0, 0.88, 0.32);
  body.add(logo);

  // --- Head Group ---
  const head = new THREE.Group();
  head.position.set(0, 1.35, 0);

  const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Eyes (Expressive cartoon eyes)
  const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const leftEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.11, 0.05, 0.24);
  const rightEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.11, 0.05, 0.24);

  const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
  leftPupil.position.set(-0.11, 0.05, 0.28);
  const rightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
  rightPupil.position.set(0.11, 0.05, 0.28);

  head.add(leftEyeWhite, rightEyeWhite, leftPupil, rightPupil);

  // Character-specific head accessory
  if (character.style === 'urban') {
    // Backward Cap
    const capGeo = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const capMesh = new THREE.Mesh(capGeo, accentMat);
    capMesh.position.y = 0.06;
    head.add(capMesh);

    const brimGeo = new THREE.BoxGeometry(0.26, 0.04, 0.2);
    const brimMesh = new THREE.Mesh(brimGeo, accentMat);
    brimMesh.position.set(0, 0.1, -0.28);
    brimMesh.rotation.x = -0.2;
    head.add(brimMesh);
  } else if (character.style === 'cyber') {
    // Cyber Visor
    const visorGeo = new THREE.BoxGeometry(0.4, 0.1, 0.15);
    const visorMesh = new THREE.Mesh(visorGeo, accentMat);
    visorMesh.position.set(0, 0.05, 0.23);
    head.add(visorMesh);

    // Headphones
    const hpGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
    const hpL = new THREE.Mesh(hpGeo, shirtMat);
    hpL.rotation.z = Math.PI / 2;
    hpL.position.set(-0.3, 0.05, 0);
    const hpR = hpL.clone();
    hpR.position.x = 0.3;
    head.add(hpL, hpR);
  } else if (character.style === 'robot') {
    // Robot Antenna
    const antPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const antPole = new THREE.Mesh(antPoleGeo, pantsMat);
    antPole.position.y = 0.38;
    const antBallGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const antBall = new THREE.Mesh(antBallGeo, accentMat);
    antBall.position.y = 0.5;
    head.add(antPole, antBall);
  } else if (character.style === 'ninja') {
    // Shinobi Headband
    const bandGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const bandMesh = new THREE.Mesh(bandGeo, accentMat);
    bandMesh.position.y = 0.12;
    head.add(bandMesh);

    // Trailing ribbon
    const ribbonGeo = new THREE.BoxGeometry(0.08, 0.35, 0.02);
    const ribbon = new THREE.Mesh(ribbonGeo, accentMat);
    ribbon.position.set(0.15, 0.05, -0.3);
    ribbon.rotation.x = 0.3;
    head.add(ribbon);
  }

  body.add(head);

  // --- Arms ---
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8);
  const handGeo = new THREE.SphereGeometry(0.09, 8, 8);

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.4, 1.1, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
  leftArmMesh.position.y = -0.22;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.52;
  leftArm.add(leftArmMesh, leftHand);
  body.add(leftArm);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.4, 1.1, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
  rightArmMesh.position.y = -0.22;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.52;
  rightArm.add(rightArmMesh, rightHand);
  body.add(rightArm);

  // --- Legs ---
  const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.55, 8);
  const shoeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.32);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.55, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.24;
  leftLegMesh.castShadow = true;
  const leftShoe = new THREE.Mesh(shoeGeo, shoesMat);
  leftShoe.position.set(0, -0.5, 0.06);
  leftShoe.castShadow = true;
  leftLeg.add(leftLegMesh, leftShoe);
  body.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.55, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.24;
  rightLegMesh.castShadow = true;
  const rightShoe = new THREE.Mesh(shoeGeo, shoesMat);
  rightShoe.position.set(0, -0.5, 0.06);
  rightShoe.castShadow = true;
  rightLeg.add(rightLegMesh, rightShoe);
  body.add(rightLeg);

  // --- Hoverboard Mesh (Attached to root under feet, hidden when inactive) ---
  const hoverboardMesh = new THREE.Group();
  hoverboardMesh.position.set(0, 0.12, 0);
  const deckGeo = new THREE.BoxGeometry(0.7, 0.06, 1.4);
  const deckMat = new THREE.MeshPhongMaterial({
    color: 0x3b82f6,
    emissive: 0x1d4ed8,
    shininess: 90,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.castShadow = true;

  const glowRingGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 16);
  const glowRingMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const fGlow = new THREE.Mesh(glowRingGeo, glowRingMat);
  fGlow.rotation.x = Math.PI / 2;
  fGlow.position.set(0, -0.04, 0.45);
  const bGlow = fGlow.clone();
  bGlow.position.z = -0.45;

  hoverboardMesh.add(deck, fGlow, bGlow);
  hoverboardMesh.visible = false;
  root.add(hoverboardMesh);

  // --- Jetpack Mesh (Attached to body spine, hidden when inactive) ---
  const jetpackMesh = new THREE.Group();
  jetpackMesh.position.set(0, 0.85, -0.32);

  const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12);
  const tankMat = new THREE.MeshPhongMaterial({ color: 0x475569, shininess: 80 });
  const tankL = new THREE.Mesh(tankGeo, tankMat);
  tankL.position.x = -0.15;
  const tankR = new THREE.Mesh(tankGeo, tankMat);
  tankR.position.x = 0.15;

  const nozzleGeo = new THREE.ConeGeometry(0.1, 0.14, 8);
  const nozzleMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzleL.position.set(-0.15, -0.28, 0);
  const nozzleR = nozzleL.clone();
  nozzleR.position.x = 0.15;

  // Flame thrust particles
  const thrustGeo = new THREE.ConeGeometry(0.09, 0.35, 6);
  const thrustMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const leftThrustParticle = new THREE.Mesh(thrustGeo, thrustMat);
  leftThrustParticle.position.set(-0.15, -0.48, 0);
  leftThrustParticle.rotation.x = Math.PI;

  const rightThrustParticle = leftThrustParticle.clone();
  rightThrustParticle.position.x = 0.15;

  jetpackMesh.add(tankL, tankR, nozzleL, nozzleR, leftThrustParticle, rightThrustParticle);
  jetpackMesh.visible = false;
  body.add(jetpackMesh);

  root.add(body);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hoverboardMesh,
    jetpackMesh,
    leftThrustParticle,
    rightThrustParticle,
    materials,
  };
}

export type AnimState = 'run' | 'jump' | 'slide' | 'crash' | 'celebrate';

export function animateCharacterRig(
  rig: CharacterRig,
  time: number,
  state: AnimState,
  speed: number,
  isHoverboardActive: boolean,
  isJetpackActive: boolean,
  laneSwitchTilt: number = 0
) {
  rig.hoverboardMesh.visible = isHoverboardActive;
  rig.jetpackMesh.visible = isJetpackActive;

  // Pulse thruster flame if jetpack active
  if (isJetpackActive) {
    const scale = 0.8 + Math.sin(time * 30) * 0.4;
    rig.leftThrustParticle.scale.set(scale, scale * 1.2, scale);
    rig.rightThrustParticle.scale.set(scale, scale * 1.2, scale);
  }

  // Hoverboard visual stance
  if (isHoverboardActive) {
    rig.root.rotation.y = 0.35; // Surfer side stance
    rig.hoverboardMesh.rotation.z = Math.sin(time * 6) * 0.08;
    rig.hoverboardMesh.position.y = 0.12 + Math.sin(time * 8) * 0.04;
  } else {
    rig.root.rotation.y = 0;
  }

  // Lane lean
  rig.body.rotation.z = laneSwitchTilt;

  switch (state) {
    case 'run': {
      const runCycle = time * (speed * 0.55);
      const legAngle = Math.sin(runCycle) * 0.65;
      const armAngle = -legAngle * 0.8;

      rig.leftLeg.rotation.x = legAngle;
      rig.rightLeg.rotation.x = -legAngle;

      rig.leftArm.rotation.x = armAngle;
      rig.rightArm.rotation.x = -armAngle;

      // Natural running bounce
      rig.body.position.y = Math.abs(Math.sin(runCycle)) * 0.09;
      rig.head.rotation.x = Math.sin(runCycle * 2) * 0.04;
      rig.body.rotation.x = 0.12; // Forward athletic lean
      break;
    }

    case 'jump': {
      // Leap pose: legs tucked slightly backwards, arms flared upwards
      rig.leftLeg.rotation.x = -0.4;
      rig.rightLeg.rotation.x = -0.55;
      rig.leftArm.rotation.x = -1.2;
      rig.rightArm.rotation.x = -1.3;
      rig.body.rotation.x = -0.15; // Upward arch
      rig.body.position.y = 0;
      break;
    }

    case 'slide': {
      // Sliding pose: body pitched down, legs sliding out flat, arms back for balance
      rig.body.rotation.x = 1.1; // Deep crouch / slide flat
      rig.body.position.y = -0.35; // Lower height profile
      rig.leftLeg.rotation.x = 0.8;
      rig.rightLeg.rotation.x = 1.1;
      rig.leftArm.rotation.x = 1.0;
      rig.rightArm.rotation.x = 1.0;
      break;
    }

    case 'crash': {
      // Stumbled collision pose: thrown backwards
      rig.body.rotation.x = -0.65;
      rig.body.rotation.y = Math.PI * 0.2;
      rig.body.position.y = -0.2;
      rig.leftArm.rotation.x = -1.5;
      rig.rightArm.rotation.x = -1.2;
      rig.leftLeg.rotation.x = 0.4;
      rig.rightLeg.rotation.x = -0.3;
      break;
    }

    case 'celebrate': {
      // Idle / victory wave
      const waveCycle = time * 5;
      rig.body.rotation.x = 0;
      rig.body.rotation.y = 0;
      rig.body.position.y = Math.abs(Math.sin(time * 3)) * 0.12;

      rig.leftLeg.rotation.x = 0;
      rig.rightLeg.rotation.x = 0;

      rig.leftArm.rotation.x = 0;
      rig.rightArm.rotation.z = 1.8 + Math.sin(waveCycle) * 0.35; // Waving hand
      rig.rightArm.rotation.x = 0.2;
      break;
    }
  }
}
