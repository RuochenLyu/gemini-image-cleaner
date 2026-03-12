# Gemini Image Cleaner

[![Live Demo](https://img.shields.io/badge/Live%20Demo-banana.aix4u.com-f3d46b?style=flat-square)](https://banana.aix4u.com)
[![License](https://img.shields.io/badge/License-MIT-1f6feb?style=flat-square)](./LICENSE)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)](https://react.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f38020?style=flat-square)](https://banana.aix4u.com)

Gemini Image Cleaner is a Cloudflare Pages-ready single-page tool for removing Gemini image watermarks locally in the browser. It supports batch upload, local processing, preview, and ZIP download without any backend.

Live demo: <https://banana.aix4u.com>

## Highlights

- Multi-image upload through click, drag and drop, or paste.
- Local-only watermark removal powered by a Web Worker.
- Result cards with preview, processed/original toggle, and single-file download.
- Batch ZIP download with consistent `*-unwatermarked.png` filenames.
- A light banana-toned UI built on `shadcn/ui`, focused on upload, processing, preview, and download.
- Chinese, English, and Japanese UI with browser-language detection and English fallback.
- Repository structure and docs are designed for open-source readability.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- JSZip
- Vitest + Testing Library

## Quick Start

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run test
npm run format
npm run format:check
```

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Recommended Node version: 20+
- Production URL: <https://banana.aix4u.com>

## Documentation

- [Design Context](./docs/en/design-context.md)
- [Architecture](./docs/en/architecture.md)
- [Algorithm](./docs/en/algorithm.md)
- [Development](./docs/en/development.md)
- [Deployment](./docs/en/deployment.md)
- Chinese source docs live in [`docs/`](./docs/)

## License

Released under the [MIT](./LICENSE) license.
