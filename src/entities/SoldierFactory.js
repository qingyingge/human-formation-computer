import * as THREE from 'three';

const GRID_SIZE = 16;
const SPACING = 1.2;
const TOTAL = GRID_SIZE * GRID_SIZE;

export function createSoldierArray() {
  const group = new THREE.Group();

  // 几何体
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.25, 1.2, 8);
  const headGeometry = new THREE.SphereGeometry(0.2, 12, 12);
  const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);

  // 材质
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xb87333 });
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
  const flagMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

  // InstancedMesh
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, TOTAL);
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, TOTAL);
  const flags = new THREE.InstancedMesh(flagGeometry, flagMaterial, TOTAL);
  const poles = new THREE.InstancedMesh(poleGeometry, poleMaterial, TOTAL);

  const dummy = new THREE.Object3D();
  const offset = ((GRID_SIZE - 1) * SPACING) / 2;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = j * SPACING - offset;
      const z = i * SPACING - offset;

      // 身体
      dummy.position.set(x, 0.6, z);
      dummy.updateMatrix();
      bodies.setMatrixAt(idx, dummy.matrix);

      // 头部
      dummy.position.set(x, 1.4, z);
      dummy.updateMatrix();
      heads.setMatrixAt(idx, dummy.matrix);

      // 旗杆
      dummy.position.set(x + 0.2, 1.65, z);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜
      dummy.position.set(x + 0.2, 1.8, z);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }

  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;

  group.add(bodies, heads, flags, poles);

  return group;
}