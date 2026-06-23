# Media Center Management System

## Overview
Arabic RTL media center management system for multi-unit newsrooms. Built with React 19 + TypeScript, Vite 6, Tailwind CSS 4, Framer Motion (motion/react), and Lucide icons.

## Architecture
- **Frontend only** — communicates with two external backend APIs
- **Management API**: `https://mcms-backend-iw71.onrender.com/api`
- **News/AI API**: `https://automation-and-ai-hub-backend.onrender.com/api`

## Tech Stack
- React 19 + TypeScript
- Vite 6 (dev server port 5000)
- Tailwind CSS 4 (`@import "tailwindcss"` syntax — no config file)
- motion/react (Framer Motion)
- Lucide React icons
- Almarai font (Arabic)

## Design System
### Color Palette
- **Brand Blues**: `#2d5570` (dark), `#3d6a8a` (mid), `#4A7C9E` (light)
- **Accent Orange**: `#FF9F4A` (primary), `#FF8C2E` (hover)
- **Neutrals**: `#1e293b` (text), `#64748b` (muted), `#94a3b8` (placeholder), `#e2e8f0` (border), `#f8fafc` (bg-subtle)

### Layout
- RTL Arabic interface
- Fixed sidebar on the **right** side (`right-0`), 272px expanded / 72px collapsed
- Main content uses `paddingRight` to offset sidebar
- Breadcrumb header at top of content area

## Key Files
- `src/App.tsx` — layout shell: sidebar, header, page routing, AIDashboard
- `src/components/auth/LoginPage.tsx` — glassmorphism dark login
- `src/components/shared/StatCard.tsx` — 5 variants with gradient
- `src/components/shared/LoadingSpinner.tsx` — dual-ring spinner
- `src/components/shared/EmptyState.tsx` — with optional action button
- `src/components/news/OverviewView.tsx` — stats + chart + recent items
- `src/components/news/SourcesView.tsx` — RSS sources with stats row
- `src/components/news/PublishedView.tsx` — published news table + modal
- `src/components/news/QueueView.tsx` — editorial queue + AI policies editor
- `src/components/news/IncompleteView.tsx` — incomplete articles management
- `src/components/news/PoliciesView.tsx` — editorial policy CRUD
- `src/services/api.ts` — all API calls

## Dev Workflow
```bash
npm run dev -- --port=5000
```
Workflow name: **Start application**

## Notes
- Tailwind CSS 4 uses `@import "tailwindcss"` (no tailwind.config.js needed)
- Arbitrary values like `border-[#e2e8f0]` and `text-[#1e293b]` are used throughout
- `useRenderTracker` is conditionally called in App.tsx (dev only)
- AI views (IdeaGeneration, TextEditing, SocialMedia, AudioProcessing, NewsRoom, ChatInterface) have their own dark-themed UIs and were not redesigned
- `SystemSettingsModal.tsx` not modified
