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

- Keep the project local-only. Do not add image upload endpoints.
- Keep Chinese docs as the source version and update the English mirror in the same change.
- Store heavy binary assets in `public/` instead of embedding them in TypeScript files.
