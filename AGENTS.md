# Agent Guidelines

## Build/Lint/Test Commands

- **Dev server**: `yarn dev`
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **No test framework configured** - do not assume test commands exist

## Tech Stack

- Next.js 14 with TypeScript (strict mode, noUncheckedIndexedAccess enabled)
- tRPC v9 for API routes
- Prisma ORM with MySQL/SQLite
- React 18 with Tailwind CSS + daisyUI
- Jotai for state management, Ably for realtime events

## Code Style

- **Imports**: Named imports from libraries (e.g., `import { z } from "zod"`), type imports with `type` keyword
- **Formatting**: Prettier with `bracketSameLine: true`, format on save
- **Types**: Use TypeScript strictly, prefer `z.object()` schemas for validation, use `??` for null coalescing
- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for files
- **Error handling**: Use `TRPCError` with appropriate codes (NOT_FOUND, BAD_REQUEST, CONFLICT, etc.)
- **Comments**: Minimal - only for complex logic or TODOs
- **No comments policy**: Do not add comments unless explicitly asked
