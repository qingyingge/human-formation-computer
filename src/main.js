import * as THREE from 'three';
import { scene, camera, renderer } from './core/SceneManager.js';
import { createControls } from './core/Controls.js';
import { createFormationUnit } from './entities/FormationUnit.js';

// 创建第一个计算单元
const unit = createFormationUnit();
scene.add(unit);

// 添加环境光
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 创建控件
const controls = createControls(camera, renderer.domElement);

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 让单元绕Y轴极慢自转
  unit.rotation.y += 0.002;

  // 更新控件
  controls.update();

  // 渲染场景
  renderer.render(scene, camera);
}

animate();