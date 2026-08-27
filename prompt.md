
# 任务：初始化 “Human-Formation Computer” Three.js 可视化项目

我要构建一个名为 “Human-Formation Computer”（人列计算机）的 Three.js 可视化仿真项目。请严格按照以下工程规范初始化项目。

## 1. 项目命名与包管理
- **项目根目录名称**：`human-formation-computer`（全小写，连字符分隔）。
- 使用 `pnpm`（优先）或 `npm` 初始化 `package.json`。
- 设置 `"name": "human-formation-computer"`。
- 安装核心依赖：`three` (最新稳定版) 和 `vite` (开发依赖)。
- 在 `package.json` 中配置脚本：
  - `"dev": "vite"`
  - `"build": "vite build"`
  - `"preview": "vite preview"`

## 2. 严谨的目录结构（工程化标准）
请创建以下目录树，这是后续扩展的骨架：
```
human-formation-computer/
├── src/
│   ├── main.js                # 应用入口
│   ├── core/                  # 核心引擎模块
│   │   ├── SceneManager.js    # 负责场景、相机、渲染器的初始化与导出
│   │   └── Controls.js        # 封装 OrbitControls 的导入与配置
│   ├── entities/              # 实体定义（对应“人”）
│   │   └── FormationUnit.js   # 单个计算单元（士兵）的生成函数
│   └── styles/                # (可选) 全局样式重置
├── public/                    # 静态资源（图标、模型等，当前留空）
├── index.html                 # 根 HTML 模板
├── .gitignore                 # 忽略 node_modules, dist, .vscode, *.log
└── README.md                  # 项目描述，包含 Human-Formation Computer 概念简述
```

## 3. 基础代码实现（最小可行性“地基”）
- **index.html**：
  - 设置中文 `<title>Human-Formation Computer · 人列计算机</title>`。
  - 引入 `src/main.js` 并设置为 `type="module"`。
  - 添加一个半透明状态栏 `<div id="status">` 用于后续显示 FPS 或时钟周期。
- **src/core/SceneManager.js**：
  - 导出 `scene`（深灰底色 `#111116`）、`camera`（透视，75度FOV，适当距离）、`renderer`（开启 antialias，设置像素比限制为2以优化性能）。
- **src/entities/FormationUnit.js**：
  - 导出一个 `createFormationUnit` 函数。
  - **视觉构成**（极简 Low-Poly 风格）：
    - 身体：`CylinderGeometry`（青铜色 `#b87333`）。
    - 头部：`SphereGeometry`（肤色 `#e0ac69`）。
    - 旗帜：头顶上方悬浮一面 `PlaneGeometry`（初期使用亮白色，方便后续染色）。
  - 所有部件放入一个 `Group` 中返回，以便整体控制位置与旋转。
- **src/main.js**：
  - 导入 `scene`、`camera`、`renderer` 以及 `createFormationUnit`。
  - 在原点 `(0, 0, 0)` 生成第一个单元并添加到场景。
  - 添加环境光 (`AmbientLight`) 和平行光 (`DirectionalLight`) 以凸显立体感。
  - 调用封装好的 Controls，启用阻尼效果 (`enableDamping`)。
  - 实现 `animate` 循环：让该单元绕 Y 轴极慢自转（作为“系统已激活”的视觉证明），并调用 `controls.update()`。

## 4. 版本控制（Git）
- 执行 `git init`。
- 生成 `.gitignore`，必须包含：`node_modules/`，`dist/`，`.vscode/`，`*.log`，`.DS_Store`。
- 执行首次提交（Commit），信息为：`"chore: 初始化 Human-Formation Computer 工程架构"`。

## 5. 验收标准与交付
- 我在终端执行 `pnpm run dev` 后，浏览器应自动打开 `http://localhost:5173`。
- 页面必须显示一个带有旗帜的青铜小人在场景中央缓慢旋转。
- 鼠标可以自由拖拽视角、滚动缩放。

请直接执行上述所有步骤，无需额外询问，完成后请告知我项目已准备就绪。