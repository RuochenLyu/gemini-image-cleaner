# Architecture

## Goal

Gemini Image Cleaner is designed as a local-first Gemini watermark remover that remains easy to read and contribute to as an open-source repository.

## Main modules

- `src/App.tsx`: page state, batch summary, locale switching, preview dialog, and downloads
- `src/components/`: upload, summary, result cards, and preview UI
- `src/components/ui/`: project-local `shadcn/ui` primitives built on Radix
- `src/lib/watermark/`: file decoding, mask alpha maps, watermark detection and calibration, worker orchestration, and PNG export. Contains sub-modules for `engine` (core restoration), `detection` (NCC-based detection), `calibration` (gain search), and `alignment` (sub-pixel alignment).
- `src/lib/queue/`: sequential batch processing queue
- `src/workers/`: pixel restoration worker
- `src/lib/download/`: single-file and batch ZIP download helpers
- `src/lib/i18n/`: locale detection and message lookup

## Processing flow

1. Files enter through click, drag and drop, or paste.
2. The queue creates a `BatchResult` for each file.
3. The main thread decodes the image and loads both the 48px and 96px alpha maps in parallel.
4. Pixel data and both alpha maps are sent to the worker.
5. The worker runs a multi-stage pipeline: smart size selection → watermark presence detection → Reverse Alpha Blending → gain calibration → contour correction.
6. The worker returns the processed pixels along with `WatermarkMetadata` (detection result, gain used, correlation scores, etc.).
7. The main thread receives the result and exports a PNG blob. Images without a detected watermark are returned as-is.

## Why sequential processing

- Lower memory peaks for large batches
- Clearer processing feedback
- More stable behavior on average laptops and mobile devices
