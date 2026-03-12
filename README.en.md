# Banana Cleaner

Banana Cleaner is a Cloudflare Pages-ready single-page tool for removing Gemini image watermarks locally in the browser. It supports batch upload, local processing, preview, and ZIP download without any backend.

## Highlights

- Multi-image upload through click, drag and drop, or paste.
- Local-only watermark removal powered by a Web Worker.
- Result cards with preview, processed/original toggle, and single-file download.
- Batch ZIP download with consistent `*-unwatermarked.png` filenames.
- Chinese, English, and Japanese UI with browser-language detection and English fallback.
- Repository structure and docs are designed for open-source readability.

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

## Documentation

- [Design Context](./docs/en/design-context.md)
- [Architecture](./docs/en/architecture.md)
- [Algorithm](./docs/en/algorithm.md)
- [Development](./docs/en/development.md)
- [Deployment](./docs/en/deployment.md)
- Chinese source docs live in [`docs/`](./docs/)

## License

Released under the [MIT](./LICENSE) license.
