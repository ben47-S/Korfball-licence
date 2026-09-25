# AGENTS.md — Licence Korfball Repository Guide

## Project Overview

Next.js 16 + React 19 + TypeScript web app for managing korfball licences. Uses pnpm as the primary package manager. Prisma ORM with PostgreSQL.

## Package Manager

**pnpm is the primary package manager.** Use `pnpm` instead of `npm` or `yarn`.

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Lint code
pnpm lint:fix         # Auto-fix lint errors
```

## Prisma — Critical Details

- **Client is generated to `generated/prisma/`**, NOT `node_modules/@prisma/client`. Do not edit generated files.
- **Schema**: `prisma/schema.prisma`
- **Seed command**: `pnpm prisma db seed` (uses `tsx ./prisma/seed.ts`)
- **Migrations**: `pnpm prisma migrate dev --name <name>` (dev), `pnpm prisma migrate deploy` (prod)
- **Regenerate client**: `pnpm prisma generate` (must run after schema changes or before tests)
- `src/lib/prisma.ts` imports from `../../generated/prisma/client` — this custom path is intentional.

## Running Tests

```bash
pnpm test                  # All tests
pnpm test:unit             # Only __tests__/unit/
pnpm test:integration      # Only __tests__/integration/
pnpm test:watch            # Watch mode
pnpm test:coverage         # With coverage report (70% threshold)
```

- Tests use **Jest** with `ts-jest` and `jest-environment-node`
- Test files live in `__tests__/unit/` and `__tests__/integration/`
- `jest.setup.js` sets `DATABASE_URL` to `postgresql://test:test@localhost:5432/test` — **PostgreSQL must be running for tests**
- `pnpm prisma generate` must be run before tests (Prisma client is imported from generated dir)
- To run a single test: `pnpm test -- -t "test name"`

## Development Setup

1. `pnpm install --ignore-scripts` then `pnpm exec prisma generate` — pnpm blocks native module builds
2. `cp .env.example .env` (or create `.env` with `DATABASE_URL`, `JWT_SECRET`, etc.)
3. `pnpm prisma generate`
4. `pnpm prisma migrate dev`
5. `pnpm prisma db seed` (optional)
6. `pnpm dev`

**`.env` is gitignored** — never commit it. `JWT_SECRET` is required (throws on module load if missing, min 32 chars).

**pnpm config**: `.npmrc` has `registry=https://registry.npmmirror.com/` (npmjs.org is unreachable). `ignoredBuiltDependencies` in `pnpm-workspace.yaml` includes `sharp` and `unrs-resolver`. Do NOT add `@prisma/adapter-better-sqlite3` — the project exclusively uses PostgreSQL.

## Build Fixes (already applied)

- Removed `@prisma/adapter-better-sqlite3` and `@types/better-sqlite3` from `package.json` — eliminates `node-gyp` dependency that fails on Railway deployments
- Removed empty `src/app/inscription/formPlayer/` directory and empty `src/app/api/joueurs/route.ts`, `src/app/api/paiements/route.ts` — Next.js requires all `page.tsx`/`route.ts` files to be valid modules
- Fixed `src/lib/auth.ts` — `JWT_SECRET` check moved inside `verifyAuth()` to allow `next build` without env vars
- Fixed Zod v4 compatibility — removed `errorMap` option from `z.nativeEnum()` calls in validators (Zod v4 removed `errorMap`)
- Fixed `ImageCapture` component — added optional `placeholder` and `label` props
- Fixed `LicencePrecedente` interfaces — added `pieceIdentite`, `certificatMedical`, `responsables` fields
- Fixed `prisma/seed.ts` — added missing `telephone` fields on `Joueur` and `Responsable`
- Fixed `src/app/api/saisons/route.ts` — moved `body` declaration outside `try` block for TypeScript scope
- Fixed `src/services/inscription.service.ts` and `licence.service.ts` — added `telephone` field and typed `let joueur`

## Key Architecture

- **App Router**: `src/app/` — Next.js App Router with TypeScript
- **API routes**: `src/app/api/*/route.ts` — Next.js server actions
- **Services**: `src/services/` — business logic (inscription, licence, joueur, arbitre, paiement)
- **Validators**: `src/lib/validators/` — Zod schemas for input validation
- **Lib**: `src/lib/` — Prisma client, auth, rate-limiter, http helpers, firebase, email, captcha
- **Path alias**: `@/*` → `./src/*` (configured in tsconfig.json)
- **Generated code**: `generated/prisma/` — Prisma client, enums, models (do NOT edit manually)

## Environment-Specific Behavior

- **Dev mode**: CAPTCHA bypassed, emails logged to console
- **Production**: CAPTCHA required (`RECAPTCHA_SECRET_KEY` must be set), emails sent via Resend
- `shouldCheckCaptcha = process.env.NODE_ENV === 'production' || process.env.RECAPTCHA_SECRET_KEY`

## Phone Format

Phone numbers must follow **+225XXXXXXXXXX** format (Ivory Coast). Validated by Zod schema: `/^\+225\d{10}$/`.

## Rate Limiting

- Default: **5 inscriptions per hour per IP** (in-memory Map)
- Configured in `src/lib/rate-limiter.ts` (`INSCRIPTION_RATE_LIMIT`)

## Linting & TypeScript

- ESLint 9 with `eslint-config-next` (config in `eslint.config.mjs`)
- TypeScript strict mode, `noEmit: true`
- Check types: `pnpm exec tsc --noEmit`

## Gitignore Highlights

- `.env*` — environment files (never commit)
- `.next/`, `coverage/`, `node_modules/` — build artifacts and dependencies
- `prisma/*.db`, `prisma/*.db-journal` — SQLite databases
- `generated/` is **NOT** gitignored — the Prisma generated client is committed
- `firebase-service-account.json`, `*.firebase-adminsdk*.json` — Firebase credentials

## Important Notes

- The `.claude/settings.local.json` has specific permissions; not relevant to OpenCode
- No `.env.example` file exists in repo — create one from env variables documented in README.md and QUICKSTART_PNPM.md
- No `.github/` workflows exist yet (no CI/CD configured)
- `dev:clean` removes `.next` before restarting; `dev:network` binds to `0.0.0.0`
- `download-fonts` script exists (`node scripts/download-fonts.js`)
