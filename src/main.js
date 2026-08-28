import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene, camera, renderer } from './scene/index.js';
import { createSoldierArray, TOTAL, GRID_SIZE, SPACING } from './entities/SoldierFactory.js';

// 网格辅助线
const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
grid.material.opacity = 0.3;
grid.material.transparent = true;
scene.add(grid);

// 创建1个士兵（调试用）
const soldierArray = createSoldierArray();
// 只显示第一个人
soldierArray.children.forEach(child => {
  child.count = 1;
});
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

// 打印顶点坐标
function logVertices() {
  const { arms, flags, poles, offset } = soldierArray.userData;
  const SHOULDER_X = 0.32;
  const SHOULDER_Y = 0.92;
  const SHOULDER_Z = 0.08;
  const ARM_LENGTH = 0.46;
  
  console.log('=== 士兵顶点信息 ===');
  console.log(`肩膀: (${SHOULDER_X}, ${SHOULDER_Y}, ${SHOULDER_Z})`);
  
  // 放下时的顶点
  const angleDown = -Math.PI / 2;
  const handXDown = SHOULDER_X + Math.cos(angleDown) * ARM_LENGTH;
  const handYDown = SHOULDER_Y + Math.sin(angleDown) * ARM_LENGTH;
  console.log(`放下-手部: (${handXDown.toFixed(2)}, ${handYDown.toFixed(2)}, ${SHOULDER_Z})`);
  console.log(`放下-旗杆顶: (${handXDown.toFixed(2)}, ${(handYDown + 0.5).toFixed(2)}, ${SHOULDER_Z})`);
  
  // 举起时的顶点
  const angleUp = Math.PI / 6;
  const handXUp = SHOULDER_X + Math.cos(angleUp) * ARM_LENGTH;
  const handYUp = SHOULDER_Y + Math.sin(angleUp) * ARM_LENGTH;
  console.log(`举起-手部: (${handXUp.toFixed(2)}, ${handYUp.toFixed(2)}, ${SHOULDER_Z})`);
  console.log(`举起-旗杆顶: (${handXUp.toFixed(2)}, ${(handYUp + 0.5).toFixed(2)}, ${SHOULDER_Z})`);
}
logVertices();
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
  
  // 手臂绕Z轴旋转（从侧面看在X-Y平面内）
  // 放下时手臂垂直向下
  const ANGLE_DOWN = -Math.PI / 2;
  // 举起时手臂向前上方
  const ANGLE_UP = Math.PI / 6;
  
  const angle = ANGLE_DOWN + (ANGLE_UP - ANGLE_DOWN) * phase;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = j * SPACING - offset;
      const z = i * SPACING - offset;

      // 手臂位置和旋转（绕Z轴旋转）
      const pivotX = x + SHOULDER_X;
      const pivotY = SHOULDER_Y;
      
      dummy.position.set(pivotX, pivotY, z + SHOULDER_Z);
      dummy.rotation.set(0, 0, angle);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      arms.setMatrixAt(idx, dummy.matrix);

      // 手部位置（手臂末端，绕Z轴旋转后的位置）
      const handX = pivotX + Math.cos(angle) * ARM_LENGTH;
      const handY = pivotY + Math.sin(angle) * ARM_LENGTH;
      const handZ = z + SHOULDER_Z;
      
      // 旗杆从手部延伸，跟随手臂角度
      const poleLength = 0.5;
      dummy.position.set(handX, handY, handZ);
      dummy.rotation.set(0, 0, angle);
      dummy.updateMatrix();
      poles.setMatrixAt(idx, dummy.matrix);

      // 旗帜在旗杆末端
      const flagEndX = handX + Math.cos(angle) * poleLength;
      const flagEndY = handY + Math.sin(angle) * poleLength;
      
      dummy.position.set(flagEndX, flagEndY, handZ);
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