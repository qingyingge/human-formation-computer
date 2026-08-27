import * as THREE from 'three';

export function createFormationUnit() {
  const group = new THREE.Group();

  // 身体
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.25, 1.2, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xb87333 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);

  // 头部
  const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.4;
  group.add(head);

  // 旗帜
  const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    side: THREE.DoubleSide 
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.y = 1.8;
  flag.position.x = 0.2;
  group.add(flag);

  // 旗杆
  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 1.65;
  pole.position.x = 0.2;
  group.add(pole);

  return group;
}