# Repository Guide

## Purpose

- This repository ships a Cloudflare Pages single-page tool for removing Gemini image watermarks locally in the browser.
- Keep the product scope narrow: local upload, local processing, preview, and download. No backend, auth, quotas, or payments.

## Directory Ownership

- `references/`: read-only reference code from prior implementations. Do not edit unless the source reference itself changes.
- `src/components/`: UI building blocks. Keep components focused and composable.
- `src/lib/watermark/`: watermark algorithm, file helpers, and processor orchestration.
- `src/lib/queue/`: batch processing queue logic.
- `src/lib/i18n/`: locale detection and translation messages.
- `src/workers/`: Web Worker entrypoints only. Keep heavy pixel work off the main thread.
- `docs/`: Chinese source docs. English mirrors live in `docs/en/`.
- `public/`: static brand assets and mask images.
- `docs/design-context.md`: the source of truth for product tone, visual direction, and interaction principles. Read it before making design or UX changes.

## Working Rules

- Prefer readable modules over large all-in-one files.
- Keep public APIs typed and stable. Add comments only where the algorithm or async flow is non-obvious.
- When behavior, commands, architecture, or deployment steps change, update `README.md`, `README.en.md`, and the relevant files in `docs/` in the same change.
- When visual direction, interaction style, or product tone changes, update `docs/design-context.md` first, then reflect the change in implementation.
- Chinese docs are the source of truth. English docs should mirror the same structure and meaning.
- Preserve local-only processing. Never add network upload logic for images or outputs.

## Commands

- `npm run dev`: start local development server.
- `npm run build`: create the production bundle for Cloudflare Pages.
- `npm run preview`: preview the built bundle locally.
- `npm run typecheck`: run TypeScript checks.
- `npm run test`: run unit and component tests.
- `npm run format`: format the repository with Prettier.
- `npm run format:check`: verify formatting without writing changes.

## Code Conventions

- Use TypeScript for application code.
- Use the batch queue for sequential processing. Do not start parallel image processing workers unless product requirements change.
- Use browser object URLs carefully and revoke them on clear or unmount.
- Locale fallback rules must stay: `zh-* -> zh-CN`, `ja-* -> ja-JP`, everything else -> `en-US`.
- Keep the worker protocol explicit and version-free unless a second worker appears.
