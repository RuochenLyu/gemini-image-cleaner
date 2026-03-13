# Architecture

## Goal

Gemini Image Cleaner is designed as a local-first Gemini watermark remover that remains easy to read and contribute to as an open-source repository.

## Main modules

- `src/App.tsx`: page state, batch summary, locale switching, preview dialog, and downloads
- `src/components/`: upload, summary, result cards, and preview UI
- `src/components/ui/`: project-local `shadcn/ui` primitives built on Radix
- `src/lib/watermark/`: file decoding, mask alpha maps, worker orchestration, and PNG export
- `src/lib/queue/`: sequential batch processing queue
- `src/workers/`: pixel restoration worker
- `src/lib/download/`: single-file and batch ZIP download helpers
- `src/lib/i18n/`: locale detection and message lookup

## Processing flow

1. Files enter through click, drag and drop, or paste.
2. The queue creates a `BatchResult` for each file.
3. The main thread decodes the image and selects a 48px or 96px watermark mask.
4. Pixel data and the alpha map are sent to the worker.
5. The worker restores the watermark region with reverse alpha blending.
6. The main thread receives the result and exports a PNG blob.

## Why sequential processing

- Lower memory peaks for large batches
- Clearer processing feedback
- More stable behavior on average laptops and mobile devices
