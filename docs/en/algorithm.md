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

## Implementation notes

- Alpha values are extracted from PNG mask brightness.
- Only the lower-right watermark rectangle is processed.
- Very small alpha values are skipped.
- Very large alpha values are clamped to avoid unstable division.
- The heavy pixel loop runs inside a Web Worker.
