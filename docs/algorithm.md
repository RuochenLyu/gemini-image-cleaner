# 算法说明

## 背景

Gemini 生成图片的水印位于右下角，尺寸会随着图片分辨率变化，当前实现使用两套 mask：

- 48px 水印，对应较小图片
- 96px 水印，对应较大图片

## 核心公式

水印叠加可表示为：

```text
Composite = Original × (1 - α) + Watermark × α
```

在已知：

- `Composite`：当前带水印图片像素
- `Watermark`：白色水印
- `α`：由 mask 亮度提取的透明度

时，可以反推原图：

```text
Original = (Composite - Watermark × α) / (1 - α)
```

## 当前实现

- 从 mask PNG 中提取亮度，生成 `Float32Array alpha map`
- 对右下角指定区域逐像素恢复 RGB 值
- alpha 值太低的像素直接跳过，避免无意义计算
- alpha 值过高时做上限裁剪，避免分母过小导致异常放大

## 为什么放到 Worker

- 图像像素循环是 CPU 密集型任务
- 批量处理时，如果放在主线程，会导致滚动、点击和重绘明显卡顿
- Worker 能让界面状态和交互保持流畅

## 输出策略

- 统一导出 PNG
- 保持与原图完全一致的宽高
- 下载文件名规则固定为：原文件名 + `-unwatermarked.png`
