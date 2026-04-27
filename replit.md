# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Eleva Drinks Artifact (pure-static)

Located at `artifacts/eleva-drinks/`. This artifact intentionally has **no** `package.json`, `node_modules`, TypeScript, Vite, or backend. It contains exactly three deliverable files plus a README:

- `index.html` — full markup
- `style.css` — dark gym theme
- `script.js` — all logic (cart, admin, sales, checkout) using `localStorage`
- `README.md`

The Replit dev preview uses `npx -y http-server` to serve the directory (no project install). Production deploy serves the same files statically — no build step. To publish on Vercel, just upload these three files.

Do NOT add a `package.json`, `vite.config.*`, `tsconfig.json`, or any `src/` folder back into this artifact — it must stay pure static.
