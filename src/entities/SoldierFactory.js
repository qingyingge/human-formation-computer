import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const GRID_SIZE = 16;
const SPACING = 1.2;
const TOTAL = GRID_SIZE * GRID_SIZE;

function createSoldierGeometry() {
  const parts = [];

  // 躯干
  const torso = new THREE.BoxGeometry(0.4, 0.6, 0.25);
  torso.translate(0, 0.7, 0);
  parts.push(torso);

  // 左臂
  const leftArm = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  leftArm.translate(-0.32, 0.75, 0);
  parts.push(leftArm);

  // 右臂
  const rightArm = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  rightArm.translate(0.32, 0.75, 0);
  parts.push(rightArm);

  // 左腿
  const leftLeg = new THREE.BoxGeometry(0.14, 0.5, 0.14);
  leftLeg.translate(-0.12, 0.15, 0);
  parts.push(leftLeg);

  // 右腿
  const rightLeg = new THREE.BoxGeometry(0.14, 0.5, 0.14);
  rightLeg.translate(0.12, 0.15, 0);
  parts.push(rightLeg);

  return mergeGeometries(parts);
}

export function createSoldierArray() {
  const group = new THREE.Group();

  // 身体（合并后的单一几何体）
  const bodyGeometry = createSoldierGeometry();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xb87333 });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, TOTAL);

  // 头部（球体）
  const headGeometry = new THREE.SphereGeometry(0.18, 10, 10);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, TOTAL);

  // 头盔（扁盒）
  const helmetGeometry = new THREE.BoxGeometry(0.36, 0.12, 0.36);
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const helmets = new THREE.InstancedMesh(helmetGeometry, helmetMaterial, TOTAL);

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

      // 身体
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      bodies.setMatrixAt(idx, dummy.matrix);

      // 头部（躯干顶部1.0 + 半径0.18 = 1.18）
      dummy.position.set(x, 1.18, z);
      dummy.updateMatrix();
      heads.setMatrixAt(idx, dummy.matrix);

      // 头盔（头部顶部1.36 + 半高0.06 = 1.42）
      dummy.position.set(x, 1.42, z);
      dummy.updateMatrix();
      helmets.setMatrixAt(idx, dummy.matrix);

      // 旗杆
      dummy.position.set(x + 0.25, 1.55, z);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜
      dummy.position.set(x + 0.25, 1.75, z);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }

  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  helmets.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;

  group.add(bodies, heads, helmets, flags, poles);

  return group;
}