# one_breath – Quick Reference

Static journaling app built with Bun + Preact. There is no backend runtime; everything runs inside the browser and persists to `localStorage` (with an in-memory fallback for non-persistent environments such as tests).

## Tech Stack

- **Runtime & tooling**: Bun (install, bundle, test)
- **UI**: Preact + wouter-preact
- **Styling**: Tailwind CSS v4 via PostCSS
- **State/persistence**: Custom storage module backed by `localStorage`
- **Quality**: TypeScript + Biome + Bun test

## Project Layout

```
/
├── docs/           # GitHub Pages output (generated)
├── scripts/        # Bun scripts for build & preview
├── src/
│   ├── app/        # Layout and shell components
│   ├── components/ # Reusable UI widgets
│   ├── context/    # Application providers
│   ├── hooks/      # Custom hooks (entries, i18n, etc.)
│   ├── lib/
│   │   └── storage # Client-side persistence
│   ├── pages/      # Route-level components
│   ├── router/     # wouter configuration
│   ├── styles/     # Tailwind entry point
│   └── types/      # Shared interfaces
├── tests/          # Bun test suites
├── index.html      # Template copied to docs/
└── package.json
```

## Commands

- `bun install` – install dependencies
- `bun run build` – compile static site into `docs/`
- `bun run dev` – build then serve `docs/` with the preview server
- `bun run preview` – serve existing `docs/` output
- `bun run check` – TypeScript + Biome
- `bun test` – run Bun tests

## Build & Deploy

`bun run build` writes the static bundle to `docs/` (HTML + CSS + JS). The `docs/` folder is git-ignored and built by CI. The CI workflow (`.github/workflows/ci.yml`) builds the site, uploads the artifact, and deploys to GitHub Pages on pushes to `main`.

## Storage Notes

- Persistence lives in `src/lib/storage/index.ts`.
- Falls back to an in-memory store when `window.localStorage` is unavailable.
- Admin helpers (`storage.admin.*`) exist for tests/tooling.

## Testing Tips

- `tests/lib/storage.test.ts` covers storage behaviour.
- Use Biome via `bun run check` before committing.

## Things No Longer Present

- No Bun server or SQLite database—legacy files were removed.
- No API routes; all data access stays in the browser.
