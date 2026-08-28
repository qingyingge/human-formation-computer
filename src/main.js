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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// 补光（从背面）
const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
fillLight.position.set(-8, 10, -10);
scene.add(fillLight);

// 后方补光
const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(0, 5, -15);
scene.add(backLight);

// 控件
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// HUD 显示
const hud = document.createElement('div');
hud.id = 'hud';
hud.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#0f0;font:12px monospace;padding:10px;border-radius:4px;z-index:1000;pointer-events:none;';
document.body.appendChild(hud);

// FPS 计算
let frameCount = 0;
let lastFpsTime = performance.now();
let fps = 0;

// 暴露到全局，供截图脚本使用
window.__THREE_SCENE__ = { scene, camera, renderer, controls, soldierArray };
// 允许外部控制动画时间
window.__ANIM_TIME__ = null;

// 更新动画的函数（供截图脚本调用）
window.__UPDATE_ANIMATION__ = (time) => {
  // phase: 0=放下, 1=举起
  const phase = (Math.sin(time * Math.PI * 0.5) + 1) * 0.5;
  const dummy = new THREE.Object3D();
  const { arms, flags, poles, offset } = soldierArray.userData;
  
  // 肩膀位置（世界坐标）
  const SHOULDER_X = 0.32;
  const SHOULDER_Y = 0.92;
  const SHOULDER_Z = 0.08;
  
  // 手臂长度（上臂+前臂）
  const ARM_LENGTH = 0.46;
  
  // 放下时手臂角度（垂直向下）
  const ANGLE_DOWN = -Math.PI / 2;
  // 举起时手臂角度（向前上方）
  const ANGLE_UP = Math.PI / 6;
  
  const angle = ANGLE_DOWN + (ANGLE_UP - ANGLE_DOWN) * phase;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = j * SPACING - offset;
      const z = i * SPACING - offset;

      // 手臂位置和旋转（围绕肩膀点旋转）
      const pivotX = x + SHOULDER_X;
      const pivotY = SHOULDER_Y;
      
      dummy.position.set(pivotX, pivotY, z + SHOULDER_Z);
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      arms.setMatrixAt(idx, dummy.matrix);

      // 手部位置（手臂末端）
      const handX = pivotX + Math.cos(angle) * ARM_LENGTH;
      const handY = pivotY + Math.sin(angle) * ARM_LENGTH;
      
      // 旗杆从手部延伸，跟随手臂角度
      dummy.position.set(handX, handY, z + SHOULDER_Z);
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜在旗杆顶部
      dummy.position.set(handX, handY + 0.25, z + SHOULDER_Z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      flags.setMatrixAt(idx, dummy.matrix);
    }
  }
  arms.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;
  flags.instanceMatrix.needsUpdate = true;
};

// 动画相关（已在 __UPDATE_ANIMATION__ 中处理）

function animate() {
  requestAnimationFrame(animate);

  // FPS 计算
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }

  // 使用旋转动画
  const t = window.__ANIM_TIME__ !== null ? window.__ANIM_TIME__ : Date.now() * 0.001;
  window.__UPDATE_ANIMATION__(t);

  controls.update();
  renderer.render(scene, camera);

  // 更新 HUD
  const camPos = camera.position;
  const target = controls.target;
  const dx = camPos.x - target.x;
  const dz = camPos.z - target.z;
  const angle = Math.atan2(dx, dz) * (180 / Math.PI);
  const dist = Math.sqrt(dx * dx + dz * dz);
  
  hud.innerHTML = [
    `FPS: ${fps}`,
    `Camera: ${camPos.x.toFixed(1)}, ${camPos.y.toFixed(1)}, ${camPos.z.toFixed(1)}`,
    `Target: ${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}`,
    `Angle: ${angle.toFixed(1)}°`,
    `Distance: ${dist.toFixed(1)}`
  ].join('<br>');
}

animate();