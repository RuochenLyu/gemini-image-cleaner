# 架构说明

## 目标

这个项目的核心目标是提供一个“纯浏览器、本地处理、可批量使用”的 Gemini 图片去水印工具，并且保证仓库长期对开源贡献者友好。

## 模块划分

- `src/App.tsx`
  负责页面状态、批处理摘要、语言切换、预览弹窗和下载动作。
- `src/components/`
  负责上传区、摘要区、结果卡片和大图查看等 UI 组件。
- `src/components/ui/`
  负责 `shadcn/ui` 基础组件与 Radix primitives 的项目内源码副本。
- `src/lib/watermark/`
  负责图片读取、mask alpha map 生成、worker 调度和最终 PNG 导出。
- `src/lib/queue/`
  负责顺序批处理队列。多图上传后按顺序处理，避免主线程和内存同时承压。
- `src/workers/`
  负责像素级恢复逻辑。主线程只做文件与界面协调。
- `src/lib/download/`
  负责单文件下载和批量 ZIP 打包下载。
- `src/lib/i18n/`
  负责浏览器语言识别、locale fallback 和文案映射。

## 处理链路

1. 用户通过点击、拖拽或粘贴导入文件。
2. 批处理队列为每个文件创建 `BatchResult` 卡片并进入排队。
3. 主线程读取图片为 `ImageData`，根据尺寸选择 48 或 96 的 Gemini 水印 mask。
4. `ImageData` 像素数据与 alpha map 一起发送到 Worker。
5. Worker 执行 Reverse Alpha Blending，恢复去水印后的像素。
6. 主线程接收结果，导出 PNG `Blob`，生成预览 URL 和下载链接。

## 为什么使用顺序队列

- 多张大图并行处理会显著放大内存峰值。
- 顺序处理更容易让处理状态保持清晰。
- 对中端设备更稳定，页面交互不会被大批量操作拖垮。

## 开源可维护性

- mask 图片与源码分离，避免把大段 base64 写进业务代码。
- 文档与代码目录一一对应，便于外部开发者快速定位。
- 中文文档作为主版本，英文文档做镜像，减少两套文档分叉。
