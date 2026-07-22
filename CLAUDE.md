# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: non-standard Next.js

This repo pins `next@16.2.11` (with React 19.2). As `AGENTS.md` warns, this Next.js has breaking changes versus older versions you may know. **Before writing routing, rendering, config, or data-fetching code, read the relevant guide under `node_modules/next/dist/docs/`** — organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`. Do not rely on remembered Next.js conventions.

## Commands

This project uses **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — start the dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

No test runner is configured.

## Architecture

- **App Router** (`app/`): `layout.tsx` is the root layout (loads Geist fonts via `next/font/google`, sets `<html>`/`<body>` shell); `page.tsx` is the home route. Add routes as nested directories with `page.tsx` under `app/`.
- **Styling**: Tailwind CSS **v4**, configured entirely in CSS. `app/globals.css` imports Tailwind with `@import "tailwindcss"` and defines the theme inline via `@theme` (CSS variables like `--color-background`, `--font-sans`) rather than a `tailwind.config.js`. PostCSS wires it up through `@tailwindcss/postcss` in `postcss.config.mjs`.
- **TypeScript**: `strict` mode; `@/*` path alias maps to the repo root (`tsconfig.json`).

## Git

- Always check the current branch state (`git status`, `git branch --show-current`) before starting any git operation — branch, commit, merge, or PR
- Commit and PR messages must contain **no** Claude-related content — no `Co-Authored-By: Claude …` trailer, no "Generated with Claude Code" line, no mention of Claude or the assistant anywhere in the message or PR body
- Write commit and PR messages as if a human authored them
- `dev` is the integration branch — always branch off `dev`, never off `main`
- All merges and PRs target `dev`; pass `--base dev` to `gh pr create`
- Do not merge or open PRs into `main` unless the user explicitly asks for a release
- **Ask the user for explicit approval before `git commit`.** Show the working-tree diff (`git diff <file>`) and proposed commit message, then wait for "OK" / "진행해"
- **Never run `git add` before approval.** Premature staging desyncs the index when the user edits the file between your stage and their approval — show diffs from the working tree, not the index
- Once approved, run `git add`, `git commit`, `git push`, and `gh pr create` in sequence without asking again — push and PR creation are not separate gates
- The single approval gate is the commit. Never commit first and ask after
