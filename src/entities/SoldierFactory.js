import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const GRID_SIZE = 16;
export const SPACING = 1.2;
export const TOTAL = GRID_SIZE * GRID_SIZE;

// 身体（不含右臂）
function createBodyGeometry() {
  const parts = [];

  // 战袍下摆
  const skirt = new THREE.BoxGeometry(0.44, 0.35, 0.38);
  skirt.translate(0, 0.28, 0);
  parts.push(skirt);

  // 左腿
  const leftLeg = new THREE.BoxGeometry(0.14, 0.28, 0.16);
  leftLeg.translate(-0.10, 0.05, 0);
  parts.push(leftLeg);

  // 右腿
  const rightLeg = new THREE.BoxGeometry(0.14, 0.28, 0.16);
  rightLeg.translate(0.10, 0.05, 0);
  parts.push(rightLeg);

  // 左靴
  const leftBoot = new THREE.BoxGeometry(0.15, 0.08, 0.22);
  leftBoot.translate(-0.10, -0.08, 0.04);
  parts.push(leftBoot);

  // 右靴
  const rightBoot = new THREE.BoxGeometry(0.15, 0.08, 0.22);
  rightBoot.translate(0.10, -0.08, 0.04);
  parts.push(rightBoot);

  // 躯干
  const torso = new THREE.BoxGeometry(0.44, 0.50, 0.36);
  torso.translate(0, 0.70, 0);
  parts.push(torso);

  // 胸甲
  const chestArmor = new THREE.BoxGeometry(0.38, 0.30, 0.08);
  chestArmor.translate(0, 0.75, 0.20);
  parts.push(chestArmor);

  // 背甲
  const backArmor = new THREE.BoxGeometry(0.36, 0.28, 0.06);
  backArmor.translate(0, 0.75, -0.20);
  parts.push(backArmor);

  // 腰带
  const belt = new THREE.BoxGeometry(0.46, 0.08, 0.40);
  belt.translate(0, 0.45, 0);
  parts.push(belt);

  // 披膊（左肩甲）
  const leftPauldron = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  leftPauldron.translate(-0.30, 0.92, 0.06);
  parts.push(leftPauldron);

  // 披膊（右肩甲）
  const rightPauldron = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  rightPauldron.translate(0.30, 0.92, 0.06);
  parts.push(rightPauldron);

  // 左上臂
  const leftUpperArm = new THREE.BoxGeometry(0.12, 0.24, 0.14);
  leftUpperArm.translate(-0.32, 0.74, 0.08);
  parts.push(leftUpperArm);

  // 左前臂
  const leftForearm = new THREE.BoxGeometry(0.10, 0.22, 0.12);
  leftForearm.translate(-0.32, 0.52, 0.08);
  parts.push(leftForearm);

  // 颈部
  const neck = new THREE.BoxGeometry(0.12, 0.10, 0.14);
  neck.translate(0, 1.00, 0);
  parts.push(neck);

  // 头部
  const head = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  head.translate(0, 1.18, 0);
  parts.push(head);

  // 髻冠
  const topknot = new THREE.BoxGeometry(0.12, 0.16, 0.12);
  topknot.translate(0, 1.38, 0);
  parts.push(topknot);

  // 额甲
  const browGuard = new THREE.BoxGeometry(0.26, 0.06, 0.06);
  browGuard.translate(0, 1.28, 0.14);
  parts.push(browGuard);

  return mergeGeometries(parts);
}

// 右臂（可独立动画）
export function createArmGeometry() {
  const parts = [];

  // 右上臂
  const upperArm = new THREE.BoxGeometry(0.12, 0.24, 0.14);
  upperArm.translate(0, 0, 0);
  parts.push(upperArm);

  // 右前臂
  const forearm = new THREE.BoxGeometry(0.10, 0.22, 0.12);
  forearm.translate(0, -0.22, 0);
  parts.push(forearm);

  return mergeGeometries(parts);
}

export function createSoldierArray() {
  const group = new THREE.Group();

  // 身体
  const bodyGeometry = createBodyGeometry();
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.6
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, TOTAL);

  // 右臂（独立，用于动画）
  const armGeometry = createArmGeometry();
  const armMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.6
  });
  const arms = new THREE.InstancedMesh(armGeometry, armMaterial, TOTAL);

  // 旗帜
  const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const flagMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const flags = new THREE.InstancedMesh(flagGeometry, flagMaterial, TOTAL);

  // 旗杆
  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const poles = new THREE.InstancedMesh(poleGeometry, poleMaterial, TOTAL);

  const dummy = new THREE.Object3D();
  const offset = ((GRID_SIZE - 1) * SPACING) / 2;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = j * SPACING - offset;
      const z = i * SPACING - offset;

      // 身体
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      bodies.setMatrixAt(idx, dummy.matrix);

      // 手臂（初始举起位置）
      dummy.position.set(x + 0.32, 1.00, z + 0.08);
      dummy.updateMatrix();
      arms.setMatrixAt(idx, dummy.matrix);

      // 旗杆
      dummy.position.set(x + 0.32, 1.35, z + 0.08);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜
      dummy.position.set(x + 0.32, 1.60, z + 0.08);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }

  bodies.instanceMatrix.needsUpdate = true;
  arms.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;

  group.add(bodies, arms, flags, poles);

  // 存储偏移量供动画使用
  group.userData.offset = offset;
  group.userData.arms = arms;
  group.userData.flags = flags;
  group.userData.poles = poles;

  return group;
}