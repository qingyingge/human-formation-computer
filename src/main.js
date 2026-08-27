import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene, camera, renderer } from './scene/index.js';
import { createSoldierArray } from './entities/SoldierFactory.js';

// 网格辅助线
const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
grid.material.opacity = 0.3;
grid.material.transparent = true;
scene.add(grid);

// 创建16x16阵列
const soldierArray = createSoldierArray();
scene.add(soldierArray);

// 灯光
const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// 补光（从另一侧照亮，避免侧面全黑）
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-8, 10, -10);
scene.add(fillLight);

// 控件
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 动画
function animate() {
  requestAnimationFrame(animate);
  soldierArray.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}

animate();
