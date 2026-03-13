# 🍌 Gemini Image Cleaner

[![Live Demo](https://img.shields.io/badge/Live%20Demo-banana.aix4u.com-f3d46b?style=flat-square)](https://banana.aix4u.com)
[![License](https://img.shields.io/badge/License-MIT-1f6feb?style=flat-square)](./LICENSE)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)](https://react.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f38020?style=flat-square)](https://banana.aix4u.com)

一个可部署到 Cloudflare Pages 的 Gemini 图片去水印单页工具。支持批量上传、本地处理、本地预览和 ZIP 下载，整个流程都在浏览器内完成，不经过后端。

在线体验：<https://banana.aix4u.com>
English README: [README.en.md](./README.en.md)

## 功能特点

- 支持点击上传、拖拽上传、粘贴上传，并且三种方式都支持多图导入。
- 多阶段去水印管线：智能尺寸选择、水印检测、Gain 校准、轮廓修正，重计算放入 Web Worker。
- 结果区使用卡片栅格，支持单张下载、结果预览、原图/结果图切换、上一张/下一张浏览。
- 支持批量 ZIP 下载，输出文件统一命名为 `*-unwatermarked.png`。
- 前端界面采用浅色香蕉系视觉和 `shadcn/ui` 组件体系，交互聚焦上传、处理、预览和下载。
- 界面语言支持简体中文、英文、日文；按浏览器语言自动匹配，未命中时回退英文。
- 项目以 GitHub 开源协作为目标，文档、目录结构和代码都按长期可读性维护。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 + shadcn/ui（Radix UI primitives）
- JSZip
- Vitest + Testing Library

## 快速开始

```bash
npm install
npm run dev
```

默认开发地址通常为 `http://localhost:5173`。

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run test
npm run format
npm run format:check
```

## Cloudflare Pages 部署

1. 将仓库推送到 GitHub。
2. 在 Cloudflare Pages 中选择此仓库。
3. 构建命令填写 `npm run build`。
4. 输出目录填写 `dist`。
5. Node 版本建议使用 20+。

当前生产地址：<https://banana.aix4u.com>

因为项目是纯静态前端，不需要配置 Functions、KV、D1 或任何图片上传服务。

## 算法说明

去水印核心基于 Reverse Alpha Blending，并在此基础上增加了多阶段增强管线：

1. **智能尺寸选择** — 同时加载 48px 和 96px 两套 mask，通过 NCC 得分自动选择匹配度更高的尺寸。
2. **水印存在检测** — 计算空间相关性和梯度相关性，未检测到水印时直接返回原图。
3. **Alpha Gain 校准** — 粗搜 + 精搜两轮寻找最优 gain，含近黑保护机制。
4. **轮廓二次修正** — 对梯度残留较高的边缘区域做混合补偿。
5. **亚像素对齐**（可选）— 双线性插值平移和缩放，精确对齐 mask 与实际水印。

详细说明参见 [算法文档](./docs/algorithm.md)。早期参考实现保留在 [`references/engine.js`](./references/engine.js)。

## 文档

- [设计上下文](./docs/design-context.md)
- [架构说明](./docs/architecture.md)
- [算法说明](./docs/algorithm.md)
- [开发说明](./docs/development.md)
- [部署说明](./docs/deployment.md)
- [English README](./README.en.md)

## 开源约定

- 中文文档是主版本，英文文档是镜像版本。
- 功能、命令、目录结构、部署方式发生变化时，需要同步更新 `README.md`、`README.en.md` 与 `docs/`。
- 设计语气、视觉方向和交互原则的基线维护在 [docs/design-context.md](./docs/design-context.md)。
- 仓库级协作说明见 [AGENTS.md](./AGENTS.md)。

## 常见问题

### 图片会上传到服务器吗？

不会。图片解码、像素处理、预览和下载全部在浏览器里完成。

### 为什么使用顺序队列，而不是并行处理？

批量上传时，顺序处理能显著降低内存峰值和 UI 抖动，尤其是在普通笔记本和移动设备上更稳定。

### 为什么结果统一导出为 PNG？

PNG 可以避免重复编码损失，也更适合稳定输出去水印结果。

## 致谢

- [gemini-watermark-remover](https://github.com/GargantuaX/gemini-watermark-remover) — 本项目参考了该项目的去水印实现思路。

## License

本项目使用 [MIT](./LICENSE) 协议开源。
