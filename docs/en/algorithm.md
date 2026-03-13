# Algorithm

## Background

Gemini watermark placement is anchored in the lower-right corner and changes size with the image resolution. This project uses two mask variants:

- 48px for smaller images
- 96px for larger images

## Core formula

Watermark compositing can be described as:

```text
Composite = Original × (1 - α) + Watermark × α
```

When `Composite`, the white `Watermark`, and `α` from the mask are known, the original pixel can be restored with:

```text
Original = (Composite - Watermark × α) / (1 - α)
```

## Processing pipeline

Watermark removal runs inside a Web Worker and consists of the following stages:

### 1. Smart size selection

Both 48px and 96px alpha maps are loaded in parallel. Spatial and gradient correlation scores are computed for each, and the better-matching size is selected automatically.

### 2. Watermark presence detection

Two metrics are computed via Normalized Cross-Correlation (NCC):

- **Spatial score**: NCC between region brightness and the alpha map
- **Gradient score**: NCC between the image Sobel gradients and alpha map gradients

If either exceeds the threshold (spatial ≥ 0.3 or gradient ≥ 0.12), a watermark is considered present. Otherwise the original image is returned unchanged.

### 3. Reverse Alpha Blending

Per-pixel restoration of the watermark region:

- **Noise floor**: pixels with alpha below the noise floor are skipped. Default 3/255.
- **Gain**: effective alpha = min(rawAlpha × gain, alphaCap).
- **Alpha cap**: prevents extreme division. Default 0.99.

### 4. Gain calibration

After an initial pass at gain=1, a two-round search finds the optimal gain:

- **Coarse**: gain from 1.05 to 2.6, step 0.1
- **Fine**: ±0.05 around the best coarse result, step 0.01

The evaluation metric is the gradient residual in the watermark region — lower means cleaner edges.

**Near-black protection**: if a candidate gain increases the proportion of near-black pixels (brightness < 10) by more than 5%, it is rejected.

### 5. Contour secondary correction

After optimal-gain removal, Sobel gradients are recomputed. Pixels with a gradient residual ≥ 0.42 receive a second pass at a slightly higher gain, blended with the first result proportionally to gradient strength.

### 6. Sub-pixel alignment (optional, off by default)

For cases where the mask and actual watermark have sub-pixel misalignment:

- **Bilinear shift**: search dx/dy ∈ [-0.5, +0.5]
- **Bilinear scale**: 0.99 / 1.0 / 1.01
- **Refinement**: a finer grid around the initial result
- **Adaptive template search**: coarse-to-fine NCC scan for non-standard watermark positions

## Module files

| File | Responsibility |
| --- | --- |
| `engine.ts` | Alpha map extraction, Reverse Alpha Blending core |
| `detection.ts` | NCC, Sobel gradients, watermark presence detection, size selection |
| `calibration.ts` | Gain search, near-black protection, gain application |
| `alignment.ts` | Bilinear shift/scale, alignment search, template matching |
| `constants.ts` | Mask paths, sizing rules, watermark rect calculation |
| `process.ts` | Main-thread orchestration: load alpha maps, dispatch worker, assemble result |
| `watermarkWorker.ts` | Worker-side pipeline entry point |

## Why a Web Worker

- Pixel loops are CPU-intensive.
- During batch processing, running on the main thread causes visible jank.
- A worker keeps the UI responsive.

## Output

- All results are exported as PNG.
- Dimensions match the original image exactly.
- Filenames follow the pattern: `<original>-unwatermarked.png`.
- Images without a detected watermark are returned as-is without error.
