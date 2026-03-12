# Development

## Requirements

- Node.js 20+
- npm 10+

## Start locally

```bash
npm install
npm run dev
```

## Validation

```bash
npm run format
npm run typecheck
npm run test
npm run build
```

## Notes

- The current UI baseline uses `shadcn/ui + Tailwind CSS v4`. Prefer shared primitives in `src/components/ui/` and semantic tokens for new interface work.
- Keep the project local-only. Do not add image upload endpoints.
- Keep Chinese docs as the source version and update the English mirror in the same change.
- Store heavy binary assets in `public/` instead of embedding them in TypeScript files.
