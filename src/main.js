import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene, camera, renderer } from './scene/index.js';
import { createSoldierArray, SPACING } from './entities/SoldierFactory.js';
import { HumanComputerEngine } from './engine/index.js';
import { createALU8 } from './circuit/alu8.js';
import { buildALU8Layout } from './circuit/layout.js';

// === 电路 & 引擎 ===
const circuit = createALU8();
const engine = new HumanComputerEngine(circuit, {
  propagationDelayMs: 100,
  clockIntervalMs: 2000,
});

// === 布局 & 士兵 ===
const layout = buildALU8Layout();
const soldierArray = createSoldierArray(layout);
scene.add(soldierArray);

const {
  arms, leftArms, whiteFlags, blackFlags,
  poles, leftPoles, offsetX, offsetZ,
  nodeIds, TOTAL, GRID_COLS, GRID_ROWS,
} = soldierArray.userData;

// === 动画状态 ===
const animState = new Array(TOTAL);
for (let i = 0; i < TOTAL; i++) {
  animState[i] = {
    currentAngle: 0,
    startAngle: 0,
    targetAngle: 0,
    prevValue: 0,
    changeStartTime: 0,
  };
}

// === 灑光 ===
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
fillLight.position.set(-8, 10, -10);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(0, 5, -15);
scene.add(backLight);

// === 控件 ===
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

// === 自由摄像机 ===
let freeMode = false;
let yaw = 0;
let pitch = -0.4;
const moveSpeed = 10;
const keys = {};

function syncFreeCameraFromOrbit() {
  const dir = new THREE.Vector3().subVectors(camera.position, orbitControls.target).normalize();
  yaw = Math.atan2(dir.x, dir.z);
  pitch = Math.asin(dir.y);
}

function enterFreeMode() {
  syncFreeCameraFromOrbit();
  orbitControls.enabled = false;
  freeMode = true;
  renderer.domElement.requestPointerLock();
}

function exitFreeMode() {
  freeMode = false;
  orbitControls.enabled = true;
  document.exitPointerLock();
}

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyF' && !e.repeat) {
    if (freeMode) exitFreeMode();
    else enterFreeMode();
  }
  if ((e.code === 'BracketRight' || e.code === 'Equal') && !e.repeat) {
    speedIdx = Math.min(speedIdx + 1, SPEED_LEVELS.length - 1);
    animSpeed = SPEED_LEVELS[speedIdx];
  }
  if ((e.code === 'BracketLeft' || e.code === 'Minus') && !e.repeat) {
    speedIdx = Math.max(speedIdx - 1, 0);
    animSpeed = SPEED_LEVELS[speedIdx];
  }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && freeMode) {
    freeMode = false;
    orbitControls.enabled = true;
  }
});

document.addEventListener('mousemove', (e) => {
  if (!freeMode || !document.pointerLockElement) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
});

function updateFreeCamera(dt) {
  if (!freeMode) return;
  const speed = keys['ShiftLeft'] ? moveSpeed * 3 : moveSpeed;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new THREE.Vector3(0, 1, 0);

  if (keys['KeyW']) camera.position.addScaledVector(forward, speed * dt);
  if (keys['KeyS']) camera.position.addScaledVector(forward, -speed * dt);
  if (keys['KeyA']) camera.position.addScaledVector(right, -speed * dt);
  if (keys['KeyD']) camera.position.addScaledVector(right, speed * dt);
  if (keys['Space']) camera.position.addScaledVector(up, speed * dt);
  if (keys['ControlLeft'] || keys['ControlRight']) camera.position.addScaledVector(up, -speed * dt);

  const lookDir = new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
  camera.lookAt(camera.position.clone().add(lookDir));
}

// === 网格辅助线 ===
const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
gridHelper.material.opacity = 0.3;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// === HUD ===
const hud = document.createElement('div');
hud.id = 'hud';
hud.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:#0f0;font:12px monospace;padding:10px;border-radius:4px;z-index:1000;pointer-events:none;white-space:pre;';
document.body.appendChild(hud);

// === FPS ===
let frameCount = 0;
let lastFpsTime = performance.now();
let fps = 0;

// === 全局暴露 ===
window.__THREE_SCENE__ = { scene, camera, renderer, controls: orbitControls, soldierArray, engine };

// 允许外部控制动画时间（shot.cjs 等工具使用）
window.__ANIM_TIME__ = null;

// === 默认输入：3 + 5 = 8 (ADD) ===
function setDefaultInputs() {
  // a = 3 (00000011)
  for (let i = 0; i < 8; i++) {
    engine.setInput(`a[${i}]`, ((3 >> i) & 1));
  }
  // b = 5 (00000101)
  for (let i = 0; i < 8; i++) {
    engine.setInput(`b[${i}]`, ((5 >> i) & 1));
  }
  // op = 0 (ADD)
  engine.setInput('op[0]', 0);
  engine.setInput('op[1]', 0);
  engine.setInput('op[2]', 0);
}

setDefaultInputs();

// === 首次计算 ===
engine.compute(0);
engine.tick(0);

// === 读取输入显示 ===
function getInputsDisplay() {
  let a = 0, b = 0;
  for (let i = 0; i < 8; i++) {
    a |= (engine.query(`a[${i}]`) << i);
    b |= (engine.query(`b[${i}]`) << i);
  }
  const op0 = engine.query('op[0]');
  const op1 = engine.query('op[1]');
  const op2 = engine.query('op[2]');
  const op = op0 | (op1 << 1) | (op2 << 2);
  const opNames = ['ADD', 'SUB', 'AND', 'OR', 'XOR', 'NOT'];
  return `a=${a.toString(2).padStart(8, '0')} (${a})  b=${b.toString(2).padStart(8, '0')} (${b})  op=${opNames[op] || op}`;
}

function getOutputDisplay() {
  let out = 0;
  for (let i = 0; i < 8; i++) {
    out |= (engine.query(`out[${i}]`) << i);
  }
  const carry = engine.query('carry_out');
  return `out=${out.toString(2).padStart(8, '0')} (${out})  carry=${carry}`;
}

// === 动画常量 ===
const SHOULDER_RIGHT_X = 0.32;
const SHOULDER_LEFT_X = -0.32;
const SHOULDER_Y = 0.92;
const SHOULDER_Z = 0.08;
const ARM_LENGTH = 0.33;
const POLE_LENGTH = 0.5;
const ANGLE_DOWN = 0;
const ANGLE_UP = -Math.PI;
const TRANSITION_MS = 100; // propagationDelayMs

// === 动画速度 ===
let animSpeed = 1;
const SPEED_LEVELS = [0.25, 0.5, 1, 2, 4, 8];
let speedIdx = 2; // 默认 1x

// === 动画更新 ===
window.__UPDATE_ANIMATION__ = (nowMs) => {
  // 推进引擎时钟
  engine.tick(nowMs);

  const dummy = new THREE.Object3D();
  const matSoldier = new THREE.Matrix4();
  const matLocal = new THREE.Matrix4();
  const matResult = new THREE.Matrix4();
  const matRy = new THREE.Matrix4();
  const matRx = new THREE.Matrix4();
  const matT = new THREE.Matrix4();

  for (let idx = 0; idx < TOTAL; idx++) {
    const nodeId = nodeIds[idx];
    if (!nodeId) continue;

    const output = engine.query(nodeId);
    const state = animState[idx];
    const targetAngle = output === 1 ? ANGLE_UP : ANGLE_DOWN;

    // 检测值变化
    if (output !== state.prevValue) {
      state.startAngle = state.currentAngle;
      state.changeStartTime = nowMs;
      state.prevValue = output;
      state.targetAngle = targetAngle;
    }

    // 线性插值过渡
    const elapsed = nowMs - state.changeStartTime;
    const t = Math.min(elapsed / TRANSITION_MS, 1);
    const angle = state.startAngle + (targetAngle - state.startAngle) * t;
    state.currentAngle = angle;

    // 士兵在网格中的位置
    const item = layout[idx];
    const x = item.gridX * SPACING - offsetX;
    const z = item.gridZ * SPACING - offsetZ;
    const facing = soldierArray.userData.facingAngles[idx] || 0;

    matSoldier.makeTranslation(x, 0, z);
    matRy.makeRotationY(facing);
    matSoldier.multiply(matRy);

    // 右臂
    const cosR = Math.cos(angle);
    const sinR = Math.sin(angle);
    matT.makeTranslation(SHOULDER_RIGHT_X, SHOULDER_Y, SHOULDER_Z);
    matRx.makeRotationX(angle);
    matLocal.multiplyMatrices(matT, matRx);
    matResult.multiplyMatrices(matSoldier, matLocal);
    arms.setMatrixAt(idx, matResult);

    // 右旗杆
    const rightHandX = SHOULDER_RIGHT_X;
    const rightHandY = SHOULDER_Y - ARM_LENGTH * cosR;
    const rightHandZ = SHOULDER_Z - ARM_LENGTH * sinR;
    matT.makeTranslation(rightHandX, rightHandY, rightHandZ);
    matRx.makeRotationX(angle);
    matLocal.multiplyMatrices(matT, matRx);
    matResult.multiplyMatrices(matSoldier, matLocal);
    poles.setMatrixAt(idx, matResult);

    // 白旗
    const rightFlagX = rightHandX;
    const rightFlagY = rightHandY - POLE_LENGTH * cosR;
    const rightFlagZ = rightHandZ - POLE_LENGTH * sinR;
    matT.makeTranslation(rightFlagX, rightFlagY, rightFlagZ);
    dummy.matrix.identity();
    dummy.matrix.copy(matSoldier);
    dummy.matrix.multiply(matT);
    whiteFlags.setMatrixAt(idx, dummy.matrix);

    // 左臂（与右臂反相）
    const leftAngle = -angle;
    const cosL = Math.cos(leftAngle);
    const sinL = Math.sin(leftAngle);
    matT.makeTranslation(SHOULDER_LEFT_X, SHOULDER_Y, SHOULDER_Z);
    matRx.makeRotationX(leftAngle);
    matLocal.multiplyMatrices(matT, matRx);
    matResult.multiplyMatrices(matSoldier, matLocal);
    leftArms.setMatrixAt(idx, matResult);

    // 左旗杆
    const leftHandX = SHOULDER_LEFT_X;
    const leftHandY = SHOULDER_Y - ARM_LENGTH * cosL;
    const leftHandZ = SHOULDER_Z - ARM_LENGTH * sinL;
    matT.makeTranslation(leftHandX, leftHandY, leftHandZ);
    matRx.makeRotationX(leftAngle);
    matLocal.multiplyMatrices(matT, matRx);
    matResult.multiplyMatrices(matSoldier, matLocal);
    leftPoles.setMatrixAt(idx, matResult);

    // 黑旗
    const leftFlagX = leftHandX;
    const leftFlagY = leftHandY - POLE_LENGTH * cosL;
    const leftFlagZ = leftHandZ - POLE_LENGTH * sinL;
    matT.makeTranslation(leftFlagX, leftFlagY, leftFlagZ);
    dummy.matrix.identity();
    dummy.matrix.copy(matSoldier);
    dummy.matrix.multiply(matT);
    blackFlags.setMatrixAt(idx, dummy.matrix);
  }

  arms.instanceMatrix.needsUpdate = true;
  leftArms.instanceMatrix.needsUpdate = true;
  poles.instanceMatrix.needsUpdate = true;
  leftPoles.instanceMatrix.needsUpdate = true;
  whiteFlags.instanceMatrix.needsUpdate = true;
  blackFlags.instanceMatrix.needsUpdate = true;
};

// === 时钟控制 ===
let lastComputeTime = Date.now();
const CLOCK_INTERVAL_MS = engine.getConfig().clockIntervalMs;

window.__ALU_COMPUTE__ = () => {
  const now = Date.now();
  engine.compute(now);
  lastComputeTime = now;
};

window.__ALU_SET_INPUT__ = (nodeId, value) => {
  engine.setInput(nodeId, value);
};

window.__ALU_RESET__ = () => {
  engine.reset();
  setDefaultInputs();
  for (let i = 0; i < TOTAL; i++) {
    animState[i].currentAngle = 0;
    animState[i].startAngle = 0;
    animState[i].targetAngle = 0;
    animState[i].prevValue = 0;
    animState[i].changeStartTime = 0;
  }
  engine.compute(0);
  engine.tick(0);
};

// === 主循环 ===
let lastFrameTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const nowMs = performance.now();
  const dt = (nowMs - lastFrameTime) / 1000;
  lastFrameTime = nowMs;

  // FPS
  frameCount++;
  if (nowMs - lastFpsTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsTime = nowMs;
  }

  // 自动触发 compute（每个时钟周期一次，速度可调）
  const realMs = window.__ANIM_TIME__ !== null ? window.__ANIM_TIME__ : Date.now();
  const wallMs = realMs * animSpeed;
  if (wallMs - lastComputeTime >= CLOCK_INTERVAL_MS) {
    engine.compute(wallMs);
    lastComputeTime = wallMs;
  }

  // 动画
  window.__UPDATE_ANIMATION__(wallMs);

  updateFreeCamera(dt);
  if (!freeMode) orbitControls.update();
  renderer.render(scene, camera);

  // HUD
  const layers = engine.getLayers();
  const pending = engine.getPendingChanges().length;
  const totalLayers = layers.length;
  // 找到当前最深的已激活层
  let activeLayer = 0;
  for (let i = 0; i < totalLayers; i++) {
    const layerNodes = layers[i];
    for (const nid of layerNodes) {
      if (engine.query(nid) === 1) {
        activeLayer = i + 1;
        break;
      }
    }
  }

  const camPos = camera.position;
  const target = orbitControls.target;
  const dx = camPos.x - target.x;
  const dz = camPos.z - target.z;
  const angle = Math.atan2(dx, dz) * (180 / Math.PI);
  const dist = Math.sqrt(dx * dx + dz * dz);

  hud.innerHTML = [
    `FPS: ${fps}  Nodes: ${TOTAL}  Layers: ${totalLayers}  Speed: ${animSpeed}x`,
    `ALU8 | Pending: ${pending}`,
    ``,
    getInputsDisplay(),
    getOutputDisplay(),
    ``,
    `Camera: ${camPos.x.toFixed(1)}, ${camPos.y.toFixed(1)}, ${camPos.z.toFixed(1)}`,
    freeMode
      ? `[FREE] WASD 移动  鼠标转向  Shift 加速  Space/Ctrl 升降`
      : `Angle: ${angle.toFixed(1)}  Dist: ${dist.toFixed(1)}`,
    ``,
    `[F] ${freeMode ? '退出自由' : '自由摄像机'}  [/] 速度  [R] Reset  [Space] Compute`,
  ].join('\n');
}

animate();
