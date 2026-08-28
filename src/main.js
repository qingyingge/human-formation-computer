import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene, camera, renderer } from './scene/index.js';
import { createSoldierArray, TOTAL, GRID_SIZE, SPACING } from './entities/SoldierFactory.js';

// 网格辅助线
const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
grid.material.opacity = 0.3;
grid.material.transparent = true;
scene.add(grid);

// 创建16x16阵列
const soldierArray = createSoldierArray();
scene.add(soldierArray);

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// 补光
const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
fillLight.position.set(-8, 10, -10);
scene.add(fillLight);

// 控件
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 暴露到全局，供截图脚本使用
window.__THREE_SCENE__ = { scene, camera, renderer, controls };

// 动画相关
const dummy = new THREE.Object3D();
const { arms, flags, poles, offset } = soldierArray.userData;

// 手臂放下时的位置
const ARM_DOWN_Y = 0.60;
// 手臂举起时的位置
const ARM_UP_Y = 1.00;
// 旗帜放下时的位置
const FLAG_DOWN_Y = 0.85;
// 旗帜举起时的位置
const FLAG_UP_Y = 1.60;
// 旗杆放下时的位置
const POLE_DOWN_Y = 0.60;
// 旗杆举起时的位置
const POLE_UP_Y = 1.35;

function animate() {
  requestAnimationFrame(animate);

  // 举旗/放旗动画（周期4秒）
  const t = Date.now() * 0.001;
  const phase = (Math.sin(t * Math.PI * 0.5) + 1) * 0.5; // 0~1

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = j * SPACING - offset;
      const z = i * SPACING - offset;

      // 手臂
      const armY = THREE.MathUtils.lerp(ARM_DOWN_Y, ARM_UP_Y, phase);
      dummy.position.set(x + 0.32, armY, z + 0.08);
      dummy.updateMatrix();
      arms.setMatrixAt(idx, dummy.matrix);

      // 旗杆
      const poleY = THREE.MathUtils.lerp(POLE_DOWN_Y, POLE_UP_Y, phase);
      dummy.position.set(x + 0.32, poleY, z + 0.08);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜
      const flagY = THREE.MathUtils.lerp(FLAG_DOWN_Y, FLAG_UP_Y, phase);
      dummy.position.set(x + 0.32, flagY, z + 0.08);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }

  arms.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

animate();