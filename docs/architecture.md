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
  负责图片读取、mask alpha map 生成、水印检测与校准、worker 调度和最终 PNG 导出。包含 `engine`（核心恢复）、`detection`（NCC 检测）、`calibration`（Gain 校准）、`alignment`（亚像素对齐）等子模块。
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
3. 主线程读取图片为 `ImageData`，并行加载 48px 和 96px 两套 alpha map。
4. 像素数据与两套 alpha map 一起发送到 Worker。
5. Worker 执行多阶段管线：智能尺寸选择 → 水印存在检测 → Reverse Alpha Blending → Gain 校准 → 轮廓修正。
6. Worker 返回处理后的像素和 `WatermarkMetadata`（检测结果、所用 gain、相关性得分等）。
7. 主线程接收结果，导出 PNG `Blob`，生成预览 URL 和下载链接。未检测到水印时返回原图。

## 为什么使用顺序队列

- 多张大图并行处理会显著放大内存峰值。
- 顺序处理更容易让处理状态保持清晰。
- 对中端设备更稳定，页面交互不会被大批量操作拖垮。

## 开源可维护性

- mask 图片与源码分离，避免把大段 base64 写进业务代码。
- 文档与代码目录一一对应，便于外部开发者快速定位。
- 中文文档作为主版本，英文文档做镜像，减少两套文档分叉。
