# TODO — Human Formation Computer

## P0 — 必须立刻修的 Bug

- [ ] `main.js` R/Space 快捷键未实现：HUD 显示 `[R] Reset  [Space] Compute`，但 keydown 中无处理逻辑
- [ ] `main.js` 动画速度被平方衰减：`elapsed / (BASE_DELAY_MS / animSpeed)` 应改为 `elapsed / BASE_DELAY_MS`
- [ ] `main.js` `lastComputeTime` 初始值空间不一致：初始化为 `Date.now()` 但后续赋值为 `wallMs`，应改为 `Date.now() * animSpeed`

## P1 — 小修小补

- [ ] `alu8.ts` `is_arith` 单输入 AND 改 BUF：语义更清晰
- [ ] `main.js` `activeLayer` 死代码清理

## P2 — 当前可用的 Feature（182人规模）

- [ ] 点击士兵查看节点信息：用 Three.js Raycaster，显示节点 ID、门类型、当前值、输入来源、拓扑层级
- [ ] 实时修改输入（HUD面板）：键盘/鼠标切换 op 和 a/b 的值，即时看到结果变化
- [ ] 层级分区着色：按 INPUT / DECODE / ADDER / LOGIC / MUX / OUTPUT 给士兵 body 着不同颜色
- [ ] 单步模式（逐层推进）：每按一次键，引擎推进一个拓扑层，逐级观察信号传播

## P3 — 锦上添花

- [ ] 信号传播路径高亮：选中输出节点，高亮从输入到该输出的完整路径，其余变暗
- [ ] GIF/视频导出：封装录制按钮，导出完整计算过程 GIF（已有 gif-encoder + puppeteer 依赖）

## P4 — 大规模架构（3000万方向）

- [ ] 16色编码旗（32格旗架）+ 放大兵：每手16色=4bit，两旗=8bit；1→8拆分兵和8→1合并兵做信号转换
- [ ] LOD分级系统：L0全细节(50m内) → L1简化手臂(200m) → L2仅body+单旗(500m) → L3彩色方块(2km) → L4区域色块(>2km)
- [ ] GPU compute shader 状态更新：50层拓扑 × 每层60万门并行评估，50μs/周期
- [ ] Delta状态传输：CPU→GPU只传变化量（~300KB/帧 vs 全量30MB）
