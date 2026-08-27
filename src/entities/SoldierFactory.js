import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const GRID_SIZE = 16;
const SPACING = 1.2;
const TOTAL = GRID_SIZE * GRID_SIZE;

function createSoldierGeometry() {
  const parts = [];

  // === 躯干（厚实，像穿铠甲的士兵） ===
  const torso = new THREE.BoxGeometry(0.48, 0.55, 0.44);
  torso.translate(0, 0.82, 0);
  parts.push(torso);

  // === 腰部（略窄，过渡） ===
  const waist = new THREE.BoxGeometry(0.42, 0.12, 0.38);
  waist.translate(0, 0.5, 0);
  parts.push(waist);

  // === 肩部（略宽于躯干） ===
  const shoulder = new THREE.BoxGeometry(0.56, 0.10, 0.42);
  shoulder.translate(0, 1.08, 0);
  parts.push(shoulder);

  // === 左上臂（手臂在躯干前方偏外侧） ===
  const leftUpperArm = new THREE.BoxGeometry(0.15, 0.28, 0.18);
  leftUpperArm.translate(-0.34, 0.98, 0.18);
  parts.push(leftUpperArm);

  // === 左前臂 ===
  const leftForearm = new THREE.BoxGeometry(0.13, 0.26, 0.16);
  leftForearm.translate(-0.34, 0.72, 0.18);
  parts.push(leftForearm);

  // === 左手 ===
  const leftHand = new THREE.BoxGeometry(0.12, 0.09, 0.13);
  leftHand.translate(-0.34, 0.56, 0.18);
  parts.push(leftHand);

  // === 右上臂 ===
  const rightUpperArm = new THREE.BoxGeometry(0.15, 0.28, 0.18);
  rightUpperArm.translate(0.34, 0.98, 0.18);
  parts.push(rightUpperArm);

  // === 右前臂 ===
  const rightForearm = new THREE.BoxGeometry(0.13, 0.26, 0.16);
  rightForearm.translate(0.34, 0.72, 0.18);
  parts.push(rightForearm);

  // === 右手 ===
  const rightHand = new THREE.BoxGeometry(0.12, 0.09, 0.13);
  rightHand.translate(0.34, 0.56, 0.18);
  parts.push(rightHand);

  // === 左大腿（腿部略向后） ===
  const leftThigh = new THREE.BoxGeometry(0.19, 0.35, 0.24);
  leftThigh.translate(-0.12, 0.28, -0.10);
  parts.push(leftThigh);

  // === 左小腿 ===
  const leftCalf = new THREE.BoxGeometry(0.16, 0.32, 0.20);
  leftCalf.translate(-0.12, -0.06, -0.10);
  parts.push(leftCalf);

  // === 左脚（靴子，向前伸出） ===
  const leftFoot = new THREE.BoxGeometry(0.17, 0.09, 0.30);
  leftFoot.translate(-0.12, -0.22, 0.10);
  parts.push(leftFoot);

  // === 右大腿 ===
  const rightThigh = new THREE.BoxGeometry(0.19, 0.35, 0.24);
  rightThigh.translate(0.12, 0.28, -0.10);
  parts.push(rightThigh);

  // === 右小腿 ===
  const rightCalf = new THREE.BoxGeometry(0.16, 0.32, 0.20);
  rightCalf.translate(0.12, -0.06, -0.10);
  parts.push(rightCalf);

  // === 右脚（靴子） ===
  const rightFoot = new THREE.BoxGeometry(0.17, 0.09, 0.30);
  rightFoot.translate(0.12, -0.22, 0.10);
  parts.push(rightFoot);

  // === 头部（球体） ===
  const head = new THREE.SphereGeometry(0.18, 10, 8);
  head.translate(0, 1.32, 0);
  parts.push(head);

  // === 颈部 ===
  const neck = new THREE.BoxGeometry(0.13, 0.10, 0.16);
  neck.translate(0, 1.15, 0);
  parts.push(neck);

  // === 头盔（扁盒，覆盖头部） ===
  const helmet = new THREE.BoxGeometry(0.42, 0.14, 0.42);
  helmet.translate(0, 1.44, 0);
  parts.push(helmet);

  // === 头盔前沿（帽檐） ===
  const brim = new THREE.BoxGeometry(0.36, 0.03, 0.14);
  brim.translate(0, 1.38, 0.26);
  parts.push(brim);

  return mergeGeometries(parts);
}

export function createSoldierArray() {
  const group = new THREE.Group();

  // 身体（合并后的单一几何体：躯干+四肢+头+头盔）
  const bodyGeometry = createSoldierGeometry();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xb87333 });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, TOTAL);

  // 旗帜（独立实例化，便于后续变色）
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

      // 身体（底部对齐地面 y=0）
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      bodies.setMatrixAt(idx, dummy.matrix);

      // 旗杆（士兵右侧）
      dummy.position.set(x + 0.30, 1.20, z);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜
      dummy.position.set(x + 0.30, 1.50, z);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }

  bodies.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;

  group.add(bodies, flags, poles);

  return group;
}
