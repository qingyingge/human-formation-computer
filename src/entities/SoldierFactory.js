import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const SPACING = 1.2;

function createBodyGeometry() {
  const parts = [];

  const skirt = new THREE.BoxGeometry(0.44, 0.35, 0.38);
  skirt.translate(0, 0.28, 0);
  parts.push(skirt);

  const leftLeg = new THREE.BoxGeometry(0.14, 0.28, 0.16);
  leftLeg.translate(-0.10, 0.05, 0);
  parts.push(leftLeg);

  const rightLeg = new THREE.BoxGeometry(0.14, 0.28, 0.16);
  rightLeg.translate(0.10, 0.05, 0);
  parts.push(rightLeg);

  const leftBoot = new THREE.BoxGeometry(0.15, 0.08, 0.22);
  leftBoot.translate(-0.10, -0.08, 0.04);
  parts.push(leftBoot);

  const rightBoot = new THREE.BoxGeometry(0.15, 0.08, 0.22);
  rightBoot.translate(0.10, -0.08, 0.04);
  parts.push(rightBoot);

  const torso = new THREE.BoxGeometry(0.44, 0.50, 0.36);
  torso.translate(0, 0.70, 0);
  parts.push(torso);

  const chestArmor = new THREE.BoxGeometry(0.38, 0.30, 0.08);
  chestArmor.translate(0, 0.75, 0.20);
  parts.push(chestArmor);

  const backArmor = new THREE.BoxGeometry(0.36, 0.28, 0.06);
  backArmor.translate(0, 0.75, -0.20);
  parts.push(backArmor);

  const belt = new THREE.BoxGeometry(0.46, 0.08, 0.40);
  belt.translate(0, 0.45, 0);
  parts.push(belt);

  const leftPauldron = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  leftPauldron.translate(-0.30, 0.92, 0.06);
  parts.push(leftPauldron);

  const rightPauldron = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  rightPauldron.translate(0.30, 0.92, 0.06);
  parts.push(rightPauldron);

  const leftUpperArm = new THREE.BoxGeometry(0.12, 0.24, 0.14);
  leftUpperArm.translate(-0.32, 0.74, 0.08);
  parts.push(leftUpperArm);

  const leftForearm = new THREE.BoxGeometry(0.10, 0.22, 0.12);
  leftForearm.translate(-0.32, 0.52, 0.08);
  parts.push(leftForearm);

  const neck = new THREE.BoxGeometry(0.12, 0.10, 0.14);
  neck.translate(0, 1.00, 0);
  parts.push(neck);

  const head = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  head.translate(0, 1.18, 0);
  parts.push(head);

  const topknot = new THREE.BoxGeometry(0.12, 0.16, 0.12);
  topknot.translate(0, 1.38, 0);
  parts.push(topknot);

  const browGuard = new THREE.BoxGeometry(0.26, 0.06, 0.06);
  browGuard.translate(0, 1.28, 0.14);
  parts.push(browGuard);

  return mergeGeometries(parts);
}

function createArmGeometry() {
  const parts = [];

  const upperArm = new THREE.BoxGeometry(0.12, 0.24, 0.14);
  upperArm.translate(0, 0, 0);
  parts.push(upperArm);

  const forearm = new THREE.BoxGeometry(0.10, 0.22, 0.12);
  forearm.translate(0, -0.22, 0);
  parts.push(forearm);

  return mergeGeometries(parts);
}

/**
 * 创建士兵阵列
 * @param layout - 节点位置映射数组，每项包含 { idx, nodeId, gridX, gridZ }
 * @returns THREE.Group，userData 中包含 nodeIds[] 和网格参数
 */
export function createSoldierArray(layout) {
  const TOTAL = layout.length;

  // 从 layout 计算网格尺寸
  let maxGridX = 0;
  let maxGridZ = 0;
  for (const pos of layout) {
    if (pos.gridX > maxGridX) maxGridX = pos.gridX;
    if (pos.gridZ > maxGridZ) maxGridZ = pos.gridZ;
  }
  const GRID_COLS = maxGridX + 1;
  const GRID_ROWS = maxGridZ + 1;

  const group = new THREE.Group();

  // 身体
  const bodyGeometry = createBodyGeometry();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.6,
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, TOTAL);

  // 右臂
  const armGeometry = createArmGeometry();
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.6,
  });
  const arms = new THREE.InstancedMesh(armGeometry, armMaterial, TOTAL);

  // 左臂
  const leftArms = new THREE.InstancedMesh(armGeometry, armMaterial, TOTAL);

  // 白旗
  const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const whiteFlagMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const whiteFlags = new THREE.InstancedMesh(flagGeometry, whiteFlagMaterial, TOTAL);

  // 黑旗
  const blackFlagMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    side: THREE.DoubleSide,
  });
  const blackFlags = new THREE.InstancedMesh(flagGeometry, blackFlagMaterial, TOTAL);

  // 旗杆
  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
  poleGeometry.translate(0, -0.25, 0);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const poles = new THREE.InstancedMesh(poleGeometry, poleMaterial, TOTAL);
  const leftPoles = new THREE.InstancedMesh(poleGeometry, poleMaterial, TOTAL);

  const dummy = new THREE.Object3D();

  // 网格居中偏移
  const offsetX = ((GRID_COLS - 1) * SPACING) / 2;
  const offsetZ = ((GRID_ROWS - 1) * SPACING) / 2;

  // nodeIds 数组：idx → nodeId
  const nodeIds = new Array(TOTAL);

  for (const item of layout) {
    const { idx, nodeId, gridX, gridZ } = item;
    const x = gridX * SPACING - offsetX;
    const z = gridZ * SPACING - offsetZ;

    nodeIds[idx] = nodeId;

    // 身体
    dummy.position.set(x, 0, z);
    dummy.updateMatrix();
    bodies.setMatrixAt(idx, dummy.matrix);

    // 右臂
    dummy.position.set(x + 0.32, 1.00, z + 0.08);
    dummy.updateMatrix();
    arms.setMatrixAt(idx, dummy.matrix);

    // 左臂
    dummy.position.set(x - 0.32, 1.00, z + 0.08);
    dummy.updateMatrix();
    leftArms.setMatrixAt(idx, dummy.matrix);

    // 右旗杆
    dummy.position.set(x + 0.32, 1.35, z + 0.08);
    dummy.updateMatrix();
    poles.setMatrixAt(idx, dummy.matrix);

    // 左旗杆
    dummy.position.set(x - 0.32, 1.35, z + 0.08);
    dummy.updateMatrix();
    leftPoles.setMatrixAt(idx, dummy.matrix);

    // 白旗
    dummy.position.set(x + 0.32, 1.60, z + 0.08);
    dummy.updateMatrix();
    whiteFlags.setMatrixAt(idx, dummy.matrix);

    // 黑旗
    dummy.position.set(x - 0.32, 1.60, z + 0.08);
    dummy.updateMatrix();
    blackFlags.setMatrixAt(idx, dummy.matrix);
  }

  bodies.instanceMatrix.needsUpdate = true;
  arms.instanceMatrix.needsUpdate = true;
  leftArms.instanceMatrix.needsUpdate = true;
  whiteFlags.instanceMatrix.needsUpdate = true;
  blackFlags.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;
  leftPoles.instanceMatrix.needsUpdate = true;

  group.add(bodies, arms, leftArms, whiteFlags, blackFlags, poles, leftPoles);

  group.userData.offsetX = offsetX;
  group.userData.offsetZ = offsetZ;
  group.userData.arms = arms;
  group.userData.leftArms = leftArms;
  group.userData.whiteFlags = whiteFlags;
  group.userData.blackFlags = blackFlags;
  group.userData.poles = poles;
  group.userData.leftPoles = leftPoles;
  group.userData.nodeIds = nodeIds;
  group.userData.TOTAL = TOTAL;
  group.userData.GRID_COLS = GRID_COLS;
  group.userData.GRID_ROWS = GRID_ROWS;
  group.userData.facingAngles = new Float32Array(TOTAL);

  return group;
}
