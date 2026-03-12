# Deployment

## Cloudflare Pages

This project is a static frontend app. Deploy the generated `dist/` directory directly.

## Recommended settings

- Framework preset: `None`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20+

## Why local and deployed behavior match

- No backend API
- No auth or subscription flow
- No server-side image storage
- Downloads rely on browser object URLs

## Pre-release checklist

```bash
npm run format:check
npm run typecheck
npm run test
npm run build
```
