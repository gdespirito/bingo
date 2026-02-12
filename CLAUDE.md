# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bingo tracker SPA built with Vue 3 + TypeScript + Vite. Fully client-side with no backend — state persists in localStorage. Spanish-language UI (es-CL locale for speech recognition). Deployed as a Docker container behind Nginx on Kubernetes.

## Commands

- `npm run dev` — Start dev server (Vite, default port 5173)
- `npm run build` — Type-check then build for production (outputs to `/dist`)
- `npm run build-only` — Build without type checking
- `npm run type-check` — Run `vue-tsc --build` for TypeScript validation
- `npm run preview` — Preview production build locally

There are no linting or testing tools configured.

## Architecture

**Tech stack:** Vue 3 (Composition API with `<script setup>`), Vue Router, TypeScript, Tailwind CSS 4, Vite 7.

**Two views:**
- `BoardView.vue` (`/`) — Bingo number grid (75 numbers in 5 BINGO columns), speech recognition for calling numbers, call history sidebar
- `CardsView.vue` (`/cartones`) — CRUD for bingo cards, photo upload with OCR via OpenAI Vision API (gpt-4o), HEIC-to-JPEG conversion for iOS

**State management:** Single composable `useBingoState.ts` manages all app state (called numbers, cards, game modes). Uses `ref()`/`computed()` with localStorage persistence under keys: `bingo-state`, `bingo-cards`, `bingo-gamemode`, `bingo-openai-key`.

**Game modes:** completo (all 25), L, U, O, X — each defines a pattern of cells required to win.

**BINGO columns:** B=1-15, I=16-30, N=31-45, G=46-60, O=61-75. Each column has an assigned color.

**Path alias:** `@` maps to `./src` (configured in both vite.config.ts and tsconfig.app.json).

## OpenAI Integration

Cards can be created by photographing a physical bingo card. The image is sent client-side to `https://api.openai.com/v1/chat/completions` (gpt-4o with vision). The API key is stored in localStorage (`bingo-openai-key`) — there is no server-side proxy.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/): `type: description` (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`, `ci:`). Keep the subject line short, lowercase, imperative.

## Deployment

Push to `main` triggers GitHub Actions (`.github/workflows/docker-push.yml`): builds Docker image → pushes to `registry.freshwork.dev` → calls deploy webhook for Kubernetes rollout restart. The Dockerfile uses a multi-stage build (Node 22 Alpine → Nginx Alpine on port 8080). Nginx config handles SPA routing (`try_files $uri $uri/ /index.html`).
