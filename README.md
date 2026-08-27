# Human-Formation Computer · 人列计算机

一个基于 Three.js 的可视化仿真项目，模拟古代"人列计算机"的概念。通过三维动画展示由多个计算单元组成的阵列，每个单元代表一个"士兵"，共同构成一个分布式计算系统。

## 项目特点

- 基于 Three.js 的实时 3D 渲染
- 极简 Low-Poly 风格的青铜小人设计
- 支持鼠标拖拽和缩放交互
- 使用 Vite 作为构建工具，支持快速开发

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview
```

## 项目结构

```
human-formation-computer/
├── src/
│   ├── main.js                # 应用入口
│   ├── core/                  # 核心引擎模块
│   │   ├── SceneManager.js    # 场景、相机、渲染器管理
│   │   └── Controls.js        # OrbitControls 封装
│   ├── entities/              # 实体定义
│   │   └── FormationUnit.js   # 计算单元生成函数
│   └── styles/                # 样式文件
├── public/                    # 静态资源
├── index.html                 # 根 HTML 模板
└── package.json               # 项目配置
```

## 技术栈

- Three.js - 3D 图形库
- Vite - 现代前端构建工具
- pnpm - 包管理器