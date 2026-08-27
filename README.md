# Human-Formation Computer · 人列计算机

Three.js 版本: r152 | 构建工具: Vite 4.x | 状态: 基建中

## 项目背景

本项目基于刘慈欣《三体》中“人列计算机”的设定，利用 Three.js 在浏览器中构建该计算机的数字孪生原型。

核心目标并非实现真实的数值计算，而是通过三维可视化，严谨复刻人列计算机的体系结构，包括中央处理器（CPU）、内存阵列、总线传输及时钟同步机制等。项目定位为计算机组成原理的可视化辅助教材。

## 快速开始

```bash
pnpm install
pnpm run dev
```

浏览器访问 `http://localhost:5173` 即可查看当前进展。

## 目录结构

```
human-formation-computer/
├── public/
├── src/
│   ├── main.js
│   ├── core/
│   │   ├── SceneManager.js
│   │   └── Controls.js
│   ├── entities/
│   │   └── FormationUnit.js
│   ├── systems/
│   └── styles/
├── index.html
├── AGENTS.md
└── README.md
```

## 灵感来源

- 刘慈欣《三体》